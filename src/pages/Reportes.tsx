import React, { useEffect, useMemo, useState } from 'react';
import { exportReportPdf, fetchReportItems, createReport, exportReportCsv, listReports, downloadReportPdf, downloadReportCsv } from '../services/reports';
import type { ReportRecord } from '../services/reports';
import { useUser } from '../context/UserContext';

type ReportStatus = 'on-track' | 'at-risk' | 'delayed';

type ProgressItem = {
  id: string;
  initiative: string;
  owner: string;
  team: string;
  status: ReportStatus;
  progress: number;
  delta: number;
  updatedAt: string;
  dueDate: string;
  scope: string;
};

type MilestoneStatus = 'done' | 'in-progress' | 'pending';

type Milestone = {
  title: string;
  description: string;
  owner: string;
  target: string;
  status: MilestoneStatus;
  completion: number;
};

type IconProps = {
  className?: string;
};

const IconShare = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75 20.25 7.5 16.5 11.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 7.5H10.5a6 6 0 0 0-6 6V18" />
  </svg>
);

const IconDownload = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18.25A1.75 1.75 0 0 0 4.75 20h14.5A1.75 1.75 0 0 0 21 18.25V16.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.75 10.75 12 15l4.25-4.25" />
  </svg>
);

const IconReport = ({ className }: IconProps) => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V21l-5-2-5 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 7.5h4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 11h4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 14.5h2.5" />
  </svg>
);

// Datos de ejemplo iniciales (se reemplazarán por datos del backend)
const progressItemsSeed: ProgressItem[] = [
  {
    id: 'KPI-021',
    initiative: 'Adopcion plataforma mobile',
    owner: 'Ana Diaz',
    team: 'Producto',
    status: 'on-track',
    progress: 82,
    delta: 12,
    updatedAt: '2024-03-18',
    dueDate: '2024-04-05',
    scope: 'Clientes premium',
  },
  {
    id: 'KPI-014',
    initiative: 'Automatizacion de reportes de ventas',
    owner: 'Luis Medina',
    team: 'Analytics',
    status: 'at-risk',
    progress: 64,
    delta: -4,
    updatedAt: '2024-03-14',
    dueDate: '2024-04-22',
    scope: 'Sucursales LATAM',
  },
  {
    id: 'KPI-037',
    initiative: 'Reduccion de churn en onboarding',
    owner: 'Maria Torres',
    team: 'CX',
    status: 'on-track',
    progress: 91,
    delta: 8,
    updatedAt: '2024-03-17',
    dueDate: '2024-04-12',
    scope: 'Clientes nuevos',
  },
  {
    id: 'KPI-009',
    initiative: 'Tiempo de respuesta en soporte',
    owner: 'Raul Ortega',
    team: 'Soporte',
    status: 'delayed',
    progress: 45,
    delta: -11,
    updatedAt: '2024-03-09',
    dueDate: '2024-04-03',
    scope: 'Canal email',
  },
  {
    id: 'KPI-032',
    initiative: 'Satisfaccion del cliente B2B',
    owner: 'Ana Diaz',
    team: 'CX',
    status: 'on-track',
    progress: 76,
    delta: 5,
    updatedAt: '2024-03-15',
    dueDate: '2024-04-18',
    scope: 'Segmento enterprise',
  },
  {
    id: 'KPI-041',
    initiative: 'Adopcion dashboard ejecutivo',
    owner: 'Laura Ruiz',
    team: 'Producto',
    status: 'at-risk',
    progress: 58,
    delta: -2,
    updatedAt: '2024-03-11',
    dueDate: '2024-04-25',
    scope: 'Directores regionales',
  },
];

