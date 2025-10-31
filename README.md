# Visa Acceptance Agent Toolkit Prototype

This repository hosts a minimal full-stack prototype that demonstrates how the Visa Acceptance Agent Toolkit can be orchestrated through the [Vercel AI SDK](https://sdk.vercel.ai/). The project exposes a lightweight API for invoices and payment links alongside an agent chat interface that streams responses from the official Visa Acceptance tools.

## Features

- **Agent chat** powered by the Vercel AI SDK with tool/function calling backed by `@visaacceptance/agent-toolkit`.
- **Toolkit-backed APIs** that proxy invoice and payment-link operations through the Visa Acceptance platform.
- **Live state inspector** that mirrors toolkit data for invoices and payment links in real time.

## Getting started

1. Install dependencies (the sandbox may block scoped packages; see the note below):

   ```bash
   npm install
   ```

2. Configure Visa Acceptance credentials so the toolkit can authenticate:

   ```bash
   export VISA_ACCEPTANCE_MERCHANT_ID="your-merchant-id"
   export VISA_ACCEPTANCE_API_KEY_ID="your-api-key-id"
   export VISA_ACCEPTANCE_SECRET_KEY="your-secret-key"
   # Optional: default SANDBOX unless overridden
   export VISA_ACCEPTANCE_ENVIRONMENT="SANDBOX"
   ```

3. Provide an OpenAI API key so the agent can call a model:

   ```bash
   export OPENAI_API_KEY="sk-your-key"
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) and begin interacting with the toolkit prototype.

> **Sandbox notice:** When running inside this exercise environment `npm install` currently fails with `403 Forbidden` for certain scoped packages (e.g. `@ai-sdk/openai`). Run the command locally or in an environment with full npm registry access.

## Available API routes

- `GET /api/invoices` — list invoices via the Visa Acceptance toolkit client
- `POST /api/invoices` — create an invoice through the toolkit
- `GET /api/invoices/:id` — retrieve an invoice by id
- `PATCH /api/invoices/:id` — update invoice details
- `POST /api/invoices/:id` — send or cancel an invoice via `{ "action": "send" | "cancel" }`
- `GET /api/payment-links` — list payment links via the toolkit client
- `POST /api/payment-links` — create a payment link
- `GET /api/payment-links/:id` — retrieve a payment link by id
- `PATCH /api/payment-links/:id` — update a payment link

## Environment variables

| Name | Description |
| --- | --- |
| `VISA_ACCEPTANCE_MERCHANT_ID` | Merchant identifier provided by Visa Acceptance. |
| `VISA_ACCEPTANCE_API_KEY_ID` | API key identifier for authenticating requests. |
| `VISA_ACCEPTANCE_SECRET_KEY` | Secret key paired with the API key identifier. |
| `VISA_ACCEPTANCE_ENVIRONMENT` | Optional environment selector (`SANDBOX` by default). |
| `OPENAI_API_KEY` | Required so the Vercel AI SDK can call OpenAI models. |

## Notes

- All toolkit calls require the Visa Acceptance credentials outlined above. Without them the API responds with `503` status codes.
- The chat endpoint will return an error if `OPENAI_API_KEY` is not configured.
- Swap in another model provider or add authentication by updating the API route implementations.
