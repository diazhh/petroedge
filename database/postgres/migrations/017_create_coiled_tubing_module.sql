-- =====================================================
-- MÓDULO COILED TUBING - MIGRACIÓN DE BASE DE DATOS
-- =====================================================
-- Versión: 1.0
-- Fecha: 2026-01-12
-- Descripción: Tablas para gestión de operaciones de Coiled Tubing

-- =====================================================
-- 1. CT UNITS (Unidades de Coiled Tubing)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- Digital Twin
    
    -- Identificación
    unit_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    year_manufactured INTEGER,
    
    -- Capacidades
    injector_capacity_lbs INTEGER NOT NULL, -- 40K, 60K, 80K, 100K
    max_speed_ft_min INTEGER, -- Velocidad máxima ft/min
    pump_hp INTEGER, -- Potencia de bomba
    max_pressure_psi INTEGER, -- Presión máxima
    max_flow_rate_bpm DECIMAL(10,2), -- Barrels per minute
    
    -- Estado operacional
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_SERVICE, MAINTENANCE, OUT_OF_SERVICE
    location VARCHAR(200), -- Ubicación actual
    current_job_id UUID, -- Job actual (FK agregado después)
    
    -- Certificaciones
    last_inspection_date DATE,
    next_inspection_date DATE,
    certification_status VARCHAR(20) DEFAULT 'VALID', -- VALID, EXPIRED, PENDING
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT ct_units_tenant_unit_unique UNIQUE(tenant_id, unit_number),
    CONSTRAINT ct_units_status_check CHECK (status IN ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'OUT_OF_SERVICE')),
    CONSTRAINT ct_units_cert_check CHECK (certification_status IN ('VALID', 'EXPIRED', 'PENDING'))
);

CREATE INDEX idx_ct_units_tenant ON ct_units(tenant_id);
CREATE INDEX idx_ct_units_status ON ct_units(status);
CREATE INDEX idx_ct_units_asset ON ct_units(asset_id);

COMMENT ON TABLE ct_units IS 'Unidades de Coiled Tubing con sus capacidades y estado';

-- =====================================================
-- 2. CT REELS (Carretes de Tubería)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- Digital Twin
    ct_unit_id UUID REFERENCES ct_units(id) ON DELETE SET NULL,
    
    -- Identificación
    reel_number VARCHAR(50) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    
    -- Especificaciones del tubing
    outer_diameter_in DECIMAL(5,3) NOT NULL, -- 1.25, 1.50, 1.75, 2.00, 2.375
    wall_thickness_in DECIMAL(5,4) NOT NULL,
    inner_diameter_in DECIMAL(5,3) NOT NULL,
    steel_grade VARCHAR(20) NOT NULL, -- CT70, CT80, CT90, CT100, CT110
    yield_strength_psi INTEGER NOT NULL, -- 70000, 80000, 90000, 100000, 110000
    
    -- Dimensiones
    total_length_ft INTEGER NOT NULL,
    usable_length_ft INTEGER NOT NULL, -- Después de cortes
    weight_per_ft_lbs DECIMAL(6,3),
    
    -- Estado de fatiga
    fatigue_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0-100%
    total_cycles INTEGER DEFAULT 0,
    total_pressure_cycles INTEGER DEFAULT 0,
    last_fatigue_calculation TIMESTAMPTZ,
    
    -- Historial
    manufacture_date DATE,
    first_use_date DATE,
    last_cut_date DATE,
    cut_history_ft INTEGER DEFAULT 0, -- Total cortado
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, IN_USE, MAINTENANCE, RETIRED
    condition VARCHAR(20) DEFAULT 'GOOD', -- GOOD, FAIR, POOR, CRITICAL
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT ct_reels_tenant_reel_unique UNIQUE(tenant_id, reel_number),
    CONSTRAINT ct_reels_status_check CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED')),
    CONSTRAINT ct_reels_condition_check CHECK (condition IN ('GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    CONSTRAINT ct_reels_grade_check CHECK (steel_grade IN ('CT70', 'CT80', 'CT90', 'CT100', 'CT110'))
);

CREATE INDEX idx_ct_reels_tenant ON ct_reels(tenant_id);
CREATE INDEX idx_ct_reels_unit ON ct_reels(ct_unit_id);
CREATE INDEX idx_ct_reels_status ON ct_reels(status);
CREATE INDEX idx_ct_reels_fatigue ON ct_reels(fatigue_percentage);

COMMENT ON TABLE ct_reels IS 'Carretes de tubería continua con tracking de fatiga';

-- =====================================================
-- 3. REEL SECTIONS (Secciones de Carrete)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_reel_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES ct_reels(id) ON DELETE CASCADE,
    
    -- Definición de sección
    section_number INTEGER NOT NULL,
    start_depth_ft INTEGER NOT NULL,
    end_depth_ft INTEGER NOT NULL,
    length_ft INTEGER NOT NULL,
    
    -- Fatiga acumulada
    fatigue_percentage DECIMAL(5,2) DEFAULT 0.00,
    bending_cycles INTEGER DEFAULT 0,
    pressure_cycles INTEGER DEFAULT 0,
    combined_damage DECIMAL(8,6) DEFAULT 0.000000, -- Miner's Rule
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, WARNING, CRITICAL, CUT
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT ct_reel_sections_unique UNIQUE(reel_id, section_number),
    CONSTRAINT ct_reel_sections_status_check CHECK (status IN ('ACTIVE', 'WARNING', 'CRITICAL', 'CUT'))
);