const milestoneTimelineSeed: Milestone[] = [
  {
    title: 'Kick-off y baseline',
    description: 'Metodologia y metas aprobadas por PMO.',
    owner: 'PMO Estrategia',
    target: '2024-02-12',
    status: 'done',
    completion: 100,
  },
  {
    title: 'Hitos intermedios',
    description: 'Validacion de datos historicos para proyecciones.',
    owner: 'Analytics',
    target: '2024-03-04',
    status: 'done',
    completion: 100,
  },
  {
    title: 'Reunion de seguimiento',
    description: 'Analisis de riesgos y acuerdos de mitigacion.',
    owner: 'Lideres de iniciativa',
    target: '2024-03-22',
    status: 'in-progress',
    completion: 65,
  },
  {
    title: 'Cierre preliminar',
    description: 'Definicion de recomendaciones por iniciativa.',
    owner: 'Direccion operaciones',
    target: '2024-04-19',
    status: 'pending',
    completion: 0,
  },
];

const reportSections = [
  { key: 'executive', label: 'Resumen ejecutivo', description: 'Indicadores clave y acuerdos para VP y C-level.' },
  { key: 'progress', label: 'Detalle de progreso', description: 'Estatus por KPI con responsables y tendencia.' },
  { key: 'risks', label: 'Riesgos y acciones', description: 'Alertas, planes de mitigacion y responsables.' },
  { key: 'timeline', label: 'Linea de tiempo', description: 'Hitos alcanzados y proximos compromisos.' },
];

const scheduledReports = [
  { id: 1, name: 'Reporte semanal CX', cadence: 'Semanal', deliverTo: 'cx@dashkpis.com', nextRun: '2024-03-25' },
  { id: 2, name: 'Resumen mensual Directores', cadence: 'Mensual', deliverTo: 'directores@dashkpis.com', nextRun: '2024-04-01' },
];

const statusConfig: Record<ReportStatus, { label: string; badge: string; accent: string }> = {
  'on-track': {
    label: 'En objetivo',
    badge: 'bg-green-100 text-green-700 border border-green-200',
    accent: 'bg-green-500',
  },
  'at-risk': {
    label: 'En riesgo',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    accent: 'bg-amber-500',
  },
  delayed: {
    label: 'Retrasado',
    badge: 'bg-rose-100 text-rose-700 border border-rose-200',
    accent: 'bg-rose-500',
  },
};

const milestoneStatusConfig: Record<MilestoneStatus, { badge: string; label: string }> = {
  done: { badge: 'bg-green-100 text-green-700 border border-green-200', label: 'Completado' },
  'in-progress': { badge: 'bg-blue-100 text-blue-700 border border-blue-200', label: 'En progreso' },
  pending: { badge: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'Pendiente' },
};

const periodOptions = ['Ultimos 30 dias', 'Ultimo trimestre', 'Ultimo semestre'];

const previewTrend = [48, 55, 62, 69, 73, 78, 82];

const initialFilters = {
  search: '',
  period: periodOptions[1],
  status: 'Todos' as ReportStatus | 'Todos',
  team: 'Todos',
  owner: 'Todos',
};

