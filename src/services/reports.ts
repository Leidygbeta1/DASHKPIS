export type ReportExportPayload = {
  titulo: string;
  filtros?: Record<string, string>;
  resumen?: Record<string, string>;
  items?: Record<string, string>[];
  secciones?: Record<string, string>[];
  nota?: string;
  nombre_archivo?: string;
};

export async function exportReportPdf(payload: ReportExportPayload): Promise<Blob> {
  const res = await fetch('/api/reportes/export/pdf/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.blob();
}
