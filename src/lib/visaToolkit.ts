import { VisaAcceptanceAgentToolkit } from "@visaacceptance/agent-toolkit/ai-sdk";

export function createVisaToolkit() {
  const merchantId = process.env.VISA_ACCEPTANCE_MERCHANT_ID!;
  const apiKeyId = process.env.VISA_ACCEPTANCE_API_KEY_ID!;
  const secretKey = process.env.VISA_ACCEPTANCE_SECRET_KEY!;

  if (!merchantId || !apiKeyId || !secretKey) {
    throw new Error("Visa Acceptance env vars are missing.");
  }

  const toolkit = new VisaAcceptanceAgentToolkit({
    merchantId,
    apiKeyId,
    secretKey,
    configuration: {
      context: { environment: "SANDBOX" },
      actions: {
        invoices: { create: true, update: true, list: true, get: true, send: true, cancel: true },
        paymentLinks: { create: true, update: true, list: true, get: true }
      }
    }
  });

  return toolkit;
}
