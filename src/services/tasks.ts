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

export async function fetchTareasByProyecto(id_proyecto: number): Promise<Tarea[]> {
  const res = await fetch(`/api/proyectos/${id_proyecto}/tareas/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTarea(body: TareaCreate): Promise<Tarea> {
  const res = await fetch('/api/tareas/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateTarea(id_tarea: number, body: TareaUpdate): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assignTarea(id_tarea: number, id_usuario_asignado: number | null): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/assign/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_usuario_asignado }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function changeDueDate(id_tarea: number, fecha_vencimiento: string | null): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/duedate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha_vencimiento }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addTiempo(id_tarea: number, id_usuario: number, horas: number, nota?: string): Promise<{ ok: boolean; total_horas: number }> {
  const res = await fetch(`/api/tareas/${id_tarea}/tiempo/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_tarea, id_usuario, horas, nota }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  const res = await fetch(`/api/tareas/${id_tarea}/tiempo/${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function completeTarea(id_tarea: number): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/complete/`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteTarea(id_tarea: number): Promise<void> {
  const res = await fetch(`/api/tareas/${id_tarea}/delete/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

export async function setTareaProgress(id_tarea: number, progreso: number): Promise<Tarea> {
  const res = await fetch(`/api/tareas/${id_tarea}/progress/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progreso }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
