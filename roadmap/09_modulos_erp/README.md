# ROADMAP: MÓDULOS ERP (Gestión Empresarial)

## Índice de Documentos

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| `01_INVENTARIO.md` | Gestión de inventario y almacén | ✅ |
| `02_COMPRAS.md` | Órdenes de compra y proveedores | 📋 |
| `03_FINANZAS.md` | Contabilidad y costos | 📋 |
| `04_RRHH.md` | Personal y nómina | 📋 |
| `05_MANTENIMIENTO.md` | CMMS, órdenes de trabajo | 📋 |
| `06_HSE.md` | Seguridad y medio ambiente | 📋 |

---

## Resumen Ejecutivo

Los módulos ERP complementan las operaciones técnicas con gestión empresarial:

- **Inventario**: Control de materiales, equipos, repuestos
- **Compras**: Proveedores, órdenes de compra, licitaciones
- **Finanzas**: Contabilidad, facturación, costos por pozo
- **RRHH**: Personal, nómina, guardias, certificaciones
- **Mantenimiento**: CMMS, preventivo/correctivo
- **HSE**: Seguridad, incidentes, permisos de trabajo

---

## Arquitectura ERP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MÓDULOS ERP                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   INVENTARIO    │  │    COMPRAS      │  │    FINANZAS     │            │
│  │                 │  │                 │  │                 │            │
│  │ • Almacenes     │  │ • Proveedores   │  │ • Contabilidad  │            │
│  │ • Materiales    │  │ • OC/Cotizac.   │  │ • Facturación   │            │
│  │ • Stock         │  │ • Recepciones   │  │ • Costos/Pozo   │            │
│  │ • Movimientos   │  │ • Licitaciones  │  │ • Presupuestos  │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │      RRHH       │  │  MANTENIMIENTO  │  │      HSE        │            │
│  │                 │  │                 │  │                 │            │
│  │ • Personal      │  │ • Equipos       │  │ • Incidentes    │            │
│  │ • Nómina        │  │ • Preventivo    │  │ • Permisos      │            │
│  │ • Guardias      │  │ • Correctivo    │  │ • Auditorías    │            │
│  │ • Certificac.   │  │ • Repuestos     │  │ • Capacitación  │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Módulo de Inventario

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Almacenes** | Múltiples ubicaciones (campo, base, taller) |
| **Materiales** | Catálogo con categorías petroleras |
| **Stock** | Control de existencias, mínimos, máximos |
| **Movimientos** | Entradas, salidas, transferencias |
| **Kardex** | Historial de movimientos por ítem |
| **Inventario Físico** | Conteos y ajustes |

### Categorías de Materiales Petroleros

| Categoría | Ejemplos |
|-----------|----------|
| **Tubulares** | Casing, tubing, drill pipe, CT |
| **Cabezales** | Wellheads, árboles de navidad |
| **BOP** | Preventores, acumuladores |
| **Bombas** | ESP, PCP, rod pump |
| **Químicos** | Lodo, inhibidores, ácidos |
| **Herramientas** | Fishing tools, packers |
| **Repuestos** | Sellos, válvulas, impellers |
| **EPP** | Cascos, guantes, overoles |

### Modelo de Datos

```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY,
    code VARCHAR(20),
    name VARCHAR(100),
    location VARCHAR(200),
    warehouse_type VARCHAR(30) -- CENTRAL, FIELD, WORKSHOP
);

CREATE TABLE materials (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    description VARCHAR(200),
    category VARCHAR(50),
    unit_of_measure VARCHAR(20),
    min_stock DECIMAL(12,2),
    max_stock DECIMAL(12,2),
    reorder_point DECIMAL(12,2)
);

CREATE TABLE stock_levels (
    id UUID PRIMARY KEY,
    warehouse_id UUID REFERENCES warehouses(id),
    material_id UUID REFERENCES materials(id),
    quantity DECIMAL(12,2),
    last_count_date DATE,
    UNIQUE(warehouse_id, material_id)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    material_id UUID REFERENCES materials(id),
    warehouse_from UUID REFERENCES warehouses(id),
    warehouse_to UUID REFERENCES warehouses(id),
    movement_type VARCHAR(20), -- IN, OUT, TRANSFER
    quantity DECIMAL(12,2),
    reference_doc VARCHAR(50),
    well_id UUID REFERENCES wells(id),
    movement_date TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Módulo de Compras

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Proveedores** | Registro, evaluación, documentos |
| **Solicitudes** | Requisiciones internas |
| **Cotizaciones** | Solicitud de precios |
| **Órdenes de Compra** | Generación y seguimiento |
| **Recepciones** | Ingreso a almacén |
| **Licitaciones** | Proceso competitivo |

### Flujo de Compras

```
SOLICITUD ──▶ COTIZACIÓN ──▶ APROBACIÓN ──▶ OC ──▶ RECEPCIÓN ──▶ PAGO
    │             │              │           │          │          │
    ▼             ▼              ▼           ▼          ▼          ▼
 Usuario      Compras       Gerencia    Proveedor   Almacén    Finanzas
