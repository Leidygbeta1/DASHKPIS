import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/session';
import { listNotifications, markNotificationRead, type NotificationItem } from '../services/notifications';

const Notificaciones: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todas'|'No leídas'|'Leídas'>('Todas');

  const load = async () => {
    setLoading(true);
    const user = getCurrentUser();
    if (!user) { setItems([]); setLoading(false); return; }
    try {
      const data = await listNotifications(user.id_usuario);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(n => filter === 'Todas' ? true : filter === 'Leídas' ? n.leida : !n.leida);

  const toggleRead = async (n: NotificationItem) => {
    const updated = await markNotificationRead(n.id_notificacion, !n.leida);
    setItems(prev => prev.map(x => x.id_notificacion === updated.id_notificacion ? updated : x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-lg border-gray-200">
            <option>Todas</option>
            <option>No leídas</option>
            <option>Leídas</option>
          </select>
          <button onClick={load} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Actualizar</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        {loading && <div className="p-6 text-gray-500">Cargando…</div>}
        {!loading && filtered.length === 0 && <div className="p-6 text-gray-500">No hay notificaciones.</div>}
        {filtered.map(n => (
          <div key={n.id_notificacion} className={`p-4 ${n.leida ? '' : 'bg-blue-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{n.titulo}</p>
                {n.mensaje && <p className="text-gray-700 mt-1">{n.mensaje}</p>}
                <p className="text-xs text-gray-500 mt-1">{new Date(n.fecha).toLocaleString()} · {n.tipo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleRead(n)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                  {n.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                </button>
                {n.link && (
                  <a href={n.link} target={n.link.startsWith('/') ? '_self' : '_blank'} rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Abrir</a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notificaciones;
