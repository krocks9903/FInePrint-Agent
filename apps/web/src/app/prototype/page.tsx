"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import styles from "./prototype.module.css";

type Risk = {
  id: number;
  severity: "High" | "Medium" | "Low";
  title: string;
  explanation: string;
  quote: string;
  location: string;
};

const demoRisks: Risk[] = [
  {
    id: 1,
    severity: "High",
    title: "Early termination fee",
    explanation:
      "Ending this agreement before the lease expires may require an additional payment.",
    quote:
      "Resident shall pay an early termination fee equal to two months' rent...",
    location: "Page 8 · Section 12.4",
  },
  {
    id: 2,
    severity: "High",
    title: "Automatic renewal",
    explanation:
      "The agreement may renew automatically unless written notice is submitted before the deadline.",
    quote:
      "Tenant must provide written notice at least sixty (60) days prior to expiration...",
    location: "Page 11 · Section 18.2",
  },
  {
    id: 3,
    severity: "Medium",
    title: "Non-refundable administrative fee",
    explanation:
      "This charge will not be returned even if you complete the agreement without damages.",
    quote:
      "The $300 administrative fee is non-refundable under all circumstances.",
    location: "Page 3 · Section 4.1",
  },
];

export default function PrototypePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  function chooseFile(selected?: File) {
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      alert("FinePrint currently accepts PDF documents.");
      return;
    }

    setFile(selected);
    setAnalyzed(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function analyzeDocument() {
    if (!file) return;

    setAnalyzing(true);
    setAnalyzed(false);

    // Prototype only for now.
    // We will replace this with the team's real API request.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    setAnalyzing(false);
    setAnalyzed(true);
  }

  function reset() {
    setFile(null);
    setAnalyzed(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.logo}>F</div>

          <div>
            <span className={styles.brandName}>FinePrint</span>
            <span className={styles.brandSubtitle}>
              Document Risk Scanner
            </span>
          </div>
        </div>

        <span className={styles.prototypeBadge}>Prototype</span>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          AI-powered document analysis
        </div>

        <h1>
          Know what could cost you
          <span> before you sign.</span>
        </h1>

        <p>
          Upload a lease, contract, or agreement. FinePrint finds the
          stipulations, deadlines, penalties, and fees that deserve your
          attention.
        </p>
      </section>

      <section className={styles.content}>
        {!analyzed ? (
          <div className={styles.uploadCard}>
            <div
              className={`${styles.dropZone} ${
                dragging ? styles.dragging : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className={styles.hiddenInput}
              />

              <div className={styles.uploadIcon}>↑</div>

              {!file ? (
                <>
                  <h2>Upload your document</h2>

                  <p>
                    Drag and drop a PDF here, or click to browse.
                  </p>

                  <span className={styles.fileHint}>
                    PDF documents
                  </span>
                </>
              ) : (
                <>
                  <h2>{file.name}</h2>

                  <p>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to
                    analyze
                  </p>

                  <span className={styles.fileHint}>
                    Click to choose another file
                  </span>
                </>
              )}
            </div>

            <button
              className={styles.analyzeButton}
              disabled={!file || analyzing}
              onClick={analyzeDocument}
            >
              {analyzing ? (
                <>
                  <span className={styles.spinner} />
                  Scanning document...
                </>
              ) : (
                "Analyze Fine Print"
              )}
            </button>

            <div className={styles.trustRow}>
              <span>✓ Clause-level findings</span>
              <span>✓ Source citations</span>
              <span>✓ Ranked risks</span>
            </div>

            <p className={styles.disclaimer}>
              FinePrint highlights language in your document. It does not
              provide legal advice.
            </p>
          </div>
        ) : (
          <Results
            filename={file?.name ?? "Document.pdf"}
            risks={demoRisks}
            onReset={reset}
          />
        )}
      </section>
    </main>
  );
}

function Results({
  filename,
  risks,
  onReset,
}: {
  filename: string;
  risks: Risk[];
  onReset: () => void;
}) {
  return (
    <div className={styles.results}>
      <div className={styles.resultsHeader}>
        <div>
          <span className={styles.completeBadge}>
            Analysis complete
          </span>

          <h2>Your FinePrint Report</h2>

          <p>{filename}</p>
        </div>

        <button
          className={styles.secondaryButton}
          onClick={onReset}
        >
          Scan another document
        </button>
      </div>

      <div className={styles.summary}>
        <div>
          <strong>{risks.length}</strong>
          <span>risks found</span>
        </div>

        <div>
          <strong>
            {
              risks.filter(
                (risk) => risk.severity === "High",
              ).length
            }
          </strong>
          <span>high priority</span>
        </div>

        <div>
          <strong>{risks.length}</strong>
          <span>clauses cited</span>
        </div>
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <span>Prioritized findings</span>
          <h3>What deserves your attention</h3>
        </div>

        <p>Highest financial risk first</p>
      </div>

      <div className={styles.riskList}>
        {risks.map((risk, index) => (
          <article
            className={styles.riskCard}
            key={risk.id}
          >
            <div className={styles.rank}>
              {index + 1}
            </div>

            <div className={styles.riskBody}>
              <div className={styles.riskTop}>
                <h4>{risk.title}</h4>

                <span
                  className={`${styles.severity} ${
                    risk.severity === "High"
                      ? styles.high
                      : risk.severity === "Medium"
                        ? styles.medium
                        : styles.low
                  }`}
                >
                  {risk.severity} risk
                </span>
              </div>

              <p className={styles.explanation}>
                {risk.explanation}
              </p>

              <div className={styles.quote}>
                <span>Source clause</span>

                <blockquote>
                  “{risk.quote}”
                </blockquote>

                <strong>{risk.location}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.reportNotice}>
        <strong>Verify before acting</strong>

        <p>
          FinePrint is designed to surface potentially important clauses,
          not replace professional legal review. Always verify each
          finding against the original document.
        </p>
      </div>
    </div>
  );
}
