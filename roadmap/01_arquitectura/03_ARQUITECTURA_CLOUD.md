# ARQUITECTURA DEL SISTEMA CLOUD (OPCIONAL)

## 1. Propósito del Cloud

El Cloud es un **servicio adicional opcional** para clientes que:
- Tienen múltiples sitios Edge
- Requieren consolidación de datos corporativos
- Necesitan acceso remoto seguro
- Desean analytics avanzado y ML

**IMPORTANTE**: El Cloud NO es standalone. Requiere al menos un Edge para funcionar.

---

## 2. Modelo de Negocio Cloud

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE SERVICIO CLOUD                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  REQUISITO: El cliente debe tener al menos 1 licencia Edge activa       │
│                                                                          │
│  PLANES:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  BÁSICO ($500/mes)                                               │    │
│  │  • Hasta 5 sitios Edge                                           │    │
│  │  • Sincronización diaria                                         │    │
│  │  • Reportes básicos                                              │    │
│  │  • 1 año retención                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PROFESIONAL ($1,500/mes)                                        │    │
│  │  • Hasta 20 sitios Edge                                          │    │
│  │  • Sincronización cada hora                                      │    │
│  │  • Reportes avanzados + BI                                       │    │
│  │  • 3 años retención                                              │    │
│  │  • Acceso remoto                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ENTERPRISE (Personalizado)                                      │    │
│  │  • Sitios ilimitados                                             │    │
│  │  • Sincronización en tiempo real                                 │    │
│  │  • ML/AI predictivo                                              │    │
│  │  • Retención ilimitada                                           │    │
│  │  • API de integración                                            │    │
│  │  • Soporte dedicado                                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Arquitectura Cloud

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA CLOUD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌───────────────────┐                              │
│                          │    Load Balancer  │                              │
│                          │    (CloudFlare)   │                              │
│                          └─────────┬─────────┘                              │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐       │
│  │  API Server │           │  API Server │           │  API Server │       │
│  │   (Pod 1)   │           │   (Pod 2)   │           │   (Pod N)   │       │
│  └─────────────┘           └─────────────┘           └─────────────┘       │
│         │                          │                          │             │
│         └──────────────────────────┼──────────────────────────┘             │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐       │
│  │  PostgreSQL │           │   Redis     │           │  TimescaleDB│       │
│  │   Primary   │           │   Cluster   │           │   Cluster   │       │
│  └─────────────┘           └─────────────┘           └─────────────┘       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVICIOS CLOUD                              │   │
│  │                                                                      │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │   │
│  │  │ Sync   │ │ Report │ │Analytics│ │ ML/AI  │ │ Remote │            │   │
│  │  │Service │ │Service │ │Service │ │Service │ │ Access │            │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Multi-Tenancy

### 4.1 Modelo de Aislamiento

**Decisión**: Schema-based multi-tenancy

```sql
-- Cada cliente tiene su propio schema
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_chevron;
CREATE SCHEMA tenant_pdvsa;

-- Tablas replicadas por tenant
CREATE TABLE tenant_acme.wells (...);
CREATE TABLE tenant_chevron.wells (...);

-- Vista unificada para administración
CREATE VIEW admin.all_wells AS
  SELECT 'acme' as tenant, * FROM tenant_acme.wells
  UNION ALL
  SELECT 'chevron' as tenant, * FROM tenant_chevron.wells;
```

### 4.2 Routing de Tenant

```
Request → API Gateway → Extrae tenant_id del JWT → Configura search_path → Ejecuta query
```

---

## 5. Sincronización Edge-Cloud

### 5.1 Estrategia de Sincronización

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE SINCRONIZACIÓN                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EDGE                                    CLOUD                           │
│  ────                                    ─────                           │
│                                                                          │
│  1. Cambios locales                                                      │
│     │                                                                    │
│     ▼                                                                    │
│  2. ┌───────────────┐                                                    │
│     │  Sync Queue   │  (Store-and-forward)                              │
│     │  (PostgreSQL) │                                                    │
│     └───────┬───────┘                                                    │
│             │                                                            │
│  3.         │ ──────(cuando hay conexión)─────────▶                     │
│             │                                                            │
│             │                     4. ┌───────────────┐                  │
│             │                        │   Sync API    │                  │
│             │                        └───────┬───────┘                  │
│             │                                │                          │
│             │                     5.         ▼                          │
│             │                        ┌───────────────┐                  │
│             │                        │   Validate    │                  │
│             │                        │   & Merge     │                  │
│             │                        └───────┬───────┘                  │
│             │                                │                          │
│             │                     6.         ▼                          │
│             │                        ┌───────────────┐                  │
│             │                        │   Store in    │                  │
│             │                        │   Cloud DB    │                  │
│             │                        └───────┬───────┘                  │
│             │                                │                          │
│  7.         │ ◀──────────(ACK)───────────────┘                          │
│             │                                                            │
│  8. ┌───────┴───────┐                                                    │
│     │  Mark synced  │                                                    │
│     └───────────────┘                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Resolución de Conflictos

