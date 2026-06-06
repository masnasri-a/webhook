const TELEGRAM_API_URL = "https://api.telegram.org";
const TELEGRAM_MESSAGE_LIMIT = 4096;

type TelegramSendMessageResponse = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
};

const getTelegramConfig = () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
};

const normalizeMessage = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, TELEGRAM_MESSAGE_LIMIT);
};

const sendTelegramMessage = async (message: string) => {
  const config = getTelegramConfig();
  if (!config) {
    return {
      ok: false as const,
      status: 500,
      error:
        "Server Telegram belum dikonfigurasi. Set TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID.",
    };
  }

  const response = await fetch(
    `${TELEGRAM_API_URL}/bot${config.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response
      .text()
      .catch(() => "Gagal membaca respons Telegram");
    return {
      ok: false as const,
      status: 502,
      error: `Telegram API error: ${detail}`,
    };
  }

  const data = (await response
    .json()
    .catch(() => null)) as TelegramSendMessageResponse | null;
  if (!data) {
    return {
      ok: false as const,
      status: 502,
      error: "Telegram API mengembalikan respons yang tidak valid.",
    };
  }

  return {
    ok: true as const,
    status: 200,
    data,
  };
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => undefined);
  if (!payload) {
    return Response.json(
      { ok: false, error: "Body request harus JSON valid." },
      { status: 400 },
    );
  }

  const message = normalizeMessage(payload.message);

  if (!message) {
    return Response.json(
      { ok: false, error: "Field `message` wajib diisi." },
      { status: 400 },
    );
  }

  const result = await sendTelegramMessage(message);

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  return Response.json({ ok: true, telegram: result.data });
}
