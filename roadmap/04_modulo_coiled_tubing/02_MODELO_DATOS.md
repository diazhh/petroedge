# COILED TUBING - MODELO DE DATOS

## 1. Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODELO DE DATOS - COILED TUBING                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │  ct_reels   │────────▶│  ct_jobs    │◀────────│    wells    │           │
│  └──────┬──────┘   1:N   └──────┬──────┘   N:1   └─────────────┘           │
│         │                       │                                           │
│         │                       │                                           │
│         ▼                       ▼                                           │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │reel_sections│         │job_operations│        │ job_fluids  │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│         │                       │                                           │
│         ▼                       ▼                                           │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│  │fatigue_cycles│        │realtime_data│         │ job_bha     │           │
│  └─────────────┘         └─────────────┘         └─────────────┘           │
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │  ct_units   │         │ job_tickets │                                   │
│  └─────────────┘         └─────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tablas de Gestión de Reels

### 2.1 Carretes de CT

```sql
CREATE TABLE ct_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Identificación
    reel_number VARCHAR(30) NOT NULL UNIQUE,
    reel_name VARCHAR(100),
    serial_number VARCHAR(50),
    
    -- Especificaciones del tubing
    od_inches DECIMAL(6, 3) NOT NULL,
    wall_thickness_inches DECIMAL(6, 4) NOT NULL,
    id_inches DECIMAL(6, 3) GENERATED ALWAYS AS (od_inches - 2 * wall_thickness_inches) STORED,
    material_grade VARCHAR(30) NOT NULL, -- CT-70, CT-80, CT-90, CT-110
    yield_strength_psi INTEGER NOT NULL,
    
    -- Longitud
    original_length_ft DECIMAL(10, 2) NOT NULL,
    current_length_ft DECIMAL(10, 2) NOT NULL,
    cut_removed_ft DECIMAL(10, 2) DEFAULT 0,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    -- AVAILABLE, IN_SERVICE, MAINTENANCE, RETIRED, SCRAPPED
    
    -- Límites de fatiga
    max_fatigue_percent DECIMAL(5, 2) DEFAULT 80.0,
    current_max_fatigue_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Presión de trabajo
    working_pressure_psi INTEGER,
    burst_pressure_psi INTEGER,
    
    -- Historial
    manufacture_date DATE,
    purchase_date DATE,
    last_inspection_date DATE,
    next_inspection_date DATE,
    total_jobs INTEGER DEFAULT 0,
    total_footage_ft DECIMAL(12, 2) DEFAULT 0,
    
    -- Ubicación
    current_location VARCHAR(100),
    assigned_unit_id UUID REFERENCES ct_units(id),
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'RETIRED', 'SCRAPPED'))
);

CREATE INDEX idx_ct_reels_tenant ON ct_reels(tenant_id);
CREATE INDEX idx_ct_reels_status ON ct_reels(status);
CREATE INDEX idx_ct_reels_number ON ct_reels(reel_number);
```

### 2.2 Secciones del Reel

```sql
CREATE TABLE reel_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES ct_reels(id) ON DELETE CASCADE,
    
    -- Ubicación en el reel
    section_number INTEGER NOT NULL,
    start_footage_ft DECIMAL(10, 2) NOT NULL,
    end_footage_ft DECIMAL(10, 2) NOT NULL,
    length_ft DECIMAL(10, 2) GENERATED ALWAYS AS (end_footage_ft - start_footage_ft) STORED,
    
    -- Fatiga acumulada
    bending_fatigue_percent DECIMAL(6, 3) DEFAULT 0,
    pressure_fatigue_percent DECIMAL(6, 3) DEFAULT 0,
    combined_fatigue_percent DECIMAL(6, 3) DEFAULT 0,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'GOOD',
    -- GOOD, WARNING, CRITICAL, CUT
    
    -- Última actualización
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(reel_id, section_number)
);

CREATE INDEX idx_reel_sections_reel ON reel_sections(reel_id);
CREATE INDEX idx_reel_sections_fatigue ON reel_sections(combined_fatigue_percent);
```

### 2.3 Ciclos de Fatiga

