# Visa Acceptance Agent — Vercel Starter

This is a minimal starter that wires the **Visa Acceptance Agent Toolkit** into **Vercel AI SDK** with real tool calling and streaming.

## Prereqs
- Node 18+
- Vercel account
- Visa Acceptance sandbox credentials
- OpenAI API key (or swap provider)

## Quick Start

```bash
pnpm i
cp .env.example .env.local
# fill in env values
pnpm dev
```

## Environment Variables

Set the following values locally (for `.env.local`) and in your Vercel project:

- `VISA_ACCEPTANCE_MERCHANT_ID`
- `VISA_ACCEPTANCE_API_KEY_ID`
- `VISA_ACCEPTANCE_SECRET_KEY`
- `OPENAI_API_KEY`

Open [http://localhost:3000](http://localhost:3000) and ask:

> Create an invoice for $200 for John Doe [john@example.com](mailto:john@example.com), due in 14 days, then email it.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add Environment Variables in Vercel Project Settings:

   * `VISA_ACCEPTANCE_MERCHANT_ID`
   * `VISA_ACCEPTANCE_API_KEY_ID`
   * `VISA_ACCEPTANCE_SECRET_KEY`
   * `OPENAI_API_KEY`
4. Deploy

> The repo ships with `vercel.json` forcing the API route to Node runtime.

## Configuration

* Default environment: `SANDBOX` (see `src/lib/visaToolkit.ts`).
* To switch to production: set `context.environment` to `"PRODUCTION"`.
* Tool calling is limited via `stopWhen: stepCountIs(8)`; tune for your flows.

## Notes

* If you see `Module not found: Can't resolve 'ai'`, ensure the `ai` package is installed and lock files are in sync.
* You can replace `openai("gpt-4o")` with any provider supported by AI SDK.