```

---

## 3. Módulo de Finanzas

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Plan de Cuentas** | Estructura contable |
| **Asientos** | Registro de transacciones |
| **Cuentas por Pagar** | Control de facturas |
| **Cuentas por Cobrar** | Facturación a clientes |
| **Costos por Pozo** | Acumulación de gastos |
| **Presupuestos** | AFE y control |

### Costos por Pozo

```
CENTRO DE COSTO: POZO PDC-15
├── Perforación
│   ├── Rig: $450,000
│   ├── Lodo: $85,000
│   ├── Brocas: $45,000
│   └── Servicios: $120,000
├── Completación
│   ├── Casing: $180,000
│   ├── Cemento: $35,000
│   └── ESP: $95,000
├── Intervenciones
│   └── Workover: $45,000
└── TOTAL: $1,055,000
```

---

## 4. Módulo de RRHH

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Personal** | Datos de empleados |
| **Cargos** | Estructura organizacional |
| **Nómina** | Cálculo de pagos |
| **Guardias** | Turnos rotativos (14x14, 7x7) |
| **Certificaciones** | Control de vigencia |
| **Capacitación** | Cursos y evaluaciones |

### Esquemas de Guardia Petrolera

| Esquema | Descripción |
|---------|-------------|
| **14x14** | 14 días trabajo, 14 días libre |
| **21x21** | 21 días trabajo, 21 días libre |
| **7x7** | 7 días trabajo, 7 días libre |
| **5x2** | Lunes a viernes, fines de semana libre |

### Certificaciones Petroleras

| Certificación | Vigencia | Requerido Para |
|---------------|----------|----------------|
| **H2S Safety** | 2 años | Todo personal de campo |
| **Well Control** | 2 años | Drilling, completación |
| **BOSIET** | 4 años | Personal offshore |
| **Primeros Auxilios** | 1 año | Todo personal |
| **Manejo Defensivo** | 1 año | Conductores |

---

## 5. Módulo de Mantenimiento (CMMS)

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Equipos** | Registro de activos |
| **Planes** | Mantenimiento preventivo |
| **Órdenes de Trabajo** | Correctivo y preventivo |
| **Repuestos** | Vinculación con inventario |
| **Historial** | Registro de intervenciones |
| **Indicadores** | MTBF, MTTR, disponibilidad |

### Tipos de Equipos Petroleros

| Categoría | Ejemplos |
|-----------|----------|
| **Producción** | ESP, motores, VSD, rod pump |
| **Superficie** | Separadores, tanques, bombas |
| **Perforación** | Top drive, mud pumps, BOP |
| **Transporte** | Camiones, grúas, montacargas |
| **Instrumentación** | Medidores, transmisores |

### Indicadores de Mantenimiento

| KPI | Fórmula | Meta |
|-----|---------|------|
| **MTBF** | Tiempo operación / Fallas | > 180 días |
| **MTTR** | Tiempo reparación / Fallas | < 24 horas |
| **Disponibilidad** | MTBF / (MTBF + MTTR) | > 95% |
| **Cumplimiento PM** | PM ejecutados / PM programados | > 90% |

---

## 6. Módulo HSE

### Funcionalidades

| Función | Descripción |
|---------|-------------|
| **Incidentes** | Registro y seguimiento |
| **Permisos de Trabajo** | Hot work, espacios confinados |
| **Inspecciones** | Checklists de seguridad |
| **Auditorías** | Programación y hallazgos |
| **Capacitación** | Cursos de seguridad |
| **Indicadores** | TRIR, LTIR, días sin LTI |

### Tipos de Incidentes

| Categoría | Descripción |
|-----------|-------------|
| **LTI** | Lost Time Incident |
| **RWC** | Restricted Work Case |
| **MTC** | Medical Treatment Case |
| **FAC** | First Aid Case |
| **Near Miss** | Casi accidente |
| **Unsafe Act** | Acto inseguro |
| **Unsafe Condition** | Condición insegura |

### Indicadores HSE

| KPI | Fórmula |
|-----|---------|
| **TRIR** | (Incidentes recordables × 200,000) / Horas trabajadas |
| **LTIR** | (LTI × 200,000) / Horas trabajadas |
| **Días sin LTI** | Días consecutivos sin LTI |
| **Severidad** | Días perdidos × 200,000 / Horas trabajadas |

---

## Cronograma de Implementación

| Módulo | Prioridad | Duración |
|--------|-----------|----------|
| **Inventario** | Alta | 4 semanas |
| **Compras** | Alta | 3 semanas |
| **RRHH básico** | Media | 3 semanas |
| **Mantenimiento** | Media | 4 semanas |
| **Finanzas básico** | Media | 4 semanas |
| **HSE** | Media | 3 semanas |

**Total: 21 semanas** (algunos pueden ejecutarse en paralelo)

---

## Integraciones entre Módulos

```
INVENTARIO ◀──────────▶ COMPRAS
    │                       │
    │                       │
    ▼                       ▼
MANTENIMIENTO ◀────────▶ FINANZAS
    │                       │
    │                       │
    ▼                       ▼
OPERACIONES ◀──────────▶ RRHH
(Well Mgmt, Drilling)       │
                            │
                            ▼
                          HSE
```

