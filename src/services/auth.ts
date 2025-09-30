export type LoginRequest = { email: string; password: string };
export type LoginResponse = { user: { id_usuario: number; email: string; rol: string; fecha_registro: string; activo: boolean } };

export async function apiLogin(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Login failed');
  }
  return res.json();
}

export type RegisterRequest = { email: string; password: string; rol: 'PM'|'Colaborador'|'Stakeholder' };
export type RegisterResponse = LoginResponse;

export async function apiRegister(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Register failed');
  }
  return res.json();
}