```sql
CREATE TABLE fatigue_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES ct_reels(id),
    section_id UUID REFERENCES reel_sections(id),
    job_id UUID REFERENCES ct_jobs(id),
    
    -- Tipo de ciclo
    cycle_type VARCHAR(20) NOT NULL,
    -- BENDING, PRESSURE, COMBINED
    
    -- Datos del ciclo
    cycle_timestamp TIMESTAMPTZ NOT NULL,
    footage_ft DECIMAL(10, 2) NOT NULL,
    
    -- Parámetros de bending
    guide_radius_inches DECIMAL(6, 2),
    od_over_radius DECIMAL(8, 4),
    
    -- Parámetros de presión
    internal_pressure_psi INTEGER,
    pressure_ratio DECIMAL(6, 4),
    
    -- Daño calculado
    damage_increment DECIMAL(10, 8) NOT NULL,
    cumulative_damage DECIMAL(6, 4),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fatigue_cycles_reel ON fatigue_cycles(reel_id);
CREATE INDEX idx_fatigue_cycles_job ON fatigue_cycles(job_id);
CREATE INDEX idx_fatigue_cycles_time ON fatigue_cycles(cycle_timestamp);

-- Hypertable para TimescaleDB
SELECT create_hypertable('fatigue_cycles', 'cycle_timestamp', if_not_exists => TRUE);
```

---

## 3. Tablas de Trabajos CT

### 3.1 Trabajos de CT

```sql
CREATE TABLE ct_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    well_id UUID NOT NULL REFERENCES wells(id),
    reel_id UUID NOT NULL REFERENCES ct_reels(id),
    unit_id UUID REFERENCES ct_units(id),
    
    -- Identificación
    job_number VARCHAR(30) NOT NULL UNIQUE,
    job_type VARCHAR(30) NOT NULL,
    -- CLEANOUT, NITROGEN_LIFT, ACID_TREATMENT, CEMENT_SQUEEZE, 
    -- FISHING, LOGGING, PERFORATION, MILLING, SAND_CONTROL
    
    -- Estado
    status VARCHAR(20) DEFAULT 'PLANNED',
    -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, SUSPENDED
    
    -- Fechas
    planned_date DATE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Profundidades
    planned_depth_ft DECIMAL(10, 2),
    max_depth_reached_ft DECIMAL(10, 2),
    tag_depth_ft DECIMAL(10, 2),
    
    -- Parámetros de operación
    max_weight_lbs INTEGER,
    max_pressure_psi INTEGER,
    max_pump_rate_bpm DECIMAL(6, 2),
    
    -- Cliente
    client_id UUID REFERENCES clients(id),
    client_representative VARCHAR(100),
    
    -- Personal
    supervisor_id UUID REFERENCES users(id),
    operator_id UUID REFERENCES users(id),
    
    -- Costos
    estimated_cost_usd DECIMAL(12, 2),
    actual_cost_usd DECIMAL(12, 2),
    
    -- Resultados
    job_successful BOOLEAN,
    objectives_met TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT valid_job_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED'))
);

CREATE INDEX idx_ct_jobs_well ON ct_jobs(well_id);
CREATE INDEX idx_ct_jobs_reel ON ct_jobs(reel_id);
CREATE INDEX idx_ct_jobs_status ON ct_jobs(status);
CREATE INDEX idx_ct_jobs_date ON ct_jobs(planned_date);
```

### 3.2 Operaciones del Trabajo

```sql
CREATE TABLE job_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Secuencia
    sequence_number INTEGER NOT NULL,
    
    -- Tiempos
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes DECIMAL(8, 2),
    
    -- Operación
    operation_code VARCHAR(10) NOT NULL,
    operation_description TEXT,
    
    -- Profundidades
    start_depth_ft DECIMAL(10, 2),
    end_depth_ft DECIMAL(10, 2),
    
    -- Parámetros
    weight_indicator_lbs INTEGER,
    pump_pressure_psi INTEGER,
    pump_rate_bpm DECIMAL(6, 2),
    wellhead_pressure_psi INTEGER,
    
    -- Notas
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_operations_job ON job_operations(job_id, sequence_number);
```

### 3.3 Fluidos Bombeados

```sql
CREATE TABLE job_fluids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Secuencia
    sequence_number INTEGER NOT NULL,
    pump_time TIMESTAMPTZ,
    
    -- Fluido
    fluid_type VARCHAR(50) NOT NULL,
    -- NITROGEN, ACID_15PCT, ACID_28PCT, BRINE, FRESH_WATER, 
    -- DIESEL, CEMENT, SPACER, MUTUAL_SOLVENT
    
    fluid_name VARCHAR(100),
    
    -- Volúmenes
    volume_bbls DECIMAL(10, 2),
    volume_gallons DECIMAL(12, 2),
    
    -- Parámetros de bombeo
    pump_rate_bpm DECIMAL(6, 2),
    pump_pressure_psi INTEGER,
    
    -- Propiedades
    density_ppg DECIMAL(6, 2),
    viscosity_cp DECIMAL(8, 2),
    
    -- Aditivos
    additives JSONB,
    -- [{name: "Corrosion Inhibitor", concentration: "0.5%", volume_gal: 5}]
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 BHA de CT

```sql
CREATE TABLE job_bha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Secuencia desde el fondo
    sequence_from_bottom INTEGER NOT NULL,
    
    -- Componente
    component_type VARCHAR(50) NOT NULL,
    -- NOZZLE, MOTOR, CHECK_VALVE, DISCONNECT, KNUCKLE_JOINT,
    -- FISHING_TOOL, PERFORATING_GUN, LOGGING_TOOL, MILL, PACKER
    
    description VARCHAR(200),
    od_inches DECIMAL(6, 3),
    id_inches DECIMAL(6, 3),
    length_ft DECIMAL(8, 2),
    weight_lbs DECIMAL(10, 2),
    
    -- Identificación
    serial_number VARCHAR(50),
    
    -- Especificaciones adicionales
    specifications JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Tablas de Tiempo Real