CREATE INDEX idx_ct_reel_sections_reel ON ct_reel_sections(reel_id);
CREATE INDEX idx_ct_reel_sections_status ON ct_reel_sections(status);

COMMENT ON TABLE ct_reel_sections IS 'Secciones de carrete para tracking granular de fatiga';

-- =====================================================
-- 4. CT JOBS (Trabajos de Coiled Tubing)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identificación
    job_number VARCHAR(50) NOT NULL,
    job_type VARCHAR(10) NOT NULL, -- CLN, N2L, ACT, CMS, FSH, LOG, PER, MIL, CTD
    
    -- Relaciones
    well_id UUID REFERENCES wells(id) ON DELETE SET NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    ct_unit_id UUID REFERENCES ct_units(id) ON DELETE SET NULL,
    ct_reel_id UUID REFERENCES ct_reels(id) ON DELETE SET NULL,
    
    -- Cliente
    client_name VARCHAR(200),
    client_contact VARCHAR(200),
    
    -- Planificación
    planned_start_date DATE,
    planned_end_date DATE,
    estimated_duration_hours DECIMAL(6,2),
    
    -- Ejecución
    actual_start_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    actual_duration_hours DECIMAL(6,2),
    
    -- Profundidades
    planned_depth_ft INTEGER,
    max_depth_reached_ft INTEGER,
    tag_depth_ft INTEGER,
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PLANNED, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED, SUSPENDED
    
    -- Objetivos y resultados
    objectives TEXT,
    results TEXT,
    observations TEXT,
    
    -- NPT (Non-Productive Time)
    npt_hours DECIMAL(6,2) DEFAULT 0,
    npt_reason TEXT,
    
    -- Costos
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    
    -- HSE
    hse_incidents INTEGER DEFAULT 0,
    safety_observations TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    CONSTRAINT ct_jobs_tenant_job_unique UNIQUE(tenant_id, job_number),
    CONSTRAINT ct_jobs_status_check CHECK (status IN ('DRAFT', 'PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED')),
    CONSTRAINT ct_jobs_type_check CHECK (job_type IN ('CLN', 'N2L', 'ACT', 'CMS', 'FSH', 'LOG', 'PER', 'MIL', 'CTD'))
);

CREATE INDEX idx_ct_jobs_tenant ON ct_jobs(tenant_id);
CREATE INDEX idx_ct_jobs_well ON ct_jobs(well_id);
CREATE INDEX idx_ct_jobs_unit ON ct_jobs(ct_unit_id);
CREATE INDEX idx_ct_jobs_status ON ct_jobs(status);
CREATE INDEX idx_ct_jobs_dates ON ct_jobs(actual_start_date, actual_end_date);

COMMENT ON TABLE ct_jobs IS 'Trabajos de intervención con Coiled Tubing';

-- Agregar FK de current_job_id en ct_units
ALTER TABLE ct_units ADD CONSTRAINT fk_ct_units_current_job 
    FOREIGN KEY (current_job_id) REFERENCES ct_jobs(id) ON DELETE SET NULL;

-- =====================================================
-- 5. CT JOB OPERATIONS (Operaciones del Job)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_job_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Secuencia
    sequence_number INTEGER NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- RIH, POOH, CIRCULATE, PUMP, PRESSURE_TEST, etc.
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Parámetros
    start_depth_ft INTEGER,
    end_depth_ft INTEGER,
    max_weight_lbs INTEGER,
    max_pressure_psi INTEGER,
    pump_rate_bpm DECIMAL(6,2),
    
    -- Descripción
    description TEXT,
    observations TEXT,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, ABORTED
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_job_operations_unique UNIQUE(job_id, sequence_number),
    CONSTRAINT ct_job_operations_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABORTED'))
);

CREATE INDEX idx_ct_job_operations_job ON ct_job_operations(job_id);
CREATE INDEX idx_ct_job_operations_time ON ct_job_operations(start_time);

