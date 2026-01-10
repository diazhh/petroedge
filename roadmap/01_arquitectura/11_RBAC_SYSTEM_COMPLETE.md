# SISTEMA RBAC COMPLETO - ROLES Y PERMISOS GRANULARES

**Fecha**: 2026-01-10  
**Estado**: ⚪ Propuesta  
**Prioridad**: CRÍTICA

---

## 1. Visión General

Implementar un sistema RBAC (Role-Based Access Control) completo con permisos granulares que permita control fino sobre recursos, acciones y campos específicos.

### Objetivos

1. **Roles predefinidos** con permisos por defecto
2. **Permisos granulares** a nivel de módulo, recurso, acción y campo
3. **Permisos dinámicos** configurables por tenant
4. **Herencia de permisos** por jerarquía de roles
5. **Auditoría completa** de accesos y cambios

---

## 2. Modelo de Datos

### 2.1 Tablas Nuevas

```sql
-- Roles (predefinidos y custom)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  parent_role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Permisos (granulares)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  action VARCHAR(50),
  field VARCHAR(50),
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Asignación roles-permisos
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Asignación usuarios-roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- Permisos directos a usuarios (excepciones)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  reason TEXT,
  UNIQUE(user_id, permission_id)
);

-- Auditoría de accesos
CREATE TABLE access_logs (
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
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user ON access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_logs_resource ON access_logs(resource_type, resource_id);
```

---

## 3. Estructura de Permisos

### 3.1 Formato de Código de Permiso

```
{module}:{action}[:{resource}[:{field}]]
```

**Ejemplos**:
- `wells:read` - Leer pozos
- `wells:create` - Crear pozos
- `wells:update:status` - Actualizar solo campo status
- `wells:delete` - Eliminar pozos
- `well-testing:read:payroll` - Leer campo payroll en well testing
- `drilling:execute:kill-sheet` - Ejecutar kill sheet
- `admin:manage:users` - Gestionar usuarios (admin)

### 3.2 Acciones Estándar

| Acción | Descripción | Nivel |
|--------|-------------|-------|
| `read` | Ver/listar recursos | Básico |
| `create` | Crear nuevos recursos | Básico |
| `update` | Modificar recursos existentes | Básico |
| `delete` | Eliminar recursos | Básico |
| `execute` | Ejecutar operaciones especiales | Avanzado |
| `approve` | Aprobar cambios/operaciones | Workflow |
| `export` | Exportar datos | Datos |
| `import` | Importar datos | Datos |
| `manage` | Gestión completa (admin) | Admin |

### 3.3 Módulos del Sistema

```typescript
const MODULES = {
  // Core
  'auth': 'Autenticación y Autorización',
  'users': 'Gestión de Usuarios',
  'tenants': 'Gestión de Tenants',
  
  // Infraestructura
  'assets': 'Activos (Digital Twins)',
  'rules': 'Motor de Reglas',
  'alarms': 'Alarmas y Eventos',
  'telemetry': 'Telemetría',
  
  // Yacimientos
  'basins': 'Cuencas',
  'fields': 'Campos',
  'reservoirs': 'Yacimientos',
  'wells': 'Pozos',
  
  // Operaciones
  'well-testing': 'Pruebas de Pozo',
  'drilling': 'Perforación',
  'coiled-tubing': 'Coiled Tubing',
  'production': 'Producción',
  
  // ERP
  'inventory': 'Inventario',
  'finance': 'Finanzas',
  'hr': 'Recursos Humanos',
  'maintenance': 'Mantenimiento',
  
  // Admin
  'admin': 'Administración del Sistema',
  'reports': 'Reportes',
  'dashboards': 'Dashboards',
};
```

---

## 4. Roles Predefinidos

### 4.1 Roles del Sistema

```typescript
const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    code: 'super_admin',
    name: 'Super Administrador',
    description: 'Acceso completo al sistema',
    permissions: ['*:*'], // Wildcard - todos los permisos
  },
  
  ADMIN: {
    code: 'admin',
    name: 'Administrador',
    description: 'Administrador de tenant',
    permissions: [
      'users:*',
      'roles:*',
      'assets:*',
      'wells:*',
      'fields:*',
      'basins:*',
      'reservoirs:*',
      'reports:*',
      'dashboards:*',
    ],
  },
  
  ENGINEER: {
    code: 'engineer',
    name: 'Ingeniero',
    description: 'Ingeniero de operaciones',
    permissions: [
      'wells:read', 'wells:create', 'wells:update',
      'well-testing:*',
      'drilling:*',
      'production:read', 'production:update',
      'assets:read', 'assets:update',
      'reports:read', 'reports:create',
    ],
  },
  
  OPERATOR: {
    code: 'operator',
    name: 'Operador',
    description: 'Operador de campo',
    permissions: [
      'wells:read',
      'well-testing:read', 'well-testing:create',
      'production:read', 'production:update',
      'alarms:read', 'alarms:acknowledge',
      'telemetry:read',
    ],
  },
  
  VIEWER: {
    code: 'viewer',
    name: 'Visualizador',
    description: 'Solo lectura',
    permissions: [
      'wells:read',
      'fields:read',
      'basins:read',
      'reservoirs:read',
      'production:read',
      'reports:read',
      'dashboards:read',
    ],
  },
  
  ACCOUNTANT: {
    code: 'accountant',
    name: 'Contador',
    description: 'Gestión financiera',
    permissions: [
      'finance:*',
      'inventory:read',
      'wells:read',
      'reports:read', 'reports:create:finance',
    ],
  },
  
  HR_MANAGER: {
    code: 'hr_manager',
    name: 'Gerente de RRHH',
    description: 'Gestión de recursos humanos',
    permissions: [
      'hr:*',
      'users:read',
      'reports:read', 'reports:create:hr',
    ],
  },
};
```

---

## 5. Implementación Backend

### 5.1 Middleware de Autorización

```typescript
// src/common/middleware/permission.middleware.ts
import type { FastifyRequest, FastifyReply } from 'fastify';

export function requirePermission(permission: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = await checkUserPermissions(user.id, permissions);
    
    if (!hasPermission) {
      return reply.code(403).send({ 
        error: 'Forbidden',
        message: `Required permissions: ${permissions.join(', ')}` 
      });
    }
  };
}

// Verificar permisos del usuario
async function checkUserPermissions(
  userId: string, 
  requiredPermissions: string[]
): Promise<boolean> {
  // 1. Obtener roles del usuario
  const userRoles = await getUserRoles(userId);
  
  // 2. Obtener permisos de roles
  const rolePermissions = await getRolePermissions(userRoles);
  
  // 3. Obtener permisos directos del usuario
  const directPermissions = await getUserDirectPermissions(userId);
  
  // 4. Combinar permisos
  const allPermissions = [...rolePermissions, ...directPermissions];
  
  // 5. Verificar si tiene los permisos requeridos
  return requiredPermissions.every(required => 
    hasPermission(allPermissions, required)
  );
}

// Verificar permiso con wildcards
function hasPermission(
  userPermissions: string[], 
  required: string
): boolean {
  return userPermissions.some(perm => {
    if (perm === '*:*') return true; // Super admin
    
    const [userModule, userAction, userResource, userField] = perm.split(':');
    const [reqModule, reqAction, reqResource, reqField] = required.split(':');
    
    if (userModule !== reqModule && userModule !== '*') return false;
    if (userAction !== reqAction && userAction !== '*') return false;
    if (reqResource && userResource !== reqResource && userResource !== '*') return false;
    if (reqField && userField !== reqField && userField !== '*') return false;
    
    return true;
  });
}
```

### 5.2 Uso en Rutas

```typescript
// Ejemplo: wells.routes.ts
fastify.get('/', {
  onRequest: [authMiddleware, requirePermission('wells:read')],
  handler: wellsController.getAllWells,
});

fastify.post('/', {
  onRequest: [authMiddleware, requirePermission('wells:create')],
  handler: wellsController.createWell,
});

fastify.put('/:id', {
  onRequest: [authMiddleware, requirePermission('wells:update')],
  handler: wellsController.updateWell,
});

fastify.delete('/:id', {
  onRequest: [authMiddleware, requirePermission('wells:delete')],
  handler: wellsController.deleteWell,
});

// Permiso específico para campo sensible
fastify.get('/:id/payroll', {
  onRequest: [authMiddleware, requirePermission('wells:read:payroll')],
  handler: wellsController.getWellPayroll,
});
```

---

## 6. Implementación Frontend

### 6.1 Hook de Permisos

```typescript
// src/hooks/usePermission.ts
export function usePermission(permission: string | string[]): boolean {
  const { user } = useAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  return permissions.every(perm => 
    user?.permissions?.includes(perm) || 
    hasWildcardPermission(user?.permissions, perm)
  );
}

export function useAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth();
  return permissions.some(perm => 
    user?.permissions?.includes(perm) ||
    hasWildcardPermission(user?.permissions, perm)
  );
}
```

### 6.2 Componente PermissionGate

```typescript
// src/components/PermissionGate.tsx
interface PermissionGateProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const hasPermission = usePermission(permission);
  
  if (!hasPermission) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

// Uso
<PermissionGate permission="wells:create">
  <Button onClick={createWell}>Crear Pozo</Button>
</PermissionGate>
```

---

## 7. Fases de Implementación

### Fase 1: Modelo de Datos (1 semana)
- [ ] Crear tablas de RBAC
- [ ] Migración de datos existentes
- [ ] Seeds con roles y permisos predefinidos

### Fase 2: Backend Core (2 semanas)
- [ ] Servicios de roles y permisos
- [ ] Middleware de autorización
- [ ] APIs de gestión de roles/permisos
- [ ] Sistema de auditoría

### Fase 3: Integración Módulos (2 semanas)
- [ ] Aplicar permisos a todos los endpoints
- [ ] Definir permisos por módulo
- [ ] Tests de autorización

### Fase 4: Frontend (1 semana)
- [ ] Hooks de permisos
- [ ] Componentes PermissionGate
- [ ] UI de gestión de roles/permisos
- [ ] Actualizar todos los componentes

### Fase 5: Auditoría y Testing (1 semana)
- [ ] Dashboard de auditoría
- [ ] Tests de seguridad
- [ ] Documentación completa

**Total**: 7 semanas

---

## 8. Permisos por Módulo (Detallado)

Ver archivo complementario: `11_RBAC_PERMISSIONS_CATALOG.md`

---

**Siguiente paso**: Crear tablas de RBAC y seeds de roles predefinidos
