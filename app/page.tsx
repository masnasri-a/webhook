"use client";

import { useEffect, useMemo, useState } from "react";

type WebhookEvent = {
  id: string;
  receivedAt: string;
  headers: Record<string, string>;
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

export default function Home() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setError(null);
      const res = await fetch("/api/webhook", { cache: "no-store" });
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-white to-zinc-50 text-zinc-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Webhook Monitor
              </p>
              <h1 className="text-3xl font-semibold">Webhook Playground</h1>
              <p className="max-w-2xl text-sm text-zinc-600">
                Kirim request ke endpoint di bawah. Setiap hit akan muncul di
                kartu dengan header dan body yang diterima.
              </p>
            </div>
            <div className="rounded-full bg-zinc-900 text-white px-4 py-2 text-sm shadow-sm">
              {events.length} hits
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-4 text-sm border border-dashed border-zinc-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-zinc-800">
                Endpoint webhook:
              </span>
              <button
                onClick={fetchEvents}
                className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                Refresh
              </button>
            </div>
            <code className="block overflow-x-auto rounded-xl bg-white px-4 py-3 font-mono text-[13px] text-zinc-800 shadow-inner">
              curl -X POST https://webhook-phi.vercel.app/api/webhook -H "Content-Type:
              application/json" -d '{`{"hello":"world"}`}'
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
            <h2 className="text-xl font-semibold">Riwayat Webhook</h2>
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
              Belum ada webhook yang masuk.
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

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Headers
                      </p>
                      <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700 border border-dashed border-zinc-200">
                        {Object.entries(event.headers).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start gap-2 border-b border-zinc-200/70 py-2 last:border-0"
                          >
                            <span className="w-28 font-semibold text-zinc-900">
                              {key}
                            </span>
                            <span className="flex-1 break-all text-zinc-700">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Body
                      </p>
                      <pre className="max-h-64 overflow-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-50 shadow-inner">
                        {formatBody(event.body)}
                      </pre>
                    </div>
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
