export type FormatPreference = {
  id_usuario: number;
  formato_fecha: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  codigo_moneda: "COP" | "USD" | "EUR";
  fondo?: string | null;
  updated_at?: string | null;
};

export async function getFormatPreference(id_usuario: number): Promise<FormatPreference> {
  const res = await fetch(`/api/usuarios/${id_usuario}/preferencias/formato/`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function saveFormatPreference(
  id_usuario: number,
  body: { formato_fecha: FormatPreference["formato_fecha"]; codigo_moneda: FormatPreference["codigo_moneda"]; fondo?: string | null }
): Promise<FormatPreference> {
  const res = await fetch(`/api/usuarios/${id_usuario}/preferencias/formato/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function resetFormatPreference(id_usuario: number): Promise<FormatPreference> {
  const res = await fetch(`/api/usuarios/${id_usuario}/preferencias/formato/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}
