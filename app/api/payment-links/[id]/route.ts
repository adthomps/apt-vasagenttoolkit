import { NextResponse } from 'next/server';
import {
  formatToolkitError,
  getPaymentLinkClient,
  hasVisaAcceptanceCredentials,
  resolveToolkitMethod
} from '@/lib/toolkit';

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, context: RouteContext) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to retrieve payment links.'
      },
      { status: 503 }
    );
  }

  try {
    const paymentLinks = await getPaymentLinkClient();
    const retrieve = resolveToolkitMethod(paymentLinks as Record<string, unknown>, ['get', 'retrieve', 'getPaymentLink']);
    if (!retrieve) {
      throw new Error('Payment link retrieval is not supported by the current Visa Acceptance toolkit client.');
    }
    const paymentLink = await retrieve(context.params.id);
    return NextResponse.json({ data: paymentLink });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        error: 'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_* variables to update payment links.'
      },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const paymentLinks = await getPaymentLinkClient();
    const update = resolveToolkitMethod(paymentLinks as Record<string, unknown>, ['update', 'updatePaymentLink']);
    if (!update) {
      throw new Error('Payment link updates are not supported by the current Visa Acceptance toolkit client.');
    }
    const paymentLink = await update(context.params.id, payload);
    return NextResponse.json({ data: paymentLink });
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}
