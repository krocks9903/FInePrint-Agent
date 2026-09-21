"use client";

import { useCallback, useState } from "react";
import type { FindingRecord, ScanDetail } from "@fineprint/shared";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [scanMeta, setScanMeta] = useState<string>("");

  const pollScan = useCallback(async (scanId: string) => {
    for (let i = 0; i < 60; i++) {
      const res = await fetch(`/api/scans/${scanId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Poll failed (${res.status})`);
      }
      const detail = (await res.json()) as ScanDetail;
      setStatus(detail.scan.status);
      if (detail.scan.status === "done") {
        setFindings(detail.findings);
        setScanMeta(
          `${detail.document.original_filename} · model ${detail.scan.model} · ${detail.findings.length} grounded finding(s)`
        );
        return;
      }
      if (detail.scan.status === "failed") {
        throw new Error(detail.scan.error ?? "Scan failed");
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error("Timed out waiting for scan");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFindings([]);
    setScanMeta("");
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    setBusy(true);
    setStatus("uploading");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/scans", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setStatus(json.cache_hit ? "done (cache)" : json.status);
      if (json.status === "done") {
        await pollScan(json.scan_id);
      } else {
        await pollScan(json.scan_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="brand">FinePrint Agent · Team DNK</div>
      <h1>Ways this document can cost you money</h1>
      <p className="lede">
        Upload a lease or contract PDF. The agent returns a ranked list of
        money-loss risks — each one quoting the exact clause. No legal advice.
        Invented fees are dropped by citation validation.
      </p>

      <form className="panel" onSubmit={onSubmit}>
        <div className="upload-row">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <button type="submit" disabled={busy || !file}>
            {busy ? "Scanning…" : "Scan document"}
          </button>
        </div>
        {status ? <p className="status">status: {status}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>

      {scanMeta ? <p className="status">{scanMeta}</p> : null}

      {findings.length > 0 ? (
        <ul className="findings">
          {findings.map((f) => (
            <li key={f.id} className="finding">
              <header>
                <strong>{f.risk_type.replaceAll("_", " ")}</strong>
                <span className={`pill ${f.severity}`}>{f.severity}</span>
              </header>
              <div>{f.plain_english}</div>
              <blockquote className="quote">&ldquo;{f.quote}&rdquo;</blockquote>
              <div className="meta">page {f.page} · grounded citation</div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
