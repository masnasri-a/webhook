"use client";

import { FormEvent, useState } from "react";

export default function TelegramPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      setResult({ ok: false, text: "Message tidak boleh kosong." });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json().catch(() => undefined);
      if (!response.ok) {
        setResult({
          ok: false,
          text:
            data?.error ||
            "Respons API tidak valid. Gagal kirim message ke Telegram.",
        });
        return;
      }

      setResult({ ok: true, text: "Message berhasil dikirim ke Telegram." });
      setMessage("");
    } catch {
      setResult({ ok: false, text: "Terjadi kesalahan saat mengirim message." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Telegram Sender
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">
          Kirim Message ke Telegram
        </h1>
        <p className="text-sm text-zinc-600">
          Isi message lalu submit. Endpoint yang dipanggil:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">/api/telegram</code>
        </p>
      </header>

      <form
        onSubmit={submitMessage}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            placeholder="Tulis message di sini..."
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim ke Telegram"}
        </button>

        {result && (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              result.ok
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {result.text}
          </p>
        )}
      </form>
    </main>
  );
}
