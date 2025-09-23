import React, { useMemo, useState } from 'react';

type Priority = 'Alta' | 'Media' | 'Baja';
type Status = 'Activa' | 'Completada';
type ViewMode = 'lista' | 'tarjetas';

type User = { id: string; nombre: string; avatar: string };
type Project = { id: string; nombre: string; color: string };
type TimeLog = { id: string; horas: number; nota?: string; fecha: string };

type Task = {
  id: string;
  titulo: string;
  descripcion?: string;
  status: Status;
  prioridad: Priority;
  progreso: number; // 0..100
  vencimiento?: string; // ISO date
  asignadoA?: string; // userId
  proyectoId?: string; // projectId
  tiempo: TimeLog[];
};

const users: User[] = [
  { id: 'u1', nombre: 'Leidy', avatar: 'https://i.pravatar.cc/40?img=5' },
  { id: 'u2', nombre: 'Nicolás', avatar: 'https://i.pravatar.cc/40?img=1' },
  { id: 'u3', nombre: 'Carolina', avatar: 'https://i.pravatar.cc/40?img=12' },
];

const projects: Project[] = [
  { id: 'p1', nombre: 'Proyecto A', color: 'bg-blue-100 text-blue-700' },
  { id: 'p2', nombre: 'Proyecto B', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'p3', nombre: 'Proyecto C', color: 'bg-amber-100 text-amber-700' },
];

const initialTasks: Task[] = [
  {
    id: 't1',
    titulo: 'Diseñar tablero principal',
    descripcion: 'Estructura inicial y componentes base',
    status: 'Activa',
    prioridad: 'Alta',
    progreso: 45,
    vencimiento: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    asignadoA: 'u1',
    proyectoId: 'p1',
    tiempo: [{ id: 'tl1', horas: 2, fecha: new Date().toISOString(), nota: 'Wireframes' }],
  },
  {
    id: 't2',
    titulo: 'Crear KPIs iniciales',
    descripcion: 'Ventas, Clientes y Tasa de conversión',
    status: 'Activa',
    prioridad: 'Media',
    progreso: 20,
    vencimiento: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    asignadoA: 'u2',
    proyectoId: 'p1',
    tiempo: [],
  },
  {
    id: 't3',
    titulo: 'Refinar estilos y tipografías',
    descripcion: 'Alinear con guía visual',
    status: 'Completada',
    prioridad: 'Baja',
    progreso: 100,
    vencimiento: new Date().toISOString().slice(0, 10),
    asignadoA: 'u3',
    proyectoId: 'p2',
    tiempo: [{ id: 'tl2', horas: 1.5, fecha: new Date().toISOString() }],
  },
];

const prioridadBadge: Record<Priority, string> = {
  Alta: 'bg-rose-100 text-rose-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja: 'bg-emerald-100 text-emerald-700',
};

const statusBadge: Record<Status, string> = {
  Activa: 'bg-blue-100 text-blue-700',
  Completada: 'bg-gray-100 text-gray-600',
};

