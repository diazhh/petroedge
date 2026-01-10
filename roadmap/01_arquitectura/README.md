# ROADMAP: ARQUITECTURA DEL SISTEMA

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_VISION_ARQUITECTURA.md` | Visión general y principios | ✅ |
| `02_ARQUITECTURA_EDGE.md` | Componentes del sistema Edge | ✅ |
| `03_ARQUITECTURA_CLOUD.md` | Componentes Cloud (opcional) | 📋 |
| `04_ARQUITECTURA_REALTIME.md` | Procesamiento en tiempo real (Kafka→Redis→WS) | ✅ |
| `05_MODELO_DATOS.md` | Estructura de base de datos | 📋 |
| `06_ARQUITECTURA_MODULAR_DIGITAL_TWINS.md` | Arquitectura modular (LEGACY - ver 10) | ✅ |
| `07_EDGE_GATEWAY_PLC_INTEGRATION.md` | Integración PLCs y protocolos | ✅ |
| `08_FRONTEND_STANDARDS.md` | Estándares de frontend | ✅ |
| `09_ASSET_TYPES_TEMPLATES_PATTERN.md` | Patrones de tipos de assets | ✅ |
| **`10_ECLIPSE_DITTO_RULE_ENGINE_ADVANCED.md`** | **Eclipse Ditto + Worker Service + Motor de Reglas Avanzado** | **🆕 ACTUAL** |

---

## Resumen Ejecutivo

La arquitectura del sistema ERP+SCADA Petrolero se basa en el principio **EDGE-FIRST**:

- **EDGE = Producto Principal**: Sistema completo que funciona 100% offline
- **CLOUD = Servicio Opcional**: Para consolidación multi-sitio

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA EDGE-FIRST                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      EDGE (PRODUCTO PRINCIPAL)                   │   │
│   │                                                                  │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│   │  │ Frontend │  │ Backend  │  │ Database │  │  SCADA   │        │   │
│   │  │  React   │  │ Rust/Go  │  │PostgreSQL│  │  Gateway │        │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│   │                                                                  │   │
│   │  • Todos los módulos ERP                                        │   │
│   │  • Análisis de yacimientos                                      │   │
│   │  • Optimización de producción                                   │   │
│   │  • Telemetría en tiempo real                                    │   │
│   │  • Reportes y dashboards                                        │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              │ OPCIONAL (cuando hay conectividad)        │
│                              ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      CLOUD (SERVICIO ADICIONAL)                  │   │
│   │                                                                  │   │
│   │  • Sincronización de datos                                      │   │
│   │  • Consolidación multi-sitio                                    │   │
│   │  • Reportes corporativos                                        │   │
│   │  • Acceso remoto                                                │   │
│   │  • Analytics y ML                                               │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Principios Arquitectónicos

1. **Autonomía Total**: Edge funciona sin conexión indefinidamente
2. **Consistencia Eventual**: Sincronización cuando hay conectividad
3. **Resiliencia**: Tolerancia a fallos de red y hardware
4. **Escalabilidad Horizontal**: Múltiples sitios edge independientes
5. **Seguridad en Capas**: Autenticación local + encriptación
6. **Bajo Consumo**: Optimizado para hardware industrial limitado

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React + TypeScript | Ecosistema maduro, componentes reutilizables |
| **Backend** | Rust (Actix) o Go (Gin) | Alto rendimiento, bajo consumo de memoria |
| **Base de Datos** | PostgreSQL + TimescaleDB | Relacional + time-series en uno |
| **SCADA** | Custom Gateway | Modbus, MQTT, OPC-UA |
| **Contenedores** | K3s (Kubernetes ligero) | Orquestación para edge |
| **OS** | Linux (Debian/Ubuntu) | Estabilidad industrial |

