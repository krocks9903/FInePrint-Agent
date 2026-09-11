# FinePrint Agent

An AI agent that reads an important document and tells you the specific ways it can cost you money.

**Team DNK** — Krish Shah, Nolan Stillwell, Diego Guatarasma
CEN 4930 AI Agent Studio · Florida Gulf Coast University · Fall 2026
Instructor: Dr. Vinod Kumar Ahuja

**Status:** Milestone 1 complete (team charter + problem discovery). Prototype work starts at M2.

---

## The problem

People sign leases, service contracts, insurance and loan paperwork without reading past the first few pages, and the clauses that cost money — early termination fees, auto-renewal notice windows, non-refundable deposits, late penalties, liability shifts — stay buried until the money is already gone.

Upload the PDF, get back a short ranked list of money-loss risks, each one quoting the exact sentence and where it appears. Not a summary of the contract. A list of the ways it can take your money.

## What works right now

Nothing runs yet. This repo currently holds the M1 report and the Week 3 lab scripts we used to pick the model stack. The first working agent lands in M2.

## What is intentionally not implemented

- Any legal advice. The agent quotes what the document says. It does not tell you whether a clause is enforceable.
- Negotiation suggestions or redlining.
- Anything not grounded in the uploaded document. Every flagged risk must cite clause text.
- Multi-agent split (extractor → ranker). That is M3.

## Stack

| Layer | Choice |
|---|---|
| Model | `gpt-oss` on NRP (National Research Platform / Nautilus), OpenAI-compatible endpoint |
| Fallback | Personal Anthropic Claude API key, switched by one env var |
| Agent framework | OpenAI Agents SDK |
| Front end | React |
| Data | Supabase (Postgres + pgvector for clause chunks, M3) |
| Editor | VS Code with GitHub Copilot Agent Mode |

NRP is provided free by the school, which is why bulk experimentation runs there. The Claude key is for evaluation runs and demos only, and has a spend cap.

## Setup

```bash
git clone https://github.com/<org>/fineprint-agent.git
cd fineprint-agent
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in the repo root:

```
NRP_BASE_URL=<endpoint url>
NRP_API_KEY=<your key>
MODEL_PROVIDER=nrp              # nrp | anthropic
```

Never commit `.env`. Ask in GroupMe for the endpoint values.

Run a lab script to confirm your setup works:

```bash
python labs/01_first_agent.py
```

You should see a five-item research plan plus per-span token usage printed to the console.

## Known limitations

1. **Tracing is local only.** The Agents SDK's default trace exporter expects a real OpenAI key, so we swapped in a console `TracingProcessor`. You get token counts, not a hosted trace UI. Evaluation logging in M3 is something we have to build.
2. **Structured output must be strict-JSON-schema-safe.** `dict[int, str]` output types fail. Use a list of `TypedDict` rows, or pass `AgentOutputSchema(..., strict_json_schema=False)`.
3. **Reasoning eats the output budget.** `gpt-oss` spends tokens thinking. With a low `max_tokens` the answer truncates silently. Set `Reasoning(effort="low")` and budget output tokens separately on long input.

## Repo layout

```
docs/        M1 report (LaTeX source + PDF)
labs/        Week 3 model choice lab scripts
agent/       agent code (M2)
tests/       test cases (M2)
```

## Milestones

| | Deliverable | Due |
|---|---|---|
| M1 | Team charter + problem discovery | Sep 2026 |
| M2 | Agent prototype v1 + market research | Sep 23, 2026 |
| M3 | Multi-agent system + cost analysis | Oct 28, 2026 |
| M4 | Evaluated + user-tested agent | Nov 18, 2026 |
| FP | Final pitch + live demo | Nov 23, 2026 |

## Contributing (team)

Branch per milestone. Open a PR and get one other member to review before merging. Commit history is graded from M2 onward, so commit your own work rather than pasting it into someone else's branch.