### 4.1 Datos en Tiempo Real

```sql
CREATE TABLE ct_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    job_id UUID NOT NULL REFERENCES ct_jobs(id),
    
    -- Profundidad y velocidad
    depth_ft DECIMAL(10, 2),
    speed_ft_min DECIMAL(8, 2),
    
    -- Peso
    weight_indicator_lbs INTEGER,
    weight_on_bit_lbs INTEGER,
    
    -- Presiones
    pump_pressure_psi INTEGER,
    wellhead_pressure_psi INTEGER,
    annular_pressure_psi INTEGER,
    
    -- Bombeo
    pump_rate_bpm DECIMAL(6, 2),
    total_volume_pumped_bbls DECIMAL(10, 2),
    
    -- Retornos
    returns_rate_bpm DECIMAL(6, 2),
    returns_density_ppg DECIMAL(6, 2),
    
    -- Motor (si aplica)
    motor_rpm INTEGER,
    motor_differential_psi INTEGER,
    
    -- Fatiga instantánea
    current_fatigue_percent DECIMAL(6, 3),
    
    PRIMARY KEY (time, job_id)
);

-- Hypertable para TimescaleDB
SELECT create_hypertable('ct_realtime_data', 'time', if_not_exists => TRUE);

-- Política de retención (30 días en detalle, luego agregado)
SELECT add_retention_policy('ct_realtime_data', INTERVAL '30 days');
```

### 4.2 Alarmas de CT

```sql
CREATE TABLE ct_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id),
    
    alarm_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alarm_type VARCHAR(30) NOT NULL,
    -- HIGH_WEIGHT, LOW_WEIGHT, HIGH_PRESSURE, FATIGUE_WARNING,
    -- LOCKUP_RISK, PUMP_FAILURE, GAS_DETECTED
    
    severity VARCHAR(10) NOT NULL,
    -- INFO, WARNING, CRITICAL
    
    parameter_name VARCHAR(50),
    parameter_value DECIMAL(12, 2),
    threshold_value DECIMAL(12, 2),
    
    message TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ct_alarms_job ON ct_alarms(job_id);
CREATE INDEX idx_ct_alarms_time ON ct_alarms(alarm_time);
```

---

## 5. Tablas de Unidades CT

### 5.1 Unidades de CT

