-- ============================================================================
-- ARQUITECTURA DE MAPEO: Fuentes de Datos → Gemelos Digitales
-- Schema SQL para PostgreSQL
-- ============================================================================

-- ============================================================================
-- DEVICE PROFILES (Perfiles de tipo de dispositivo)
-- ============================================================================
CREATE TABLE device_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    code VARCHAR(50) NOT NULL,              -- CT_PLC_UNITRONICS, WELL_RTU
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Configuración de transporte
    transport_type VARCHAR(30) NOT NULL,    -- modbus, opcua, s7, ethernet_ip, mqtt
    transport_schema JSONB DEFAULT '{}',    -- Schema de configuración esperada
    
    -- Rule Chain por defecto para este tipo de dispositivo
    default_rule_chain_id UUID REFERENCES rules(id),
    
    -- Schema de telemetrías que este dispositivo puede enviar
    -- Ejemplo: { "pressure": { "type": "number", "unit": "psi" } }
    telemetry_schema JSONB NOT NULL DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- ============================================================================
-- ASSET TEMPLATES (Plantillas de gemelos digitales compuestos)
-- ============================================================================
CREATE TABLE asset_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    code VARCHAR(50) NOT NULL,              -- CT_UNIT_TEMPLATE, RIG_TEMPLATE
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Asset type raíz (el padre del gemelo compuesto)
    root_asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    
    -- Componentes que se crean automáticamente
    -- Ejemplo: [{ "code": "reel", "assetTypeCode": "CT_REEL", "name": "Carrete", "required": true }]
    components JSONB NOT NULL DEFAULT '[]',
    
    -- Relaciones entre componentes
    -- Ejemplo: [{ "from": "reel", "to": "root", "type": "INSTALLED_IN" }]
    relationships JSONB NOT NULL DEFAULT '[]',
    
    -- Configuraciones por defecto para los componentes
    default_properties JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- ============================================================================
-- CONNECTIVITY PROFILES (Perfiles de mapeo device → digital twin)
-- ============================================================================
CREATE TABLE connectivity_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    code VARCHAR(50) NOT NULL,              -- CT_UNIT_CONNECTIVITY
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Relaciones
    device_profile_id UUID NOT NULL REFERENCES device_profiles(id),
    asset_template_id UUID NOT NULL REFERENCES asset_templates(id),
    
    -- Rule chain específica para este perfil (opcional, override del device_profile)
    rule_chain_id UUID REFERENCES rules(id),
    
    -- Mapeos de telemetría: sourceKey → targetComponent.feature.property
    -- Ejemplo: [{ 
    --   "sourceKey": "reel_depth",
    --   "target": { "component": "reel", "feature": "telemetry", "property": "currentDepth" },
    --   "transform": null
    -- }]
    mappings JSONB NOT NULL DEFAULT '[]',
    
    -- Reglas de transformación post-mapeo
    post_transform_rules JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- ============================================================================
-- DIGITAL TWIN INSTANCES (Instancias de gemelos digitales creados)
-- ============================================================================
CREATE TABLE digital_twin_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Template usado (null si es simple sin template)
    asset_template_id UUID REFERENCES asset_templates(id),
    
    code VARCHAR(100) NOT NULL,             -- CT-UNIT-001
    name VARCHAR(200) NOT NULL,
    
    -- Thing ID raíz en Ditto
    root_thing_id VARCHAR(200) NOT NULL,    -- acme:ct_unit_001
    
    -- Thing IDs de componentes (cache para acceso rápido)
    -- Ejemplo: { "reel": "acme:ct_unit_001_reel", "pump": "acme:ct_unit_001_pump" }
    component_thing_ids JSONB NOT NULL DEFAULT '{}',
    
    status VARCHAR(30) DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code),
    UNIQUE(root_thing_id)
);

-- ============================================================================
-- DEVICE BINDINGS (Vinculaciones device → digital twin)
-- ============================================================================
CREATE TABLE device_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Data Source vinculada (dispositivo físico)
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    
    -- Digital Twin destino
    digital_twin_id UUID NOT NULL REFERENCES digital_twin_instances(id),
    
    -- Connectivity Profile a usar
    connectivity_profile_id UUID NOT NULL REFERENCES connectivity_profiles(id),
    
    -- Sobrescrituras de mapeo para esta instancia específica (opcional)
    custom_mappings JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    last_data_received_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un data source solo puede estar vinculado a un digital twin
    UNIQUE(data_source_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX idx_device_profiles_tenant ON device_profiles(tenant_id);
CREATE INDEX idx_device_profiles_code ON device_profiles(code);

CREATE INDEX idx_asset_templates_tenant ON asset_templates(tenant_id);
CREATE INDEX idx_asset_templates_code ON asset_templates(code);

CREATE INDEX idx_connectivity_profiles_tenant ON connectivity_profiles(tenant_id);
CREATE INDEX idx_connectivity_profiles_device ON connectivity_profiles(device_profile_id);
CREATE INDEX idx_connectivity_profiles_template ON connectivity_profiles(asset_template_id);

CREATE INDEX idx_digital_twin_instances_tenant ON digital_twin_instances(tenant_id);
CREATE INDEX idx_digital_twin_instances_template ON digital_twin_instances(asset_template_id);
CREATE INDEX idx_digital_twin_instances_thing ON digital_twin_instances(root_thing_id);

CREATE INDEX idx_device_bindings_tenant ON device_bindings(tenant_id);
CREATE INDEX idx_device_bindings_data_source ON device_bindings(data_source_id);
CREATE INDEX idx_device_bindings_twin ON device_bindings(digital_twin_id);
CREATE INDEX idx_device_bindings_connectivity ON device_bindings(connectivity_profile_id);
