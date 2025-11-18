import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

// ---------------- Real data services ----------------
import { listKPIs, type KPI as ApiKPI, type KPIType } from "../services/kpis";
import { fetchProyectos, type Proyecto as ApiProyecto } from "../services/projects";
import { fetchUsuarios, type UsuarioLite } from "../services/projects";
import { fetchTareasByProyecto, type Tarea as ApiTarea } from "../services/tasks";
import {
  DEFAULT_PANEL_LAYOUT_STATE,
  PANEL_IDS,
  fetchDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
  type PanelLayoutState,
  type PanelLayoutPreference,
  type PanelPlacement,
  type PanelId,
  type LayoutCode,
} from "../services/dashboard";
import { getCurrentUser } from "../services/session";

type Project = { id: number; nombre: string; color: string };
type KPI = { id: number; nombre: string; objetivo: number; valorActual: number; tipo: KPIType; proyectoId?: number };
type User = { id: number; nombre: string; avatar: string };

// Estado de tareas para el gráfico de pie
type TaskSlice = { name: string; value: number };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// Paleta simple para proyectos
const PROJECT_BADGES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

type PanelSpan = 4 | 6 | 8 | 12;

const SUPPORTED_SPANS: PanelSpan[] = [4, 6, 8, 12];

const SPAN_LABELS: Record<PanelSpan, string> = {
  12: "Completo",
  8: "3/4",
  6: "1/2",
  4: "1/3",
};

const SPAN_CLASSES: Record<PanelSpan, string> = {
  12: "col-span-12",
  8: "col-span-12 xl:col-span-8",
  6: "col-span-12 lg:col-span-6",
  4: "col-span-12 md:col-span-6 xl:col-span-4",
};

const PREVIEW_SPAN_CLASSES: Record<PanelSpan, string> = {
  12: "col-span-12",
  8: "col-span-8",
  6: "col-span-6",
  4: "col-span-4",
};

const PANEL_DESCRIPTIONS: Record<PanelId, { title: string; description: string }> = {
  stats: { title: "Indicadores clave", description: "Tarjetas resumen con el estado global de KPIs." },
  kpiByType: { title: "KPIs por tipo", description: "Distribución de KPIs por categoría." },
  tasksStatus: { title: "Estado de tareas", description: "Seguimiento visual de tareas completadas y pendientes." },
  progressByProject: { title: "Progreso por proyecto", description: "Ranking con el avance promedio de cada proyecto." },
  kpiTrend: { title: "Tendencia de KPIs", description: "Curva de progreso mensual versus objetivo." },
};

const PANEL_SIZE_OPTIONS: Record<PanelId, PanelSpan[]> = {
  stats: [12, 8, 6],
  kpiByType: [12, 8, 6, 4],
  tasksStatus: [12, 8, 6, 4],
  progressByProject: [12, 8],
  kpiTrend: [12, 8, 6],
};

const PANEL_PRESETS: Record<LayoutCode, PanelLayoutState> = {
  "grid-2": DEFAULT_PANEL_LAYOUT_STATE,
  "grid-3": {
    panels: [
      { id: "stats", order: 0, colSpan: 12 },
      { id: "kpiByType", order: 1, colSpan: 4 },
      { id: "tasksStatus", order: 2, colSpan: 4 },
      { id: "kpiTrend", order: 3, colSpan: 4 },
      { id: "progressByProject", order: 4, colSpan: 12 },
    ],
  },
  "focus-kpi": {
    panels: [
      { id: "stats", order: 0, colSpan: 12 },
      { id: "kpiByType", order: 1, colSpan: 8 },
      { id: "tasksStatus", order: 2, colSpan: 4 },
      { id: "progressByProject", order: 3, colSpan: 12 },
      { id: "kpiTrend", order: 4, colSpan: 12 },
    ],
  },
  "progress-focus": {
    panels: [
      { id: "stats", order: 0, colSpan: 12 },
      { id: "progressByProject", order: 1, colSpan: 12 },
      { id: "tasksStatus", order: 2, colSpan: 6 },
      { id: "kpiByType", order: 3, colSpan: 6 },
      { id: "kpiTrend", order: 4, colSpan: 12 },
    ],
  },
  custom: DEFAULT_PANEL_LAYOUT_STATE,
};