```sql
CREATE TABLE ct_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Identificación
    unit_number VARCHAR(30) NOT NULL UNIQUE,
    unit_name VARCHAR(100),
    
    -- Especificaciones
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    
    -- Capacidades
    max_reel_od_inches DECIMAL(6, 2),
    max_tubing_od_inches DECIMAL(6, 3),
    injector_capacity_lbs INTEGER,
    max_speed_ft_min INTEGER,
    
    -- Bomba
    pump_type VARCHAR(50),
    pump_hp INTEGER,
    max_pressure_psi INTEGER,
    max_rate_bpm DECIMAL(6, 2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    -- AVAILABLE, IN_SERVICE, MAINTENANCE, OUT_OF_SERVICE
    
    current_location VARCHAR(100),
    
    -- Certificaciones
    last_inspection_date DATE,
    next_inspection_date DATE,
    certifications JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Job Tickets

### 6.1 Tickets de Trabajo

```sql
CREATE TABLE job_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id),
    
    -- Número de ticket
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    ticket_date DATE NOT NULL,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'DRAFT',
    -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
    
    -- Información del pozo
    well_name VARCHAR(100),
    well_location TEXT,
    client_name VARCHAR(100),
    
    -- Equipo usado
    unit_number VARCHAR(30),
    reel_number VARCHAR(30),
    ct_od_inches DECIMAL(6, 3),
    ct_length_ft DECIMAL(10, 2),
    
    -- Resumen de operación
    job_type VARCHAR(50),
    objective TEXT,
    result TEXT,
    
    -- Profundidades
    surface_depth_ft DECIMAL(10, 2),
    max_depth_ft DECIMAL(10, 2),
    tag_depth_ft DECIMAL(10, 2),
    
    -- Tiempos
    rig_up_time TIMESTAMPTZ,
    rig_down_time TIMESTAMPTZ,
    total_hours DECIMAL(6, 2),
    
    -- Fluidos totales
    fluids_summary JSONB,
    
    -- Firmas
    operator_name VARCHAR(100),
    operator_signature TEXT,
    client_representative VARCHAR(100),
    client_signature TEXT,
    supervisor_name VARCHAR(100),
    supervisor_signature TEXT,
    
    -- Aprobación
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- PDF generado
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_tickets_job ON job_tickets(job_id);
CREATE INDEX idx_job_tickets_number ON job_tickets(ticket_number);
```

---

## 7. Vistas

### 7.1 Resumen de Reels

```sql
CREATE VIEW reel_summary AS
SELECT 
    r.id,
    r.reel_number,
    r.od_inches,
    r.wall_thickness_inches,
    r.material_grade,
    r.current_length_ft,
    r.original_length_ft,
    ROUND((r.current_length_ft / r.original_length_ft) * 100, 1) as length_remaining_pct,
    r.current_max_fatigue_percent,
    r.max_fatigue_percent,
    r.status,
    r.total_jobs,
    r.total_footage_ft,
    r.current_location,
    u.unit_number as assigned_unit,
    r.next_inspection_date,
    CASE 
        WHEN r.current_max_fatigue_percent >= r.max_fatigue_percent THEN 'CRITICAL'
        WHEN r.current_max_fatigue_percent >= r.max_fatigue_percent * 0.9 THEN 'WARNING'
        ELSE 'OK'
    END as fatigue_status
FROM ct_reels r
LEFT JOIN ct_units u ON r.assigned_unit_id = u.id;
```

### 7.2 Resumen de Trabajos

```sql
CREATE VIEW job_summary AS
SELECT 
    j.id,
    j.job_number,
    j.job_type,
    j.status,
    w.well_name,
    w.well_code,
    r.reel_number,
    u.unit_number,
    j.planned_date,
    j.start_time,
    j.end_time,
    j.planned_depth_ft,
    j.max_depth_reached_ft,
    j.job_successful,
    EXTRACT(EPOCH FROM (j.end_time - j.start_time)) / 3600 as duration_hours
FROM ct_jobs j
JOIN wells w ON j.well_id = w.id
JOIN ct_reels r ON j.reel_id = r.id
LEFT JOIN ct_units u ON j.unit_id = u.id;
```

---

## 8. Funciones de Fatiga

### 8.1 Calcular Daño por Bending

```sql
CREATE OR REPLACE FUNCTION calculate_bending_damage(
    p_od_inches DECIMAL,
    p_wall_thickness DECIMAL,
    p_guide_radius_inches DECIMAL,
    p_yield_strength_psi INTEGER,
    p_pressure_psi INTEGER DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
    v_od_over_r DECIMAL;
    v_strain DECIMAL;
    v_cycles_to_failure INTEGER;
    v_damage DECIMAL;
BEGIN
    -- Calcular OD/R ratio
    v_od_over_r := p_od_inches / p_guide_radius_inches;
    
    -- Calcular strain (simplificado)
    v_strain := v_od_over_r / 2;
    
    -- Ciclos hasta falla (modelo simplificado basado en curvas S-N)
    -- En producción usar modelo completo con datos del fabricante
    v_cycles_to_failure := POWER(10, (4.5 - v_strain * 100));
    
    -- Daño por ciclo (Miner's Rule)
    v_damage := 1.0 / GREATEST(v_cycles_to_failure, 1);
    
    RETURN ROUND(v_damage, 10);
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Actualizar Fatiga del Reel

```sql
CREATE OR REPLACE FUNCTION update_reel_fatigue(p_reel_id UUID)
RETURNS VOID AS $$
DECLARE
    v_max_fatigue DECIMAL;
BEGIN
    -- Obtener máxima fatiga de todas las secciones
    SELECT MAX(combined_fatigue_percent) INTO v_max_fatigue
    FROM reel_sections
    WHERE reel_id = p_reel_id AND status != 'CUT';
    
    -- Actualizar el reel
    UPDATE ct_reels
    SET 
        current_max_fatigue_percent = COALESCE(v_max_fatigue, 0),
        updated_at = NOW()
    WHERE id = p_reel_id;
END;
$$ LANGUAGE plpgsql;
```

