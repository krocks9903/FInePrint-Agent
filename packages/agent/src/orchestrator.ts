/**
 * Scan orchestrator — state machine:
 * queued → parsing → analyzing → validating → done | failed
 *
 * Teammates: extend extraction in persona.ts; do not bypass citation validation.
 */

import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES_DEFAULT,
  type CreateScanResponse,
  type ScanDetail,
} from "@fineprint/shared";
import { parsePdfBuffer } from "@fineprint/mcp-document";
import { extractRisksWithModel } from "./persona.js";
import { resolveProvider } from "./provider.js";
import { getStore, sha256, type LocalStore } from "./store.js";
import { rankFindings, validateCitations } from "./validator.js";

export interface UploadInput {
  ownerId: string;
  filename: string;
  mime: string;
  buffer: Buffer;
}

export class Orchestrator {
  constructor(private store: LocalStore = getStore()) {}

  async createAndProcess(input: UploadInput): Promise<CreateScanResponse> {
    const maxBytes = Number(
      process.env.MAX_UPLOAD_BYTES ?? MAX_UPLOAD_BYTES_DEFAULT
    );
    if (!ALLOWED_MIME.includes(input.mime as (typeof ALLOWED_MIME)[number])) {
      throw new Error("Only application/pdf uploads are allowed");
    }
    if (input.buffer.length === 0) {
      throw new Error("Empty PDF rejected");
    }
    if (input.buffer.length > maxBytes) {
      throw new Error(`PDF exceeds max size of ${maxBytes} bytes`);
    }

    const provider = resolveProvider();
    const hash = sha256(input.buffer);

    const cached = await this.store.findCachedScan(hash, provider.model);
    if (cached) {
      // Re-attach as a new scan row pointing at same findings copy for API simplicity:
      // create a done scan that clones findings from cache.
      const doc = await this.store.savePdf(
        input.ownerId,
        input.filename,
        input.mime,
        input.buffer
      );
      const scan = await this.store.createScan({
        document_id: doc.id,
        owner_id: input.ownerId,
        content_sha256: hash,
        model: provider.model,
      });
      await this.store.replaceFindings(
        scan.id,
        cached.findings.map(({ id: _id, scan_id: _s, ...rest }) => rest)
      );
      // Also reuse pages if we can parse quickly from cache path — parse once for this doc.
      const pages = await parsePdfBuffer(input.buffer);
      await this.store.setPages(doc.id, pages.pages);
      await this.store.updateScanStatus(scan.id, "done");
      return {
        scan_id: scan.id,
        document_id: doc.id,
        status: "done",
        cache_hit: true,
      };
    }

    const doc = await this.store.savePdf(
      input.ownerId,
      input.filename,
      input.mime,
      input.buffer
    );
    const scan = await this.store.createScan({
      document_id: doc.id,
      owner_id: input.ownerId,
      content_sha256: hash,
      model: provider.model,
    });

    try {
      await this.processScan(scan.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.store.updateScanStatus(scan.id, "failed", message);
      throw err;
    }

    const updated = await this.store.getScan(scan.id);
    return {
      scan_id: scan.id,
      document_id: doc.id,
      status: updated?.status ?? "failed",
      cache_hit: false,
    };
  }

  async processScan(scanId: string): Promise<void> {
    const scan = await this.store.getScan(scanId);
    if (!scan) throw new Error(`scan not found: ${scanId}`);

    await this.store.updateScanStatus(scanId, "parsing");
    const buffer = await this.store.readPdf(scan.document_id);
    const parsed = await parsePdfBuffer(buffer);
    if (parsed.meta.empty) {
      throw new Error("PDF produced no extractable text (empty or encrypted)");
    }
    await this.store.setPages(scan.document_id, parsed.pages);

    await this.store.updateScanStatus(scanId, "analyzing");
    const provider = resolveProvider();
    const { output, model } = await extractRisksWithModel(
      provider,
      parsed.pages
    );

    await this.store.updateScanStatus(scanId, "validating");
    const grounded = rankFindings(
      validateCitations(output.findings, parsed.pages)
    );
    await this.store.replaceFindings(
      scanId,
      grounded.map((f) => ({
        ...f,
        grounded: true as const,
      }))
    );

    // Keep model label accurate on the scan row
    scan.model = model;
    await this.store.updateScanStatus(scanId, "done");

    console.info(
      JSON.stringify({
        event: "scan_done",
        scan_id: scanId,
        model,
        finding_count: grounded.length,
        page_count: parsed.meta.pageCount,
      })
    );
  }

  async getScanDetail(scanId: string): Promise<ScanDetail | null> {
    const scan = await this.store.getScan(scanId);
    if (!scan) return null;
    const document = await this.store.getDocument(scan.document_id);
    if (!document) return null;
    const findings = await this.store.getFindings(scanId);
    const pages = (await this.store.getPages(scan.document_id)) ?? undefined;
    return { scan, document, findings, pages };
  }
}

export function getOrchestrator(): Orchestrator {
  return new Orchestrator(getStore());
}