const PRESET_CARDS: Array<{ code: LayoutCode; title: string; description: string }> = [
  { code: "grid-2", title: "Balanceado", description: "Dos columnas adaptables con enfoque general." },
  { code: "grid-3", title: "Tablero compacto", description: "Tres columnas para ver más paneles a la vez." },
  { code: "focus-kpi", title: "KPIs al frente", description: "KPIs y métricas dominan la vista." },
  { code: "progress-focus", title: "Progreso destacado", description: "Resalta el avance por proyecto y tareas." },
];

const cloneLayoutState = (state: PanelLayoutState): PanelLayoutState => ({
  panels: state.panels.map((panel) => ({ ...panel })),
});

const isPanelId = (value: string): value is PanelId => PANEL_IDS.includes(value as PanelId);

const normalizeState = (state?: PanelLayoutState | null): PanelLayoutState => {
  if (!state || !Array.isArray(state.panels)) {
    return cloneLayoutState(DEFAULT_PANEL_LAYOUT_STATE);
  }
  const fallback = cloneLayoutState(DEFAULT_PANEL_LAYOUT_STATE);
  const map = new Map<PanelId, PanelPlacement>();
  state.panels.forEach((panel, idx) => {
    if (!panel || !isPanelId(panel.id)) return;
    const span = SUPPORTED_SPANS.includes(panel.colSpan as PanelSpan)
      ? (panel.colSpan as PanelSpan)
      : 12;
    map.set(panel.id, {
      id: panel.id,
      order: typeof panel.order === "number" ? panel.order : idx,
      colSpan: span,
    });
  });
  fallback.panels.forEach((panel) => {
    if (!map.has(panel.id)) {
      map.set(panel.id, { ...panel });
    }
  });
  const panels = Array.from(map.values())
    .sort((a, b) => a.order - b.order)
    .map((panel, idx) => ({ ...panel, order: idx }));
  return { panels };
};

const sanitizePinned = (value?: PanelId[]): PanelId[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<PanelId>();
  return value.filter((pid): pid is PanelId => {
    if (!isPanelId(pid) || seen.has(pid)) {
      return false;
    }
    seen.add(pid);
    return true;
  });
};

const buildDefaultPreference = (userId: number): PanelLayoutPreference => ({
  id: null,
  id_usuario: userId,
  id_proyecto: 0,
  layout_code: "grid-2",
  panel_state: cloneLayoutState(DEFAULT_PANEL_LAYOUT_STATE),
  pinned_panels: [],
});

const normalizePreference = (pref: PanelLayoutPreference): PanelLayoutPreference => ({
  ...pref,
  id_proyecto: pref.id_proyecto ?? 0,
  panel_state: normalizeState(pref.panel_state),
  pinned_panels: sanitizePinned(pref.pinned_panels),
});

// ---------------- Mini Components ----------------
const MiniTrend = ({ data }: { data: number[] }) => (
  <div className="flex items-end gap-1 h-10">
    {data.map((h, i) => (
      <div
        key={i}
        className="w-1.5 rounded-sm bg-gradient-to-t from-blue-200 to-blue-500"
        style={{ height: `${h * 4}px` }}
      />
    ))}
  </div>
);

const StatCard = ({
  title,
  value,
  delta,
  trendColor,
}: {
  title: string;
  value: string | number;
  delta: number;
  trendColor: "green" | "rose" | "amber";
}) => {
  const map = {
    green: "text-green-600 bg-green-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
  } as const;
  return (
    <div className="surface-card rounded-xl border shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className={`text-xs px-2 py-1 rounded ${map[trendColor]}`}>
          {delta >= 0 ? "+" : ""}
          {delta}%
        </span>
      </div>
      <div className="mt-4">
        <MiniTrend data={[6, 10, 4, 12, 8, 14, 9]} />
      </div>
    </div>
  );
};

