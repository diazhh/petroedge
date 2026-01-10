import { RbacRepository } from './rbac.repository.js';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  AssignRoleToUserInput,
  AssignPermissionToUserInput,
  QueryRolesInput,
  QueryPermissionsInput,
} from './rbac.schema.js';
import type { RoleWithPermissions, PermissionCheck, LogAccessInput } from './rbac.types.js';

export class RbacService {
  private repository: RbacRepository;

  constructor() {
    this.repository = new RbacRepository();
  }

  async getRoles(tenantId: string, query: QueryRolesInput) {
    return await this.repository.findAllRoles(tenantId, query);
  }

  async getRoleById(id: string, tenantId: string): Promise<RoleWithPermissions | null> {
    const role = await this.repository.findRoleById(id, tenantId);
    if (!role) return null;

    const permissions = await this.repository.getRolePermissions(role.id);

    return {
      ...role,
      permissions,
    };
  }

  async createRole(tenantId: string, data: CreateRoleInput) {
    const existing = await this.repository.findRoleByCode(data.code, tenantId);
    if (existing) {
      throw new Error(`Role with code '${data.code}' already exists`);
    }

    if (data.parentRoleId) {
      const parentRole = await this.repository.findRoleById(data.parentRoleId, tenantId);
      if (!parentRole) {
        throw new Error('Parent role not found');
      }
    }

    const role = await this.repository.createRole({
      tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      isSystem: false,
      isActive: true,
      parentRoleId: data.parentRoleId,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await this.repository.assignPermissionsToRole(role.id, data.permissionIds);
    }

    return role;
  }

  async updateRole(id: string, tenantId: string, data: UpdateRoleInput) {
    const role = await this.repository.findRoleById(id, tenantId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    if (data.parentRoleId) {
      const parentRole = await this.repository.findRoleById(data.parentRoleId, tenantId);
      if (!parentRole) {
        throw new Error('Parent role not found');
      }

      if (parentRole.id === role.id) {
        throw new Error('Role cannot be its own parent');
      }
    }

    return await this.repository.updateRole(id, tenantId, data);
  }

  async deleteRole(id: string, tenantId: string) {
    const role = await this.repository.findRoleById(id, tenantId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    return await this.repository.deleteRole(id, tenantId);
  }

  async assignPermissionsToRole(roleId: string, tenantId: string, permissionIds: string[]) {
    const role = await this.repository.findRoleById(roleId, tenantId);
    if (!role) {
      throw new Error('Role not found');
    }

    for (const permId of permissionIds) {
      const permission = await this.repository.findPermissionById(permId, tenantId);
      if (!permission) {
        throw new Error(`Permission ${permId} not found`);
      }
    }

    return await this.repository.assignPermissionsToRole(roleId, permissionIds);
  }

  async getPermissions(tenantId: string, query: QueryPermissionsInput) {
    return await this.repository.findAllPermissions(tenantId, query);
  }

  async getPermissionById(id: string, tenantId: string) {
    return await this.repository.findPermissionById(id, tenantId);
  }

  async createPermission(tenantId: string, data: CreatePermissionInput) {
    const existing = await this.repository.findPermissionByCode(data.code, tenantId);
    if (existing) {
      throw new Error(`Permission with code '${data.code}' already exists`);
    }

    return await this.repository.createPermission({
      tenantId,
      code: data.code,
      module: data.module,
      resource: data.resource,
      action: data.action,
      field: data.field,
      description: data.description,
      isSystem: false,
    });
  }

  async assignRoleToUser(data: AssignRoleToUserInput, grantedBy: string, tenantId: string) {
    const role = await this.repository.findRoleById(data.roleId, tenantId);
    if (!role) {
      throw new Error('Role not found');
    }

    return await this.repository.assignRoleToUser({
      userId: data.userId,
      roleId: data.roleId,
      grantedBy,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  }

  async removeRoleFromUser(userId: string, roleId: string, tenantId: string) {
    const role = await this.repository.findRoleById(roleId, tenantId);
    if (!role) {
      throw new Error('Role not found');
    }

    return await this.repository.removeRoleFromUser(userId, roleId);
  }

  async assignPermissionToUser(
    data: AssignPermissionToUserInput,
    grantedBy: string,
    tenantId: string
  ) {
    const permission = await this.repository.findPermissionById(data.permissionId, tenantId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    return await this.repository.assignPermissionToUser({
      userId: data.userId,
      permissionId: data.permissionId,
      granted: data.granted,
      grantedBy,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      reason: data.reason,
    });
  }

  async removePermissionFromUser(userId: string, permissionId: string, tenantId: string) {
    const permission = await this.repository.findPermissionById(permissionId, tenantId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    return await this.repository.removePermissionFromUser(userId, permissionId);
  }

  async getUserRoles(userId: string) {
    return await this.repository.getUserRoles(userId);
  }

  async getUserPermissions(userId: string) {
    return await this.repository.getAllPermissionsForUser(userId);
  }

  async checkPermission(userId: string, permissionCode: string): Promise<PermissionCheck> {
    const allPermissions = await this.repository.getAllPermissionsForUser(userId);
    const hasPermission = allPermissions.some(p => p.code === permissionCode);

    if (hasPermission) {
      const directPerms = await this.repository.getUserDirectPermissions(userId);
      const isDirect = directPerms.some(
        dp => dp.permission.code === permissionCode && dp.granted
      );

      return {
        userId,
        permissionCode,
        granted: true,
        source: isDirect ? 'direct' : 'role',
      };
    }

    return {
      userId,
      permissionCode,
      granted: false,
      source: 'none',
    };
  }

  async checkPermissions(userId: string, permissionCodes: string[]): Promise<PermissionCheck[]> {
    const results: PermissionCheck[] = [];

    for (const code of permissionCodes) {
      const check = await this.checkPermission(userId, code);
      results.push(check);
    }

    return results;
  }

  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const check = await this.checkPermission(userId, permissionCode);
    return check.granted;
  }

  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      const hasIt = await this.hasPermission(userId, code);
      if (hasIt) return true;
    }
    return false;
  }

  async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    for (const code of permissionCodes) {
      const hasIt = await this.hasPermission(userId, code);
      if (!hasIt) return false;
    }
    return true;
  }

  async logAccess(data: LogAccessInput) {
    return await this.repository.logAccess(data);
  }

  async getAccessLogs(tenantId: string, userId?: string, limit = 100) {
    return await this.repository.getAccessLogs(tenantId, userId, limit);
  }

  matchesWildcard(permissionCode: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(permissionCode);
  }

  async hasPermissionWithWildcard(userId: string, pattern: string): Promise<boolean> {
    const allPermissions = await this.repository.getAllPermissionsForUser(userId);
    return allPermissions.some(p => this.matchesWildcard(p.code, pattern));
  }
}
