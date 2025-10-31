import "server-only";
export const runtime = "nodejs"; // Next runtime hint; vercel.json sets nodejs20.x

import { NextRequest } from "next/server";
import { streamText, createUIMessageStream, createUIMessageStreamResponse, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createVisaToolkit } from "@/lib/visaToolkit";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const toolkit = createVisaToolkit();
  const tools = toolkit.getTools();

  const uiStream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: openai("gpt-4o"),
        messages,
        tools,
        stopWhen: stepCountIs(8)
      });

      for await (const chunk of result.fullStream) {
        writer.write(chunk);
      }
      writer.close();
    }
  });

  return createUIMessageStreamResponse(uiStream);
}