COMMENT ON TABLE ct_job_operations IS 'Registro cronológico de operaciones durante un job';

-- =====================================================
-- 6. CT JOB FLUIDS (Fluidos Bombeados)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_job_fluids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Secuencia
    sequence_number INTEGER NOT NULL,
    
    -- Tipo de fluido
    fluid_type VARCHAR(50) NOT NULL, -- ACID, BRINE, DIESEL, N2, SPACER, etc.
    fluid_name VARCHAR(100),
    density_ppg DECIMAL(5,2),
    viscosity_cp DECIMAL(6,2),
    
    -- Volúmenes
    planned_volume_bbl DECIMAL(10,2),
    actual_volume_bbl DECIMAL(10,2),
    
    -- Parámetros de bombeo
    pump_rate_bpm DECIMAL(6,2),
    pump_pressure_psi INTEGER,
    
    -- Timing
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Observaciones
    observations TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_job_fluids_unique UNIQUE(job_id, sequence_number)
);

CREATE INDEX idx_ct_job_fluids_job ON ct_job_fluids(job_id);

COMMENT ON TABLE ct_job_fluids IS 'Fluidos bombeados durante el job';

-- =====================================================
-- 7. CT JOB BHA (Bottom Hole Assembly)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_job_bha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Configuración
    bha_config_name VARCHAR(100),
    total_length_ft DECIMAL(8,2),
    total_weight_lbs DECIMAL(10,2),
    
    -- Descripción
    description TEXT,
    schematic_url VARCHAR(500), -- URL a diagrama
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ct_job_bha_job ON ct_job_bha(job_id);

COMMENT ON TABLE ct_job_bha IS 'Configuración de BHA para el job';

-- =====================================================
-- 8. CT BHA COMPONENTS (Componentes del BHA)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_bha_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bha_id UUID NOT NULL REFERENCES ct_job_bha(id) ON DELETE CASCADE,
    
    -- Posición
    sequence_number INTEGER NOT NULL,
    
    -- Componente
    component_type VARCHAR(50) NOT NULL, -- NOZZLE, JAR, MOTOR, MILL, PERFORATOR, etc.
    component_name VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Dimensiones
    length_ft DECIMAL(6,2),
    outer_diameter_in DECIMAL(5,3),
    inner_diameter_in DECIMAL(5,3),
    weight_lbs DECIMAL(8,2),
    
    -- Especificaciones
    specifications JSONB,
    
    CONSTRAINT ct_bha_components_unique UNIQUE(bha_id, sequence_number)
);

CREATE INDEX idx_ct_bha_components_bha ON ct_bha_components(bha_id);

COMMENT ON TABLE ct_bha_components IS 'Componentes individuales del BHA';

-- =====================================================
-- 9. CT JOB TICKETS (Documentación Oficial)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_job_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    
    -- Identificación
    ticket_number VARCHAR(50) NOT NULL,
    
    -- Contenido
    summary TEXT,
    operations_summary TEXT,
    fluids_summary TEXT,
    results_summary TEXT,
    
    -- Firmas digitales
    operator_signature VARCHAR(200),
    operator_signed_at TIMESTAMPTZ,
    supervisor_signature VARCHAR(200),
    supervisor_signed_at TIMESTAMPTZ,
    client_signature VARCHAR(200),
    client_signed_at TIMESTAMPTZ,
    
    -- PDF generado
    pdf_url VARCHAR(500),
    pdf_generated_at TIMESTAMPTZ,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, PENDING_SIGNATURES, COMPLETED
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_job_tickets_job_unique UNIQUE(job_id),
    CONSTRAINT ct_job_tickets_status_check CHECK (status IN ('DRAFT', 'PENDING_SIGNATURES', 'COMPLETED'))
);

CREATE INDEX idx_ct_job_tickets_job ON ct_job_tickets(job_id);
CREATE INDEX idx_ct_job_tickets_status ON ct_job_tickets(status);

COMMENT ON TABLE ct_job_tickets IS 'Job tickets oficiales con firmas digitales';

-- =====================================================
-- 10. FATIGUE CYCLES (Ciclos de Fatiga)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_fatigue_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID NOT NULL REFERENCES ct_reels(id) ON DELETE CASCADE,
    section_id UUID REFERENCES ct_reel_sections(id) ON DELETE CASCADE,
    job_id UUID REFERENCES ct_jobs(id) ON DELETE SET NULL,
    
    -- Tipo de ciclo
    cycle_type VARCHAR(20) NOT NULL, -- BENDING, PRESSURE, COMBINED
    
    -- Parámetros del ciclo
    max_strain DECIMAL(8,6), -- Para bending
    max_pressure_psi INTEGER, -- Para pressure
    guide_radius_in DECIMAL(6,2), -- Radio de guía
    
    -- Daño calculado
    cycles_applied INTEGER DEFAULT 1,
    cycles_to_failure INTEGER,
    damage_ratio DECIMAL(10,8), -- ni/Ni
    
    -- Timestamp
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_fatigue_cycles_type_check CHECK (cycle_type IN ('BENDING', 'PRESSURE', 'COMBINED'))
);

