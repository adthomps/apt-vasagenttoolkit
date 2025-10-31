'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChat } from 'ai/react';
import type { ToolkitInvoice as Invoice, ToolkitPaymentLink as PaymentLink } from '@/lib/toolkit';

const examplePrompts = [
  'List my recent invoices and summarize their statuses.',
  'Create a $1200 USD invoice for Northwind Traders due next Friday.',
  'Send the most recent draft invoice to the customer.',
  'Generate a payment link for the VIP brunch event for 75 EUR.',
  'Deactivate the "Spring promotion" payment link.'
];

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, stop } = useChat({
    api: '/api/chat'
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractString = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return undefined;
  };

  const extractNumber = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return undefined;
  };

  const formatAmount = (record: Record<string, unknown>) => {
    const rawAmount = record.amount as unknown;
    const nested = typeof rawAmount === 'object' && rawAmount !== null ? (rawAmount as Record<string, unknown>) : undefined;

    const amountValue =
      typeof rawAmount === 'number'
        ? rawAmount
        : typeof rawAmount === 'string'
          ? Number.isNaN(Number(rawAmount))
            ? undefined
            : Number(rawAmount)
          : nested
            ? extractNumber(nested, ['value', 'amount'])
            : undefined;

    const currency =
      extractString(record, ['currency', 'currencyCode', 'currency_code']) ??
      (nested ? extractString(nested, ['currency', 'currencyCode', 'currency_code']) : undefined);

    if (amountValue !== undefined) {
      if (currency) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amountValue);
        } catch (currencyError) {
          // ignore formatting issues and fall back to numeric output
        }
      }
      return amountValue.toLocaleString();
    }

    if (typeof rawAmount === 'string') {
      return rawAmount;
    }

    return undefined;
  };

  const syncData = async () => {
    setIsSyncing(true);
    try {
      const [invoiceResponse, paymentLinkResponse] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payment-links')
      ]);

      const invoiceJson = await invoiceResponse.json().catch(() => ({ error: 'Unable to parse invoices response' }));
      const paymentLinkJson = await paymentLinkResponse
        .json()
        .catch(() => ({ error: 'Unable to parse payment links response' }));

      if (!invoiceResponse.ok) {
        throw new Error(invoiceJson.error ?? 'Unable to load invoices');
      }

      if (!paymentLinkResponse.ok) {
        throw new Error(paymentLinkJson.error ?? 'Unable to load payment links');
      }

      setInvoices(Array.isArray(invoiceJson.data) ? invoiceJson.data : []);
      setPaymentLinks(Array.isArray(paymentLinkJson.data) ? paymentLinkJson.data : []);
      setError(null);
    } finally {
      setIsSyncing(false);
    }
  };

  const synchroniseWithErrorHandling = async () => {
    try {
      await syncData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to synchronise with the Visa Acceptance toolkit.');
    }
  };

  useEffect(() => {
    synchroniseWithErrorHandling();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(synchroniseWithErrorHandling, 600);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, messages.length]);

  const lastToolCall = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'tool');
  }, [messages]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2.5rem',
        maxWidth: '960px',
        width: '100%'
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Visa Acceptance Agent Toolkit</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          This minimal prototype pairs the <strong>Vercel AI SDK</strong> with a lightweight API to
          demonstrate invoice and payment link actions. Use the chat to issue instructions and review
          the toolkit state below.
        </p>
        <div
          style={{
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(15, 23, 42, 0.35)',
            fontSize: '0.95rem',
            lineHeight: 1.5
          }}
        >
          <strong>Environment checklist:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0, display: 'grid', gap: '0.35rem' }}>
            <li>Set <code>VISA_ACCEPTANCE_MERCHANT_ID</code>, <code>VISA_ACCEPTANCE_API_KEY_ID</code>, and <code>VISA_ACCEPTANCE_SECRET_KEY</code>.</li>
            <li>
              Optionally configure <code>VISA_ACCEPTANCE_ENVIRONMENT</code> to switch between <code>SANDBOX</code> and
              <code>PRODUCTION</code>.
            </li>
            <li>Provide an <code>OPENAI_API_KEY</code> so the chat agent can call OpenAI models.</li>
          </ul>
        </div>
        {error && (
          <p style={{ margin: 0, color: '#f97316', fontSize: '0.95rem' }}>
            {error}
          </p>
        )}
      </header>

      <section
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}
      >
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setInput(prompt)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: 'rgba(30, 41, 59, 0.55)',
              color: 'inherit',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            {prompt}
          </button>
        ))}
      </section>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '1rem',
          padding: '1.25rem',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Agent conversation</h2>
          {isLoading && (
            <span style={{ fontSize: '0.85rem', color: '#38bdf8' }}>thinking…</span>
          )}
        </div>

        <div
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingRight: '0.5rem'
          }}
        >
          {messages.length === 0 && (
            <p style={{ margin: 0, opacity: 0.7 }}>
              Start by choosing a prompt above or describe the action you want to take.
            </p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                background: message.role === 'user' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(15, 118, 110, 0.35)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                maxWidth: '75%'
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Agent' : 'Tool'}
              </strong>
              <span style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {'content' in message ? message.content : JSON.stringify(message, null, 2)}
              </span>
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(event);
          }}
          style={{
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask the toolkit to manage invoices or payment links"
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: 'inherit'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isLoading || !input ? 0.6 : 1
            }}
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => stop()}
            disabled={!isLoading}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              opacity: !isLoading ? 0.4 : 1
            }}
          >
            Stop
          </button>
        </form>
        {lastToolCall && (
          <code
            style={{
              fontSize: '0.8rem',
              background: 'rgba(15, 23, 42, 0.9)',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              overflowX: 'auto'
            }}
          >
            {typeof lastToolCall.content === 'string'
              ? lastToolCall.content
              : JSON.stringify(lastToolCall.content, null, 2)}
          </code>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gap: '1.25rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Invoices</h2>
            <button
              onClick={synchroniseWithErrorHandling}
              disabled={isSyncing}
              style={{
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '0.65rem',
                background: '#0ea5e9',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isSyncing ? 0.6 : 1
              }}
            >
              Refresh
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invoices.map((invoice) => (
              <article
                key={invoice.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.65)',
                  borderRadius: '0.85rem',
                  padding: '0.9rem 1rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              >
                <header
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong>
                    {extractString(invoice as Record<string, unknown>, [
                      'customerName',
                      'customer_name',
                      'customer',
                      'name',
                      'title'
                    ]) ?? 'Invoice'}
                  </strong>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {extractString(invoice as Record<string, unknown>, ['status', 'state', 'lifecycle_state']) ?? 'unknown'}
                  </span>
                </header>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
                  {extractString(invoice as Record<string, unknown>, ['description', 'memo', 'notes']) ??
                    'No description provided.'}
                </p>
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>
                    <strong>{formatAmount(invoice as Record<string, unknown>) ?? '—'}</strong>
                    {(() => {
                      const dueDate = extractString(invoice as Record<string, unknown>, [
                        'dueDate',
                        'due_date',
                        'due',
                        'dueOn'
                      ]);
                      if (!dueDate) return null;
                      const parsed = new Date(dueDate);
                      return Number.isNaN(parsed.getTime()) ? ` · due ${dueDate}` : ` · due ${parsed.toLocaleDateString()}`;
                    })()}
                  </span>
                  <span>ID: {invoice.id}</span>
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', opacity: 0.8 }}>View raw</summary>
                    <pre
                      style={{
                        margin: '0.5rem 0 0',
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '0.75rem',
                        borderRadius: '0.65rem',
                        overflowX: 'auto',
                        fontSize: '0.75rem'
                      }}
                    >
                      {JSON.stringify(invoice, null, 2)}
                    </pre>
                  </details>
                </div>
              </article>
            ))}
            {invoices.length === 0 && <p style={{ opacity: 0.7 }}>No invoices yet.</p>}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Payment links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paymentLinks.map((link) => (
              <article
                key={link.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.65)',
                  borderRadius: '0.85rem',
                  padding: '0.9rem 1rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              >
                <header
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <strong>
                    {extractString(link as Record<string, unknown>, ['name', 'title', 'label']) ?? 'Payment link'}
                  </strong>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {extractString(link as Record<string, unknown>, ['status', 'state']) ?? 'unknown'}
                  </span>
                </header>
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>
                    <strong>{formatAmount(link as Record<string, unknown>) ?? '—'}</strong>
                  </span>
                  {(() => {
                    const url = extractString(link as Record<string, unknown>, ['url', 'paymentUrl', 'payment_url']);
                    if (!url) {
                      return <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>No payment URL provided.</span>;
                    }
                    return (
                      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {url}
                      </a>
                    );
                  })()}
                  <span>ID: {link.id}</span>
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', opacity: 0.8 }}>View raw</summary>
                    <pre
                      style={{
                        margin: '0.5rem 0 0',
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '0.75rem',
                        borderRadius: '0.65rem',
                        overflowX: 'auto',
                        fontSize: '0.75rem'
                      }}
                    >
                      {JSON.stringify(link, null, 2)}
                    </pre>
                  </details>
                </div>
              </article>
            ))}
            {paymentLinks.length === 0 && <p style={{ opacity: 0.7 }}>No payment links yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
