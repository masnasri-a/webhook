type StoredEvent = {
  id: string;
  receivedAt: string;
  headers: Record<string, string>;
  body: unknown;
};

let webhookEvents: StoredEvent[] = [];

const MAX_EVENTS = 50;

const safelyParseBody = async (request: Request) => {
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await request.json();
    }
    if (contentType.includes("text/")) {
      return await request.text();
    }
  } catch (error) {
    // Fall through to return undefined when parsing fails.
  }

  return await request.text().catch(() => undefined);
};

export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries());
  const body = await safelyParseBody(request);

  const newEvent: StoredEvent = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    headers,
    body,
  };

  webhookEvents = [newEvent, ...webhookEvents].slice(0, MAX_EVENTS);

  return Response.json({ ok: true, stored: newEvent.id });
}

export async function GET() {
  return Response.json({ events: webhookEvents });
}
