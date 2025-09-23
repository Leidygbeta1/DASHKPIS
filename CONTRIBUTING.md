# Guía de Contribución — DASHKPIS

## Prerrequisitos
- Acepta la invitación al repositorio.
- Instala Git y Node.js 20 LTS.
- Editor recomendado: VS Code.

## Configuración inicial
```bash
git clone https://github.com/Leidygbeta1/DASHKPIS.git
cd DASHKPIS
npm ci
```

## Flujo de trabajo
1. Actualiza `main` y crea rama de trabajo
```bash
git switch main && git pull --ff-only
git switch -c feature/nombre-corto  # o fix/, chore/, docs/
```
2. Desarrolla y valida localmente
```bash
npm run lint --if-present
npm run build --if-present
```
3. Commit y push
```bash
git add -A
git commit -m "feat: descripción corta del cambio"
git push -u origin feature/nombre-corto
```
4. Abre un Pull Request
- Base: `main`  |  Compare: tu rama
- Completa la descripción, enlaza Issues (`#123`) y solicita revisión
- Espera a que los checks de CI pasen y haya 1 aprobación

5. Mantén la rama al día si GitHub lo pide
```bash
git fetch origin
git switch feature/nombre-corto
git merge origin/main
# resuelve conflictos si aparecen
git push
```

6. Merge y limpieza
- Usar "Squash and merge" cuando el PR esté aprobado y en verde
```bash
git switch main && git pull --ff-only
git branch -d feature/nombre-corto
git push origin --delete feature/nombre-corto
```

## Convenciones
- Ramas: `feature/*`, `fix/*`, `chore/*`, `docs/*`
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)

## Reglas del repositorio
- PR obligatorio hacia `main` con 1 aprobación mínima
- Checks de CI deben pasar y la rama debe estar "up to date"
- Prohibido `force push` y eliminar `main`

## Reporte de Bugs
- Usar Issues → plantilla "🐛 Bug Report" y adjuntar pasos y capturas
