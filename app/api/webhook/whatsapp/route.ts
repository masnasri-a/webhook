type StoredEvent = {
  id: string;
  receivedAt: string;
  body: unknown;
};

let events: StoredEvent[] = [];
const MAX_EVENTS = 50;

const VERIFY_TOKEN = 'testting-webhook-allow';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');

  // Meta verification handshake.
  if (mode) {
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Otherwise: list stored events for the /wa UI.
  return Response.json({ events });
}

// Untuk terima pesan masuk
export async function POST(request: Request) {
  const body = await request.json();
  console.log('Incoming:', JSON.stringify(body, null, 2));

  events = [
    { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), body },
    ...events,
  ].slice(0, MAX_EVENTS);

  return new Response('EVENT_RECEIVED', { status: 200 });
}
