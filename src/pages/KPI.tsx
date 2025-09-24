import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type KPIType = 'Financiero' | 'Operacional' | 'Cliente' | 'Marketing';

type Project = { id: string; nombre: string; color: string };

type KPI = {
  id: string;
  nombre: string;
  descripcion?: string;
  objetivo: number;
  valorActual: number;
  tipo: KPIType;
  proyectoId?: string;
  fechaCreacion: string;
};

const projects: Project[] = [
  { id: 'p1', nombre: 'Proyecto A', color: 'bg-blue-100 text-blue-700' },
  { id: 'p2', nombre: 'Proyecto B', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'p3', nombre: 'Proyecto C', color: 'bg-amber-100 text-amber-700' },
];

const initialKPIs: KPI[] = [
  {
    id: 'k1',
    nombre: 'Tasa de Conversión',
    descripcion: 'Mide el porcentaje de visitantes que se convierten en clientes.',
    objetivo: 5,
    valorActual: 3.5,
    tipo: 'Marketing',
    proyectoId: 'p1',
    fechaCreacion: new Date('2025-09-01').toISOString().slice(0, 10),
  },
  {
    id: 'k2',
    nombre: 'Costo de Adquisición de Clientes',
    descripcion: 'Costo total para adquirir un nuevo cliente.',
    objetivo: 50,
    valorActual: 62.1,
    tipo: 'Financiero',
    proyectoId: 'p2',
    fechaCreacion: new Date('2025-08-15').toISOString().slice(0, 10),
  },
  {
    id: 'k3',
    nombre: 'Satisfacción del Cliente (NPS)',
    descripcion: 'Mide la lealtad y satisfacción del cliente.',
    objetivo: 75,
    valorActual: 81,
    tipo: 'Cliente',
    proyectoId: 'p1',
    fechaCreacion: new Date('2025-09-10').toISOString().slice(0, 10),
  },
];

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
  const [kpis, setKpis] = useState<KPI[]>(initialKPIs);
  const [query, setQuery] = useState('');
  const [tipoF, setTipoF] = useState<'Todos' | KPIType>('Todos');
  const [proyectoF, setProyectoF] = useState<'Todos' | string>('Todos');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KPI | null>(null);
  const [detalles, setDetalles] = useState<KPI | null>(null);
  const [confirmDel, setConfirmDel] = useState<KPI | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return kpis
      .filter((k) => (tipoF === 'Todos' ? true : k.tipo === tipoF))
      .filter((k) => (proyectoF === 'Todos' ? true : k.proyectoId === proyectoF))
      .filter((k) => k.nombre.toLowerCase().includes(query.toLowerCase()) || (k.descripcion ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [kpis, query, tipoF, proyectoF]);

  const openCreate = () => {
    setEditing({
      id: uuidv4(),
      nombre: '',
      descripcion: '',
      objetivo: 0,
      valorActual: 0,
      tipo: 'Operacional',
      proyectoId: undefined,
      fechaCreacion: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const openEdit = (k: KPI) => {
    setEditing({ ...k });
    setShowForm(true);
  };

  const saveKPI = () => {
    if (!editing) return;
    setKpis((prev) => {
      const exists = prev.some((x) => x.id === editing.id);
      if (exists) return prev.map((x) => (x.id === editing.id ? editing : x));
      return [...prev, { ...editing, id: uuidv4() }];
    });
    setShowForm(false);
    setEditing(null);
  };

  const deleteKPI = (k: KPI) => {
    setKpis((prev) => prev.filter((x) => x.id !== k.id));
    setConfirmDel(null);
    if (detalles?.id === k.id) setDetalles(null);
  };

  const getProgressColor = (k: KPI) => {
    const progress = (k.valorActual / k.objetivo) * 100;
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

          <select value={proyectoF} onChange={(e) => setProyectoF(e.target.value)} className="rounded-lg border-gray-200">
            <option value="Todos">Proyecto: Todos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
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
              const proj = projects.find((p) => p.id === k.proyectoId);
              const progress = (k.valorActual / k.objetivo) * 100;
              return (
                <div key={k.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setDetalles(k)} />
                  <div className="flex items-center justify-between z-10 relative">
                    <h3 className="text-lg font-semibold text-gray-900">{k.nombre}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${tipoBadge[k.tipo]}`}>{k.tipo}</span>
                      {proj && <span className={`text-xs px-2 py-1 rounded ${proj.color}`}>{proj.nombre}</span>}
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
                      {k.valorActual} de {k.objetivo}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 z-10 relative">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(k); }} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm">
                      Editar
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel(k); }} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50 text-sm">
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
                  const proj = projects.find((p) => p.id === k.proyectoId);
                  const progress = (k.valorActual / k.objetivo) * 100;
                  return (
                    <tr key={k.id} className="border-t border-gray-100 hover:bg-gray-50">
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
                        {proj ? <span className={`text-xs px-2 py-1 rounded ${proj.color}`}>{proj.nombre}</span> : <span className="text-gray-400 text-xs">Sin proyecto</span>}
                      </td>
                      <td className="px-4 py-3 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full ${getProgressColor(k)}`} style={{ width: `${Math.min(100, progress)}%` }} />
                          </div>
                          <span className="w-16 text-right text-gray-700">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {k.valorActual} de {k.objetivo}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(k)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                            Editar
                          </button>
                          <button onClick={() => setConfirmDel(k)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50">
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
              <h3 className="text-lg font-semibold text-gray-900">{editing.id.startsWith('k') ? 'Editar KPI' : 'Crear KPI'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" placeholder="Escribe el nombre del KPI" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={editing.descripcion} onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valor Objetivo</label>
                <input type="number" step="0.1" value={editing.objetivo} onChange={(e) => setEditing({ ...editing, objetivo: Number(e.target.value) })} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valor Actual</label>
                <input type="number" step="0.1" value={editing.valorActual} onChange={(e) => setEditing({ ...editing, valorActual: Number(e.target.value) })} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de KPI</label>
                <select value={editing.tipo} onChange={(e) => setEditing({ ...editing, tipo: e.target.value as KPIType })} className="mt-1 w-full rounded-lg border-gray-200">
                  <option>Financiero</option>
                  <option>Operacional</option>
                  <option>Cliente</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Proyecto</label>
                <select value={editing.proyectoId ?? ''} onChange={(e) => setEditing({ ...editing, proyectoId: e.target.value || undefined })} className="mt-1 w-full rounded-lg border-gray-200">
                  <option value="">Sin proyecto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
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
                  <span className={`text-xs px-2 py-1 rounded ${tipoBadge[detalles.tipo]}`}>{detalles.tipo}</span>
                  <span className={`text-xs px-2 py-1 rounded ${projects.find(p => p.id === detalles.proyectoId)?.color ?? 'bg-gray-100 text-gray-600'}`}>
                    {projects.find(p => p.id === detalles.proyectoId)?.nombre ?? 'Sin proyecto'}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalles(null)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Descripción</p>
                <p className="text-gray-800">{detalles.descripcion || '—'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha de Creación</p>
                  <p className="text-gray-800">{new Date(detalles.fechaCreacion).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Valor Objetivo</p>
                  <p className="text-gray-800">{detalles.objetivo}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Progreso: {((detalles.valorActual / detalles.objetivo) * 100).toFixed(1)}%</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full ${getProgressColor(detalles)}`} style={{ width: `${Math.min(100, (detalles.valorActual / detalles.objetivo) * 100)}%` }} />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={detalles.valorActual}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setKpis((prev) => prev.map((x) => (x.id === detalles.id ? { ...x, valorActual: v } : x)));
                      setDetalles({ ...detalles, valorActual: v });
                    }}
                    className="w-24 rounded-lg border-gray-200"
                  />
                  <span className="text-sm text-gray-700">de {detalles.objetivo}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-medium text-gray-900">Acciones</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => openEdit(detalles)} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-white">Editar KPI</button>
                  <button onClick={() => setConfirmDel(detalles)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
                    Eliminar
                  </button>
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
            <p className="mt-1 text-gray-600">¿Seguro que deseas eliminar “{confirmDel.nombre}”?</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={() => deleteKPI(confirmDel)} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPI;