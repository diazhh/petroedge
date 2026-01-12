# ROADMAP: MÓDULO COILED TUBING

> **Estado**: ⚪ Pendiente  
> **Última actualización**: 2026-01-12

---

## 📄 Documento Principal

**📌 IMPORTANTE**: La documentación técnica completa del módulo CT se encuentra en:

```
/ct.md (raíz del proyecto)
```

Este documento contiene ~1200 líneas con:
- Visión y objetivo del módulo
- Integración con la plataforma PetroEdge
- Tipos de operaciones CT
- Entidades del módulo (CT Units, Reels, Jobs, Tickets)
- Flujo de trabajo operativo
- Interfaces de usuario (wireframes ASCII)
- Modelo de fatiga completo
- Cálculos de ingeniería (hidráulica, mecánica, buckling)
- Telemetría y sensores
- Sistema de alarmas
- KPIs y métricas
- Job Ticket template
- Estándares y normativas
- Roadmap de implementación detallado

---

## 📁 Índice de Documentos de Soporte

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `/ct.md` | **Documentación técnica completa** | ✅ Actualizado |
| `01_VISION_FUNCIONALIDADES.md` | Visión y casos de uso (legacy) | 📋 Referencia |
| `02_MODELO_DATOS.md` | Esquemas SQL detallados | ✅ Válido |
| `03_APIS_ENDPOINTS.md` | Especificación de APIs | 📋 Por actualizar |
| `04_INTERFAZ_USUARIO.md` | Wireframes detallados | 📋 Por actualizar |

---

## 🎯 Resumen del Módulo

El módulo de **Coiled Tubing** gestiona el ciclo completo de operaciones de intervención de pozos:

### Funcionalidades Principales

| Área | Funcionalidades |
|------|-----------------|
| **Gestión de Flota** | Unidades CT, carretes, herramientas BHA |
| **Tracking de Fatiga** | Monitoreo por secciones, alertas, cortes |
| **Planificación** | Wizard de jobs, simulación, asignación |
| **Monitoreo RT** | Dashboard operativo, telemetría SCADA |
| **Análisis** | Buckling, hidráulica, predicción lockup |
| **Documentación** | Job tickets, reportes, KPIs |

### Software de Referencia

| Software | Fabricante |
|----------|------------|
| **CIRCA Suite** | Baker Hughes |
| **Cerberus** | NOV-CTES |
| **CoilCADE** | Schlumberger |
| **SMART-LINK** | Weatherford |

---

## 📊 Roadmap de Implementación

| Fase | Entregables | Duración | Estado |
|------|-------------|----------|--------|
| **1** | Modelo de datos, APIs base | 2 sem | ⚪ |
| **2** | Gestión de reels y fatiga | 2 sem | ⚪ |
| **3** | Gestión de jobs y BHA | 2 sem | ⚪ |
| **4** | Dashboard tiempo real | 2 sem | ⚪ |
| **5** | Job tickets y reportes | 1 sem | ⚪ |
| **6** | Cálculos de ingeniería | 2 sem | ⚪ |
| **7** | Integración y testing | 1 sem | ⚪ |

**Total estimado: 12 semanas**

---

## 🔗 Referencias

- Documentación completa: `/ct.md`
- Arquitectura general: `/roadmap/01_arquitectura/`
- Estándares frontend: `/roadmap/01_arquitectura/08_FRONTEND_STANDARDS.md`

