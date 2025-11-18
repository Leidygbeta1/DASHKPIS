import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/session";
import {
  getNotificationConfig,
  updateNotificationConfig,
  resetNotificationConfig,
  type NotificationPreference,
} from "../services/notifications";
import {
  getFormatPreference,
  saveFormatPreference,
  resetFormatPreference,
  type FormatPreference,
} from "../services/preferences";
import { updateUserProfile } from "../services/api"; // Asegúrate de que esta función esté implementada
import { useTheme } from "../context/ThemeContext";

type CurrencyOption = {
  code: FormatPreference["codigo_moneda"];
  label: string;
  symbol: string;
  thousand: string;
  decimal: string;
  symbolPosition: "left" | "right";
};

const DATE_FORMAT_OPTIONS: FormatPreference["formato_fecha"][] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "COP", label: "COP - Peso Colombiano ($)", symbol: "$", thousand: ".", decimal: ",", symbolPosition: "left" },
  { code: "USD", label: "USD - Dólar Estadounidense ($)", symbol: "$", thousand: ",", decimal: ".", symbolPosition: "left" },
  { code: "EUR", label: "EUR - Euro (€)", symbol: "€", thousand: ".", decimal: ",", symbolPosition: "right" },
];

const SAMPLE_DATE = { day: "24", month: "09", year: "2025" };
const SAMPLE_NUMBER = 1234567.89;

const formatDatePreview = (format: FormatPreference["formato_fecha"]) =>
  format.replace("DD", SAMPLE_DATE.day).replace("MM", SAMPLE_DATE.month).replace("YYYY", SAMPLE_DATE.year);

const formatCurrencyPreview = (code: FormatPreference["codigo_moneda"]) => {
  const option = CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
  const [integer, decimals] = SAMPLE_NUMBER.toFixed(2).split(".");
  const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, option.thousand);
  const amount = `${withThousands}${option.decimal}${decimals}`;
  return option.symbolPosition === "left" ? `${option.symbol} ${amount}` : `${amount} ${option.symbol}`;
};

