import { NextResponse } from 'next/server';
import {
  formatToolkitError,
  getInvoiceClient,
  hasVisaAcceptanceCredentials,
  normaliseToolkitList,
  resolveToolkitMethod
} from '@/lib/toolkit';

export async function GET() {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        data: [],
        error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to enable invoice listing.'
      },
      { status: 503 }
    );
  }

  try {
    const invoices = await getInvoiceClient();
    const list = resolveToolkitMethod(invoices as Record<string, unknown>, [
      'list',
      'listInvoices',
      'all',
      'getAll'
    ]);

    if (!list) {
      throw new Error('Invoice listing is not supported by the current Visa Acceptance toolkit client.');
    }

    const result = await list();
    return NextResponse.json({ data: normaliseToolkitList(result) });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to enable invoice creation.'
      },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const invoices = await getInvoiceClient();
    const create = resolveToolkitMethod(invoices as Record<string, unknown>, ['create', 'createInvoice']);

    if (!create) {
      throw new Error('Invoice creation is not supported by the current Visa Acceptance toolkit client.');
    }

    const invoice = await create(payload);
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}
