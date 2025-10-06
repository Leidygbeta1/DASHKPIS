import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/session";
import { listNotifications, markNotificationRead, type NotificationItem } from "../../services/notifications";

type Props = { onMenuClick?: () => void };

const Header: React.FC<Props> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestSeenId, setLatestSeenId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null);
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    // Load a small batch for the bell dropdown
    listNotifications(user.id_usuario, { limit: 10 })
      .then((items) => {
        setNotifications(items);
        // Memorize the highest id to avoid toasting existing items
        const maxId = items.reduce((m, n) => Math.max(m, n.id_notificacion || 0), 0);
        setLatestSeenId(maxId || null);
      })
      .catch(() => setNotifications([]));
  }, []);

  const unreadCount = notifications.filter(n => !n.leida).length;

  const onClickNotification = async (n: NotificationItem) => {
    try {
      if (!n.leida) {
        const saved = await markNotificationRead(n.id_notificacion, true);
        setNotifications(prev => prev.map(x => x.id_notificacion === saved.id_notificacion ? saved : x));
      }
      if (n.link) {
        // Navigate within app if link matches our routes
        if (n.link.startsWith('/')) navigate(n.link);
        else window.open(n.link, '_blank');
      }
    } catch (e) {
      // ignore for now
    }
  };
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Poll de notificaciones: cada 20s
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const items = await listNotifications(user.id_usuario, { limit: 10 });
        // Detectar si hay nuevas (id mayor a latestSeenId)
        const maxId = items.reduce((m, n) => Math.max(m, n.id_notificacion || 0), 0);
        if (latestSeenId && maxId > latestSeenId) {
          const newest = items.find(n => n.id_notificacion === maxId);
          if (newest) setToast({ title: newest.titulo, message: newest.mensaje || undefined });
        }
        setNotifications(items);
        if (!latestSeenId && maxId) setLatestSeenId(maxId);
        if (maxId > (latestSeenId || 0)) setLatestSeenId(maxId);
      } catch {
        // silenciar errores del poll
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [latestSeenId]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const handleLogout = () => {
    alert("Sesión cerrada ✅");
    navigate("/login"); // asegúrate que exista esta ruta
  };

  const handleConfig = () => {
    navigate("/dashboard/configuracion"); // asegúrate que exista esta ruta en App.tsx
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Botón hamburguesa móvil */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Barra de búsqueda */}
        <div className="flex-1">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Buscar (Ctrl + K)"
              className="w-full rounded-xl border-gray-200 pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Botón Notificaciones */}
          <div className="relative">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              onClick={async () => {
                const next = !showNotifications;
                setShowNotifications(next);
                // refrescar al abrir
                if (next) {
                  const user = getCurrentUser();
                  if (user) {
                    try {
                      const items = await listNotifications(user.id_usuario, { limit: 10 });
                      setNotifications(items);
                    } catch {
                      // ignore
                    }
                  }
                }
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14v-2A6 6 0 1 0 6 12v2a2 2 0 0 1-.6 1.4L4 17h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] leading-4 rounded-full text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Notificaciones</p>
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => navigate('/dashboard/reportes')}>Ver todo</button>
                </div>
                <ul className="mt-2 text-sm text-gray-700 max-h-80 overflow-auto">
                  {notifications.length === 0 && (
                    <li className="text-gray-500 py-6 text-center">No tienes notificaciones</li>
                  )}
                  {notifications.map(n => (
                    <li key={n.id_notificacion} className={`p-2 rounded-lg cursor-pointer ${n.leida ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`} onClick={() => onClickNotification(n)}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">{n.leida ? '🔔' : '🟦'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate">{n.titulo}</p>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(n.fecha).toLocaleString()}</span>
                          </div>
                          {n.mensaje && <p className="text-gray-600 truncate">{n.mensaje}</p>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Botón Modo oscuro */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              // 🌙 Luna
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
              </svg>
            ) : (
              // 🌞 Sol con rayos más visibles
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>

          {/* Menú usuario */}
          <div className="relative">
            <button
              className="flex items-center gap-2 pl-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                className="w-8 h-8 rounded-full"
                src="https://i.pravatar.cc/40"
                alt="Avatar"
              />
              <div className="hidden sm:block leading-4 text-left">
                <p className="text-sm font-semibold text-gray-900">Usuario</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={handleConfig}
                >
                  ⚙️ Configuración
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
          {/* Toast de notificación nueva */}
          {toast && (
            <div className="fixed top-16 right-4 z-30 max-w-xs bg-white border border-gray-200 shadow-lg rounded-lg p-3 animate-[fadeIn_200ms_ease-in]">
              <div className="flex items-start gap-2">
                <span>🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{toast.title}</p>
                  {toast.message && <p className="text-xs text-gray-600 truncate">{toast.message}</p>}
                  <div className="mt-2 flex gap-2">
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => {
                        setShowNotifications(true);
                        setToast(null);
                      }}
                    >
                      Ver
                    </button>
                    <button className="text-xs text-gray-500 hover:underline" onClick={() => setToast(null)}>Ocultar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;