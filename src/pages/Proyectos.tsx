import React, { useEffect, useMemo, useState } from "react";
import { createProyecto, deleteProyecto, fetchProyectos, fetchUsuarios, updateProyecto, type Proyecto as ProyectoDTO, type UsuarioLite } from "../services/projects";

type ProyectoUI = {
  id: number | string; // numeric from backend, string for temp
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string; // ISO date
  fecha_fin?: string; // ISO date
  id_pm?: number; // maps to UsuarioLite.id_usuario
};

const SectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="mb-5 flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    {right}
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500 bg-white">
    {text}
  </div>
);

function pmName(usuarios: UsuarioLite[], id_pm?: number) {
  const u = usuarios.find((u) => u.id_usuario === id_pm);
  if (!u) return "Sin PM";
  return u.nombre || u.email;
}

function daysBetween(a?: string, b?: string) {
  if (!a || !b) return "—";
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  const days = Math.max(0, Math.round((d2 - d1) / 86400000));
  return `${days} d`;
}

function isActive(p: ProyectoUI) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.fecha_inicio && !p.fecha_fin) return true;
  if (p.fecha_inicio && p.fecha_fin) return p.fecha_inicio <= today && today <= p.fecha_fin;
  return false;
}

const Proyectos: React.FC = () => {
  const [projects, setProjects] = useState<ProyectoUI[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioLite[]>([]);
  const [query, setQuery] = useState("");
  const [pmF, setPmF] = useState<"Todos" | number>("Todos");
  const [estadoF, setEstadoF] = useState<"Todos" | "Activos" | "Finalizados" | "Sin fecha">("Todos");
  const [vista, setVista] = useState<"lista" | "tarjetas">("lista");
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProyectoUI | null>(null);
  const [confirmDel, setConfirmDel] = useState<ProyectoUI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Cargar datos del backend
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchProyectos(), fetchUsuarios()])
      .then(([ps, us]) => {
        if (!active) return;
        setUsuarios(us);
        setProjects(
          ps.map<ProyectoUI>((p) => ({
            id: p.id_proyecto,
            nombre: p.nombre,
            descripcion: p.descripcion ?? undefined,
            fecha_inicio: p.fecha_inicio ?? undefined,
            fecha_fin: p.fecha_fin ?? undefined,
            id_pm: p.id_pm ?? undefined,
          }))
        );
      })
      .catch((e) => setError(e?.message || 'Error cargando proyectos'))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return projects
      .filter((p) => (pmF === "Todos" ? true : p.id_pm === pmF))
      .filter((p) => {
        if (estadoF === "Todos") return true;
        const active = isActive(p);
        if (estadoF === "Activos") return active;
        if (estadoF === "Finalizados") return !!p.fecha_fin && !active;
        if (estadoF === "Sin fecha") return !p.fecha_inicio && !p.fecha_fin;
        return true;
      })
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.descripcion ?? "").toLowerCase().includes(query.toLowerCase())
      );
  }, [projects, pmF, estadoF, query]);

  const openCreate = () => {
    setEditing({ id: `tmp-${Date.now()}`, nombre: "", descripcion: "", fecha_inicio: undefined, fecha_fin: undefined, id_pm: undefined });
    setShowForm(true);
  };
  const openEdit = (p: ProyectoUI) => {
    setEditing({ ...p });
    setShowForm(true);
  };
  const save = async () => {
    if (!editing || !editing.nombre.trim()) return;
    try {
      setLoading(true);
      const payload: Omit<ProyectoDTO, 'id_proyecto'> = {
        nombre: editing.nombre,
        descripcion: editing.descripcion ?? null,
        fecha_inicio: editing.fecha_inicio ?? null,
        fecha_fin: editing.fecha_fin ?? null,
        id_pm: typeof editing.id_pm === 'number' ? editing.id_pm : null,
      };
      if (typeof editing.id === 'string' && editing.id.startsWith('tmp-')) {
        const created = await createProyecto(payload);
        setProjects((prev) => [
          ...prev,
          {
            id: created.id_proyecto,
            nombre: created.nombre,
            descripcion: created.descripcion ?? undefined,
            fecha_inicio: created.fecha_inicio ?? undefined,
            fecha_fin: created.fecha_fin ?? undefined,
            id_pm: created.id_pm ?? undefined,
          },
        ]);
      } else {
        const updated = await updateProyecto(Number(editing.id), payload);
        setProjects((prev) =>
          prev.map((x) =>
            x.id === editing.id
              ? {
                  id: updated.id_proyecto,
                  nombre: updated.nombre,
                  descripcion: updated.descripcion ?? undefined,
                  fecha_inicio: updated.fecha_inicio ?? undefined,
                  fecha_fin: updated.fecha_fin ?? undefined,
                  id_pm: updated.id_pm ?? undefined,
                }
              : x
          )
        );
      }
      setShowForm(false);
      setEditing(null);
    } catch (e: any) {
      setError(e?.message || 'Error guardando proyecto');
    } finally {
      setLoading(false);
    }
  };
  const del = async (p: ProyectoUI) => {
    try {
      setLoading(true);
      if (typeof p.id === 'number') {
        await deleteProyecto(p.id);
      }
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e: any) {
      setError(e?.message || 'Error eliminando proyecto');
    } finally {
      setConfirmDel(null);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Proyectos"
        right={
          <div className="flex items-center gap-2">
            {/* Botón filtros móvil */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="sm:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Filtros"
              title="Filtros"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16M7 12h10M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Toggle vista móvil */}
            <button
              onClick={() => setVista(vista === "lista" ? "tarjetas" : "lista")}
              className="sm:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Cambiar vista"
              title="Cambiar vista"
            >
              {vista === "lista" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* Toggle vista desktop */}
            <div className="hidden sm:flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setVista("tarjetas")}
                className={`px-3 py-2 text-sm ${vista === "tarjetas" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setVista("lista")}
                className={`px-3 py-2 text-sm ${vista === "lista" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Lista
              </button>
            </div>

            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow">
              Nuevo proyecto
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${showFilters ? "block" : "hidden sm:block"}`}>
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>
        )}
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="w-full rounded-lg border-gray-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <select value={pmF} onChange={(e) => setPmF(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))} className="rounded-lg border-gray-200">
            <option value="Todos">PM: Todos</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre || u.email}
              </option>
            ))}
          </select>

          <select value={estadoF} onChange={(e) => setEstadoF(e.target.value as any)} className="rounded-lg border-gray-200">
            <option value="Todos">Estado: Todos</option>
            <option value="Activos">Activos</option>
            <option value="Finalizados">Finalizados</option>
            <option value="Sin fecha">Sin fecha</option>
          </select>

          <button
            onClick={() => {
              setQuery("");
              setPmF("Todos");
              setEstadoF("Todos");
            }}
            className="rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-gray-600">Cargando…</div>
      ) : filtered.length === 0 ? (
        <EmptyState text="No hay proyectos con los filtros actuales." />
      ) : vista === "lista" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">PM</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.nombre}</div>
                    {p.descripcion && <div className="text-gray-500">{p.descripcion}</div>}
                  </td>
                  <td className="px-4 py-3">{pmName(usuarios, p.id_pm)}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString() : <span className="text-gray-400">—</span>} 
                      {" → "}
                      {p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{daysBetween(p.fecha_inicio, p.fecha_fin)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${isActive(p) ? "bg-emerald-100 text-emerald-700" : p.fecha_fin ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}>
                      {isActive(p) ? "Activo" : p.fecha_fin ? "Finalizado" : "Sin fecha"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">Editar</button>
                      <button onClick={() => setConfirmDel(p)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-gray-900">{p.nombre}</div>
                <span className={`text-xs px-2 py-1 rounded ${isActive(p) ? "bg-emerald-100 text-emerald-700" : p.fecha_fin ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"}`}>
                  {isActive(p) ? "Activo" : p.fecha_fin ? "Finalizado" : "Sin fecha"}
                </span>
              </div>
              {p.descripcion && <p className="mt-2 text-gray-600 text-sm">{p.descripcion}</p>}
              <div className="mt-3 text-sm text-gray-700">
                <div><span className="text-gray-500">PM:</span> {pmName(usuarios, p.id_pm)}</div>
                <div className="text-gray-500">
                  {p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString() : "—"} → {p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : "—"}
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => openEdit(p)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm">Editar</button>
                <button onClick={() => setConfirmDel(p)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50 text-sm">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showForm && editing && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{typeof editing.id === 'string' && editing.id.startsWith("tmp-") ? "Crear proyecto" : "Editar proyecto"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" placeholder="Nombre del proyecto" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={editing.descripcion} onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha inicio</label>
                <input type="date" value={editing.fecha_inicio ?? ""} onChange={(e) => setEditing({ ...editing, fecha_inicio: e.target.value || undefined })} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha fin</label>
                <input type="date" value={editing.fecha_fin ?? ""} onChange={(e) => setEditing({ ...editing, fecha_fin: e.target.value || undefined })} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">PM</label>
                <select value={editing.id_pm ?? ""} onChange={(e) => setEditing({ ...editing, id_pm: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 w-full rounded-lg border-gray-200">
                  <option value="">Sin PM</option>
                  {usuarios.map((u: UsuarioLite) => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombre || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Eliminar proyecto</h3>
            <p className="mt-1 text-gray-600">¿Seguro que deseas eliminar “{confirmDel.nombre}”?</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={() => del(confirmDel)} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
