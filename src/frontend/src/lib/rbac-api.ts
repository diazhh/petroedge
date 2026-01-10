/**
 * RBAC API Service
 * 
 * Servicio para consumir los endpoints del sistema RBAC
 */

import { api } from './api';

// ==================== Types ====================

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  module: string;
  action: string;
  resource: string | null;
  field: string | null;
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  expiresAt: string | null;
}

export interface UserPermission {
  userId: string;
  permissionId: string;
  assignedAt: string;
  assignedBy: string;
  expiresAt: string | null;
}

export interface AccessLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  permission: string;
  granted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface CreateRoleData {
  name: string;
  displayName: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  displayName?: string;
  description?: string;
}

export interface CreatePermissionData {
  name: string;
  displayName: string;
  description?: string;
  module: string;
  action: string;
  resource?: string;
  field?: string;
}

export interface UpdatePermissionData {
  displayName?: string;
  description?: string;
}

export interface AssignRoleData {
  roleId: string;
  expiresAt?: string;
}

export interface AssignPermissionData {
  permissionId: string;
  expiresAt?: string;
}

export interface CheckPermissionData {
  permission: string;
}

export interface CheckPermissionsData {
  permissions: string[];
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface RoleFilters extends PaginationParams {
  isSystem?: boolean;
  search?: string;
}

export interface PermissionFilters extends PaginationParams {
  module?: string;
  action?: string;
  isSystem?: boolean;
  search?: string;
}

export interface AccessLogFilters extends PaginationParams {
  userId?: string;
  action?: string;
  resource?: string;
  granted?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== Roles API ====================

export const rolesApi = {
  /**
   * Listar roles
   */
  list: async (filters?: RoleFilters) => {
    const response = await api.get<PaginatedResponse<Role>>('/api/v1/rbac/roles', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener rol por ID
   */
  getById: async (roleId: string, includePermissions = false) => {
    const response = await api.get<ApiResponse<RoleWithPermissions>>(
      `/api/v1/rbac/roles/${roleId}`,
      {
        params: { includePermissions },
      }
    );
    return response.data.data;
  },

  /**
   * Crear rol
   */
  create: async (data: CreateRoleData) => {
    const response = await api.post<ApiResponse<Role>>('/api/v1/rbac/roles', data);
    return response.data.data;
  },

  /**
   * Actualizar rol
   */
  update: async (roleId: string, data: UpdateRoleData) => {
    const response = await api.put<ApiResponse<Role>>(`/api/v1/rbac/roles/${roleId}`, data);
    return response.data.data;
  },

  /**
   * Eliminar rol
   */
  delete: async (roleId: string) => {
    await api.delete(`/api/v1/rbac/roles/${roleId}`);
  },

  /**
   * Asignar permisos a un rol
   */
  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await api.post<ApiResponse<void>>(
      `/api/v1/rbac/roles/${roleId}/permissions`,
      { permissionIds }
    );
    return response.data;
  },

  /**
   * Remover permisos de un rol
   */
  removePermissions: async (roleId: string, permissionIds: string[]) => {
    await api.delete(`/api/v1/rbac/roles/${roleId}/permissions`, {
      data: { permissionIds },
    });
  },
};

// ==================== Permissions API ====================

export const permissionsApi = {
  /**
   * Listar permisos
   */
  list: async (filters?: PermissionFilters) => {
    const response = await api.get<PaginatedResponse<Permission>>('/api/v1/rbac/permissions', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Obtener permiso por ID
   */
  getById: async (permissionId: string) => {
    const response = await api.get<ApiResponse<Permission>>(
      `/api/v1/rbac/permissions/${permissionId}`
    );
    return response.data.data;
  },

  /**
   * Crear permiso
   */
  create: async (data: CreatePermissionData) => {
    const response = await api.post<ApiResponse<Permission>>('/api/v1/rbac/permissions', data);
    return response.data.data;
  },

  /**
   * Actualizar permiso
   */
  update: async (permissionId: string, data: UpdatePermissionData) => {
    const response = await api.put<ApiResponse<Permission>>(
      `/api/v1/rbac/permissions/${permissionId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Eliminar permiso
   */
  delete: async (permissionId: string) => {
    await api.delete(`/api/v1/rbac/permissions/${permissionId}`);
  },
};

// ==================== User Roles API ====================

export const userRolesApi = {
  /**
   * Obtener roles de un usuario
   */
  getUserRoles: async (userId: string) => {
    const response = await api.get<ApiResponse<Role[]>>(`/api/v1/rbac/users/${userId}/roles`);
    return response.data.data;
  },

  /**
   * Asignar rol a usuario
   */
  assignRole: async (userId: string, data: AssignRoleData) => {
    const response = await api.post<ApiResponse<void>>(
      `/api/v1/rbac/users/${userId}/roles`,
      data
    );
    return response.data;
  },

  /**
   * Remover rol de usuario
   */
  removeRole: async (userId: string, roleId: string) => {
    await api.delete(`/api/v1/rbac/users/${userId}/roles/${roleId}`);
  },
};

// ==================== User Permissions API ====================

export const userPermissionsApi = {
  /**
   * Obtener permisos de un usuario
   */
  getUserPermissions: async (userId: string) => {
    const response = await api.get<ApiResponse<Permission[]>>(
      `/api/v1/rbac/users/${userId}/permissions`
    );
    return response.data.data;
  },

  /**
   * Asignar permiso a usuario
   */
  assignPermission: async (userId: string, data: AssignPermissionData) => {
    const response = await api.post<ApiResponse<void>>(
      `/api/v1/rbac/users/${userId}/permissions`,
      data
    );
    return response.data;
  },

  /**
   * Remover permiso de usuario
   */
  removePermission: async (userId: string, permissionId: string) => {
    await api.delete(`/api/v1/rbac/users/${userId}/permissions/${permissionId}`);
  },
};

// ==================== Permission Check API ====================

export const permissionCheckApi = {
  /**
   * Verificar si el usuario actual tiene un permiso
   */
  checkPermission: async (permission: string) => {
    const response = await api.post<ApiResponse<{ hasPermission: boolean }>>(
      '/api/v1/rbac/check-permission',
      { permission }
    );
    return response.data.data.hasPermission;
  },

  /**
   * Verificar múltiples permisos
   */
  checkPermissions: async (permissions: string[]) => {
    const response = await api.post<ApiResponse<{ permissions: Record<string, boolean> }>>(
      '/api/v1/rbac/check-permissions',
      { permissions }
    );
    return response.data.data.permissions;
  },
};

// ==================== Access Logs API ====================

export const accessLogsApi = {
  /**
   * Listar logs de acceso
   */
  list: async (filters?: AccessLogFilters) => {
    const response = await api.get<PaginatedResponse<AccessLog>>('/api/v1/rbac/access-logs', {
      params: filters,
    });
    return response.data;
  },
};

// ==================== Export All ====================

export const rbacApi = {
  roles: rolesApi,
  permissions: permissionsApi,
  userRoles: userRolesApi,
  userPermissions: userPermissionsApi,
  permissionCheck: permissionCheckApi,
  accessLogs: accessLogsApi,
};

export default rbacApi;
