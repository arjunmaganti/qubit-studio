import { proxySimulation } from '@/lib/proxySimulation';

export const dynamic = 'force-dynamic';
export const POST = (request: Request) => proxySimulation(request, 'stress');
