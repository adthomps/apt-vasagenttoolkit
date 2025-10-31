"use client";
import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string>("");

  async function send() {
    if (!input.trim()) return;
    setLog((l) => l + `
> ${input}`);
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: input }] })
    });

    const reader = res.body!.getReader();
    const dec = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setLog((l) => l + dec.decode(value));
    }
    setInput("");
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>Visa Acceptance Agent — Vercel Demo</h1>
      <p>Try: <code>Create an invoice for $200 for John Doe (john@example.com), due in 14 days, then email it.</code></p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a request…"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={send}>Send</button>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{log}</pre>
    </main>
  );
}
