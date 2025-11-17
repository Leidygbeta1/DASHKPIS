
export type CurrentUser = {
  id_usuario: number;
  email: string;
  nombre: string;
  rol: string;
  fecha_registro: string;
  activo: boolean;
  profile_image?: string; // Soporta imagen de perfil
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
