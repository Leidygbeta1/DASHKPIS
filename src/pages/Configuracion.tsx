import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../services/session";
import { getNotificationConfig, updateNotificationConfig, type NotificationConfig } from "../services/notifications";

const Configuracion: React.FC = () => {
  const [foto, setFoto] = useState<string | null>(null);
  const [notificaciones, setNotificaciones] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifConfig, setNotifConfig] = useState<NotificationConfig[]>([]);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    getNotificationConfig(user.id_usuario).then(setNotifConfig).catch(() => setNotifConfig([]));
  }, []);

  // Subir foto
  const handleUploadClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFoto(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // Eliminar cuenta
  const handleDeactivateAccount = () => {
    if (window.confirm("¿Seguro que quieres desactivar tu cuenta?")) {
      alert("Cuenta desactivada ✅");
    }
  };

  return (
    <div className="p-6 space-y-10">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configuración</h1>
        <p className="text-gray-600">
          Personaliza tu perfil, seguridad y preferencias
        </p>
      </div>

      {/* ================== PERFIL ================== */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">👤 Perfil</h2>

        {/* Upload foto */}
        <div className="flex items-center gap-4 mb-6">
          {foto ? (
            <img
              src={foto}
              alt="Perfil"
              className="w-20 h-20 rounded-full object-cover border shadow-md"
            />
          ) : (
            <img
              src="https://via.placeholder.com/80"
              alt="Perfil"
              className="w-20 h-20 rounded-full object-cover border shadow-md"
            />
          )}
          <div>
            <button
              type="button"
              onClick={handleUploadClick}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Subir nueva foto
            </button>
            <button
              type="button"
              onClick={() => setFoto(null)}
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Restablecer
            </button>
            <p className="text-gray-500 text-xs mt-1">
              Permitidos JPG, GIF o PNG. Tamaño máximo de 800K
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primer Nombre
            </label>
            <input
              type="text"
              defaultValue="John"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apellido
            </label>
            <input
              type="text"
              defaultValue="Doe"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Género
            </label>
            <select className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>Seleccionar</option>
              <option>Masculino</option>
              <option>Femenino</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              defaultValue="john.doe@example.com"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organización
            </label>
            <input
              type="text"
              defaultValue="ThemeSelection"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              placeholder="(+57) 300 123 4567"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              placeholder="Dirección"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado / Departamento
            </label>
            <input
              type="text"
              defaultValue="California"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Código Postal
            </label>
            <input
              type="text"
              defaultValue="231465"
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              País
            </label>
            <select className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>Seleccionar</option>
              <option>Colombia</option>
              <option>México</option>
              <option>Estados Unidos</option>
              <option>España</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Idioma
            </label>
            <select className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>Seleccionar idioma</option>
              <option>Español</option>
              <option>Inglés</option>
              <option>Francés</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Zona horaria
            </label>
            <select className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>Seleccionar zona horaria</option>
              <option>GMT-5 (Bogotá, Lima)</option>
              <option>GMT-6 (CDMX)</option>
              <option>GMT+1 (Madrid)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Moneda
            </label>
            <select className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>Seleccionar moneda</option>
              <option>COP - Peso Colombiano</option>
              <option>USD - Dólar</option>
              <option>EUR - Euro</option>
            </select>
          </div>
        </form>

        {/* Botones */}
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* ================== ELIMINAR CUENTA ================== */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🗑️ Eliminar cuenta</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
          <p className="font-medium">
            ¿Estás seguro de que deseas eliminar tu cuenta?
          </p>
          <p className="text-sm">
            Una vez elimines tu cuenta, no hay forma de recuperarla. Por favor,
            asegúrate antes de continuar.
          </p>
        </div>

        <div className="flex items-center mb-4">
          <input
            id="confirmDelete"
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="confirmDelete" className="text-sm text-gray-700">
            Confirmo la desactivación de mi cuenta
          </label>
        </div>

        <button
          onClick={handleDeactivateAccount}
          disabled={!confirmDelete}
          className={`px-4 py-2 rounded-lg text-white ${
            confirmDelete
              ? "bg-red-500 hover:bg-red-600"
              : "bg-red-300 cursor-not-allowed"
          }`}
        >
          Desactivar cuenta
        </button>
      </div>

      {/* ================== NOTIFICACIONES ================== */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notificaciones</h2>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Activar o desactivar notificaciones
          </span>

          {/* Switch toggle */}
          <button
            onClick={() => setNotificaciones(!notificaciones)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              notificaciones ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                notificaciones ? "translate-x-6" : "translate-x-0"
              }`}
            ></div>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {notificaciones
            ? "Las notificaciones están activadas."
            : "Las notificaciones están desactivadas."}
        </p>

        {/* Preferencias por tipo */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Preferencias por tipo</p>
          <div className="space-y-2">
            {notifConfig.length === 0 && (
              <div className="text-sm text-gray-500">No hay preferencias cargadas.</div>
            )}
            {notifConfig.map((c, idx) => (
              <label key={`${c.tipo}-${idx}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-sm text-gray-800">{c.tipo}</span>
                <input
                  type="checkbox"
                  checked={c.activo}
                  onChange={(e) => setNotifConfig(prev => prev.map((x, i) => i === idx ? { ...x, activo: e.target.checked } : x))}
                  className="w-4 h-4"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end">
            <button
              disabled={savingNotif}
              onClick={async () => {
                const user = getCurrentUser();
                if (!user) return;
                try {
                  setSavingNotif(true);
                  const payload = notifConfig.map(n => ({ tipo: n.tipo, activo: n.activo }));
                  const saved = await updateNotificationConfig(user.id_usuario, payload);
                  setNotifConfig(saved);
                } finally {
                  setSavingNotif(false);
                }
              }}
              className={`px-4 py-2 rounded-lg ${savingNotif ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {savingNotif ? 'Guardando…' : 'Guardar preferencias'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
