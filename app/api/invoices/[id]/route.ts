import { NextResponse } from 'next/server';
import {
  formatToolkitError,
  getInvoiceClient,
  hasVisaAcceptanceCredentials,
  resolveToolkitMethod
} from '@/lib/toolkit';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, context: RouteContext) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      { error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to retrieve invoices.' },
      { status: 503 }
    );
  }

  try {
    const invoices = await getInvoiceClient();
    const retrieve = resolveToolkitMethod(invoices as Record<string, unknown>, ['get', 'retrieve', 'getInvoice']);
    if (!retrieve) {
      throw new Error('Invoice retrieval is not supported by the current Visa Acceptance toolkit client.');
    }
    const invoice = await retrieve(context.params.id);
    return NextResponse.json({ data: invoice });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      { error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to update invoices.' },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const invoices = await getInvoiceClient();
    const update = resolveToolkitMethod(invoices as Record<string, unknown>, ['update', 'updateInvoice']);
    if (!update) {
      throw new Error('Invoice updates are not supported by the current Visa Acceptance toolkit client.');
    }
    const invoice = await update(context.params.id, payload);
    return NextResponse.json({ data: invoice });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      { error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to send or cancel invoices.' },
      { status: 503 }
    );
  }

  try {
    const { action } = (await request.json()) as { action?: string };
    const invoices = await getInvoiceClient();

    if (action === 'send') {
      const send = resolveToolkitMethod(invoices as Record<string, unknown>, ['send', 'sendInvoice']);
      if (!send) {
        throw new Error('Invoice sending is not supported by the current Visa Acceptance toolkit client.');
      }
      const invoice = await send(context.params.id);
      return NextResponse.json({ data: invoice });
    }

    if (action === 'cancel') {
      const cancel = resolveToolkitMethod(invoices as Record<string, unknown>, ['cancel', 'cancelInvoice']);
      if (!cancel) {
        throw new Error('Invoice cancellation is not supported by the current Visa Acceptance toolkit client.');
      }
      const invoice = await cancel(context.params.id);
      return NextResponse.json({ data: invoice });
    }

    return NextResponse.json({ error: 'Unsupported action. Use "send" or "cancel".' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}
