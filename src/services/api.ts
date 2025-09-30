export async function fetchHealth() {
  const res = await fetch('/api/health/');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export type KPI = { id: number; name: string; value: number };

export async function fetchKPIs(): Promise<KPI[]> {
  const res = await fetch('/api/kpis/');
  if (!res.ok) throw new Error('Failed to load KPIs');
  return res.json();
}