const Reportes: React.FC = () => {
  const { user } = useUser();
  const [filters, setFilters] = useState(initialFilters);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportAlert, setExportAlert] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const [filterAlert, setFilterAlert] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [myReports, setMyReports] = useState<ReportRecord[]>([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  const [myReportsError, setMyReportsError] = useState<string | null>(null);

  // Estado proveniente del backend
  const [items, setItems] = useState<ProgressItem[]>(progressItemsSeed);
  const [milestones, setMilestones] = useState<Milestone[]>(milestoneTimelineSeed);

  const [formatConfig, setFormatConfig] = useState({
    mostrarFiltros: true,
    mostrarResumen: true,
    mostrarItems: true,
    mostrarSecciones: true,
    tamanoFuente: 14,
    piePagina: "DashKPI - Universidad Piloto de Colombia",
  });

  const teams = useMemo(() => ['Todos', ...Array.from(new Set(items.map((item) => item.team)))], [items]);
  const owners = useMemo(() => ['Todos', ...Array.from(new Set(items.map((item) => item.owner)))], [items]);
  const activeFilterChips = useMemo(() => {

    const chips: string[] = [];
    if (filters.status !== 'Todos') chips.push(`Estado: ${filters.status}`);
    if (filters.team !== 'Todos') chips.push(`Equipo: ${filters.team}`);
    if (filters.owner !== 'Todos') chips.push(`Responsable: ${filters.owner}`);
    if (filters.search.trim()) chips.push(`Busqueda: ${filters.search.trim()}`);
    return chips;
  }, [filters]);

  const handleDraftFilter = (key: keyof typeof draftFilters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleResetFilters = () => {
    setFilters(initialFilters);
    setFilterAlert({ tone: 'success', message: 'Filtros restablecidos.' });
  };
  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setFilterAlert({ tone: 'success', message: 'Filtros aplicados correctamente.' });
    setShowFiltersPanel(false);
  };

  const referenceDate = useMemo(() => new Date(), []);

  const filteredProgress = useMemo(() => {
    const periodToDays: Record<string, number> = {
      'Ultimos 30 dias': 30,
      'Ultimo trimestre': 90,
      'Ultimo semestre': 180,
    };

  return items.filter((item) => {
      if (filters.status !== 'Todos' && item.status !== filters.status) {
        return false;
      }
      if (filters.team !== 'Todos' && item.team !== filters.team) {
        return false;
      }
      if (filters.owner !== 'Todos' && item.owner !== filters.owner) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const haystack = `${item.id} ${item.initiative} ${item.scope}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      const days = periodToDays[filters.period] ?? 90;
      const updatedAt = new Date(item.updatedAt);
      const diff = (referenceDate.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= days;
    });
  }, [filters, referenceDate, items]);

  const totals = useMemo(() => {
    if (!filteredProgress.length) {
      return {
        average: 0,
        trend: 0,
        onTrack: 0,
        atRisk: 0,
        delayed: 0,
        completionRatio: 0,
        nextDue: undefined as ProgressItem | undefined,
        topPerformer: undefined as ProgressItem | undefined,
      };
    }

    const sumProgress = filteredProgress.reduce((acc, item) => acc + item.progress, 0);
    const sumTrend = filteredProgress.reduce((acc, item) => acc + item.delta, 0);
    const onTrack = filteredProgress.filter((item) => item.status === 'on-track').length;
    const atRisk = filteredProgress.filter((item) => item.status === 'at-risk').length;
    const delayed = filteredProgress.filter((item) => item.status === 'delayed').length;
    const completionRatio = Math.round((onTrack / filteredProgress.length) * 100);

    const nextDue = [...filteredProgress].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )[0];
    const topPerformer = [...filteredProgress].sort((a, b) => b.progress - a.progress)[0];

    return {
      average: Math.round(sumProgress / filteredProgress.length),
      trend: Math.round(sumTrend / filteredProgress.length),
      onTrack,
      atRisk,
      delayed,
      completionRatio,
      nextDue,
      topPerformer,
    };
  }, [filteredProgress]);

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(value));
  };

  const renderDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : '';
    const color = delta >= 0 ? 'text-green-600 bg-green-50' : 'text-rose-600 bg-rose-50';
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
        {`${sign}${delta}%`}
      </span>
    );
  };

  const exportPayload = useMemo(() => {
  const resumen =
    filteredProgress.length > 0
      ? {
          'Progreso promedio': `${totals.average}%`,
          'Variacion promedio': `${totals.trend}%`,
          'KPIs en objetivo': `${totals.onTrack}`,
          'KPIs en riesgo': `${totals.atRisk}`,
          'KPIs retrasados': `${totals.delayed}`,
        }
      : undefined;

  return {
    titulo: `Reporte de KPIs - ${filters.period}`,

    // ⭐ NUEVO BLOQUE (formato del reporte)
    formato: {
      mostrarFiltros: formatConfig.mostrarFiltros,
      mostrarResumen: formatConfig.mostrarResumen,
      mostrarItems: formatConfig.mostrarItems,
      mostrarSecciones: formatConfig.mostrarSecciones,
      tamanoFuente: formatConfig.tamanoFuente,
      piePagina: formatConfig.piePagina,
    },

    // 🔵 FILTROS — solo si el usuario quiere mostrarlos
    filtros: formatConfig.mostrarFiltros
      ? {
          Periodo: filters.period,
          Estado: filters.status,
          Equipo: filters.team,
          Responsable: filters.owner,
          Busqueda: filters.search || 'Sin filtro',
        }
      : undefined,

    // 🔵 RESUMEN — solo si está habilitado
    resumen: formatConfig.mostrarResumen ? resumen : undefined,

    // 🔵 ITEMS — depende del toggle
    items: formatConfig.mostrarItems
      ? filteredProgress.slice(0, 5).map((item) => ({
          initiative: item.initiative,
          owner: item.owner,
          status: item.status,
          progress: `${item.progress}%`,
          delta: `${item.delta}%`,
          due: item.dueDate,
          updated: item.updatedAt,
        }))
      : undefined,

    // 🔵 SECCIONES — controlado por el switch
    secciones: formatConfig.mostrarSecciones
      ? reportSections.map((section) => ({
          label: section.label,
          description: section.description,
        }))
      : undefined,

    nota: 'Generado automáticamente desde DashKPIs.',
    nombre_archivo: `reporte-${filters.period.replace(/\s+/g, '-').toLowerCase()}`,
  };
}, [filters, filteredProgress, totals, formatConfig]);

  // Cargar datos desde el backend cuando cambian los filtros
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await fetchReportItems({
          period: filters.period,
          status: String(filters.status),
          team: filters.team,
          owner: filters.owner,
          search: filters.search,
        });
        if (ignore) return;
        const mapped: ProgressItem[] = (data.items || []).map((it: any) => ({
          id: String(it.id),
          initiative: String(it.initiative || ''),
          owner: String(it.owner || ''),
          team: String(it.team || ''),
          status: (it.status || 'on-track') as ReportStatus,
          progress: Number(it.progress || 0),
          delta: Number(it.delta || 0),
          updatedAt: String(it.updatedAt || ''),
          dueDate: String(it.dueDate || ''),
          scope: String(it.scope || ''),
        }));
        setItems(mapped);
        const mappedMilestones: Milestone[] = (data.milestones || []).map((m: any) => ({
          title: String(m.title || ''),
          description: String(m.description || ''),
          owner: String(m.owner || ''),
          target: String(m.target || ''),
          status: (m.status || 'in-progress') as MilestoneStatus,
          completion: Number(m.completion || 0),
        }));
        setMilestones(mappedMilestones.length ? mappedMilestones : milestoneTimelineSeed);
      } catch (e: any) {
        setFilterAlert({ tone: 'error', message: typeof e?.message === 'string' ? e.message : 'No se pudo cargar el reporte' });
      } finally {
        // noop
      }
    }
    load();
    return () => { ignore = true; };
  }, [filters]);



  const handleExportPdf = async () => {
    if (!filteredProgress.length) {
      setExportAlert({ tone: 'error', message: 'No hay datos para exportar con los filtros seleccionados.' });
      return;
    }
    try {
      setExportAlert(null);
      setExportingPdf(true);
      const blob = await exportReportPdf(exportPayload);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${exportPayload.nombre_archivo || 'reporte'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportAlert({ tone: 'success', message: 'Reporte PDF generado correctamente.' });
    } catch (error: any) {
      const message = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : 'No se pudo generar el PDF.';
      setExportAlert({ tone: 'error', message });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!filteredProgress.length) {
      setFilterAlert({ tone: 'error', message: 'No hay datos para generar un reporte con los filtros seleccionados.' });
      return;
    }
    try {
      if (!user?.id_usuario) throw new Error('Usuario no autenticado.');
      const payload = { ...exportPayload, id_usuario: user.id_usuario } as any;
      const created = await createReport(payload);
      setFilterAlert({ tone: 'success', message: `Reporte creado: ${created.titulo}` });
      // refresh list
      await loadMyReports();
    } catch (e: any) {
      setFilterAlert({ tone: 'error', message: typeof e?.message === 'string' ? e.message : 'No se pudo crear el reporte' });
    }
  };

  const handleExportCsv = async () => {
    if (!filteredProgress.length) {
      setExportAlert({ tone: 'error', message: 'No hay datos para exportar con los filtros seleccionados.' });
      return;
    }
    try {
      setExportAlert(null);
      setExportingCsv(true);
      const blob = await exportReportCsv(exportPayload);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${exportPayload.nombre_archivo || 'reporte'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportAlert({ tone: 'success', message: 'Reporte CSV generado correctamente.' });
    } catch (error: any) {
      const message = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : 'No se pudo generar el CSV.';
      setExportAlert({ tone: 'error', message });
    } finally {
      setExportingCsv(false);
    }
  };

  const loadMyReports = async () => {
    if (!user?.id_usuario) return;
    try {
      setLoadingMyReports(true);
      setMyReportsError(null);
      const records = await listReports({ id_usuario: user.id_usuario });
      setMyReports(records);
    } catch (err: any) {
      setMyReportsError(typeof err?.message === 'string' ? err.message : 'No se pudieron cargar tus reportes.');
    } finally {
      setLoadingMyReports(false);
    }
  };

  useEffect(() => {
    loadMyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id_usuario]);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Reportes</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Generacion y consulta de reportes de progreso para las iniciativas clave. Configura filtros, revisa hitos y exporta el resumen para las partes interesadas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
              onClick={() => {
                setShowFiltersPanel(true);
                setFilterAlert(null);
              }}
            >
              <IconReport className="h-4 w-4" /> Aplicar filtros
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300">
              <IconShare className="h-4 w-4" /> Compartir borrador
            </button>
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium ${
                exportingCsv ? 'text-slate-400 border-slate-200' : 'text-slate-600 hover:border-slate-300'
              }`}
            >
              <IconDownload className="h-4 w-4" /> {exportingCsv ? 'Generando CSV…' : 'Exportar CSV'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium ${
                exportingPdf ? 'text-slate-400 border-slate-200' : 'text-slate-600 hover:border-slate-300'
              }`}
            >
              <IconDownload className="h-4 w-4" /> {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
            </button>
            <button onClick={handleGenerateReport} className="inline-flex items-center gap-2 rounded-lg btn-primary px-4 py-2 text-sm font-medium shadow">
              <IconReport className="h-4 w-4" /> Generar reporte
            </button>
          </div>
        </div>

      {exportAlert && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            exportAlert.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {exportAlert.message}
        </div>
      )}

      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs rounded-xl border surface-card px-4 py-3 shadow-sm">
          {activeFilterChips.map((chip) => (
            <span key={chip} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {chip}
            </span>
          ))}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {filterAlert && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            filterAlert.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {filterAlert.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  <div className="rounded-2xl border shadow-sm p-4 surface-card">
          <p className="text-xs font-medium uppercase text-slate-400">Promedio de avance</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{`${totals.average}%`}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${totals.trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}
            >
              {`${totals.trend >= 0 ? '+' : ''}${totals.trend}% vs periodo previo`}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">Actualizado {formatDate(referenceDate.toISOString())}</p>
        </div>
  <div className="rounded-2xl border shadow-sm p-4 surface-card">
          <p className="text-xs font-medium uppercase text-slate-400">Iniciativas en objetivo</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-3xl font-semibold text-slate-900">{totals.onTrack}</span>
              <p className="text-sm text-slate-500">de {filteredProgress.length} iniciativas</p>
            </div>
            <div className="text-sm text-green-600 font-medium">{`${totals.completionRatio}%`}</div>
          </div>
        </div>
  <div className="rounded-2xl border shadow-sm p-4 surface-card">
          <p className="text-xs font-medium uppercase text-slate-400">Alertas activas</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{totals.atRisk + totals.delayed}</span>
            <p className="text-sm text-slate-500">{`${totals.atRisk} en riesgo - ${totals.delayed} retrasadas`}</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.min(100, (100 * (totals.atRisk + totals.delayed)) / (filteredProgress.length || 1))}%` }}
            />
          </div>
        </div>
  <div className="rounded-2xl border shadow-sm p-4 surface-card">
          <p className="text-xs font-medium uppercase text-slate-400">Proxima entrega</p>
          {totals.nextDue ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-slate-900">{totals.nextDue.initiative}</p>
              <p className="text-sm text-slate-500">Due {formatDate(totals.nextDue.dueDate)}</p>
              <p className="text-xs text-slate-400">Responsable: {totals.nextDue.owner}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No hay entregas registradas en este periodo.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border shadow-sm p-5 surface-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Avance consolidado</h2>
                <p className="text-sm text-slate-500">Evolucion semanal del avance promedio de las iniciativas filtradas.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">Tabla</button>
                <button className="rounded-full bg-slate-900 px-3 py-1 text-white">Grafica</button>
              </div>
            </div>
            <div className="mt-6 h-48 rounded-xl border border-dashed surface-card flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-8 flex items-end justify-between gap-2">
                {previewTrend.map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 text-xs text-slate-500">
                    <div className="w-10 h-full max-h-36 rounded-full surface-card shadow-sm border flex items-end justify-center">
                      <div className="w-3 rounded-full bg-blue-500" style={{ height: `${value}%` }} />
                    </div>
                    <span>{`S${index + 1}`}</span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400">Visual placeholder pendiente de integrar libreria de graficos</span>
            </div>
          </div>

          <div className="rounded-2xl border shadow-sm p-5 surface-card">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Linea de tiempo de hitos</h2>
                <p className="text-sm text-slate-500">Seguimiento a compromisos relevantes del periodo.</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Agregar hito</button>
            </div>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                        milestone.status === 'done'
                          ? 'bg-green-500'
                          : milestone.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-slate-300'
                      }`}
                    >
                      {milestone.status === 'pending' ? '0%' : `${milestone.completion}%`}
                    </div>
                    <div className="mt-2 h-full w-px bg-slate-200" />
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{milestone.title}</p>
                        <p className="text-xs text-slate-500">Responsable: {milestone.owner}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${milestoneStatusConfig[milestone.status].badge}`}>
                        {milestoneStatusConfig[milestone.status].label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{milestone.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Objetivo: {formatDate(milestone.target)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border shadow-sm surface-card">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Detalle de iniciativas</h2>
                <p className="text-sm text-slate-500">Listado listo para exportar con los filtros aplicados.</p>
              </div>
              <button className="text-sm text-slate-500 hover:text-slate-700">Reordenar columnas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">KPI</th>
                    <th className="px-5 py-3 font-medium">Iniciativa</th>
                    <th className="px-5 py-3 font-medium">Equipo</th>
                    <th className="px-5 py-3 font-medium">Responsable</th>
                    <th className="px-5 py-3 font-medium">Avance</th>
                    <th className="px-5 py-3 font-medium">Ultima actualizacion</th>
                    <th className="px-5 py-3 font-medium">Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredProgress.length ? (
                    filteredProgress.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{item.id}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{item.initiative}</span>
                            <span className="text-xs text-slate-500">{item.scope}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">{item.team}</td>
                        <td className="px-5 py-3">{item.owner}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative h-2 w-24 rounded-full bg-slate-200">
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full ${statusConfig[item.status].accent}`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-900">{`${item.progress}%`}</span>
                            {renderDelta(item.delta)}
                          </div>
                        </td>
                        <td className="px-5 py-3">{formatDate(item.updatedAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span>{formatDate(item.dueDate)}</span>
                            <span className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[item.status].badge}`}>
                              {statusConfig[item.status].label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                        No se encontraron resultados para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

  <div className="space-y-6">
          {/* Mis reportes (snapshots) */}
          <div className="rounded-2xl border shadow-sm p-5 surface-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Mis reportes</h2>
              <button onClick={loadMyReports} className="text-sm font-medium text-blue-600 hover:text-blue-700">Actualizar</button>
            </div>
            <p className="text-sm text-slate-500 mt-1">Reportes que has generado. Puedes descargarlos en PDF o CSV.</p>
            {myReportsError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{myReportsError}</div>
            )}
            <div className="mt-4 space-y-3">
              {loadingMyReports ? (
                <div className="text-sm text-slate-500">Cargando…</div>
              ) : myReports.length === 0 ? (
                <div className="text-sm text-slate-500">Aún no has generado reportes.</div>
              ) : (
                myReports.map((rep) => (
                  <div key={rep.id_reporte} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{rep.titulo}</p>
                      <p className="text-xs text-slate-500">Creado: {new Date(rep.fecha_creacion).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300"
                        onClick={async () => {
                          try {
                            const blob = await downloadReportPdf(rep.id_reporte);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${rep.nombre_archivo || 'reporte'}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            setExportAlert({ tone: 'error', message: 'No se pudo descargar el PDF del reporte.' });
                          }
                        }}
                      >
                        PDF
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-slate-300"
                        onClick={async () => {
                          try {
                            const blob = await downloadReportCsv(rep.id_reporte);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${rep.nombre_archivo || 'reporte'}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            setExportAlert({ tone: 'error', message: 'No se pudo descargar el CSV del reporte.' });
                          }
                        }}
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="surface-card rounded-2xl border shadow-sm p-5">
  <h2 className="text-lg font-semibold text-slate-900">Secciones incluidas</h2>
  <p className="text-sm text-slate-500 mb-4">Personaliza el contenido del reporte antes de compartir.</p>
  <div className="space-y-3">
    {reportSections.map((section) => (
      <label
        key={section.key}
        className="flex items-start gap-3 rounded-xl border surface-card p-3 hover:border-blue-200"
      >
        <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{section.label}</p>
          <p className="text-xs text-slate-500">{section.description}</p>
        </div>
      </label>
    ))}
  </div>

  {totals.topPerformer && (
    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
      <p className="font-semibold">Sugerencia automatica</p>
      <p className="mt-1">
        Destaca a {totals.topPerformer.owner} por el progreso de "{totals.topPerformer.initiative}" ({`${totals.topPerformer.progress}%`}).        </p>
    </div>
  )}
</div>

{/* ⭐⭐⭐ PANEL NUEVO INSERTADO AQUÍ ⭐⭐⭐ */}
<div className="rounded-2xl border shadow-sm p-5 surface-card">
  <h2 className="text-lg font-semibold text-slate-900">Formato del reporte</h2>
  <p className="text-sm text-slate-500 mb-4">Configura cómo se exportará el PDF.</p>

  <div className="space-y-3">

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={formatConfig.mostrarFiltros}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, mostrarFiltros: e.target.checked })
        }
      />
      <span className="text-sm text-slate-700">Mostrar filtros en el reporte</span>
    </label>

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={formatConfig.mostrarResumen}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, mostrarResumen: e.target.checked })
        }
      />
      <span className="text-sm text-slate-700">Mostrar resumen general</span>
    </label>

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={formatConfig.mostrarItems}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, mostrarItems: e.target.checked })
        }
      />
      <span className="text-sm text-slate-700">Mostrar detalle de KPIs</span>
    </label>

    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={formatConfig.mostrarSecciones}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, mostrarSecciones: e.target.checked })
        }
      />
      <span className="text-sm text-slate-700">Mostrar secciones del reporte</span>
    </label>

    <label className="block text-sm">
      <span className="text-xs uppercase text-slate-500">Tamaño de letra</span>
      <input
        type="number"
        min={10}
        max={26}
        value={formatConfig.tamanoFuente}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, tamanoFuente: Number(e.target.value) })
        }
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>

    <label className="block text-sm">
      <span className="text-xs uppercase text-slate-500">Pie de página</span>
      <input
        type="text"
        value={formatConfig.piePagina}
        onChange={(e) =>
          setFormatConfig({ ...formatConfig, piePagina: e.target.value })
        }
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>

  </div>
