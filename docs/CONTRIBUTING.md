# Contributing (Team DNK)

Read [docs/TEAM_OWNERSHIP.md](docs/TEAM_OWNERSHIP.md) first — it defines package lanes so Krish, Nolan, and Diego can work in parallel without merge pain.

## Setup

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Build packages + start Next.js on :3000 |
| `npm test` | M2 pipeline tests (mock provider, no API keys) |
| `npm run build` | Build all workspaces |
| `npm run mcp:document` | Run MCP `document_parse` server over stdio |

## PR checklist

- [ ] Touches only your lane (or lane owner approved)
- [ ] `npm test` passes
- [ ] No secrets in the diff
- [ ] README / architecture updated if behavior changed
- [ ] Another teammate reviewed
