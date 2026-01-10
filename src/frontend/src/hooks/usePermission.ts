/**
 * Sistema de Permisos Granulares
 * 
 * Formato: {modulo}:{accion}[:{campo}]
 * Ejemplos:
 * - wells:read
 * - wells:create
 * - wells:update
 * - wells:delete
 * - wells:read:payroll
 * - wells:*
 * - *:*
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const checkPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  if (!requiredPermission || typeof requiredPermission !== 'string') {
    return false;
  }

  // Super admin tiene acceso a todo
  if (userPermissions.includes('*:*')) {
    return true;
  }

  const parts = requiredPermission.split(':');
  const module = parts[0];
  const action = parts[1];
  const field = parts[2];

  // Verificar permiso de módulo completo (ej: 'wells:*')
  if (userPermissions.includes(`${module}:*`)) {
    return true;
  }

  // Verificar permiso exacto
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Si se requiere un campo específico, verificar si tiene el permiso de acción general
  if (field && userPermissions.includes(`${module}:${action}`)) {
    return true;
  }

  // Verificar wildcard de acción con cualquier campo
  if (field && userPermissions.includes(`${module}:${action}:*`)) {
    return true;
  }

  return false;
};

/**
 * Hook para verificar un permiso específico
 */
export const usePermission = (permission: string): boolean => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  return useMemo(() => {
    return checkPermission(permissions, permission);
  }, [permissions, permission]);
};

/**
 * Hook para verificar múltiples permisos
 */
export const usePermissions = (permissionList: string[]): boolean[] => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  return useMemo(() => {
    return permissionList.map((p) => checkPermission(permissions, p));
  }, [permissions, permissionList]);
};

/**
 * Hook para verificar si tiene al menos uno de los permisos
 */
export const useAnyPermission = (permissionList: string[]): boolean => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  return useMemo(() => {
    if (!permissionList || permissionList.length === 0) return false;
    return permissionList.some((p) => checkPermission(permissions, p));
  }, [permissions, permissionList]);
};

/**
 * Hook para verificar si tiene todos los permisos
 */
export const useAllPermissions = (permissionList: string[]): boolean => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];

  return useMemo(() => {
    if (!permissionList || permissionList.length === 0) return false;
    return permissionList.every((p) => checkPermission(permissions, p));
  }, [permissions, permissionList]);
};

/**
 * Hook para obtener todos los permisos del usuario
 */
export const useUserPermissions = (): string[] => {
  const user = useAuthStore((state) => state.user);
  return user?.permissions || [];
};

/**
 * Hook para verificar si el usuario es Super Admin
 */
export const useIsSuperAdmin = (): boolean => {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];
  return permissions.includes('*:*');
};

/**
 * Hook para verificar el rol del usuario
 */
export const useUserRole = (): string | null => {
  const user = useAuthStore((state) => state.user);
  return user?.role || null;
};

/**
 * Hook para verificar si tiene un rol específico
 */
export const useHasRole = (role: string): boolean => {
  const userRole = useUserRole();
  return userRole === role;
};

/**
 * Hook para verificar si tiene alguno de los roles especificados
 */
export const useHasAnyRole = (roles: string[]): boolean => {
  const userRole = useUserRole();
  return userRole ? roles.includes(userRole) : false;
};

export default usePermission;
