import React, { useEffect, useMemo, useState } from 'react';
import type { KPI as KPIModel, KPIType } from '../services/kpis';
import { listKPIs, createKPI, updateKPI, deleteKPI as apiDeleteKPI, updateKPIProgress } from '../services/kpis';
import { fetchProyectos, type Proyecto } from '../services/projects';

// Simple color palette per project for badges
const projectColors = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-purple-100 text-purple-700','bg-rose-100 text-rose-700'];

const tipoBadge: Record<KPIType, string> = {
  'Financiero': 'bg-rose-100 text-rose-700',
  'Operacional': 'bg-blue-100 text-blue-700',
  'Cliente': 'bg-emerald-100 text-emerald-700',
  'Marketing': 'bg-amber-100 text-amber-700',
};

// Componentes auxiliares (copiados del código de Tarea para reutilización)
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

const KPI: React.FC = () => {
  const [kpis, setKpis] = useState<KPIModel[]>([]);
  const [query, setQuery] = useState('');
  const [tipoF, setTipoF] = useState<'Todos' | KPIType>('Todos');
  const [proyectoF, setProyectoF] = useState<'Todos' | number>('Todos');

  const [projects, setProjects] = useState<Proyecto[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KPIModel | null>(null);
  const [detalles, setDetalles] = useState<KPIModel | null>(null);
  const [confirmDel, setConfirmDel] = useState<KPIModel | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load projects and KPIs
    fetchProyectos().then(setProjects).catch(() => setProjects([]));
    listKPIs().then(setKpis).catch(() => setKpis([]));
  }, []);

  const filtered = useMemo(() => {
    return kpis
      .filter((k) => (tipoF === 'Todos' ? true : k.tipo === tipoF))
      .filter((k) => (proyectoF === 'Todos' ? true : (k.id_proyecto ?? null) === (proyectoF as number)))
      .filter((k) => k.nombre.toLowerCase().includes(query.toLowerCase()) || (k.descripcion ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [kpis, query, tipoF, proyectoF]);

  const openCreate = () => {
    setEditing({
      id_kpi: 0,
      nombre: '',
      descripcion: '',
      valor_actual: 0,
      valor_objetivo: 0,
      tipo: 'Operacional',
      id_proyecto: undefined,
      fecha_creacion: new Date().toISOString().slice(0, 10),
    } as KPIModel);
    setShowForm(true);
  };

  const openEdit = (k: KPIModel) => {
    setEditing({ ...k });
    setShowForm(true);
  };

  const saveKPI = () => {
    if (!editing) return;
    const payload = {
      nombre: editing.nombre,
      descripcion: editing.descripcion ?? null,
      valor_objetivo: Number((editing as any).valor_objetivo ?? 0),
      valor_actual: Number((editing as any).valor_actual ?? 0),
      tipo: editing.tipo,
      id_proyecto: editing.id_proyecto ?? null,
    };
    if ((editing as any).id_kpi && (editing as any).id_kpi > 0) {
      updateKPI((editing as any).id_kpi, payload)
        .then((saved) => {
          setKpis((prev) => prev.map((x) => (x.id_kpi === saved.id_kpi ? saved : x)));
          setShowForm(false);
          setEditing(null);
        })
        .catch(console.error);
    } else {
      createKPI(payload)
        .then((created) => {
          setKpis((prev) => [created, ...prev]);
          setShowForm(false);
          setEditing(null);
        })
        .catch(console.error);
    }
  };

  const deleteKPI = (k: KPIModel) => {
    apiDeleteKPI(k.id_kpi)
      .then(() => {
        setKpis((prev) => prev.filter((x) => x.id_kpi !== k.id_kpi));
        setConfirmDel(null);
        if (detalles && (detalles as any).id_kpi === k.id_kpi) setDetalles(null);
      })
      .catch(console.error);
  };

  const getProgressColor = (k: KPIModel) => {
    const progress = (Number((k as any).valor_actual) / Number((k as any).valor_objetivo || 1)) * 100;
    if (progress >= 100) return 'bg-emerald-600';
    if (progress >= 75) return 'bg-amber-500';
    return 'bg-rose-600';
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="KPIs"
        right={
          <div className="flex items-center gap-2">
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
            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow">
              Nuevo KPI
            </button>
          </div>
        }
      />

      <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid gap-3 md:grid-cols-4">
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
          
          <select value={tipoF} onChange={(e) => setTipoF(e.target.value as any)} className="rounded-lg border-gray-200">
            <option value="Todos">Tipo: Todos</option>
            <option value="Financiero">Financiero</option>
            <option value="Operacional">Operacional</option>
            <option value="Cliente">Cliente</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select value={proyectoF} onChange={(e) => {
            const v = e.target.value;
            setProyectoF(v === 'Todos' ? 'Todos' : Number(v));
          }} className="rounded-lg border-gray-200">
            <option value="Todos">Proyecto: Todos</option>
            {projects.map((p) => (
              <option key={p.id_proyecto} value={p.id_proyecto}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No hay KPIs con los filtros actuales." />
      ) : (
        <>
          {/* Vista para móviles (Tarjetas) */}
          <div className="grid sm:hidden gap-3">
            {filtered.map((k) => {
              const proj = projects.find((p) => p.id_proyecto === (k.id_proyecto ?? -1));
              const progress = (Number((k as any).valor_actual) / Number((k as any).valor_objetivo || 1)) * 100;
              return (
                <div key={(k as any).id_kpi} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setDetalles(k)} />
                  <div className="flex items-center justify-between z-10 relative">
                    <h3 className="text-lg font-semibold text-gray-900">{k.nombre}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${tipoBadge[k.tipo]}`}>{k.tipo}</span>
                      {proj && <span className={`text-xs px-2 py-1 rounded ${projectColors[(proj.id_proyecto % projectColors.length)]}`}>{proj.nombre}</span>}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm z-10 relative">{k.descripcion}</p>
                  
                  <div className="z-10 relative">
                    <p className="text-sm font-medium text-gray-700">Progreso: {progress.toFixed(1)}%</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full ${getProgressColor(k)}`} style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {(k as any).valor_actual} de {(k as any).valor_objetivo}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 z-10 relative">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(k as any); }} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm">
                      Editar
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel(k as any); }} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista para tabletas y escritorio (Tabla) */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr className="text-left">
                  <th className="px-4 py-3">KPI</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Proyecto</th>
                  <th className="px-4 py-3">Progreso</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => {
                  const proj = projects.find((p) => p.id_proyecto === (k.id_proyecto ?? -1));
                  const progress = (Number((k as any).valor_actual) / Number((k as any).valor_objetivo || 1)) * 100;
                  return (
                    <tr key={(k as any).id_kpi} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button onClick={() => setDetalles(k)} className="text-left hover:underline font-medium text-gray-900">
                          {k.nombre}
                        </button>
                        <div className="text-gray-500">{k.descripcion}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${tipoBadge[k.tipo]}`}>{k.tipo}</span>
                      </td>
                      <td className="px-4 py-3">
                        {proj ? <span className={`text-xs px-2 py-1 rounded ${projectColors[(proj.id_proyecto % projectColors.length)]}`}>{proj.nombre}</span> : <span className="text-gray-400 text-xs">Sin proyecto</span>}
                      </td>
                      <td className="px-4 py-3 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full ${getProgressColor(k)}`} style={{ width: `${Math.min(100, progress)}%` }} />
                          </div>
                          <span className="w-16 text-right text-gray-700">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {(k as any).valor_actual} de {(k as any).valor_objetivo}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(k as any)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                            Editar
                          </button>
                          <button onClick={() => setConfirmDel(k as any)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Crear/Editar */}
      {showForm && editing && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{(editing as any).id_kpi ? 'Editar KPI' : 'Crear KPI'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input value={editing.nombre} onChange={(e) => setEditing({ ...(editing as any), nombre: e.target.value } as any)} className="mt-1 w-full rounded-lg border-gray-200" placeholder="Escribe el nombre del KPI" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={editing.descripcion as any} onChange={(e) => setEditing({ ...(editing as any), descripcion: e.target.value } as any)} className="mt-1 w-full rounded-lg border-gray-200" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valor Objetivo</label>
                <input type="number" step="0.1" value={Number((editing as any).valor_objetivo ?? 0)} onChange={(e) => setEditing({ ...(editing as any), valor_objetivo: Number(e.target.value) } as any)} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valor Actual</label>
                <input type="number" step="0.1" value={Number((editing as any).valor_actual ?? 0)} onChange={(e) => setEditing({ ...(editing as any), valor_actual: Number(e.target.value) } as any)} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de KPI</label>
                <select value={editing.tipo as any} onChange={(e) => setEditing({ ...(editing as any), tipo: e.target.value as KPIType } as any)} className="mt-1 w-full rounded-lg border-gray-200">
                  <option>Financiero</option>
                  <option>Operacional</option>
                  <option>Cliente</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Proyecto</label>
                <select value={(editing as any).id_proyecto ?? ''} onChange={(e) => setEditing({ ...(editing as any), id_proyecto: e.target.value ? Number(e.target.value) : undefined } as any)} className="mt-1 w-full rounded-lg border-gray-200">
                  <option value="">Sin proyecto</option>
                  {projects.map((p) => (
                    <option key={p.id_proyecto} value={p.id_proyecto}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={saveKPI} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Detalles */}
      {detalles && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetalles(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{detalles.nombre}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${tipoBadge[(detalles.tipo as KPIType)]}`}>{detalles.tipo as any}</span>
                  <span className={`text-xs px-2 py-1 rounded ${projectColors[(projects.find(p => p.id_proyecto === (detalles as any).id_proyecto)?.id_proyecto ?? 0) % projectColors.length]}`}>
                    {projects.find(p => p.id_proyecto === (detalles as any).id_proyecto)?.nombre ?? 'Sin proyecto'}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalles(null)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-800">{(detalles as any).descripcion || '—'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha de Creación</p>
                  <p className="text-gray-800">{new Date((detalles as any).fecha_creacion).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Valor Objetivo</p>
                  <p className="text-gray-800">{(detalles as any).valor_objetivo}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Progreso: {((Number((detalles as any).valor_actual) / Number((detalles as any).valor_objetivo || 1)) * 100).toFixed(1)}%</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full ${getProgressColor(detalles as any)}`} style={{ width: `${Math.min(100, (Number((detalles as any).valor_actual) / Number((detalles as any).valor_objetivo || 1)) * 100)}%` }} />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={Number((detalles as any).valor_actual ?? 0)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setKpis((prev) => prev.map((x) => ((x as any).id_kpi === (detalles as any).id_kpi ? ({ ...(x as any), valor_actual: v } as any) : x)));
                      setDetalles({ ...(detalles as any), valor_actual: v } as any);
                    }}
                    className="w-24 rounded-lg border-gray-200"
                  />
                  <span className="text-sm text-gray-700">de {(detalles as any).valor_objetivo}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-medium text-gray-900">Acciones</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(detalles as any)} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-white">Editar KPI</button>
                  <button onClick={() => setConfirmDel(detalles as any)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
                    Eliminar
                  </button>
                  <button onClick={() => {
                    updateKPIProgress((detalles as any).id_kpi, Number((detalles as any).valor_actual ?? 0))
                      .then((saved) => {
                        setKpis((prev) => prev.map((x) => (x.id_kpi === saved.id_kpi ? saved : x)));
                        setDetalles(saved as any);
                      })
                      .catch(console.error);
                  }} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">Guardar progreso</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Eliminar KPI</h3>
            <p className="mt-1 text-gray-600">¿Seguro que deseas eliminar “{(confirmDel as any).nombre}”?</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={() => deleteKPI(confirmDel as any)} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPI;