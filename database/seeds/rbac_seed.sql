-- Seed de RBAC: Roles y Permisos
-- Fecha: 2026-01-10

-- Obtener tenant_id de ACME Petroleum
DO $$
DECLARE
    v_tenant_id UUID;
    v_admin_role_id UUID;
    v_engineer_role_id UUID;
    v_operator_role_id UUID;
    v_viewer_role_id UUID;
    v_admin_user_id UUID;
BEGIN
    -- Obtener tenant_id
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'ACME Petroleum' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ACME Petroleum no encontrado';
    END IF;

    -- Obtener admin user_id
    SELECT id INTO v_admin_user_id FROM users WHERE email = 'admin@acme-petroleum.com' LIMIT 1;

    -- ============================================================================
    -- ROLES
    -- ============================================================================
    
    -- Admin Role
    INSERT INTO roles (id, tenant_id, name, code, description, is_system, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'Administrador', 'admin', 'Acceso completo al sistema', true, true)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_admin_role_id;

    -- Engineer Role
    INSERT INTO roles (id, tenant_id, name, code, description, is_system, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'Ingeniero', 'engineer', 'Operaciones técnicas y análisis', true, true)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_engineer_role_id;

    -- Operator Role
    INSERT INTO roles (id, tenant_id, name, code, description, is_system, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'Operador', 'operator', 'Operaciones de campo', true, true)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_operator_role_id;

    -- Viewer Role
    INSERT INTO roles (id, tenant_id, name, code, description, is_system, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'Visualizador', 'viewer', 'Solo lectura', true, true)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_viewer_role_id;

    -- ============================================================================
    -- PERMISSIONS
    -- ============================================================================
    
    -- Assets/Digital Twins
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('assets:create', 'Crear Assets', 'Crear nuevos assets/digital twins', 'assets', 'create', 'infrastructure', 'assets', true, true),
        ('assets:read', 'Leer Assets', 'Ver assets/digital twins', 'assets', 'read', 'infrastructure', 'assets', true, true),
        ('assets:update', 'Actualizar Assets', 'Modificar assets/digital twins', 'assets', 'update', 'infrastructure', 'assets', true, true),
        ('assets:delete', 'Eliminar Assets', 'Eliminar assets/digital twins', 'assets', 'delete', 'infrastructure', 'assets', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- Data Sources
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('data-sources:create', 'Crear Fuentes de Datos', 'Crear nuevas fuentes de datos', 'data-sources', 'create', 'edge', 'data-sources', true, true),
        ('data-sources:read', 'Leer Fuentes de Datos', 'Ver fuentes de datos', 'data-sources', 'read', 'edge', 'data-sources', true, true),
        ('data-sources:update', 'Actualizar Fuentes de Datos', 'Modificar fuentes de datos', 'data-sources', 'update', 'edge', 'data-sources', true, true),
        ('data-sources:delete', 'Eliminar Fuentes de Datos', 'Eliminar fuentes de datos', 'data-sources', 'delete', 'edge', 'data-sources', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- Edge Gateways
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('edge-gateways:create', 'Crear Edge Gateways', 'Registrar nuevos edge gateways', 'edge-gateways', 'create', 'edge', 'gateways', true, true),
        ('edge-gateways:read', 'Leer Edge Gateways', 'Ver edge gateways', 'edge-gateways', 'read', 'edge', 'gateways', true, true),
        ('edge-gateways:update', 'Actualizar Edge Gateways', 'Modificar edge gateways', 'edge-gateways', 'update', 'edge', 'gateways', true, true),
        ('edge-gateways:delete', 'Eliminar Edge Gateways', 'Eliminar edge gateways', 'edge-gateways', 'delete', 'edge', 'gateways', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- Wells
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('wells:create', 'Crear Pozos', 'Crear nuevos pozos', 'wells', 'create', 'wells', 'wells', true, true),
        ('wells:read', 'Leer Pozos', 'Ver pozos', 'wells', 'read', 'wells', 'wells', true, true),
        ('wells:update', 'Actualizar Pozos', 'Modificar pozos', 'wells', 'update', 'wells', 'wells', true, true),
        ('wells:delete', 'Eliminar Pozos', 'Eliminar pozos', 'wells', 'delete', 'wells', 'wells', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- Digital Twins (Ditto)
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('digital-twins:create', 'Crear Digital Twins', 'Crear nuevos digital twins', 'digital-twins', 'create', 'infrastructure', 'digital-twins', true, true),
        ('digital-twins:read', 'Leer Digital Twins', 'Ver digital twins', 'digital-twins', 'read', 'infrastructure', 'digital-twins', true, true),
        ('digital-twins:update', 'Actualizar Digital Twins', 'Modificar digital twins', 'digital-twins', 'update', 'infrastructure', 'digital-twins', true, true),
        ('digital-twins:delete', 'Eliminar Digital Twins', 'Eliminar digital twins', 'digital-twins', 'delete', 'infrastructure', 'digital-twins', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- Coiled Tubing
    INSERT INTO permissions (code, name, description, resource, action, module, category, is_system, is_active)
    VALUES 
        ('coiled-tubing:create', 'Crear Coiled Tubing', 'Crear unidades, reels y jobs de CT', 'coiled-tubing', 'create', 'coiled-tubing', 'operations', true, true),
        ('coiled-tubing:read', 'Leer Coiled Tubing', 'Ver unidades, reels y jobs de CT', 'coiled-tubing', 'read', 'coiled-tubing', 'operations', true, true),
        ('coiled-tubing:update', 'Actualizar Coiled Tubing', 'Modificar unidades, reels y jobs de CT', 'coiled-tubing', 'update', 'coiled-tubing', 'operations', true, true),
        ('coiled-tubing:delete', 'Eliminar Coiled Tubing', 'Eliminar unidades, reels y jobs de CT', 'coiled-tubing', 'delete', 'coiled-tubing', 'operations', true, true),
        ('coiled-tubing:execute', 'Ejecutar Operaciones CT', 'Iniciar/completar jobs y gestionar alarmas', 'coiled-tubing', 'execute', 'coiled-tubing', 'operations', true, true)
    ON CONFLICT (code) DO NOTHING;

    -- ============================================================================
    -- ROLE-PERMISSION ASSIGNMENTS
    -- ============================================================================
    
    -- Admin: Todos los permisos
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Engineer: Lectura/escritura en módulos técnicos
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_engineer_role_id, id FROM permissions
    WHERE code IN (
        'assets:read', 'assets:update',
        'data-sources:read', 'data-sources:update',
        'edge-gateways:read',
        'wells:read', 'wells:update',
        'digital-twins:read', 'digital-twins:update',
        'coiled-tubing:read', 'coiled-tubing:create', 'coiled-tubing:update', 'coiled-tubing:execute'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Operator: Lectura en la mayoría, escritura limitada
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_operator_role_id, id FROM permissions
    WHERE code IN (
        'assets:read',
        'data-sources:read',
        'edge-gateways:read',
        'wells:read',
        'digital-twins:read',
        'coiled-tubing:read', 'coiled-tubing:execute'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Viewer: Solo lectura
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, id FROM permissions
    WHERE action = 'read'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- ============================================================================
    -- USER-ROLE ASSIGNMENTS
    -- ============================================================================
    
    -- Asignar rol admin al usuario admin
    IF v_admin_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, granted_by)
        VALUES (v_admin_user_id, v_admin_role_id, v_admin_user_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'RBAC seed completado exitosamente';
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Admin Role ID: %', v_admin_role_id;
    RAISE NOTICE 'Admin User ID: %', v_admin_user_id;
END $$;