const Configuracion: React.FC = () => {
  const { mode: themeMode, setMode: setThemeMode, primary, setPrimary } = useTheme();
  // Inicializa 'foto' con la imagen actual del usuario si existe
  const currentUser = useMemo(() => getCurrentUser(), []);
  // Si el usuario tiene imagen base64, úsala; si no, null
  const [foto, setFoto] = useState<string | null>(
    currentUser && currentUser.profile_image ? currentUser.profile_image : null
  );
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [notificaciones, setNotificaciones] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notifConfig, setNotifConfig] = useState<NotificationPreference[]>([]);
  const [notifSnapshot, setNotifSnapshot] = useState<NotificationPreference[]>([]);
  const [notifAlert, setNotifAlert] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [formatPref, setFormatPref] = useState<FormatPreference | null>(null);
  const [dateFormat, setDateFormat] = useState<FormatPreference["formato_fecha"]>("DD/MM/YYYY");
  const [currencyCode, setCurrencyCode] = useState<FormatPreference["codigo_moneda"]>("COP");
  const [background, setBackground] = useState<string>("");
  const [formatLoading, setFormatLoading] = useState(false);
  const [formatSaving, setFormatSaving] = useState(false);
  const [formatAlert, setFormatAlert] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  // ...existing code...
  const notifGroups = useMemo(
    () => ({
      canales: notifConfig.filter((item) => item.categoria === "canal"),
      tipos: notifConfig.filter((item) => item.categoria === "tipo"),
    }),
    [notifConfig]
  );

  const cloneNotifPrefs = (prefs: NotificationPreference[]) => prefs.map((pref) => ({ ...pref }));

  useEffect(() => {
    if (!currentUser) return;
    setNotifLoading(true);
    getNotificationConfig(currentUser.id_usuario)
      .then((prefs) => {
        const cloned = cloneNotifPrefs(prefs);
        setNotifConfig(cloned);
        setNotifSnapshot(cloned);
        setNotificaciones(prefs.some((p) => p.activo));
      })
      .catch(() => {
        setNotifConfig([]);
        setNotifSnapshot([]);
        setNotificaciones(false);
      })
      .finally(() => setNotifLoading(false));
    // Cargar datos de usuario para el formulario de perfil
    setNombre(currentUser.nombre || "");
    setEmail(currentUser.email || "");
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setFormatLoading(true);
    getFormatPreference(currentUser.id_usuario)
      .then((pref) => {
        setFormatPref(pref);
        setDateFormat(pref.formato_fecha);
        setCurrencyCode(pref.codigo_moneda);
        setBackground(pref.fondo || "");
      })
      .catch(() => {
        const fallback: FormatPreference = {
          id_usuario: currentUser.id_usuario,
          formato_fecha: "DD/MM/YYYY",
          codigo_moneda: "COP",
          fondo: "",
        };
        setFormatPref(fallback);
        setDateFormat(fallback.formato_fecha);
        setCurrencyCode(fallback.codigo_moneda);
        setBackground("");
      })
      .finally(() => setFormatLoading(false));
  }, [currentUser]);

  // Subir foto
  // Subir imagen y convertir a base64
  const handleUploadClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFoto(event.target?.result as string); // base64
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

  const handleNotifToggle = (tipo: string, value: boolean) => {
    setNotifConfig((prev) => {
      const updated = prev.map((item) => (item.tipo === tipo ? { ...item, activo: value } : item));
      setNotificaciones(updated.some((item) => item.activo));
      return updated;
    });
    setNotifAlert(null);
  };

  const handleNotifCancel = () => {
    setNotifConfig(cloneNotifPrefs(notifSnapshot));
    setNotificaciones(notifSnapshot.some((item) => item.activo));
    setNotifAlert(null);
  };

  const handleNotifToggleAll = () => {
    const next = !notificaciones;
    setNotificaciones(next);
    setNotifConfig((prev) => prev.map((item) => ({ ...item, activo: next ? true : false })));
    setNotifAlert(null);
  };

  const handleNotifSave = async () => {
    if (!currentUser) return;
    try {
      setSavingNotif(true);
      const payload = notifConfig.map((item) => ({ tipo: item.tipo, activo: item.activo }));
      const saved = await updateNotificationConfig(currentUser.id_usuario, payload);
      setNotifConfig(cloneNotifPrefs(saved));
      setNotifSnapshot(cloneNotifPrefs(saved));
      setNotificaciones(saved.some((item) => item.activo));
      setNotifAlert({ tone: "success", message: "Preferencias de notificación actualizadas correctamente." });
    } catch (err: any) {
      const msg = typeof err?.message === "string" && err.message ? err.message : "No se pudieron guardar las preferencias.";
      setNotifAlert({ tone: "error", message: msg });
    } finally {
      setSavingNotif(false);
    }
  };

  const handleNotifReset = async () => {
    if (!currentUser) return;
    try {
      setSavingNotif(true);
      const defaults = await resetNotificationConfig(currentUser.id_usuario);
      setNotifConfig(cloneNotifPrefs(defaults));
      setNotifSnapshot(cloneNotifPrefs(defaults));
      setNotificaciones(defaults.some((item) => item.activo));
      setNotifAlert({ tone: "success", message: "Preferencias restablecidas a los valores predeterminados." });
    } catch (err: any) {
      const msg = typeof err?.message === "string" && err.message ? err.message : "No se pudo restablecer la configuración.";
      setNotifAlert({ tone: "error", message: msg });
    } finally {
      setSavingNotif(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    const payload: any = {
      id_usuario: currentUser.id_usuario,
      nombre,
      email,
    };
    if (foto) {
      payload.profile_image = foto;
    }
    try {
      const apiResponse = await updateUserProfile(payload);
      let updatedUser = { ...currentUser, ...apiResponse };
      if (!updatedUser.profile_image && currentUser.profile_image) {
        updatedUser.profile_image = currentUser.profile_image;
      }
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      alert("Perfil actualizado correctamente");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Error al actualizar el perfil");
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
  <div className="rounded-xl shadow-lg border hover:shadow-xl transition-shadow p-6 surface-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">👤 Perfil</h2>

        {/* Upload foto */}
        <div className="flex items-center gap-4 mb-6">
          {foto ? (
            <img
              src={foto}
              alt="Perfil"
              className="w-20 h-20 rounded-full object-cover border shadow-md"
              onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80"; }}
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
              className="px-4 py-2 rounded-lg text-sm btn-primary"
            >
              Subir nueva foto
            </button>
            <button
              type="button"
              onClick={() => setFoto(null)}
              className="ml-2 px-4 py-2 rounded-lg text-sm border text-[color:var(--fg)] hover:border-primary"
            >
              Restablecer
            </button>
            <p className="text-gray-500 text-xs mt-1">
              Permitidos JPG, GIF o PNG. Tamaño máximo de 800K
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => { e.preventDefault(); handleSaveProfile(); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Botones */}
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-lg btn-primary"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border text-[color:var(--fg)] hover:border-primary"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* ================== TEMA Y COLORES ================== */}
  <div className="rounded-xl shadow-lg border hover:shadow-xl transition-shadow p-6 surface-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">🎨 Tema y colores</h2>
            <p className="text-sm text-gray-500">Elige modo claro/oscuro o usa el del sistema. Personaliza el color primario.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Modo de color</p>
            <div className="flex items-center gap-3">
              {([
                { key: 'system', label: 'Sistema' },
                { key: 'light', label: 'Claro' },
                { key: 'dark', label: 'Oscuro' },
              ] as const).map(opt => (
                <label key={opt.key} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <input
                    type="radio"
                    name="theme-mode"
                    checked={themeMode === opt.key}
                    onChange={() => setThemeMode(opt.key as any)}
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Color primario</p>
            <div className="flex flex-wrap gap-2">
              {['#2563eb', '#4f46e5', '#16a34a', '#dc2626', '#f59e0b', '#0ea5e9', '#a855f7'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimary(color)}
                  className="w-8 h-8 rounded-full border border-gray-200"
                  style={{ backgroundColor: color, outline: primary === color ? '3px solid #111827' : undefined }}
                  aria-label={color}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Actual: <span className="font-mono">{primary}</span></p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1">Vista previa</p>
          <div className="rounded-xl border border-dashed border-gray-300 p-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Botón primario
            </button>
          </div>
        </div>
      </div>

      {/* ================== FORMATOS ================== */}
  <div className="rounded-xl shadow-lg border hover:shadow-xl transition-shadow p-6 surface-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">📅 Formatos de fechas y moneda</h2>
            <p className="text-sm text-gray-500">Personaliza cómo ves las fechas y valores en toda la aplicación.</p>
          </div>
          {formatLoading && <span className="text-xs text-gray-500">Cargando…</span>}
        </div>

        {formatAlert && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              formatAlert.tone === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {formatAlert.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Formato de fecha</label>
            <select
              disabled={formatLoading}
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value as FormatPreference["formato_fecha"]);
                setFormatAlert(null);
              }}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Vista previa</p>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                {formatDatePreview(dateFormat)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Moneda y símbolo</label>
            <select
              disabled={formatLoading}
              value={currencyCode}
              onChange={(e) => {
                setCurrencyCode(e.target.value as FormatPreference["codigo_moneda"]);
                setFormatAlert(null);
              }}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Vista previa monetaria</p>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                {formatCurrencyPreview(currencyCode)}
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Fondo de pantalla</label>
            <select
              disabled={formatLoading}
              value={background}
              onChange={(e) => {
                setBackground(e.target.value);
                setFormatAlert(null);
              }}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Predeterminado</option>
              <option value="bg-gradient-to-br from-indigo-200 to-indigo-400">Azul degradado</option>
              <option value="bg-gradient-to-br from-green-200 to-green-400">Verde degradado</option>
              <option value="bg-gradient-to-br from-pink-200 to-pink-400">Rosa degradado</option>
              <option value="bg-gradient-to-br from-yellow-100 to-yellow-300">Amarillo suave</option>
              <option value="bg-white">Blanco</option>
              <option value="bg-gray-100">Gris claro</option>
            </select>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Vista previa</p>
              <div className={`rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center ${background || 'bg-white'}`}>
                {background ? background.replace('bg-', '').replace(/-/g, ' ') : 'Predeterminado'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            disabled={formatLoading || formatSaving || !formatPref}
            onClick={() => {
              if (!formatPref) return;
              setDateFormat(formatPref.formato_fecha);
              setCurrencyCode(formatPref.codigo_moneda);
              setBackground(formatPref.fondo || "");
              setFormatAlert(null);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={formatLoading || formatSaving || !currentUser}
            onClick={async () => {
              if (!currentUser) return;
              try {
                setFormatSaving(true);
                const pref = await resetFormatPreference(currentUser.id_usuario);
                setFormatPref(pref);
                setDateFormat(pref.formato_fecha);
                setCurrencyCode(pref.codigo_moneda);
                setBackground(pref.fondo || "");
                setFormatAlert({ tone: "success", message: "Se restableció el formato predeterminado." });
              } catch (err: any) {
                const msg = err?.message || "No se pudo restablecer.";
                setFormatAlert({ tone: "error", message: msg });
              } finally {
                setFormatSaving(false);
              }
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Restablecer
          </button>
          <button
            type="button"
            disabled={formatLoading || formatSaving || !currentUser}
            onClick={async () => {
              if (!currentUser) return;
              try {
                setFormatSaving(true);
                const saved = await saveFormatPreference(currentUser.id_usuario, {
                  formato_fecha: dateFormat,
                  codigo_moneda: currencyCode,
                  fondo: background,
                });
                setFormatPref(saved);
                setFormatAlert({ tone: "success", message: "Preferencias guardadas correctamente." });
              } catch (err: any) {
                const msg = err?.message || "No se pudieron guardar los cambios.";
                setFormatAlert({ tone: "error", message: msg });
              } finally {
                setFormatSaving(false);
              }
            }}
            className={`px-5 py-2 rounded-lg text-white ${formatSaving ? "bg-gray-300 cursor-not-allowed" : "btn-primary"}`}
          >
            {formatSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* ================== ELIMINAR CUENTA ================== */}
  <div className="rounded-xl shadow-lg border hover:shadow-xl transition-shadow p-6 surface-card">
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
  <div className="surface-card rounded-xl shadow-lg border hover:shadow-xl transition-shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">🔔 Notificaciones</h2>
        <p className="text-sm text-gray-500">Define qué tipos de alertas deseas recibir y por qué canales.</p>

        {notifAlert && (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              notifAlert.tone === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {notifAlert.message}
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <div>
            <p className="text-sm font-medium text-gray-700">Activar o desactivar todas las notificaciones</p>
            <p className="text-xs text-gray-500">
              {notificaciones ? "Actualmente recibirás notificaciones." : "Todas las notificaciones están desactivadas."}
            </p>
          </div>
          <button
            onClick={handleNotifToggleAll}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              notificaciones ? "bg-green-500" : "bg-gray-300"
            }`}
            aria-label="Cambiar estado general de notificaciones"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                notificaciones ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section>
            <p className="text-sm font-semibold text-gray-900 mb-2">Canales de entrega</p>
            <div className="space-y-2">
              {notifLoading && <div className="text-xs text-gray-500">Cargando canales…</div>}
              {!notifLoading && notifGroups.canales.length === 0 && (
                <div className="text-sm text-gray-500">No hay canales configurables.</div>
              )}
              {notifGroups.canales.map((c) => (
                <div key={c.tipo} className="border rounded-lg p-3 surface-card flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.descripcion}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={c.activo}
                    onChange={(e) => handleNotifToggle(c.tipo, e.target.checked)}
                    className="mt-1 w-4 h-4"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold text-gray-900 mb-2">Tipos de notificación</p>
            <div className="space-y-2">
              {notifLoading && <div className="text-xs text-gray-500">Cargando tipos…</div>}
              {!notifLoading && notifGroups.tipos.length === 0 && (
                <div className="text-sm text-gray-500">No hay tipos de notificación disponibles.</div>
              )}
              {notifGroups.tipos.map((c) => (
                <div key={c.tipo} className="border rounded-lg p-3 surface-card flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.descripcion}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={c.activo}
                    onChange={(e) => handleNotifToggle(c.tipo, e.target.checked)}
                    className="mt-1 w-4 h-4"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleNotifCancel}
            disabled={savingNotif}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleNotifReset}
            disabled={savingNotif || !currentUser}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleNotifSave}
            disabled={savingNotif || !currentUser}
            className={`px-5 py-2 rounded-lg text-white ${savingNotif ? "bg-gray-300 cursor-not-allowed" : "btn-primary"}`}
          >
            {savingNotif ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