</div>
{/* ⭐⭐⭐ FIN PANEL NUEVO ⭐⭐⭐ */}

<div className="rounded-2xl border shadow-sm p-5 surface-card">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-slate-900">Programaciones</h2>
    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Crear</button>
  </div>
  <p className="text-sm text-slate-500 mt-1">Configura envios automaticos a las partes interesadas.</p>
  <div className="mt-4 space-y-3 text-sm text-slate-700">
    {scheduledReports.map((item) => (
      <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="font-semibold text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{`${item.cadence} - Siguiente envio ${formatDate(item.nextRun)}`}</p>
        <p className="mt-1 text-xs text-slate-500">Destinatarios: {item.deliverTo}</p>
      </div>
    ))}
  </div>
</div>

<div className="surface-card rounded-2xl border shadow-sm p-5">
  <h2 className="text-lg font-semibold text-slate-900">Acciones recomendadas</h2>
  <ul className="mt-3 space-y-2 text-sm text-slate-600">
    <li className="flex gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
      Revisar planes de accion para iniciativas en riesgo (KPI-014, KPI-041).
    </li>
    <li className="flex gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
      Confirmar entregables con equipo de Producto antes del 05 Abr 2024.
    </li>
    <li className="flex gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
      Compartir resumen con PMO y solicitar retroalimentacion.
    </li>
  </ul>
