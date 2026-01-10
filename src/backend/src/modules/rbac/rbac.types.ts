import type { Role, Permission, UserRole, UserPermission, RolePermission } from '../../common/database/schema.js';

export type { Role, Permission, UserRole, UserPermission, RolePermission };

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserWithRoles {
  userId: string;
  roles: Role[];
  permissions: Permission[];
}

export interface PermissionCheck {
  userId: string;
  permissionCode: string;
  granted: boolean;
  source: 'role' | 'direct' | 'none';
}

export interface CreateRoleInput {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  parentRoleId?: string;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  parentRoleId?: string;
}

export interface CreatePermissionInput {
  tenantId: string;
  code: string;
  module: string;
  resource?: string;
  action?: string;
  field?: string;
  description?: string;
}

export interface AssignRoleToUserInput {
  userId: string;
  roleId: string;
  grantedBy: string;
  expiresAt?: Date;
}

export interface AssignPermissionToUserInput {
  userId: string;
  permissionId: string;
  granted: boolean;
  grantedBy: string;
  expiresAt?: Date;
  reason?: string;
}

export interface LogAccessInput {
  tenantId: string;
  userId: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  permissionCode?: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}
