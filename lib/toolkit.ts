import { VisaAcceptanceAgentToolkit } from '@visaacceptance/agent-toolkit/ai-sdk';

export type ToolkitInvoice = Record<string, unknown> & { id: string };
export type ToolkitPaymentLink = Record<string, unknown> & { id: string };

const REQUIRED_ENV_VARS = [
  'VISA_ACCEPTANCE_MERCHANT_ID',
  'VISA_ACCEPTANCE_API_KEY_ID',
  'VISA_ACCEPTANCE_SECRET_KEY'
] as const;

const ACTION_CONFIGURATION = {
  actions: {
    invoices: {
      create: true,
      update: true,
      list: true,
      get: true,
      send: true,
      cancel: true
    },
    paymentLinks: {
      create: true,
      update: true,
      list: true,
      get: true
    }
  }
};

let toolkitPromise: Promise<VisaAcceptanceAgentToolkit> | null = null;

export function hasVisaAcceptanceCredentials(): boolean {
  return REQUIRED_ENV_VARS.every((key) => Boolean(process.env[key]));
}

function instantiateToolkit(): Promise<VisaAcceptanceAgentToolkit> {
  if (!toolkitPromise) {
    if (!hasVisaAcceptanceCredentials()) {
      throw new Error(
        'Visa Acceptance credentials are missing. Set VISA_ACCEPTANCE_MERCHANT_ID, VISA_ACCEPTANCE_API_KEY_ID, and VISA_ACCEPTANCE_SECRET_KEY.'
      );
    }

    toolkitPromise = Promise.resolve(
      new VisaAcceptanceAgentToolkit({
        merchantId: process.env.VISA_ACCEPTANCE_MERCHANT_ID!,
        apiKeyId: process.env.VISA_ACCEPTANCE_API_KEY_ID!,
        secretKey: process.env.VISA_ACCEPTANCE_SECRET_KEY!,
        configuration: {
          ...ACTION_CONFIGURATION,
          context: {
            environment: (process.env.VISA_ACCEPTANCE_ENVIRONMENT ?? 'SANDBOX') as 'SANDBOX' | 'PRODUCTION'
          }
        }
      })
    );
  }

  return toolkitPromise;
}

export async function getVisaAcceptanceToolkit(): Promise<VisaAcceptanceAgentToolkit> {
  return instantiateToolkit();
}

export type ToolkitClient = {
  invoices?: {
    list: (...args: any[]) => Promise<any>;
    get?: (id: string) => Promise<any>;
    retrieve?: (id: string) => Promise<any>;
    create: (payload: any) => Promise<any>;
    update: (id: string, payload: any) => Promise<any>;
    send?: (id: string) => Promise<any>;
    cancel?: (id: string) => Promise<any>;
  };
  paymentLinks?: {
    list: (...args: any[]) => Promise<any>;
    get?: (id: string) => Promise<any>;
    retrieve?: (id: string) => Promise<any>;
    create: (payload: any) => Promise<any>;
    update: (id: string, payload: any) => Promise<any>;
  };
};

export async function getVisaAcceptanceClient(): Promise<ToolkitClient> {
  const toolkit = await getVisaAcceptanceToolkit();
  const candidate = (toolkit as unknown as { client?: ToolkitClient }).client;

  if (!candidate) {
    throw new Error('The Visa Acceptance toolkit client is not available. Ensure you are on the latest toolkit release.');
  }

  return candidate;
}

export async function getInvoiceClient() {
  const client = await getVisaAcceptanceClient();
  if (!client.invoices) {
    throw new Error('Invoice operations are unavailable in the Visa Acceptance toolkit client.');
  }
  return client.invoices;
}

export async function getPaymentLinkClient() {
  const client = await getVisaAcceptanceClient();
  if (!client.paymentLinks) {
    throw new Error('Payment link operations are unavailable in the Visa Acceptance toolkit client.');
  }
  return client.paymentLinks;
}

export async function getVisaAcceptanceTools() {
  const toolkit = await getVisaAcceptanceToolkit();
  return toolkit.getTools();
}

export function resolveToolkitMethod<T extends Record<string, unknown>>(
  source: T,
  candidates: string[]
): ((...args: unknown[]) => Promise<unknown>) | undefined {
  for (const candidate of candidates) {
    const method = source[candidate];
    if (typeof method === 'function') {
      return (method as (...args: unknown[]) => Promise<unknown>).bind(source);
    }
  }

  return undefined;
}

export function normaliseToolkitList<T extends { data?: unknown }>(payload: T): unknown {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload;
}

export function formatToolkitError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected Visa Acceptance toolkit error';
}
