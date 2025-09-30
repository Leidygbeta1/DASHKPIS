export type CurrentUser = {
  id_usuario: number;
  email: string;
  rol: string;
  fecha_registro: string;
  activo: boolean;
};

export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("currentUser");
}
