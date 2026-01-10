/**
 * Componentes de Control de Permisos
 * 
 * Renderiza contenido condicionalmente basado en los permisos del usuario.
 */

import { ReactNode } from 'react';
import {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useIsSuperAdmin,
} from '@/hooks/usePermission';

interface PermissionGateProps {
  /** Permiso único requerido */
  permission?: string;
  /** Lista de permisos (usar con requireAll) */
  permissions?: string[];
  /** Si true, requiere todos los permisos de la lista. Si false, requiere al menos uno */
  requireAll?: boolean;
  /** Contenido a renderizar si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
}

/**
 * Componente que renderiza sus hijos solo si el usuario tiene el permiso requerido
 * 
 * @example
 * <PermissionGate permission="wells:read">
 *   <WellsTable />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate permissions={['wells:create', 'wells:update']} requireAll={false}>
 *   <ActionButtons />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasSinglePermission = usePermission(permission || '');
  const hasAnyPermission = useAnyPermission(permissions || []);
  const hasAllPermissions = useAllPermissions(permissions || []);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions : hasAnyPermission;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface CanDoProps {
  /** Permiso requerido */
  permission: string;
  /** Contenido a renderizar si tiene permiso */
  children: ReactNode;
}

/**
 * Componente para ocultar elementos si NO tiene el permiso
 * Útil para botones de acción
 * 
 * @example
 * <CanDo permission="wells:create">
 *   <Button>Crear Pozo</Button>
 * </CanDo>
 */
export function CanDo({ permission, children }: CanDoProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : null;
}

interface SuperAdminOnlyProps {
  /** Contenido a renderizar si es super admin */
  children: ReactNode;
  /** Contenido alternativo si no es super admin */
  fallback?: ReactNode;
}

/**
 * Componente para mostrar contenido solo a Super Admins
 * 
 * @example
 * <SuperAdminOnly>
 *   <DangerZone />
 * </SuperAdminOnly>
 */
export function SuperAdminOnly({ children, fallback = null }: SuperAdminOnlyProps) {
  const isSuperAdmin = useIsSuperAdmin();
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
}

interface RoleGateProps {
  /** Rol requerido o lista de roles */
  role?: string;
  roles?: string[];
  /** Contenido a renderizar si tiene el rol */
  children: ReactNode;
  /** Contenido alternativo si no tiene el rol */
  fallback?: ReactNode;
}

/**
 * Componente para mostrar contenido basado en rol
 * 
 * @example
 * <RoleGate role="admin">
 *   <AdminPanel />
 * </RoleGate>
 * 
 * @example
 * <RoleGate roles={['admin', 'engineer']}>
 *   <TechnicalPanel />
 * </RoleGate>
 */
export function RoleGate({ role, roles, children, fallback = null }: RoleGateProps) {
  const hasAnyPermission = useAnyPermission(
    role ? [`role:${role}`] : (roles || []).map((r) => `role:${r}`)
  );

  // Para simplificar, usamos el rol directamente del store
  // ya que los permisos basados en rol se manejan diferente
  return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
}

export default PermissionGate;
