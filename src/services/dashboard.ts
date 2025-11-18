export type PanelId = 'stats' | 'kpiByType' | 'tasksStatus' | 'progressByProject' | 'kpiTrend';

export type LayoutCode = 'grid-2' | 'grid-3' | 'focus-kpi' | 'progress-focus' | 'custom';

export type PanelPlacement = {
  id: PanelId;
  order: number;
  colSpan: 4 | 6 | 8 | 12;
};

export type PanelLayoutState = {
  panels: PanelPlacement[];
};

export type PanelLayoutPreference = {
  id?: number | null;
  id_usuario: number;
  id_proyecto?: number | null;
  layout_code: LayoutCode;
  panel_state: PanelLayoutState;
  pinned_panels: PanelId[];
  updated_at?: string | null;
};

export const PANEL_IDS: PanelId[] = ['stats', 'kpiByType', 'tasksStatus', 'progressByProject', 'kpiTrend'];

export const DEFAULT_PANEL_LAYOUT_STATE: PanelLayoutState = {
  panels: [
    { id: 'stats', order: 0, colSpan: 12 },
    { id: 'kpiByType', order: 1, colSpan: 6 },
    { id: 'tasksStatus', order: 2, colSpan: 6 },
    { id: 'progressByProject', order: 3, colSpan: 12 },
    { id: 'kpiTrend', order: 4, colSpan: 12 },
  ],
};

function buildLayoutQuery(id_usuario: number, id_proyecto = 0) {
  const params = new URLSearchParams();
  params.set('id_usuario', String(id_usuario));
  params.set('id_proyecto', String(id_proyecto ?? 0));
  return params.toString();
}

import { fetchJsonCached } from './http';

export async function fetchDashboardLayout(id_usuario: number, id_proyecto = 0): Promise<PanelLayoutPreference> {
  const query = buildLayoutQuery(id_usuario, id_proyecto);
  const url = `/api/dashboard/layout/?${query}`;
  return fetchJsonCached<PanelLayoutPreference>(url, { ttlMs: 60000, persist: true });
}

export type SaveLayoutPayload = {
  id_usuario: number;
  id_proyecto?: number | null;
  layout_code: LayoutCode;
  panel_state: PanelLayoutState;
  pinned_panels: PanelId[];
};

export async function saveDashboardLayout(payload: SaveLayoutPayload): Promise<PanelLayoutPreference> {
  const res = await fetch('/api/dashboard/layout/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function resetDashboardLayout(id_usuario: number, id_proyecto = 0): Promise<PanelLayoutPreference> {
  const query = buildLayoutQuery(id_usuario, id_proyecto);
  const res = await fetch(`/api/dashboard/layout/?${query}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
