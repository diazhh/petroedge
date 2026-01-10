# REGLAS DE DOCUMENTACIÓN - SCADA+ERP

**IMPORTANTE**: Este archivo contiene las reglas oficiales de documentación del proyecto.

---

## 🎯 Principio Fundamental

**UN SOLO DOCUMENTO DE TRACKING**: `/PROGRESS.md`

Todo el seguimiento de progreso, estado de roadmaps y próximas tareas se centraliza en este único archivo.

---

## 📁 Jerarquía de Documentos

### Documentos Oficiales (NO modificar sin razón)

1. **`/PROGRESS.md`** ⭐ DOCUMENTO CENTRAL
   - Tracking de todos los roadmaps
   - Estado actual del proyecto
   - Próxima tarea a ejecutar
   - **ACTUALIZAR**: Después de cada tarea completada
   - **CONSULTAR**: Antes de iniciar cualquier trabajo

2. **`/AGENTS.md`** (raíz)
   - Convenciones de desarrollo
   - Stack tecnológico
   - Reglas de código
   - Sistema de documentación
   - **ACTUALIZAR**: Solo cuando cambien convenciones

3. **`/roadmap/00_MASTER_ROADMAP.md`**
   - Plan maestro del proyecto
   - Fases y prioridades
   - **NO ACTUALIZAR**: Es referencia estática

4. **`/roadmap/XX_*/`**
   - Roadmaps detallados por módulo
   - Especificaciones técnicas
   - **CONSULTAR**: Para detalles de implementación
   - **NO ACTUALIZAR**: Son referencias estáticas

### Documentos de Referencia (Consulta)

5. **`/QUICKSTART.md`**
   - Guía de inicio rápido
   - Comandos útiles
   - **ACTUALIZAR**: Si cambian comandos o setup

6. **`/docs/*.md`**
   - Documentación técnica
   - Arquitectura, stack, protocolos
   - **CONSULTAR**: Para entender decisiones técnicas

### Documentos Temporales (NO actualizar)

7. **`/IMPLEMENTATION_STATUS.md`**
   - Snapshot temporal del estado
   - **NO ACTUALIZAR**: Es un snapshot histórico
   - **DEPRECADO**: Usar `/PROGRESS.md` en su lugar

---

## ✅ Flujo de Trabajo Correcto

```
INICIO DE SESIÓN
    ↓
1. Leer /PROGRESS.md
    ↓
2. Identificar "Próxima Tarea a Ejecutar"
    ↓
3. ¿Necesito detalles técnicos?
    ├─ SÍ → Consultar /roadmap/XX_*/
    └─ NO → Continuar
    ↓
4. EJECUTAR trabajo
    ↓
5. ACTUALIZAR /PROGRESS.md:
   - Cambiar estado
   - Mover tareas a "Completadas"
   - Actualizar "Siguiente paso"
   - Actualizar fecha
    ↓
6. Commit y push
    ↓
FIN DE SESIÓN
```

---

## ❌ Anti-Patrones (NO HACER)

### ❌ NO Crear Estos Archivos

- `STATUS.md` en cualquier carpeta
- `TODO.md` en cualquier carpeta
- `PROGRESS_*.md` adicionales
- `TASKS.md` en módulos
- `CHECKLIST.md` duplicados
- Cualquier archivo de tracking fuera de `/PROGRESS.md`

### ❌ NO Duplicar Información

- NO copiar estado de `/PROGRESS.md` a otros archivos
- NO mantener múltiples listas de tareas
- NO crear documentos de progreso por módulo

### ❌ NO Actualizar Documentos Estáticos

- NO modificar roadmaps en `/roadmap/` (son referencia)
- NO actualizar `IMPLEMENTATION_STATUS.md` (es snapshot)
- NO cambiar `00_MASTER_ROADMAP.md` (es plan maestro)

---

## ✅ Qué Documentar y Dónde

