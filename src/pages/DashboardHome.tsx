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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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

  // Carga inicial
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pr, us, ks] = await Promise.all([
          fetchProyectos(),
          fetchUsuarios(),
          listKPIs(),
        ]);
        if (!alive) return;
        // Proyectos mapeados
        const mappedProjects: Project[] = pr.map((p: ApiProyecto, i: number) => ({
          id: p.id_proyecto,
          nombre: p.nombre,
          color: PROJECT_BADGES[i % PROJECT_BADGES.length],
        }));
        setProjects(mappedProjects);
        // Usuarios
        setUsers(
          us.map((u: UsuarioLite) => ({
            id: u.id_usuario,
            nombre: u.nombre || u.email,
            avatar: `https://i.pravatar.cc/40?u=${u.email || u.id_usuario}`,
          }))
        );
        // KPIs
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
        // Tareas por estado (agrega todas las de todos los proyectos)
        const tareasByProj = await Promise.all(
          pr.map((p) => fetchTareasByProyecto(p.id_proyecto))
        );
        const allTasks: ApiTarea[] = tareasByProj.flat();
        const completed = allTasks.filter((t) => t.estado === "Completada").length;
        const inProgress = allTasks.filter((t) => t.estado === "En progreso").length;
        const pending = allTasks.filter((t) => t.estado === "Pendiente").length;
        setTareasPie([
          { name: "Completadas", value: completed },
          { name: "En progreso", value: inProgress },
          { name: "Pendientes", value: pending },
        ]);
      } catch (e) {
        // Silenciar pequeños errores; podríamos poner un banner si quieres
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    // Orden descendente por progreso
    return arr.sort((a, b) => b.progreso - a.progreso);
  }, [projects, kpis]);

  // Altura dinámica para que no se vea "apeñuscado"
  const progressChartHeight = useMemo(() => {
    const rows = Math.max(progressByProject.length, 1);
    return Math.max(240, rows * 38 + 60); // ~38px por fila + margenes
  }, [progressByProject.length]);

  // Tendencia mensual simple basada en fecha_creacion de KPIs (últimos 5 meses)
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
        const d = k as any; // fecha_creacion está en servicios
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

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold">
          ¡Bienvenido a DashKPIs!
        </h2>
        <p className="text-white/80 mt-1">
          Tienes {totalKPIs} KPIs activos en {projects.length} proyectos.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filtros</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={kpiF}
            onChange={(e) => setKpiF(e.target.value as any)}
            className="rounded-lg border-gray-200"
          >
            <option value="Todos">Todos los KPIs</option>
            <option value="Financiero">Financieros</option>
            <option value="Operacional">Operacionales</option>
            <option value="Cliente">Clientes</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select
            value={userF}
            onChange={(e) => setUserF(e.target.value)}
            className="rounded-lg border-gray-200"
          >
            <option value="Todos">Todos los usuarios</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateF}
            onChange={(e) => setDateF(e.target.value)}
            className="rounded-lg border-gray-200"
          />

          <button
            onClick={() => {
              setKpiF("Todos");
              setUserF("Todos");
              setDateF("");
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 shadow-md hover:shadow-lg active:shadow-inner transition"
            style={{
              background: "linear-gradient(to bottom, #ffffff, #f3f4f6)",
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Cards superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
  <StatCard title="KPIs Totales" value={totalKPIs} delta={12.4} trendColor="green" />
  <StatCard title="Cumplimiento Promedio" value={`${avgProgress.toFixed(1)}%`} delta={3.2} trendColor="amber" />
  <StatCard title="Proyectos Activos" value={projects.length} delta={1.5} trendColor="green" />
  <StatCard title="KPIs Financieros" value={kpis.filter((k) => k.tipo === "Financiero").length} delta={-2.1} trendColor="rose" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPIs por tipo */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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

        {/* Estado de Tareas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                label={(props: any) =>
                  `${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
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

        {/* Progreso por proyecto */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
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
                      <text x={x + 6} y={y + 5} fill="#374151" fontSize={12}>
                        {value}%
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolución de KPIs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución de KPIs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="progreso"
                stroke="#3b82f6"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                isAnimationActive
              />
              <Line
                type="monotone"
                dataKey="objetivos"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
