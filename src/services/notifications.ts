// Elimina una notificación por ID
export async function deleteNotification(id_notificacion: number): Promise<void> {
  const res = await fetch(`/api/notificaciones/${id_notificacion}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
}
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

export async function listNotifications(
  id_usuario: number,
  params?: {
    leida?: boolean;
    limit?: number;
    tipo?: string;
    q?: string;
    desde?: string;
    hasta?: string;
  }
): Promise<NotificationItem[]> {
  const qs = new URLSearchParams();
  if (params?.leida !== undefined) qs.set('leida', params.leida ? 'true' : 'false');
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.tipo) qs.set('tipo', params.tipo);
  if (params?.q) qs.set('q', params.q);
  if (params?.desde) qs.set('desde', params.desde);
  if (params?.hasta) qs.set('hasta', params.hasta);
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
