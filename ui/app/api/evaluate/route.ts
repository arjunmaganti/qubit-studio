import { PARAMS } from '@/lib/params';
import type { ParamKey } from '@/lib/params';

/** The browser never talks to the solver directly; this is the only hop. */
const BACKEND = process.env.QUBIT_API_URL ?? 'http://127.0.0.1:8000';
const KEYS: ParamKey[] = ['ej_ghz', 'ec_ghz', 'ng', 'ncut'];

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body was not valid JSON.' }, { status: 400 });
  }

  const source = body as Record<string, unknown>;
  const payload: Record<string, number> = {};
  for (const key of KEYS) {
    const value = source?.[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return Response.json({ error: `Parameter "${key}" must be a finite number.` }, { status: 400 });
    }
    const { min, max } = PARAMS[key];
    if (value < min || value > max) {
      return Response.json(
        { error: `Parameter "${key}" must be between ${min} and ${max}.` },
        { status: 400 },
      );
    }
    if (key === 'ncut' && !Number.isInteger(value)) return Response.json({ error: 'Parameter "ncut" must be a whole number.' }, { status: 400 });
    payload[key] = value;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
      cache: 'no-store',
    });
  } catch {
    return Response.json(
      {
        error: 'The simulation service is unavailable or timed out. Retry the calculation.',
      },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
