export type NotificationItem = {
  id_notificacion: number;
  id_usuario: number;
  tipo: string;
  titulo: string;
  mensaje?: string | null;
  link?: string | null;
  fecha: string; // ISO
  leida: boolean;
};

export type NotificationPreference = {
  id_usuario: number;
  tipo: string;
  nombre: string;
  descripcion: string;
  categoria: "canal" | "tipo";
  activo: boolean;
};

export async function listNotifications(id_usuario: number, params?: { leida?: boolean; limit?: number }): Promise<NotificationItem[]> {
  const qs = new URLSearchParams();
  if (params?.leida !== undefined) qs.set('leida', params.leida ? 'true' : 'false');
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  const res = await fetch(`/api/usuarios/${id_usuario}/notificaciones/${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function markNotificationRead(id_notificacion: number, leida: boolean): Promise<NotificationItem> {
  const res = await fetch(`/api/notificaciones/${id_notificacion}/leida/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leida }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNotificationConfig(id_usuario: number): Promise<NotificationPreference[]> {
  const res = await fetch(`/api/usuarios/${id_usuario}/notificaciones/config/`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateNotificationConfig(
  id_usuario: number,
  items: Array<{ tipo: string; activo: boolean }>
): Promise<NotificationPreference[]> {
  const res = await fetch(`/api/usuarios/${id_usuario}/notificaciones/config/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resetNotificationConfig(id_usuario: number): Promise<NotificationPreference[]> {
  const res = await fetch(`/api/usuarios/${id_usuario}/notificaciones/config/`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
