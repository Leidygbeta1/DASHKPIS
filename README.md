# DASHKAPIS 📊

Un dashboard moderno de KPIs desarrollado con React, TypeScript, Tailwind CSS y React Router.

## 🚀 Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** como build tool
- **Tailwind CSS v4** para estilos
- **React Router DOM** para navegación
- **ESLint** para linting

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git

## ⚡ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Leidygbeta1/DASHKPIS.git
   cd DASHKPIS
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

## 🐍 Backend Django REST (nuevo)

Este proyecto incluye un backend Django en `backend/` con endpoints de ejemplo.

### Requisitos

### Pasos
1) Crear/activar entorno virtual (si no existe ya `.venv`):
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
```
## 👥 Guía rápida para el equipo (clonar, correr y desarrollar)

Sigue estos pasos en Windows (PowerShell) para levantar el proyecto igual que en mi equipo.

### 0) Requisitos
- Node.js 18+
- Python 3.12 (recomendado) o 3.10+
- VS Code (opcional) con extensiones: Python, ESLint, Tailwind CSS IntelliSense

### 1) Clonar y dependencias del frontend
```powershell
git clone https://github.com/Leidygbeta1/DASHKPIS.git
cd DASHKPIS
npm ci
```

### 2) Backend: entorno y dependencias
```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 3) Variables de entorno del backend
```powershell
Copy-Item backend/.env.example backend/.env -Force
```

Tienes dos opciones de base de datos:

1) Rápido (local): usa SQLite (ya viene configurado en `.env.example`).

2) Azure SQL (compartido): edita `backend/.env` y define `DATABASE_URL` así:

```
DATABASE_URL=mssql://USUARIO:CONTRASENA@<servidor>.database.windows.net:1433/<BD>?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no&Connection+Timeout=30
```

Notas importantes para Azure SQL:
- Instala el ODBC Driver 18 (una sola vez):
  - Descarga: https://learn.microsoft.com/sql/connect/odbc/windows/release-notes-odbc-sql-server
  - O vía winget: `winget install -e --id Microsoft.ODBCDriver18`
- Asegúrate de que tu IP pública esté permitida en el firewall del servidor SQL (Azure Portal > SQL Server > Networking > Firewall). También habilita “Allow Azure services”.
- Si tu contraseña tiene símbolos, URL-encódelos (ej: `!` → `%21`).

### 4) Migraciones y usuario admin (opcional)
```powershell
python backend/manage.py migrate
python backend/manage.py createsuperuser
```

### 5) Levantar ambos servidores
- Terminal A (backend):
```powershell
python backend/manage.py runserver 8000
```
- Terminal B (frontend):
```powershell
npm run dev
```

Abre http://localhost:5173

### 6) Endpoints clave (backend)
- Auth: `POST /api/auth/login/`, `POST /api/auth/register/`, `GET /api/usuarios/`
- Proyectos: `GET/POST /api/proyectos/`, `GET/PUT/DELETE /api/proyectos/{id}/`
- Tareas (por proyecto): `GET /api/proyectos/{id}/tareas/`
- Tareas (CRUD/acciones):
  - `POST /api/tareas/`, `PUT /api/tareas/{id}/`
  - `POST /api/tareas/{id}/assign/`, `POST /api/tareas/{id}/duedate/`
  - Tiempo: `POST /api/tareas/{id}/tiempo/` y `GET /api/tareas/{id}/tiempo/?fecha=YYYY-MM-DD` o `?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
  - Progreso: `POST /api/tareas/{id}/progress/`
  - Completar: `POST /api/tareas/{id}/complete/`
  - Eliminar: `DELETE /api/tareas/{id}/delete/`

### 7) Problemas comunes y soluciones
- Error ODBC 258 (timeout) o “Invalid connection string attribute”:
  - Verifica el driver 18 instalado y reinicia VS Code/terminal tras instalar.
  - Revisa `DATABASE_URL`: el parámetro `driver` debe ser `ODBC+Driver+18+for+SQL+Server` (con `+` en vez de espacios) y cada parámetro separado por `&`.
  - Comprueba el firewall del SQL Server y la IP pública del equipo.
- Error “'mssql' isn’t an available database backend”:
  - Asegúrate de estar en el venv correcto (`.venv` activado) y que `pip install -r backend/requirements.txt` terminó sin errores.
- CORS al consumir la API desde Vite:
  - `DJANGO_CORS_ALLOWED_ORIGINS` incluye `http://localhost:5173` y `http://127.0.0.1:5173`.

### 8) Flujo típico de desarrollo
1. Crear rama: `git checkout -b feature/lo-que-sea`
2. Cambios + commits pequeños
3. `npm run dev` (frontend) y `python backend/manage.py runserver` (backend)
4. Pull request a `main`

2) Instalar dependencias:
```powershell
pip install -r backend/requirements.txt
```

3) Variables de entorno:
```powershell
Copy-Item backend/.env.example backend/.env -Force
```

4) Migraciones y server:
```powershell
python backend/manage.py migrate
python backend/manage.py runserver 8000
```

5) Endpoints de prueba:
- GET http://127.0.0.1:8000/api/health/
- GET http://127.0.0.1:8000/api/kpis/

Vite está configurado con proxy para `/api` hacia `http://127.0.0.1:8000` en `vite.config.ts`.
```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
