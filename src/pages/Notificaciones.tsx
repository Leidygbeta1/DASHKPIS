import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/session";
import { listNotifications, markNotificationRead, type NotificationItem } from "../services/notifications";

const relativeTime = (iso: string) => {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days === 1 ? "" : "s"}`;
};

const Notificaciones: React.FC = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<"Todas" | "No leídas" | "Leídas">("Todas");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadNotifications = async (background = false) => {
    if (!user) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      setError(null);
      const data = await listNotifications(user.id_usuario);
      setItems(data);
      if (data.length && !selectedId) {
        setSelectedId(data[0].id_notificacion);
      } else if (data.length === 0) {
        setSelectedId(null);
      }
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "No se pudieron cargar las notificaciones.";
      setError(msg);
      setItems([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) loadNotifications();
    else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const typeOptions = useMemo(() => {
    const all = Array.from(new Set(items.map((n) => n.tipo))).sort();
    return ["Todos", ...all];
  }, [items]);

  const filtered = items.filter((n) => {
    const stateOk = filterState === "Todas" ? true : filterState === "Leídas" ? n.leida : !n.leida;
    const typeOk = typeFilter === "Todos" ? true : n.tipo === typeFilter;
    return stateOk && typeOk;
  });

  useEffect(() => {
    if (!filtered.length) return;
    if (!selectedId || !filtered.some((n) => n.id_notificacion === selectedId)) {
      setSelectedId(filtered[0].id_notificacion);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((n) => n.id_notificacion === selectedId) || null;

  const markAndUpdate = async (notification: NotificationItem, setAsRead: boolean) => {
    const saved = await markNotificationRead(notification.id_notificacion, setAsRead);
    setItems((prev) => prev.map((item) => (item.id_notificacion === saved.id_notificacion ? saved : item)));
  };

  const handleSelect = async (notification: NotificationItem) => {
    setSelectedId(notification.id_notificacion);
    if (!notification.leida) {
      try {
        await markAndUpdate(notification, true);
      } catch {
        // ignore and keep UI consistent
      }
    }
  };

  const handleToggleRead = async (notification: NotificationItem) => {
    try {
      await markAndUpdate(notification, !notification.leida);
    } catch {
      // keep silent for now
    }
  };

  const handleRefresh = () => loadNotifications(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500">Revisa las alertas más recientes sin salir del dashboard.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as any)}
            className="rounded-lg border-gray-200 text-sm"
          >
            <option value="Todas">Todas</option>
            <option value="No leídas">No leídas</option>
            <option value="Leídas">Leídas</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border-gray-200 text-sm"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={`px-3 py-2 rounded-lg border border-gray-200 text-sm ${
              refreshing || loading ? "text-gray-400" : "hover:bg-gray-50"
            }`}
          >
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="bg-white rounded-xl border border-gray-200">
          {loading && <div className="p-6 text-gray-500">Cargando notificaciones…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No hay notificaciones {filterState === "No leídas" ? "pendientes" : "registradas"}.
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {filtered.map((n) => (
                <li key={n.id_notificacion}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n)}
                    className={`w-full text-left p-4 transition ${
                      selectedId === n.id_notificacion ? "bg-indigo-50 border-l-4 border-indigo-400" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-medium ${n.leida ? "text-gray-700" : "text-gray-900"}`}>{n.titulo}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(n.fecha)}</span>
                    </div>
                    {n.mensaje && (
                      <p className={`mt-1 text-sm ${n.leida ? "text-gray-500" : "text-gray-700"}`} aria-label="Mensaje">
                        {n.mensaje}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                        <span>Tipo</span>
                        <span className="font-semibold">{n.tipo}</span>
                      </span>
                      {!n.leida && <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Nueva</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 min-h-[320px]">
          {!selected && (
            <div className="p-6 text-gray-500 text-center">
              Selecciona una notificación del listado para ver el detalle.
            </div>
          )}
          {selected && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{selected.titulo}</h2>
                  <span className="text-sm text-gray-500">{new Date(selected.fecha).toLocaleString()}</span>
                </div>
                <p className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {selected.tipo}
                </p>
              </div>
              <div className="flex-1 p-6">
                {selected.mensaje ? (
                  <p className="text-gray-700 leading-relaxed">{selected.mensaje}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Esta notificación no incluye un mensaje descriptivo.</p>
                )}
                {selected.link && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Acceso rápido</p>
                    <a
                      href={selected.link}
                      target={selected.link.startsWith("/") ? "_self" : "_blank"}
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Abrir recurso
                      <span aria-hidden>↗</span>
                    </a>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 p-4 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleToggleRead(selected)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  {selected.leida ? "Marcar como no leída" : "Marcar como leída"}
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Actualizar lista
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