// ---------------- Dashboard ----------------
const DashboardHome: React.FC = () => {
  // Datos desde API
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [tareasPie, setTareasPie] = useState<TaskSlice[]>([
    { name: "Completadas", value: 0 },
    { name: "En progreso", value: 0 },
    { name: "Pendientes", value: 0 },
  ]);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const actingUserId = currentUser?.id_usuario ?? 1;

  const [layoutPref, setLayoutPref] = useState<PanelLayoutPreference>(() => buildDefaultPreference(actingUserId));
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutAlert, setLayoutAlert] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [draftLayoutCode, setDraftLayoutCode] = useState<LayoutCode>("grid-2");
  const [draftPanelState, setDraftPanelState] = useState<PanelLayoutState>(() => cloneLayoutState(DEFAULT_PANEL_LAYOUT_STATE));
  const [draftPinned, setDraftPinned] = useState<PanelId[]>([]);
  const [draggingPanel, setDraggingPanel] = useState<PanelId | null>(null);

  const commitPreference = (pref: PanelLayoutPreference) => {
    setLayoutPref(normalizePreference(pref));
  };

  // Carga inicial de datos reales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pr, us, ks] = await Promise.all([fetchProyectos(), fetchUsuarios(), listKPIs()]);
        if (!alive) return;
        const mappedProjects: Project[] = pr.map((p: ApiProyecto, i: number) => ({
          id: p.id_proyecto,
          nombre: p.nombre,
          color: PROJECT_BADGES[i % PROJECT_BADGES.length],
        }));
        setProjects(mappedProjects);
        setUsers(
          us.map((u: UsuarioLite) => ({
            id: u.id_usuario,
            nombre: u.nombre || u.email,
            avatar: `https://i.pravatar.cc/40?u=${u.email || u.id_usuario}`,
          }))
        );
        setKpis(
          ks.map((k: ApiKPI) => ({
            id: k.id_kpi,
            nombre: k.nombre,
            objetivo: Number(k.valor_objetivo ?? 0) || 0,
            valorActual: Number(k.valor_actual ?? 0) || 0,
            tipo: k.tipo,
            proyectoId: k.id_proyecto ?? undefined,
          }))
        );
        const tareasByProj = await Promise.all(pr.map((p) => fetchTareasByProyecto(p.id_proyecto)));
        const allTasks: ApiTarea[] = tareasByProj.flat();
        const completed = allTasks.filter((t) => t.estado === "Completada").length;
        const inProgress = allTasks.filter((t) => t.estado === "En progreso").length;
        const pending = allTasks.filter((t) => t.estado === "Pendiente").length;
        setTareasPie([
          { name: "Completadas", value: completed },
          { name: "En progreso", value: inProgress },
          { name: "Pendientes", value: pending },
        ]);
      } catch {
        // En un escenario real mostraríamos una alerta
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Carga del layout personalizado
  useEffect(() => {
    let active = true;
    (async () => {
      setLayoutLoading(true);
      try {
        const pref = await fetchDashboardLayout(actingUserId, 0);
        if (!active) return;
        commitPreference(pref);
      } catch {
        if (active) {
          commitPreference(buildDefaultPreference(actingUserId));
        }
      } finally {
        if (active) {
          setLayoutLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [actingUserId]);

  // 📊 Estadísticas calculadas
  const totalKPIs = kpis.length;
  const avgProgress = useMemo(() => {
    const valid = kpis.filter((k) => k.objetivo > 0);
    const sum = valid.reduce((acc, k) => acc + (k.valorActual / k.objetivo) * 100, 0);
    return valid.length ? sum / valid.length : 0;
  }, [kpis]);

  const kpiByType = useMemo(() => {
    const types: KPIType[] = ["Financiero", "Operacional", "Cliente", "Marketing"];
    return types.map((t) => ({ name: t, value: kpis.filter((k) => k.tipo === t).length }));
  }, [kpis]);

  const progressByProject = useMemo(() => {
    const arr = projects.map((p) => {
      const projKpis = kpis.filter((k) => k.proyectoId === p.id && k.objetivo > 0);
      const avg = projKpis.length
        ? projKpis.reduce((acc, k) => acc + (k.valorActual / k.objetivo) * 100, 0) / projKpis.length
        : 0;
      return { name: p.nombre, progreso: +avg.toFixed(1) };
    });
    return arr.sort((a, b) => b.progreso - a.progreso);
  }, [projects, kpis]);

  const progressChartHeight = useMemo(() => {
    const rows = Math.max(progressByProject.length, 1);
    return Math.max(240, rows * 38 + 60);
  }, [progressByProject.length]);

  const kpiTrend = useMemo(() => {
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const now = new Date();
    const last5 = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
    return last5.map(({ y, m }) => {
      const group = kpis.filter((k) => {
        const d = k as any;
        const dt = new Date((d.fecha_creacion as string) || new Date());
        return dt.getFullYear() === y && dt.getMonth() === m;
      });
      const valid = group.filter((k) => k.objetivo > 0);
      const avg = valid.length
        ? valid.reduce((acc, k) => acc + (k.valorActual / k.objetivo) * 100, 0) / valid.length
        : 0;
      return { mes: months[m], progreso: +avg.toFixed(0), objetivos: 80 };
    });
  }, [kpis]);

  // ---------------- Filtros ----------------
  const [kpiF, setKpiF] = useState<"Todos" | KPIType>("Todos");
  const [userF, setUserF] = useState<"Todos" | number | string>("Todos");
  const [dateF, setDateF] = useState("");

  // Layout visible
  const orderedPanels = useMemo(
    () => [...layoutPref.panel_state.panels].sort((a, b) => a.order - b.order),
    [layoutPref]
  );
  const pinnedSet = useMemo(() => new Set(layoutPref.pinned_panels), [layoutPref.pinned_panels]);
  const pinnedPlacements = orderedPanels.filter((panel) => pinnedSet.has(panel.id));
  const regularPlacements = orderedPanels.filter((panel) => !pinnedSet.has(panel.id));

  const openLayoutModal = () => {
    setDraftLayoutCode(layoutPref.layout_code);
    setDraftPanelState(cloneLayoutState(layoutPref.panel_state));
    setDraftPinned([...layoutPref.pinned_panels]);
    setLayoutModalOpen(true);
    setDraggingPanel(null);
  };

  const closeLayoutModal = () => {
    setLayoutModalOpen(false);
    setDraggingPanel(null);
  };

  const markAsCustom = () => setDraftLayoutCode("custom");

  const applyPreset = (code: LayoutCode) => {
    const preset = PANEL_PRESETS[code] || DEFAULT_PANEL_LAYOUT_STATE;
    setDraftLayoutCode(code);
    setDraftPanelState(cloneLayoutState(preset));
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, panelId: PanelId) => {
    event.dataTransfer.effectAllowed = "move";
    setDraggingPanel(panelId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, targetId: PanelId) => {
    event.preventDefault();
    if (!draggingPanel || draggingPanel === targetId) return;
    setDraftPanelState((prev) => {
      const items = [...prev.panels];
      const fromIdx = items.findIndex((p) => p.id === draggingPanel);
      const toIdx = items.findIndex((p) => p.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      markAsCustom();
      return { panels: items.map((panel, idx) => ({ ...panel, order: idx })) };
    });
  };

  const handleDragEnd = () => setDraggingPanel(null);

  const handleChangeSize = (panelId: PanelId, span: PanelSpan) => {
    setDraftPanelState((prev) => {
      const items = prev.panels.map((panel) => (panel.id === panelId ? { ...panel, colSpan: span } : panel));
      return { panels: items };
    });
    markAsCustom();
  };

  const togglePinned = (panelId: PanelId) => {
    setDraftPinned((prev) => {
      if (prev.includes(panelId)) {
        return prev.filter((p) => p !== panelId);
      }
      return [...prev, panelId];
    });
  };

  const handleSaveLayout = async () => {
    setLayoutSaving(true);
    try {
      const payload = {
        id_usuario: actingUserId,
        id_proyecto: layoutPref.id_proyecto ?? 0,
        layout_code: draftLayoutCode,
        panel_state: draftPanelState,
        pinned_panels: draftPinned,
      };
      const saved = await saveDashboardLayout(payload);
      commitPreference(saved);
      setLayoutAlert({ tone: "success", message: "Disposición guardada correctamente." });
      closeLayoutModal();
    } catch (err: any) {
      const message = typeof err?.message === "string" && err.message ? err.message : "No se pudo guardar la disposición.";
      setLayoutAlert({ tone: "error", message });
    } finally {
      setLayoutSaving(false);
    }
  };

  const handleResetLayout = async () => {
    setLayoutSaving(true);
    try {
      const restored = await resetDashboardLayout(actingUserId, layoutPref.id_proyecto ?? 0);
      const normalized = normalizePreference(restored);
      commitPreference(normalized);
      setDraftLayoutCode(normalized.layout_code);
      setDraftPanelState(cloneLayoutState(normalized.panel_state));
      setDraftPinned([...normalized.pinned_panels]);
      setLayoutAlert({ tone: "success", message: "Volviste al diseño predeterminado." });
    } catch (err: any) {
      const message = typeof err?.message === "string" && err.message ? err.message : "No se pudo restablecer la disposición.";
      setLayoutAlert({ tone: "error", message });
    } finally {
      setLayoutSaving(false);
    }
  };

  const renderPanelContent = (panelId: PanelId) => {
    switch (panelId) {
      case "stats":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatCard title="KPIs Totales" value={totalKPIs} delta={12.4} trendColor="green" />
            <StatCard title="Cumplimiento Promedio" value={`${avgProgress.toFixed(1)}%`} delta={3.2} trendColor="amber" />
            <StatCard title="Proyectos Activos" value={projects.length} delta={1.5} trendColor="green" />
            <StatCard
              title="KPIs Financieros"
              value={kpis.filter((k) => k.tipo === "Financiero").length}
              delta={-2.1}
              trendColor="rose"
            />
          </div>
        );
      case "kpiByType":
        return (
          <div className="surface-card rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">KPIs por Tipo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" isAnimationActive>
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "tasksStatus":
        return (
          <div className="surface-card rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de Tareas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tareasPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={(props: any) => `${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  isAnimationActive
                >
                  {tareasPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      case "progressByProject":
        return (
          <div className="surface-card rounded-xl p-6 shadow-sm border h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Progreso por Proyecto</h3>
            <ResponsiveContainer width="100%" height={progressChartHeight}>
              <BarChart
                layout="vertical"
                data={progressByProject}
                barCategoryGap="30%"
                margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={160} interval={0} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="progreso" fill="#10b981" barSize={24} radius={[0, 10, 10, 0]}>
                  <LabelList
                    dataKey="progreso"
                    position="right"
                    content={(props: any) => {
                      const { x, y, value } = props;
                      if (x == null || y == null || value == null) return null;
                      return (
                        <text x={x + 6} y={y + 5} fontSize={12} style={{ fill: "var(--fg)" }}>
                          {value}%
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "kpiTrend":
        return (
          <div className="surface-card rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución de KPIs</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kpiTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progreso" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} isAnimationActive />
                <Line type="monotone" dataKey="objetivos" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  const renderLayoutModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="surface-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-full overflow-y-auto p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Configurar layout de paneles</h3>
            <p className="text-sm text-gray-500">Arrastra, cambia tamaños o aplica un preset para personalizar tu dashboard.</p>
          </div>
          <button
            onClick={closeLayoutModal}
            className="p-2 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition"
            aria-label="Cerrar configuración"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Esquemas sugeridos</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {PRESET_CARDS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => applyPreset(preset.code)}
                  className={`text-left rounded-xl border p-4 transition shadow-sm ${
                    draftLayoutCode === preset.code
                      ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50/60"
                      : "hover:border-blue-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{preset.title}</p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                  <div className="mt-3 grid grid-cols-12 gap-1 h-12">
                    {(PANEL_PRESETS[preset.code] || DEFAULT_PANEL_LAYOUT_STATE).panels.map((panel) => (
                      <div
                        key={`${preset.code}-${panel.id}`}
                        className={`rounded-md bg-gradient-to-r from-blue-100 to-blue-200 ${PREVIEW_SPAN_CLASSES[panel.colSpan as PanelSpan] || "col-span-12"}`}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Orden y tamaño de paneles</h4>
            <div className="space-y-3">
              {draftPanelState.panels.map((panel) => (
                <div
                  key={panel.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, panel.id)}
                  onDragOver={(e) => handleDragOver(e, panel.id)}
                  onDrop={handleDragEnd}
                  onDragEnd={handleDragEnd}
                  className={`rounded-xl border surface-card p-4 shadow-sm cursor-grab transition ${
                    draggingPanel === panel.id ? "border-blue-400 shadow-md" : "hover:border-blue-300"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{PANEL_DESCRIPTIONS[panel.id].title}</p>
                      <p className="text-xs text-gray-500">{PANEL_DESCRIPTIONS[panel.id].description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PANEL_SIZE_OPTIONS[panel.id].map((size) => (
                        <button
                          key={`${panel.id}-${size}`}
                          type="button"
                          onClick={() => handleChangeSize(panel.id, size)}
                          className={`text-xs px-3 py-1 rounded-lg border transition ${
                            panel.colSpan === size ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"
                          }`}
                        >
                          {SPAN_LABELS[size]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Paneles fijados (siempre visibles)</h4>
            <div className="flex flex-wrap gap-3">
              {draftPanelState.panels.map((panel) => (
                <label
                  key={`pin-${panel.id}`}
                  className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition ${
                    draftPinned.includes(panel.id) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={draftPinned.includes(panel.id)}
                    onChange={() => togglePinned(panel.id)}
                    className="sr-only"
                  />
                  {PANEL_DESCRIPTIONS[panel.id].title}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={handleResetLayout}
            disabled={layoutSaving}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={closeLayoutModal}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={layoutSaving}
            className="px-5 py-2 rounded-lg btn-primary font-semibold shadow disabled:opacity-50"
          >
            {layoutSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold">¡Bienvenido a DashKPIs!</h2>
        <p className="text-white/80 mt-1">Tienes {totalKPIs} KPIs activos en {projects.length} proyectos.</p>
      </div>

      {/* Filtros */}
      <div className="surface-card rounded-xl border shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filtros</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <select value={kpiF} onChange={(e) => setKpiF(e.target.value as any)} className="rounded-lg border-gray-200">
            <option value="Todos">Todos los KPIs</option>
            <option value="Financiero">Financieros</option>
            <option value="Operacional">Operacionales</option>
            <option value="Cliente">Clientes</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select value={userF} onChange={(e) => setUserF(e.target.value)} className="rounded-lg border-gray-200">
            <option value="Todos">Todos los usuarios</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>

          <input type="date" value={dateF} onChange={(e) => setDateF(e.target.value)} className="rounded-lg border-gray-200" />

          <button
            onClick={() => {
              setKpiF("Todos");
              setUserF("Todos");
              setDateF("");
            }}
            className="px-4 py-2 rounded-lg border text-[color:var(--fg)] hover:border-primary transition"
          >
            Limpiar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {layoutAlert && (
            <p
              className={`text-sm ${
                layoutAlert.tone === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {layoutAlert.message}
            </p>
          )}
          <button
            type="button"
            onClick={openLayoutModal}
            disabled={layoutLoading}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 disabled:opacity-50"
          >
            🧩 {layoutLoading ? "Cargando layout…" : "Configurar paneles"}
          </button>
        </div>
      </div>

      {/* Paneles fijados */}
      {pinnedPlacements.length > 0 && (
        <div className="surface-card border border-blue-100 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            Paneles fijados <span className="text-xs text-blue-500">(siempre visibles)</span>
          </p>
          <div className="grid grid-cols-12 gap-4">
            {pinnedPlacements.map((placement) => (
              <div key={`pin-${placement.id}`} className={`${SPAN_CLASSES[placement.colSpan as PanelSpan] || "col-span-12"} lg:sticky lg:top-4`}>
                <div className="rounded-2xl ring-2 ring-blue-200 surface-card shadow-lg p-2">{renderPanelContent(placement.id)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paneles según layout */}
      <div className="grid grid-cols-12 gap-6">
        {regularPlacements.map((placement) => (
          <div key={placement.id} className={SPAN_CLASSES[placement.colSpan as PanelSpan] || "col-span-12"}>
            {renderPanelContent(placement.id)}
          </div>
        ))}
      </div>

      {layoutModalOpen && renderLayoutModal()}
    </div>
  );
};

export default DashboardHome;
