/**
 * PDF → page-mapped text. Used as an MCP tool AND imported directly by the orchestrator.
 * Owner lane: MCP / document pipeline (see docs/TEAM_OWNERSHIP.md).
 */

import { createRequire } from "node:module";
import type { DocumentPage, ParseResult } from "@fineprint/shared";

const require = createRequire(import.meta.url);
// pdf-parse is CJS; default export is the parse function in Node.
const pdfParse = require("pdf-parse") as (
  data: Buffer,
  options?: { pagerender?: (pageData: PdfPageData) => Promise<string> }
) => Promise<{ text: string; numpages: number; info?: unknown }>;

interface PdfPageData {
  pageIndex: number;
  getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
}

async function renderPage(pageData: PdfPageData): Promise<string> {
  const content = await pageData.getTextContent();
  const strings = content.items
    .map((item) => (typeof item.str === "string" ? item.str : ""))
    .filter(Boolean);
  return strings.join(" ");
}

/**
 * Parse a PDF buffer into per-page text suitable for citation checks.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParseResult> {
  if (!buffer?.length) {
    return {
      pages: [],
      meta: { pageCount: 0, charCount: 0, empty: true },
    };
  }

  const pageTexts: string[] = [];
  const data = await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const text = await renderPage(pageData);
      pageTexts[pageData.pageIndex] = text;
      return text;
    },
  });

  const pages: DocumentPage[] = [];
  const count = Math.max(data.numpages || 0, pageTexts.length);

  for (let i = 0; i < count; i++) {
    const text = (pageTexts[i] ?? "").replace(/\s+/g, " ").trim();
    pages.push({ page: i + 1, text });
  }

  // Fallback: some PDFs only populate aggregate text via pdf-parse.
  if (pages.every((p) => !p.text) && data.text?.trim()) {
    const fallback = data.text.replace(/\s+/g, " ").trim();
    return {
      pages: [{ page: 1, text: fallback }],
      meta: {
        pageCount: 1,
        charCount: fallback.length,
        empty: fallback.length === 0,
      },
    };
  }

  const charCount = pages.reduce((n, p) => n + p.text.length, 0);
  return {
    pages,
    meta: {
      pageCount: pages.length,
      charCount,
      empty: charCount === 0,
    },
  };
}

export function pagesToAgentContext(pages: DocumentPage[], maxChars = 24_000): string {
  const parts: string[] = [];
  let used = 0;
  for (const p of pages) {
    const block = `--- PAGE ${p.page} ---\n${p.text}\n`;
    if (used + block.length > maxChars) break;
    parts.push(block);
    used += block.length;
  }
  return parts.join("\n");
}