CREATE INDEX idx_ct_fatigue_cycles_reel ON ct_fatigue_cycles(reel_id);
CREATE INDEX idx_ct_fatigue_cycles_section ON ct_fatigue_cycles(section_id);
CREATE INDEX idx_ct_fatigue_cycles_job ON ct_fatigue_cycles(job_id);
CREATE INDEX idx_ct_fatigue_cycles_time ON ct_fatigue_cycles(occurred_at);

COMMENT ON TABLE ct_fatigue_cycles IS 'Registro de ciclos de fatiga para tracking detallado';

-- =====================================================
-- 11. CT ALARMS (Alarmas Operacionales)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID REFERENCES ct_jobs(id) ON DELETE CASCADE,
    ct_unit_id UUID REFERENCES ct_units(id) ON DELETE SET NULL,
    
    -- Tipo de alarma
    alarm_type VARCHAR(50) NOT NULL, -- OVERPULL, OVERPRESSURE, FATIGUE_WARNING, LOCKUP_RISK, etc.
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Detalles
    message TEXT NOT NULL,
    parameter_name VARCHAR(100),
    parameter_value DECIMAL(12,4),
    threshold_value DECIMAL(12,4),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamp
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_alarms_severity_check CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ct_alarms_status_check CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'))
);

CREATE INDEX idx_ct_alarms_tenant ON ct_alarms(tenant_id);
CREATE INDEX idx_ct_alarms_job ON ct_alarms(job_id);
CREATE INDEX idx_ct_alarms_unit ON ct_alarms(ct_unit_id);
CREATE INDEX idx_ct_alarms_status ON ct_alarms(status);
CREATE INDEX idx_ct_alarms_severity ON ct_alarms(severity);
CREATE INDEX idx_ct_alarms_time ON ct_alarms(triggered_at);

COMMENT ON TABLE ct_alarms IS 'Alarmas operacionales durante jobs de CT';

-- =====================================================
-- 12. CT REALTIME DATA (TimescaleDB Hypertable)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_realtime_data (
    time TIMESTAMPTZ NOT NULL,
    job_id UUID NOT NULL REFERENCES ct_jobs(id) ON DELETE CASCADE,
    ct_unit_id UUID NOT NULL REFERENCES ct_units(id) ON DELETE CASCADE,
    
    -- Profundidad y posición
    depth_ft DECIMAL(10,2),
    speed_ft_min DECIMAL(8,2),
    
    -- Fuerzas
    surface_weight_lbs INTEGER,
    hookload_lbs INTEGER,
    
    -- Presiones
    pump_pressure_psi INTEGER,
    annulus_pressure_psi INTEGER,
    downhole_pressure_psi INTEGER,
    
    -- Bombeo
    pump_rate_bpm DECIMAL(6,2),
    pump_strokes_per_min INTEGER,
    total_volume_pumped_bbl DECIMAL(10,2),
    
    -- Inyector
    injector_speed_ft_min DECIMAL(6,2),
    injector_force_lbs INTEGER,
    
    -- Temperatura
    surface_temp_f DECIMAL(5,2),
    downhole_temp_f DECIMAL(5,2),
    
    -- Estado
    operation_mode VARCHAR(50), -- RIH, POOH, CIRCULATING, IDLE
    
    PRIMARY KEY (time, job_id, ct_unit_id)
);

-- Convertir a hypertable de TimescaleDB
SELECT create_hypertable('ct_realtime_data', 'time', if_not_exists => TRUE);

-- Índices adicionales
CREATE INDEX idx_ct_realtime_job ON ct_realtime_data(job_id, time DESC);
CREATE INDEX idx_ct_realtime_unit ON ct_realtime_data(ct_unit_id, time DESC);

COMMENT ON TABLE ct_realtime_data IS 'Datos en tiempo real de operaciones CT (TimescaleDB)';

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ct_units_updated_at BEFORE UPDATE ON ct_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ct_reels_updated_at BEFORE UPDATE ON ct_reels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ct_jobs_updated_at BEFORE UPDATE ON ct_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ct_job_bha_updated_at BEFORE UPDATE ON ct_job_bha
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ct_job_tickets_updated_at BEFORE UPDATE ON ct_job_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANTS (Ajustar según roles existentes)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO scadaerp_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scadaerp_app;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
