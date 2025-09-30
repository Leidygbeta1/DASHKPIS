export type Proyecto = {
  id_proyecto: number;
  nombre: string;
  descripcion?: string | null;
  fecha_inicio?: string | null; // yyyy-mm-dd
  fecha_fin?: string | null;
  id_pm?: number | null;
};

export type UsuarioLite = { id_usuario: number; email: string; rol: string; nombre?: string };

export async function fetchProyectos(): Promise<Proyecto[]> {
  const res = await fetch('/api/proyectos/');
  if (!res.ok) throw new Error('No se pudieron cargar los proyectos');
  return res.json();
}

export async function createProyecto(p: Omit<Proyecto, 'id_proyecto'>): Promise<Proyecto> {
  const res = await fetch('/api/proyectos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateProyecto(id: number, p: Omit<Proyecto, 'id_proyecto'>): Promise<Proyecto> {
  const res = await fetch(`/api/proyectos/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProyecto(id: number): Promise<void> {
  const res = await fetch(`/api/proyectos/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchUsuarios(): Promise<UsuarioLite[]> {
  const res = await fetch('/api/usuarios/');
  if (!res.ok) throw new Error('No se pudieron cargar los usuarios');
  return res.json();
}
