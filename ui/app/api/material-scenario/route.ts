const BACKEND = process.env.QUBIT_API_URL ?? 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

const NUMBER_FIELDS = {
  ej_ghz: [0.01, 50],
  ec_ghz: [0.01, 2],
  ng: [0, 1],
  ncut: [20, 60],
  junction_critical_current_factor: [0.5, 1.5],
  total_capacitance_factor: [0.5, 1.5],
} as const;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body was not valid JSON.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return Response.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const source = body as Record<string, unknown>;
  const payload: Record<string, string | number> = {};

  if (source.scenario_name !== undefined) {
    if (typeof source.scenario_name !== 'string' || source.scenario_name.trim().length === 0) {
      return Response.json({ error: 'scenario_name must be a non-empty string.' }, { status: 400 });
    }
    payload.scenario_name = source.scenario_name.trim().slice(0, 80);
  }

  for (const [key, [min, max]] of Object.entries(NUMBER_FIELDS)) {
    const value = source[key];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      return Response.json(
        { error: `${key} must be a finite number between ${min} and ${max}.` },
        { status: 400 },
      );
    }
    if (key === 'ncut' && !Number.isInteger(value)) return Response.json({ error: 'ncut must be a whole number.' }, { status: 400 });
    payload[key] = value;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}/material-scenario`, {
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
