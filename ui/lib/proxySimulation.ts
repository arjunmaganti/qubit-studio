const BACKEND = process.env.QUBIT_API_URL ?? 'http://127.0.0.1:8000';

export async function proxySimulation(request: Request, endpoint: string): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body was not valid JSON.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${BACKEND}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
      cache: 'no-store',
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({
      error: 'The simulation service is unavailable or timed out. Retry the calculation.',
    }, { status: 502 });
  }
}
