-- =====================================================
-- MÓDULO COILED TUBING - MIGRACIÓN SIMPLIFICADA
-- =====================================================
-- Versión: 1.0
-- Fecha: 2026-01-12
-- Descripción: Tablas básicas para gestión de operaciones de Coiled Tubing

-- =====================================================
-- 1. CT UNITS (Unidades de Coiled Tubing)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identificación
    unit_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    year_manufactured INTEGER,
    
    -- Capacidades
    injector_capacity_lbs INTEGER NOT NULL,
    max_speed_ft_min INTEGER,
    pump_hp INTEGER,
    max_pressure_psi INTEGER,
    max_flow_rate_bpm DECIMAL(10,2),
    
    -- Estado operacional
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    location VARCHAR(200),
    
    -- Certificaciones
    last_inspection_date DATE,
    next_inspection_date DATE,
    certification_status VARCHAR(20) DEFAULT 'VALID',
    
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

-- =====================================================
-- 2. CT REELS (Carretes de Coiled Tubing)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES ct_units(id) ON DELETE CASCADE,
    
    -- Identificación
    reel_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Especificaciones del tubing
    outer_diameter_in DECIMAL(5,3) NOT NULL,
    wall_thickness_in DECIMAL(5,4) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    length_ft INTEGER NOT NULL,
    weight_lbs INTEGER,
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    current_length_ft INTEGER,
    fatigue_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Fechas importantes
    manufacture_date DATE,
    last_inspection_date DATE,
    next_inspection_date DATE,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT ct_reels_tenant_reel_unique UNIQUE(tenant_id, reel_number),
    CONSTRAINT ct_reels_status_check CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'))
);

CREATE INDEX idx_ct_reels_tenant ON ct_reels(tenant_id);
CREATE INDEX idx_ct_reels_unit ON ct_reels(unit_id);
CREATE INDEX idx_ct_reels_status ON ct_reels(status);

-- =====================================================
-- 3. CT JOBS (Trabajos de Coiled Tubing)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES ct_units(id),
    reel_id UUID REFERENCES ct_reels(id),
    
    -- Identificación
    job_number VARCHAR(50) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    well_name VARCHAR(100),
    field_name VARCHAR(100),
    
    -- Fechas
    planned_start_date TIMESTAMPTZ,
    actual_start_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    
    -- Personal
    supervisor VARCHAR(100),
    operator VARCHAR(100),
    
    -- Observaciones
    description TEXT,
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT ct_jobs_tenant_job_unique UNIQUE(tenant_id, job_number),
    CONSTRAINT ct_jobs_status_check CHECK (status IN ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_ct_jobs_tenant ON ct_jobs(tenant_id);
CREATE INDEX idx_ct_jobs_unit ON ct_jobs(unit_id);
CREATE INDEX idx_ct_jobs_status ON ct_jobs(status);
CREATE INDEX idx_ct_jobs_dates ON ct_jobs(actual_start_date, actual_end_date);

-- =====================================================
-- 4. CT REEL SECTIONS (Secciones de Reel)
-- =====================================================

CREATE TABLE IF NOT EXISTS ct_reel_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reel_id UUID NOT NULL REFERENCES ct_reels(id) ON DELETE CASCADE,
    
    section_number INTEGER NOT NULL,
    start_depth_ft INTEGER NOT NULL,
    end_depth_ft INTEGER NOT NULL,
    length_ft INTEGER NOT NULL,
    fatigue_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'GOOD',
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ct_reel_sections_unique UNIQUE(reel_id, section_number),
    CONSTRAINT ct_reel_sections_status_check CHECK (status IN ('GOOD', 'WARNING', 'CRITICAL', 'RETIRED'))
);

CREATE INDEX idx_ct_reel_sections_reel ON ct_reel_sections(reel_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_ct_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ct_units_updated_at
    BEFORE UPDATE ON ct_units
    FOR EACH ROW EXECUTE FUNCTION update_ct_updated_at();

CREATE TRIGGER update_ct_reels_updated_at
    BEFORE UPDATE ON ct_reels
    FOR EACH ROW EXECUTE FUNCTION update_ct_updated_at();

CREATE TRIGGER update_ct_jobs_updated_at
    BEFORE UPDATE ON ct_jobs
    FOR EACH ROW EXECUTE FUNCTION update_ct_updated_at();

CREATE TRIGGER update_ct_reel_sections_updated_at
    BEFORE UPDATE ON ct_reel_sections
    FOR EACH ROW EXECUTE FUNCTION update_ct_updated_at();
