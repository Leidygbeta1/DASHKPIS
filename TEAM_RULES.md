# 🚨 REGLAS DE TRABAJO EN EQUIPO - DASHKAPIS

## 📋 FLUJO DE TRABAJO OBLIGATORIO

### 🔄 Para Cada Nueva Funcionalidad:

1. **SIEMPRE actualizar primero:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Crear nueva rama:**
   ```bash
   git checkout -b feature/nombre-descriptivo
   # Ejemplos:
   # git checkout -b feature/agregar-graficos
   # git checkout -b feature/pagina-productos
   # git checkout -b fix/error-sidebar
   ```

3. **Trabajar en tu rama y hacer commits:**
   ```bash
   git add .
   git commit -m "feat: agregar componente de gráficos"
   ```

4. **Antes de subir, actualizar con main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/tu-rama
   git merge main  # Resolver conflictos si los hay
   ```

5. **Subir tu rama:**
   ```bash
   git push origin feature/tu-rama
   ```

6. **Crear Pull Request en GitHub**

## 🚫 PROHIBIDO TERMINANTEMENTE:

- ❌ `git push origin main` (push directo a main)
- ❌ Trabajar directamente en la rama main
- ❌ Hacer commits sin mensaje descriptivo
- ❌ Subir código que no compile
- ❌ Hacer merge sin revisar conflictos

## ✅ CONVENCIONES DE COMMITS:

```bash
feat: nueva funcionalidad
fix: corrección de bug
style: cambios de estilos/CSS
refactor: mejoras de código
docs: documentación
test: pruebas
```

## 🔧 ANTES DE CADA SESIÓN DE TRABAJO:

```bash
git checkout main
git pull origin main
```

## 🆘 COMANDOS DE EMERGENCIA:

**Si hiciste cambios en main por error:**
```bash
git stash  # Guardar cambios temporalmente
git checkout main
git pull origin main
git checkout -b feature/mis-cambios
git stash pop  # Recuperar cambios
```

**Si hay conflictos:**
```bash
git status  # Ver archivos en conflicto
# Editar archivos manualmente
git add .
git commit -m "resolve: conflictos resueltos"
```

## 📞 CONTACTO DE EMERGENCIA:

Si algo sale mal, contactar inmediatamente al líder del proyecto.