export type Tarea = {
  id_tarea: number;
  id_proyecto: number;
  id_usuario_asignado?: number | null;
  titulo: string;
  descripcion?: string | null;
  fecha_creacion: string; // ISO datetime
  fecha_vencimiento?: string | null; // yyyy-mm-dd
  prioridad: string; // backend-defined
  progreso: number; // 0..100
  estado: string; // 'Pendiente' | 'En progreso' | 'Completada'
};

export type TareaCreate = {
  id_proyecto: number;
  titulo: string;
  descripcion?: string | null;
  fecha_vencimiento?: string | null;
  id_usuario_asignado?: number | null;
  prioridad?: 'Alta' | 'Media' | 'Baja';
};

export type TareaUpdate = TareaCreate;

import { fetchJsonCached, invalidateCache } from './http';

export async function fetchTareasByProyecto(id_proyecto: number): Promise<Tarea[]> {
  // Cache project task lists briefly to speed up navigation between views
  return fetchJsonCached<Tarea[]>(`/api/proyectos/${id_proyecto}/tareas/`, {
    ttlMs: 20000,
    persist: true,
  });
}

export async function createTarea(body: TareaCreate): Promise<Tarea> {
  const res = await fetch('/api/tareas/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  // Invalidate cached lists for the affected project
  if (body?.id_proyecto != null) invalidateCache(`/api/proyectos/${body.id_proyecto}/tareas/`);
  return data;
}

export async function updateTarea(id_tarea: number, body: TareaUpdate): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  // Try to invalidate the specific project list if available, otherwise nuke broader caches
  if (body?.id_proyecto != null) {
    invalidateCache(`/api/proyectos/${body.id_proyecto}/tareas/`);
  } else {
    invalidateCache('/api/proyectos/');
  }
  return data;
}

export async function assignTarea(id_tarea: number, id_usuario_asignado: number | null): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/assign/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario_asignado }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  // Assignment changes can affect list badges/filters; clear project task list caches broadly
  invalidateCache('/api/proyectos/');
  return data;
}

export async function changeDueDate(id_tarea: number, fecha_vencimiento: string | null): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/duedate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha_vencimiento }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  invalidateCache('/api/proyectos/');
  return data;
}

export async function addTiempo(id_tarea: number, id_usuario: number, horas: number, nota?: string): Promise<{ ok: boolean; total_horas: number }> {
  const res = await fetch(`/api/tareas/${id_tarea}/tiempo/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tarea, id_usuario, horas, nota }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  // Time entries affect the timeline list for that task
  invalidateCache(`/api/tareas/${id_tarea}/tiempo/`);
  return data;
}

export type TiempoLog = {
  id_registro: number;
  id_usuario: number;
  horas: number;
  fecha_registro: string; // ISO datetime
  nota?: string;
};

export async function listTiempo(
  id_tarea: number,
  opts?: { fecha?: string; desde?: string; hasta?: string }
): Promise<TiempoLog[]> {
  const params = new URLSearchParams();
  if (opts?.fecha) params.set('fecha', opts.fecha);
  if (opts?.desde) params.set('desde', opts.desde);
  if (opts?.hasta) params.set('hasta', opts.hasta);
  const qs = params.toString();
  // Cache short-lived time logs; do not persist to localStorage to avoid confusion across sessions
  return fetchJsonCached<TiempoLog[]>(`/api/tareas/${id_tarea}/tiempo/${qs ? `?${qs}` : ''}` , {
    ttlMs: 10000,
    persist: false,
  });
}

export async function completeTarea(id_tarea: number): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/complete/`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  invalidateCache('/api/proyectos/');
  return data;
}

export async function deleteTarea(id_tarea: number): Promise<void> {
  const res = await fetch(`/api/tareas/${id_tarea}/delete/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  // We don't know the project id; invalidate broadly
  invalidateCache('/api/proyectos/');
}

export async function setTareaProgress(id_tarea: number, progreso: number): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/progress/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progreso }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  invalidateCache('/api/proyectos/');
  return data;
}