| Escenario | Estrategia |
|-----------|------------|
| **Mismo registro, mismo campo** | Last-write-wins (por timestamp) |
| **Mismo registro, campos diferentes** | Merge automático |
| **Conflicto crítico** | Marcar para revisión manual |
| **Borrado vs Modificación** | Borrado gana |

### 5.3 Cola de Sincronización

```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Trigger para poblar la cola
CREATE OR REPLACE FUNCTION queue_sync_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO sync_queue (table_name, record_id, operation, payload)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Servicios Cloud Específicos

### 6.1 Sync Service

- Recibe datos de múltiples Edge
- Valida integridad
- Aplica transformaciones
- Almacena en tenant correspondiente

### 6.2 Report Service

- Genera reportes consolidados multi-sitio
- Exportación a PDF, Excel, Power BI
- Programación de reportes
- Distribución por email

### 6.3 Analytics Service

- Dashboards corporativos
- KPIs agregados
- Comparativas entre sitios
- Tendencias históricas

### 6.4 ML/AI Service

- Predicción de fallos de equipos
- Optimización de producción
- Detección de anomalías
- Pronósticos de declinación

### 6.5 Remote Access Service

- Túnel seguro a Edge específico
- Autenticación de dos factores
- Auditoría de acceso
- Timeout automático

---

## 7. Infraestructura Cloud

### 7.1 Opciones de Despliegue

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **AWS** | Escalabilidad, servicios managed | Costo, dependencia |
| **Azure** | Integración enterprise | Complejidad |
| **GCP** | BigQuery, ML | Menor presencia LATAM |
| **On-Premise** | Control total, compliance | Mantenimiento |

### 7.2 Stack Recomendado (AWS)

| Servicio | Componente |
|----------|------------|
| **EKS** | Kubernetes managed |
| **RDS** | PostgreSQL managed |
| **ElastiCache** | Redis para cache/sessions |
| **S3** | Almacenamiento de archivos |
| **CloudFront** | CDN para frontend |
| **Route53** | DNS |
| **WAF** | Firewall de aplicación |

---

## 8. Seguridad Cloud

### 8.1 Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                   SEGURIDAD CLOUD                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PERÍMETRO                                                   │
│  ├── WAF (Web Application Firewall)                          │
│  ├── DDoS protection                                         │
│  └── Rate limiting                                           │
│                                                              │
│  RED                                                         │
│  ├── VPC aislada                                             │
│  ├── Security groups                                         │
│  └── Private subnets para BD                                 │
│                                                              │
│  APLICACIÓN                                                  │
│  ├── JWT + OAuth 2.0                                         │
│  ├── API keys para Edge                                      │
│  └── RBAC multi-tenant                                       │
│                                                              │
│  DATOS                                                       │
│  ├── Encriptación at-rest (AES-256)                         │
│  ├── TLS 1.3 en tránsito                                    │
│  └── Backup encriptados                                      │
│                                                              │
│  COMPLIANCE                                                  │
│  ├── Logs de auditoría                                       │
│  ├── Retención configurable                                  │
│  └── Exportación para auditorías                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. SLA y Disponibilidad

| Métrica | Objetivo |
|---------|----------|
| **Uptime** | 99.9% (8.76 horas downtime/año) |
| **Latency API** | < 200ms P95 |
| **Sync delay** | < 5 minutos |
| **RTO** | 4 horas |
| **RPO** | 1 hora |

---

## 10. Prioridad de Implementación

El Cloud es la **ÚLTIMA PRIORIDAD**. Se implementa después de que el Edge esté completo y probado.

**Orden sugerido**:
1. Sync Service básico
2. Multi-tenancy
3. Reportes corporativos
4. Remote Access
5. Analytics
6. ML/AI

