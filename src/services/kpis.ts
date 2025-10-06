export type KPIType = 'Financiero' | 'Operacional' | 'Cliente' | 'Marketing';

export interface KPI {
  id_kpi: number;
  nombre: string;
  descripcion?: string | null;
  valor_objetivo: number;
  valor_actual: number;
  tipo: KPIType;
  id_proyecto?: number | null;
  fecha_creacion: string; // yyyy-mm-dd
}

export type KPICreate = Omit<KPI, 'id_kpi' | 'fecha_creacion'>;

export async function listKPIs(params?: { id_proyecto?: number }): Promise<KPI[]> {
  const qs = params?.id_proyecto ? `?id_proyecto=${params.id_proyecto}` : '';
  const res = await fetch(`/api/kpis/${qs}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createKPI(payload: KPICreate): Promise<KPI> {
  const res = await fetch('/api/kpis/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateKPI(id_kpi: number, payload: KPICreate): Promise<KPI> {
  const res = await fetch(`/api/kpis/${id_kpi}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteKPI(id_kpi: number): Promise<void> {
  const res = await fetch(`/api/kpis/${id_kpi}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

export async function updateKPIProgress(id_kpi: number, valor_actual: number): Promise<KPI> {
  const res = await fetch(`/api/kpis/${id_kpi}/progress/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor_actual }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