const Avatar: React.FC<{ userId?: string }> = ({ userId }) => {
  const u = users.find((x) => x.id === userId);
  return (
    <div className="flex items-center gap-2">
      <img className="w-7 h-7 rounded-full ring-1 ring-gray-200" src={u?.avatar ?? 'https://i.pravatar.cc/40?u=anon'} alt={u?.nombre ?? 'Sin asignar'} />
      <span className="text-sm text-gray-700">{u?.nombre ?? 'Sin asignar'}</span>
    </div>
  );
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

const Tarea: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [query, setQuery] = useState('');
  const [statusF, setStatusF] = useState<'Todas' | Status>('Todas');
  const [prioridadF, setPrioridadF] = useState<'Todas' | Priority>('Todas');
  const [proyectoF, setProyectoF] = useState<'Todos' | string>('Todos');
  const [asignadoF, setAsignadoF] = useState<'Todos' | string>('Todos');
  const [vista, setVista] = useState<ViewMode>('lista');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detalles, setDetalles] = useState<Task | null>(null);
  const [confirmDel, setConfirmDel] = useState<Task | null>(null);

  // NUEVO: control del panel de filtros en móvil
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (statusF === 'Todas' ? true : t.status === statusF))
      .filter((t) => (prioridadF === 'Todas' ? true : t.prioridad === prioridadF))
      .filter((t) => (proyectoF === 'Todos' ? true : t.proyectoId === proyectoF))
      .filter((t) => (asignadoF === 'Todos' ? true : t.asignadoA === asignadoF))
      .filter((t) => t.titulo.toLowerCase().includes(query.toLowerCase()) || (t.descripcion ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [tasks, query, statusF, prioridadF, proyectoF, asignadoF]);

  const totalHoras = (t: Task) => t.tiempo.reduce((acc, x) => acc + x.horas, 0);

  const openCreate = () => {
    setEditing({
      id: `tmp-${Date.now()}`,
      titulo: '',
      descripcion: '',
      status: 'Activa',
      prioridad: 'Media',
      progreso: 0,
      vencimiento: undefined,
      asignadoA: undefined,
      proyectoId: undefined,
      tiempo: [],
    });
    setShowForm(true);
  };

  const openEdit = (t: Task) => {
    setEditing({ ...t });
    setShowForm(true);
  };

  const saveTask = () => {
    if (!editing) return;
    setTasks((prev) => {
      const exists = prev.some((x) => x.id === editing.id && !editing.id.startsWith('tmp-'));
      if (exists) return prev.map((x) => (x.id === editing.id ? editing : x));
      const newId = `t${prev.length + 1}`;
      return [...prev, { ...editing, id: newId }];
    });
    setShowForm(false);
    setEditing(null);
  };

  const markDone = (t: Task, done: boolean) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: done ? 'Completada' : 'Activa', progreso: done ? 100 : x.progreso } : x)));
  };

  const changeDue = (t: Task, date?: string) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, vencimiento: date } : x)));
  };

  const assignTo = (t: Task, userId?: string) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, asignadoA: userId } : x)));
  };

  const assignProject = (t: Task, projectId?: string) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, proyectoId: projectId } : x)));
  };

  const addTime = (t: Task, horas: number, nota?: string) => {
    if (!horas || horas <= 0) return;
    const log: TimeLog = { id: `log-${Date.now()}`, horas, nota, fecha: new Date().toISOString() };
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, tiempo: [...x.tiempo, log] } : x)));
  };

  const deleteTask = (t: Task) => {
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    setConfirmDel(null);
    if (detalles?.id === t.id) setDetalles(null);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Tareas"
        right={
          <div className="flex items-center gap-2">
            {/* Botón de filtros (solo móvil) */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="sm:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Filtros"
              title="Filtros"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16M7 12h10M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Toggle vista (iconos en móvil) */}
            <button
              onClick={() => setVista(vista === 'lista' ? 'tarjetas' : 'lista')}
              className="sm:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Cambiar vista"
              title="Cambiar vista"
            >
              {vista === 'lista' ? (
                // icono tarjetas
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                // icono lista
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Toggle vista (segmentos en ≥ sm) */}
            <div className="hidden sm:flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setVista('tarjetas')}
                className={`px-3 py-2 text-sm ${vista === 'tarjetas' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`px-3 py-2 text-sm ${vista === 'lista' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Lista
              </button>
            </div>

            <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow">
              Nueva tarea
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título o descripción"
                className="w-full rounded-lg border-gray-200 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <select value={statusF} onChange={(e) => setStatusF(e.target.value as any)} className="rounded-lg border-gray-200">
            <option value="Todas">Estado: Todas</option>
            <option value="Activa">Activas</option>
            <option value="Completada">Completadas</option>
          </select>

          <select value={prioridadF} onChange={(e) => setPrioridadF(e.target.value as any)} className="rounded-lg border-gray-200">
            <option value="Todas">Prioridad: Todas</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <select value={proyectoF} onChange={(e) => setProyectoF(e.target.value)} className="rounded-lg border-gray-200">
            <option value="Todos">Proyecto: Todos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select value={asignadoF} onChange={(e) => setAsignadoF(e.target.value)} className="rounded-lg border-gray-200">
            <option value="Todos">Asignado: Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setQuery('');
              setStatusF('Todas');
              setPrioridadF('Todas');
              setProyectoF('Todos');
              setAsignadoF('Todos');
            }}
            className="rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista/Tarjetas */}
      {filtered.length === 0 ? (
        <EmptyState text="No hay tareas con los filtros actuales." />
      ) : vista === 'lista' ? (
        // CONTENEDOR: agrega overflow-x-auto
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          {/* TABLA: fija un ancho mínimo para scroll horizontal en móvil */}
          <table className="w-full text-sm min-w-[880px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Asignado</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Tiempo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const proj = projects.find((p) => p.id === t.proyectoId);
                return (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={t.status === 'Completada'} onChange={(e) => markDone(t, e.target.checked)} className="rounded" />
                        <button onClick={() => setDetalles(t)} className="text-left hover:underline font-medium text-gray-900">
                          {t.titulo}
                        </button>
                      </div>
                      {t.descripcion && <div className="text-gray-500">{t.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {proj ? <span className={`text-xs px-2 py-1 rounded ${proj.color}`}>{proj.nombre}</span> : <span className="text-gray-400 text-xs">Sin proyecto</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Avatar userId={t.asignadoA} />
                    </td>
                    <td className="px-4 py-3">{t.vencimiento ? new Date(t.vencimiento).toLocaleDateString() : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${prioridadBadge[t.prioridad]}`}>{t.prioridad}</span>
                    </td>
                    <td className="px-4 py-3 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${t.progreso}%` }} />
                        </div>
                        <span className="w-10 text-right text-gray-700">{t.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{totalHoras(t)} h</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${statusBadge[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                          Editar
                        </button>
                        <button onClick={() => setConfirmDel(t)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50">
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
      ) : (
        // GRID de tarjetas: ajusta gaps y columnas responsivas
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const proj = projects.find((p) => p.id === t.proyectoId);
            return (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" checked={t.status === 'Completada'} onChange={(e) => markDone(t, e.target.checked)} />
                    <button onClick={() => setDetalles(t)} className="font-semibold text-gray-900 text-left hover:underline">
                      {t.titulo}
                    </button>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${prioridadBadge[t.prioridad]}`}>{t.prioridad}</span>
                </div>
                {t.descripcion && <p className="mt-2 text-gray-600 text-sm">{t.descripcion}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {proj && <span className={`text-xs px-2 py-1 rounded ${proj.color}`}>{proj.nombre}</span>}
                  <span className="text-gray-500">{t.vencimiento ? new Date(t.vencimiento).toLocaleDateString() : 'Sin fecha'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${t.progreso}%` }} />
                  </div>
                  <span className="text-sm text-gray-700">{t.progreso}%</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Avatar userId={t.asignadoA} />
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-sm">
                      Editar
                    </button>
                    <button onClick={() => setConfirmDel(t)} className="px-2 py-1 rounded border border-gray-200 text-rose-600 hover:bg-rose-50 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showForm && editing && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editing.id.startsWith('tmp-') ? 'Crear tarea' : 'Editar tarea'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Título</label>
                <input value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" placeholder="Escribe el título" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={editing.descripcion} onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })} className="mt-1 w-full rounded-lg border-gray-200" rows={3} />
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
              <div>
                <label className="text-sm font-medium text-gray-700">Asignado a</label>
                <select value={editing.asignadoA ?? ''} onChange={(e) => setEditing({ ...editing, asignadoA: e.target.value || undefined })} className="mt-1 w-full rounded-lg border-gray-200">
                  <option value="">Sin asignar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha límite</label>
                <input type="date" value={editing.vencimiento ?? ''} onChange={(e) => setEditing({ ...editing, vencimiento: e.target.value || undefined })} className="mt-1 w-full rounded-lg border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Prioridad</label>
                <select value={editing.prioridad} onChange={(e) => setEditing({ ...editing, prioridad: e.target.value as Priority })} className="mt-1 w-full rounded-lg border-gray-200">
                  <option>Alta</option>
                  <option>Media</option>
                  <option>Baja</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Progreso: {editing.progreso}%</label>
                <input type="range" min={0} max={100} value={editing.progreso} onChange={(e) => setEditing({ ...editing, progreso: Number(e.target.value) })} className="mt-1 w-full" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={saveTask} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
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
                <h3 className="text-xl font-semibold text-gray-900">{detalles.titulo}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${prioridadBadge[detalles.prioridad]}`}>{detalles.prioridad}</span>
                  <span className={`text-xs px-2 py-1 rounded ${statusBadge[detalles.status]}`}>{detalles.status}</span>
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
                  <p className="text-sm text-gray-500 mb-1">Asignado</p>
                  <Avatar userId={detalles.asignadoA} />
                  <select
                    className="mt-2 w-full rounded-lg border-gray-200"
                    value={detalles.asignadoA ?? ''}
                    onChange={(e) => {
                      assignTo(detalles, e.target.value || undefined);
                      setDetalles({ ...detalles, asignadoA: e.target.value || undefined });
                    }}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Proyecto</p>
                  <select
                    className="w-full rounded-lg border-gray-200"
                    value={detalles.proyectoId ?? ''}
                    onChange={(e) => {
                      assignProject(detalles, e.target.value || undefined);
                      setDetalles({ ...detalles, proyectoId: e.target.value || undefined });
                    }}
                  >
                    <option value="">Sin proyecto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha límite</p>
                  <input
                    type="date"
                    className="w-full rounded-lg border-gray-200"
                    value={detalles.vencimiento ?? ''}
                    onChange={(e) => {
                      changeDue(detalles, e.target.value || undefined);
                      setDetalles({ ...detalles, vencimiento: e.target.value || undefined });
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Progreso: {detalles.progreso}%</p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={detalles.progreso}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setTasks((prev) => prev.map((x) => (x.id === detalles.id ? { ...x, progreso: v } : x)));
                      setDetalles({ ...detalles, progreso: v });
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="font-medium text-gray-900">Tiempo</p>
                  <p className="text-sm text-gray-500">Total: {totalHoras(detalles)} h</p>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget as HTMLFormElement;
                      const horas = Number((form.elements.namedItem('horas') as HTMLInputElement).value);
                      const nota = (form.elements.namedItem('nota') as HTMLInputElement).value;
                      addTime(detalles, horas, nota);
                      setDetalles({ ...detalles, tiempo: [...detalles.tiempo, { id: `log-${Date.now()}`, horas, nota, fecha: new Date().toISOString() }] });
                      form.reset();
                    }}
                  >
                    <input name="horas" type="number" step="0.25" min="0" placeholder="Horas" className="flex-1 rounded-lg border-gray-200" />
                    <input name="nota" type="text" placeholder="Nota" className="flex-[2] rounded-lg border-gray-200" />
                    <button className="px-3 rounded-lg bg-blue-600 text-white">Agregar</button>
                  </form>
                  <ul className="mt-3 space-y-2 text-sm">
                    {detalles.tiempo.length === 0 && <li className="text-gray-500">Sin registros aún.</li>}
                    {detalles.tiempo.map((l) => (
                      <li key={l.id} className="flex items-center justify-between">
                        <span className="text-gray-700">{new Date(l.fecha).toLocaleDateString()} · {l.horas} h</span>
                        <span className="text-gray-500">{l.nota}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="font-medium text-gray-900">Acciones</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => openEdit(detalles)} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-white">Editar tarea</button>
                    <button
                      onClick={() => markDone(detalles, detalles.status !== 'Completada')}
                      className={`px-3 py-2 rounded-lg ${detalles.status === 'Completada' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {detalles.status === 'Completada' ? 'Marcar como activa' : 'Marcar completada'}
                    </button>
                    <button onClick={() => setConfirmDel(detalles)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100">
                      Eliminar
                    </button>
                  </div>
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
            <h3 className="text-lg font-semibold text-gray-900">Eliminar tarea</h3>
            <p className="mt-1 text-gray-600">¿Seguro que deseas eliminar “{confirmDel.titulo}”?</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-gray-200">Cancelar</button>
              <button onClick={() => deleteTask(confirmDel)} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tarea;