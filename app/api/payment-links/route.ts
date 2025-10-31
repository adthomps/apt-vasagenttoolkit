import { NextResponse } from 'next/server';
import {
  formatToolkitError,
  getPaymentLinkClient,
  hasVisaAcceptanceCredentials,
  normaliseToolkitList,
  resolveToolkitMethod
} from '@/lib/toolkit';

export async function GET() {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        data: [],
        error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to enable payment link listing.'
      },
      { status: 503 }
    );
  }

  try {
    const paymentLinks = await getPaymentLinkClient();
    const list = resolveToolkitMethod(paymentLinks as Record<string, unknown>, [
      'list',
      'listPaymentLinks',
      'all',
      'getAll'
    ]);

    if (!list) {
      throw new Error('Payment link listing is not supported by the current Visa Acceptance toolkit client.');
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
        error:
          'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to enable payment link creation.'
      },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const paymentLinks = await getPaymentLinkClient();
    const create = resolveToolkitMethod(paymentLinks as Record<string, unknown>, ['create', 'createPaymentLink']);

    if (!create) {
      throw new Error('Payment link creation is not supported by the current Visa Acceptance toolkit client.');
    }

    const paymentLink = await create(payload);
    return NextResponse.json({ data: paymentLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}
