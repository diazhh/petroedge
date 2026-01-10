/**
 * React Query Hooks for RBAC
 * 
 * Hooks para consumir la API RBAC con React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacApi } from '@/lib/rbac-api';
import type {
  RoleFilters,
  PermissionFilters,
  AccessLogFilters,
  CreateRoleData,
  UpdateRoleData,
  CreatePermissionData,
  UpdatePermissionData,
  AssignRoleData,
  AssignPermissionData,
} from '@/lib/rbac-api';

// ==================== Query Keys ====================

export const rbacKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  rolesList: (filters?: RoleFilters) => [...rbacKeys.roles(), 'list', filters] as const,
  roleDetail: (id: string) => [...rbacKeys.roles(), 'detail', id] as const,
  permissions: () => [...rbacKeys.all, 'permissions'] as const,
  permissionsList: (filters?: PermissionFilters) =>
    [...rbacKeys.permissions(), 'list', filters] as const,
  permissionDetail: (id: string) => [...rbacKeys.permissions(), 'detail', id] as const,
  userRoles: (userId: string) => [...rbacKeys.all, 'user-roles', userId] as const,
  userPermissions: (userId: string) => [...rbacKeys.all, 'user-permissions', userId] as const,
  accessLogs: (filters?: AccessLogFilters) =>
    [...rbacKeys.all, 'access-logs', filters] as const,
};

// ==================== Roles Hooks ====================

/**
 * Hook para listar roles
 */
export function useRoles(filters?: RoleFilters) {
  return useQuery({
    queryKey: rbacKeys.rolesList(filters),
    queryFn: () => rbacApi.roles.list(filters),
  });
}

/**
 * Hook para obtener un rol por ID
 */
export function useRole(roleId: string, includePermissions = false) {
  return useQuery({
    queryKey: rbacKeys.roleDetail(roleId),
    queryFn: () => rbacApi.roles.getById(roleId, includePermissions),
    enabled: !!roleId,
  });
}

/**
 * Hook para crear un rol
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleData) => rbacApi.roles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}

/**
 * Hook para actualizar un rol
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleData }) =>
      rbacApi.roles.update(roleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetail(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}

/**
 * Hook para eliminar un rol
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rbacApi.roles.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}

/**
 * Hook para asignar permisos a un rol
 */
export function useAssignRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rbacApi.roles.assignPermissions(roleId, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetail(variables.roleId) });
    },
  });
}

/**
 * Hook para remover permisos de un rol
 */
export function useRemoveRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rbacApi.roles.removePermissions(roleId, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roleDetail(variables.roleId) });
    },
  });
}

// ==================== Permissions Hooks ====================

/**
 * Hook para listar permisos
 */
export function usePermissions(filters?: PermissionFilters) {
  return useQuery({
    queryKey: rbacKeys.permissionsList(filters),
    queryFn: () => rbacApi.permissions.list(filters),
  });
}

/**
 * Hook para obtener un permiso por ID
 */
export function usePermissionDetail(permissionId: string) {
  return useQuery({
    queryKey: rbacKeys.permissionDetail(permissionId),
    queryFn: () => rbacApi.permissions.getById(permissionId),
    enabled: !!permissionId,
  });
}

/**
 * Hook para crear un permiso
 */
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePermissionData) => rbacApi.permissions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
    },
  });
}

/**
 * Hook para actualizar un permiso
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ permissionId, data }: { permissionId: string; data: UpdatePermissionData }) =>
      rbacApi.permissions.update(permissionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: rbacKeys.permissionDetail(variables.permissionId),
      });
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
    },
  });
}

/**
 * Hook para eliminar un permiso
 */
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId: string) => rbacApi.permissions.delete(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
    },
  });
}

// ==================== User Roles Hooks ====================

/**
 * Hook para obtener roles de un usuario
 */
export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userRoles(userId),
    queryFn: () => rbacApi.userRoles.getUserRoles(userId),
    enabled: !!userId,
  });
}

/**
 * Hook para asignar rol a usuario
 */
export function useAssignUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignRoleData }) =>
      rbacApi.userRoles.assignRole(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(variables.userId) });
    },
  });
}

/**
 * Hook para remover rol de usuario
 */
export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      rbacApi.userRoles.removeRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userRoles(variables.userId) });
    },
  });
}

// ==================== User Permissions Hooks ====================

/**
 * Hook para obtener permisos de un usuario
 */
export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: rbacKeys.userPermissions(userId),
    queryFn: () => rbacApi.userPermissions.getUserPermissions(userId),
    enabled: !!userId,
  });
}

/**
 * Hook para asignar permiso a usuario
 */
export function useAssignUserPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignPermissionData }) =>
      rbacApi.userPermissions.assignPermission(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userPermissions(variables.userId) });
    },
  });
}

/**
 * Hook para remover permiso de usuario
 */
export function useRemoveUserPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissionId }: { userId: string; permissionId: string }) =>
      rbacApi.userPermissions.removePermission(userId, permissionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.userPermissions(variables.userId) });
    },
  });
}

// ==================== Permission Check Hooks ====================

/**
 * Hook para verificar un permiso (server-side)
 */
export function useCheckPermission(permission: string) {
  return useQuery({
    queryKey: [...rbacKeys.all, 'check-permission', permission],
    queryFn: () => rbacApi.permissionCheck.checkPermission(permission),
    enabled: !!permission,
  });
}

/**
 * Hook para verificar múltiples permisos (server-side)
 */
export function useCheckPermissions(permissions: string[]) {
  return useQuery({
    queryKey: [...rbacKeys.all, 'check-permissions', permissions],
    queryFn: () => rbacApi.permissionCheck.checkPermissions(permissions),
    enabled: permissions.length > 0,
  });
}

// ==================== Access Logs Hooks ====================

/**
 * Hook para listar logs de acceso
 */
export function useAccessLogs(filters?: AccessLogFilters) {
  return useQuery({
    queryKey: rbacKeys.accessLogs(filters),
    queryFn: () => rbacApi.accessLogs.list(filters),
  });
}
