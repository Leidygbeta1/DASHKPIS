import React, { useMemo, useState } from "react";
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

// ---------------- Mock Data ----------------
type KPIType = "Financiero" | "Operacional" | "Cliente" | "Marketing";

type Project = { id: string; nombre: string; color: string };

type KPI = {
  id: string;
  nombre: string;
  objetivo: number;
  valorActual: number;
  tipo: KPIType;
  proyectoId?: string;
};

type User = { id: string; nombre: string; avatar: string };

const users: User[] = [
  { id: "u1", nombre: "Leidy", avatar: "https://i.pravatar.cc/40?img=5" },
  { id: "u2", nombre: "Nicolás", avatar: "https://i.pravatar.cc/40?img=1" },
  { id: "u3", nombre: "Carolina", avatar: "https://i.pravatar.cc/40?img=12" },
];

const projects: Project[] = [
  { id: "p1", nombre: "Proyecto A", color: "bg-blue-100 text-blue-700" },
  { id: "p2", nombre: "Proyecto B", color: "bg-emerald-100 text-emerald-700" },
  { id: "p3", nombre: "Proyecto C", color: "bg-amber-100 text-amber-700" },
];

const initialKPIs: KPI[] = [
  { id: "k1", nombre: "Conversión", objetivo: 5, valorActual: 3.5, tipo: "Marketing", proyectoId: "p1" },
  { id: "k2", nombre: "CAC", objetivo: 50, valorActual: 62.1, tipo: "Financiero", proyectoId: "p2" },
  { id: "k3", nombre: "NPS", objetivo: 75, valorActual: 81, tipo: "Cliente", proyectoId: "p1" },
  { id: "k4", nombre: "Tiempo Respuesta", objetivo: 24, valorActual: 18, tipo: "Operacional", proyectoId: "p3" },
];

const tareas = [
  { name: "Completadas", value: 42 },
  { name: "En progreso", value: 18 },
  { name: "Pendientes", value: 10 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

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
  // 📊 Estadísticas calculadas
  const totalKPIs = initialKPIs.length;
  const avgProgress = useMemo(() => {
    const sum = initialKPIs.reduce(
      (acc, k) => acc + (k.valorActual / k.objetivo) * 100,
      0
    );
    return sum / initialKPIs.length;
  }, []);

  const kpiByType = useMemo(() => {
    const types: KPIType[] = ["Financiero", "Operacional", "Cliente", "Marketing"];
    return types.map((t) => ({
      name: t,
      value: initialKPIs.filter((k) => k.tipo === t).length,
    }));
  }, []);

  const progressByProject = useMemo(() => {
    return projects.map((p) => {
      const projKpis = initialKPIs.filter((k) => k.proyectoId === p.id);
      const avg =
        projKpis.length > 0
          ? projKpis.reduce((acc, k) => acc + (k.valorActual / k.objetivo) * 100, 0) /
            projKpis.length
          : 0;
      return { name: p.nombre, progreso: +avg.toFixed(1) };
    });
  }, []);

  const kpiTrend = [
    { mes: "Mayo", progreso: 45, objetivos: 60 },
    { mes: "Junio", progreso: 52, objetivos: 65 },
    { mes: "Julio", progreso: 61, objetivos: 70 },
    { mes: "Agosto", progreso: 68, objetivos: 72 },
    { mes: "Septiembre", progreso: 74, objetivos: 78 },
  ];

  // ---------------- Filtros ----------------
  const [kpiF, setKpiF] = useState<"Todos" | KPIType>("Todos");
  const [userF, setUserF] = useState<"Todos" | string>("Todos");
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
        <StatCard title="KPIs Financieros" value={initialKPIs.filter((k) => k.tipo === "Financiero").length} delta={-2.1} trendColor="rose" />
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
                data={tareas}
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
                {tareas.map((_, i) => (
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={progressByProject}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="progreso" fill="#10b981" barSize={30} radius={[0, 10, 10, 0]}>
                <LabelList
                  dataKey="progreso"
                  position="right"
                  content={(props: any) => {
                    const { x, y, value } = props;
                    if (x == null || y == null || value == null) return null;
                    return (
                      <text x={x + 5} y={y + 5} fill="#374151" fontSize={12}>
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