</div>
</div>
</div>
</div>

{showFiltersPanel && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-3xl rounded-2xl surface-card border p-6 shadow-2xl space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Filtros avanzados</h3>
          <p className="text-sm text-slate-500">Combina criterios antes de aplicar al reporte.</p>
        </div>
        <button
          onClick={() => setShowFiltersPanel(false)}
          className="rounded-full border border-slate-200 p-2 hover:bg-slate-100 text-slate-500"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Periodo</span>
          <select
            value={draftFilters.period}
            onChange={(e) => handleDraftFilter('period', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            {periodOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Estado del KPI</span>
          <select
            value={draftFilters.status}
            onChange={(e) => handleDraftFilter('status', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="Todos">Todos</option>
            <option value="on-track">En objetivo</option>
            <option value="at-risk">En riesgo</option>
            <option value="delayed">Retrasado</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Equipo</span>
          <select
            value={draftFilters.team}
            onChange={(e) => handleDraftFilter('team', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            {teams.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Responsable</span>
          <select
            value={draftFilters.owner}
            onChange={(e) => handleDraftFilter('owner', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            {owners.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">Busqueda por texto</span>
          <input
            type="text"
            value={draftFilters.search}
            onChange={(e) => handleDraftFilter('search', e.target.value)}
            placeholder="Nombre de KPI o iniciativa…"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-blue-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setDraftFilters(initialFilters);
          }}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Restablecer
        </button>

        <button
          type="button"
          onClick={() => setShowFiltersPanel(false)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={applyDraftFilters}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700"
        >
          Aplicar filtros
        </button>
      </div>

    </div>
  </div>
)}
</>
);
};

export default Reportes;

