export type ReportExportPayload = {
  titulo: string;
  filtros?: Record<string, string>;
  resumen?: Record<string, string>;
  items?: Record<string, string>[];
  secciones?: Record<string, string>[];
  nota?: string;
  nombre_archivo?: string;
  formato?: {
    mostrarFiltros?: boolean;
    mostrarResumen?: boolean;
    mostrarItems?: boolean;
    mostrarSecciones?: boolean;
    tamanoFuente?: number;
    piePagina?: string;
  };
};

export async function exportReportPdf(payload: ReportExportPayload): Promise<Blob> {
  const res = await fetch('/api/reportes/export/pdf/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.blob();
}

export async function exportReportCsv(payload: ReportExportPayload): Promise<Blob> {
  const res = await fetch('/api/reportes/export/csv/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.blob();
}

import { fetchJsonCached } from './http';

export async function fetchReportItems(params: {
  period: string;
  status: string;
  team: string;
  owner: string;
  search: string;
}): Promise<{ items: any[]; teams: string[]; owners: string[]; milestones: any[] }> {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.status) qs.set('status', params.status);
  if (params.team) qs.set('team', params.team);
  if (params.owner) qs.set('owner', params.owner);
  if (params.search) qs.set('search', params.search);
  const url = `/api/reportes/items/${qs.toString() ? `?${qs.toString()}` : ''}`;
  // Short TTL cache to avoid refetch bursts while navigating; do not persist to keep data recent
  return fetchJsonCached(url, { ttlMs: 10000 });
}

export type ReportRecord = {
  id_reporte: number;
  titulo: string;
  id_usuario: number;
  filtros?: Record<string, string>;
  resumen?: Record<string, string>;
  items?: any[];
  secciones?: any[];
  nota?: string;
  formato?: ReportExportPayload['formato'];
  nombre_archivo?: string;
  fecha_creacion: string;
};

export async function createReport(payload: ReportExportPayload & { id_usuario: number }): Promise<ReportRecord> {
  const res = await fetch('/api/reportes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listReports(params?: { id_usuario?: number; q?: string; desde?: string; hasta?: string }): Promise<ReportRecord[]> {
  const qs = new URLSearchParams();
  if (params?.id_usuario) qs.set('id_usuario', String(params.id_usuario));
  if (params?.q) qs.set('q', params.q);
  if (params?.desde) qs.set('desde', params.desde);
  if (params?.hasta) qs.set('hasta', params.hasta);
  const url = `/api/reportes/${qs.toString() ? `?${qs.toString()}` : ''}`;
  return fetchJsonCached<ReportRecord[]>(url, { ttlMs: 15000 });
}

export async function downloadReportPdf(id_reporte: number): Promise<Blob> {
  const res = await fetch(`/api/reportes/${id_reporte}/pdf/`);
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function downloadReportCsv(id_reporte: number): Promise<Blob> {
  const res = await fetch(`/api/reportes/${id_reporte}/csv/`);
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}
