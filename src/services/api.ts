export async function fetchHealth() {
  const res = await fetch('/api/health/');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function updateUserProfile(data: any): Promise<any> {
  const res = await fetch('/api/usuarios/perfil/', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.detail || 'Error al actualizar el perfil');
  }

  return res.json();
}
