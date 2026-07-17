"use client";

import { useEffect, useMemo, useState } from "react";

type WebhookEvent = {
  id: string;
  receivedAt: string;
  body: unknown;
};

const formatBody = (body: unknown) => {
  if (body === undefined || body === null) {
    return "No body received";
  }

  if (typeof body === "string") {
    return body || "Empty string";
  }

  try {
    return JSON.stringify(body, null, 2);
  } catch (error) {
    return "Could not render body";
  }
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function WhatsApp() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setError(null);
      const res = await fetch("/api/webhook/whatsapp", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Gagal memuat webhook");
      }
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const latestHit = useMemo(
    () => (events.length > 0 ? formatTime(events[0].receivedAt) : null),
    [events],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-zinc-50 text-zinc-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                WhatsApp Webhook Monitor
              </p>
              <h1 className="text-3xl font-semibold">WhatsApp Playground</h1>
              <p className="max-w-2xl text-sm text-zinc-600">
                Pesan masuk dari WhatsApp Cloud API akan muncul di kartu di
                bawah beserta body yang diterima.
              </p>
            </div>
            <div className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm shadow-sm">
              {events.length} hits
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-emerald-50/60 p-4 text-sm border border-dashed border-emerald-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-zinc-800">
                Endpoint webhook:
              </span>
              <button
                onClick={fetchEvents}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                Refresh
              </button>
            </div>
            <code className="block overflow-x-auto rounded-xl bg-white px-4 py-3 font-mono text-[13px] text-zinc-800 shadow-inner">
              https://webhook-phi.vercel.app/api/webhook/whatsapp
            </code>
            {latestHit && (
              <p className="text-xs text-zinc-500">
                Terakhir diterima: {latestHit}
              </p>
            )}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Riwayat Pesan</h2>
            <span className="text-xs text-zinc-500">
              Auto-refresh setiap 5 detik
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
              Memuat webhook...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
              Belum ada pesan yang masuk.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                        Hit ID
                      </p>
                      <p className="font-mono text-sm text-zinc-800">
                        {event.id}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {formatTime(event.receivedAt)}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Body
                    </p>
                    <pre className="max-h-96 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-50 shadow-inner">
                      {formatBody(event.body)}
                    </pre>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
