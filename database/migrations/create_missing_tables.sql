-- Crear tablas faltantes para RBAC y Edge Gateway
-- Fecha: 2026-01-10

-- ============================================================================
-- RBAC Tables
-- ============================================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    field VARCHAR(100),
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Role-Permission assignments
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- User-Role assignments
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- User-Permission direct assignments (exceptions)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    reason TEXT,
    UNIQUE(user_id, permission_id)
);

-- Access logs (audit trail)
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100),
    granted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Edge Gateway Tables
-- ============================================================================

-- Edge Gateways table
CREATE TABLE IF NOT EXISTS edge_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gateway_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    site_name VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    version VARCHAR(50),
    config_version INTEGER NOT NULL DEFAULT 1,
    last_heartbeat TIMESTAMP,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, gateway_id)
);

-- Data Sources table
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    edge_gateway_id UUID NOT NULL REFERENCES edge_gateways(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    protocol VARCHAR(50) NOT NULL,
    connection_config JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    scan_rate INTEGER NOT NULL DEFAULT 5000,
    last_successful_read TIMESTAMP,
    last_error TEXT,
    error_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, edge_gateway_id, name)
);

-- Data Source Tags table
CREATE TABLE IF NOT EXISTS data_source_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    tag_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    asset_id UUID,
    telemetry_key VARCHAR(100),
    protocol_config JSONB NOT NULL,
    unit VARCHAR(50),
    scan_rate INTEGER,
    deadband DOUBLE PRECISION,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_value DOUBLE PRECISION,
    last_quality VARCHAR(20),
    last_read TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(data_source_id, tag_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- RBAC Indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_tenant_id ON access_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);

-- Edge Gateway Indexes
CREATE INDEX IF NOT EXISTS idx_edge_gateways_tenant_id ON edge_gateways(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edge_gateways_gateway_id ON edge_gateways(gateway_id);
CREATE INDEX IF NOT EXISTS idx_edge_gateways_status ON edge_gateways(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_tenant_id ON data_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_edge_gateway_id ON data_sources(edge_gateway_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_protocol ON data_sources(protocol);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_source_tags_data_source_id ON data_source_tags(data_source_id);
CREATE INDEX IF NOT EXISTS idx_data_source_tags_asset_id ON data_source_tags(asset_id);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE roles IS 'Roles para control de acceso basado en roles (RBAC)';
COMMENT ON TABLE permissions IS 'Permisos granulares del sistema';
COMMENT ON TABLE role_permissions IS 'Asignación de permisos a roles';
COMMENT ON TABLE user_roles IS 'Asignación de roles a usuarios';
COMMENT ON TABLE user_permissions IS 'Permisos directos a usuarios (excepciones)';
COMMENT ON TABLE access_logs IS 'Registro de auditoría de accesos';
COMMENT ON TABLE edge_gateways IS 'Edge Gateways registrados en el sistema';
COMMENT ON TABLE data_sources IS 'Fuentes de datos (PLCs, sensores) configuradas';
COMMENT ON TABLE data_source_tags IS 'Tags configurados para cada fuente de datos';