| Información | Dónde Documentar | Frecuencia |
|-------------|------------------|------------|
| Estado de tareas | `/PROGRESS.md` | Después de cada tarea |
| Próxima tarea | `/PROGRESS.md` | Al completar tarea actual |
| Bloqueadores | `/PROGRESS.md` | Cuando aparecen |
| Porcentaje de progreso | `/PROGRESS.md` | Al cambiar significativamente |
| Convenciones de código | `/AGENTS.md` | Cuando cambian reglas |
| Comandos de setup | `/QUICKSTART.md` | Cuando cambia setup |
| Decisiones técnicas | `/docs/*.md` | Cuando se toman decisiones |
| Especificaciones | `/roadmap/XX_*/` | Al crear roadmap (una vez) |
| Código | Archivos `.ts`, `.tsx` | Siempre |

---

## 🔄 Actualización de `/PROGRESS.md`

### Template de Actualización

```markdown
### X.X Nombre del Componente
**Estado**: 🟡 En Progreso (XX%)  ← ACTUALIZAR
**Última actualización**: YYYY-MM-DD  ← ACTUALIZAR

#### Tareas Completadas
- ✅ Tarea 1  ← MOVER desde Pendientes
- ✅ Tarea 2  ← MOVER desde Pendientes

#### Tareas en Progreso
- 🟡 Tarea actual  ← AGREGAR si aplica

#### Tareas Pendientes
- ⬜ Tarea pendiente 1
- ⬜ Tarea pendiente 2

**Siguiente paso**: Descripción clara  ← ACTUALIZAR
**Bloqueadores**: Ninguno o descripción  ← ACTUALIZAR
**Notas**: Información relevante  ← AGREGAR si necesario
```

### Cuándo Cambiar Estado

| De | A | Cuándo |
|----|---|--------|
| ⚪ Pendiente | 🟡 En Progreso | Al iniciar primera tarea |
| 🟡 En Progreso | 🟠 Bloqueado | Al encontrar bloqueador |
| 🟠 Bloqueado | 🟡 En Progreso | Al resolver bloqueador |
| 🟡 En Progreso | 🟢 Completado | Al completar todas las tareas |
| Cualquiera | 🔴 Problema | Al encontrar error crítico |

---

## 📊 Ejemplo Completo

### ❌ INCORRECTO (NO HACER)

```
# Crear múltiples archivos
/src/backend/STATUS.md          ← NO
/src/frontend/TODO.md           ← NO
/roadmap/01_arquitectura/PROGRESS.md  ← NO
/database/TASKS.md              ← NO
```

### ✅ CORRECTO (HACER)

```
# Un solo archivo centralizado
/PROGRESS.md                    ← SÍ

# Actualizar después de completar tarea
1. Abrir /PROGRESS.md
2. Buscar sección "1.3 Backend API"
3. Mover "✅ Servidor iniciado" a Completadas
4. Actualizar porcentaje: 35% → 40%
5. Actualizar "Siguiente paso"
6. Actualizar fecha
7. Guardar
```

---

## 🚨 Resolución de Conflictos

### Si Encuentras Documentos Duplicados

1. Verificar cuál tiene información más reciente
2. Consolidar en `/PROGRESS.md`
3. Eliminar documentos duplicados
4. Actualizar referencias si existen

### Si `/PROGRESS.md` No Existe

1. Crear desde plantilla en `/AGENTS.md`
2. Migrar información de documentos temporales
3. Eliminar documentos temporales
4. Continuar con flujo normal

---

## 📝 Checklist de Documentación

Antes de terminar una sesión de trabajo:

- [ ] `/PROGRESS.md` actualizado con progreso
- [ ] Estado cambiado si corresponde
- [ ] "Siguiente paso" actualizado
- [ ] Bloqueadores documentados si existen
- [ ] Fecha de actualización cambiada
- [ ] NO se crearon archivos de tracking adicionales
- [ ] Commits realizados

---

**Última actualización**: 2026-01-08  
**Versión**: 1.0.0
