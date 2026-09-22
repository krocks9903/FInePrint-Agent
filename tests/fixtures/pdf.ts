/**
 * Builds tiny text PDFs for offline tests (no binary checked into git beyond generation).
 */
export function buildSimplePdf(lines: string[]): Buffer {
  const escaped = lines
    .map((l) => l.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"))
    .join(") Tj T* (");
  const stream = `BT /F1 11 Tf 50 740 Td 14 TL (${escaped}) Tj ET`;
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
  );
  objects.push(
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`
  );
  objects.push(
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
  );

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += obj;
  }
  const xrefStart = Buffer.byteLength(body, "utf8");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "utf8");
}

export const FIXTURE_LEASE_LINES = [
  "RESIDENTIAL LEASE AGREEMENT",
  "Tenant may terminate early by paying an early termination fee equal to two months rent.",
  "This lease renews automatically for successive one-year terms unless Tenant gives 60 days written notice of non-renewal.",
  "A late fee of $50 applies if rent is more than five days past due.",
  "The security deposit may be forfeited if Tenant vacates without proper notice.",
];

export const FIXTURE_GYM_LINES = [
  "MEMBERSHIP AGREEMENT",
  "Membership renews automatically each month until cancelled.",
  "Cancellation requires 30 days written notice before the next billing date.",
  "An early cancellation fee of $99 applies during the first year.",
];

/** Hallucination trap: no early termination fee exists; agent must not invent one. */
export const FIXTURE_TRAP_LINES = [
  "SERVICE AGREEMENT",
  "Either party may cancel this agreement at any time with written notice.",
  "There are no penalties for cancellation.",
  "Fees are limited to the monthly subscription price of $12.",
];
