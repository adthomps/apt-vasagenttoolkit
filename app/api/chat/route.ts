import { convertToCoreMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { formatToolkitError, getVisaAcceptanceTools, hasVisaAcceptanceCredentials } from '@/lib/toolkit';

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured for the agent runtime.' },
      { status: 500 }
    );
  }

  if (!hasVisaAcceptanceCredentials()) {
    return NextResponse.json(
      {
        error:
          'Visa Acceptance credentials are not configured. Set VISA_ACCEPTANCE_MERCHANT_ID, VISA_ACCEPTANCE_API_KEY_ID, and VISA_ACCEPTANCE_SECRET_KEY.'
      },
      { status: 503 }
    );
  }

  try {
    const { messages } = await request.json();
    const tools = await getVisaAcceptanceTools();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system:
        'You are the Visa Acceptance Agent Toolkit prototype. Use the official Visa Acceptance agent tools to help merchants manage invoices and payment links. Be concise and include relevant identifiers in your responses.',
      messages: convertToCoreMessages(messages),
      tools
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json({ error: formatToolkitError(error) }, { status: 500 });
  }
}
