import { eq, and, like, or, sql, desc, inArray, isNull } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userPermissions,
  accessLogs,
  type NewRole,
  type NewPermission,
  type NewUserRole,
  type NewUserPermission,
  type NewAccessLog,
} from '../../common/database/schema.js';
import type { QueryRolesInput, QueryPermissionsInput } from './rbac.schema.js';

export class RbacRepository {
  async findRoleById(id: string, tenantId: string) {
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
      .limit(1);
    return role || null;
  }

  async findRoleByCode(code: string, tenantId: string) {
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.code, code), eq(roles.tenantId, tenantId)))
      .limit(1);
    return role || null;
  }

  async findAllRoles(tenantId: string, query: QueryRolesInput) {
    const { page, perPage, search, isActive, isSystem } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(roles.tenantId, tenantId)];

    if (search) {
      conditions.push(
        or(
          like(roles.name, `%${search}%`),
          like(roles.code, `%${search}%`),
          like(roles.description, `%${search}%`)
        )!
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(roles.isActive, isActive));
    }

    if (isSystem !== undefined) {
      conditions.push(eq(roles.isSystem, isSystem));
    }

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(roles)
        .where(and(...conditions))
        .orderBy(desc(roles.createdAt))
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(roles)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      perPage,
    };
  }

  async createRole(data: NewRole) {
    const [role] = await db.insert(roles).values(data).returning();
    return role;
  }

  async updateRole(id: string, tenantId: string, data: Partial<NewRole>) {
    const [role] = await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
      .returning();
    return role || null;
  }

  async deleteRole(id: string, tenantId: string) {
    const [role] = await db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
      .returning();
    return role || null;
  }

  async findPermissionById(id: string, tenantId: string) {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.id, id), eq(permissions.tenantId, tenantId)))
      .limit(1);
    return permission || null;
  }

  async findPermissionByCode(code: string, tenantId: string) {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.code, code), eq(permissions.tenantId, tenantId)))
      .limit(1);
    return permission || null;
  }

  async findAllPermissions(tenantId: string, query: QueryPermissionsInput) {
    const { page, perPage, module, search } = query;
    const offset = (page - 1) * perPage;

    const conditions = [eq(permissions.tenantId, tenantId)];

    if (module) {
      conditions.push(eq(permissions.module, module));
    }

    if (search) {
      conditions.push(
        or(
          like(permissions.code, `%${search}%`),
          like(permissions.description, `%${search}%`)
        )!
      );
    }

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(permissions)
        .where(and(...conditions))
        .orderBy(permissions.module, permissions.code)
        .limit(perPage)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(permissions)
        .where(and(...conditions)),
    ]);

    return {
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      perPage,
    };
  }

  async createPermission(data: NewPermission) {
    const [permission] = await db.insert(permissions).values(data).returning();
    return permission;
  }

  async getRolePermissions(roleId: string) {
    const results = await db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.granted, true)));

    return results.map(r => r.permission);
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    if (permissionIds.length === 0) {
      return [];
    }

    const values = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
      granted: true,
    }));

    return await db.insert(rolePermissions).values(values).returning();
  }

  async getUserRoles(userId: string) {
    const results = await db
      .select({
        role: roles,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          or(
            isNull(userRoles.expiresAt),
            sql`${userRoles.expiresAt} > NOW()`
          )!
        )
      );

    return results.map(r => r.role);
  }

  async assignRoleToUser(data: NewUserRole) {
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, data.userId), eq(userRoles.roleId, data.roleId)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userRoles)
        .set({ expiresAt: data.expiresAt, grantedAt: new Date() })
        .where(eq(userRoles.id, existing.id))
        .returning();
      return updated;
    }

    const [userRole] = await db.insert(userRoles).values(data).returning();
    return userRole;
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const [userRole] = await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .returning();
    return userRole || null;
  }

  async getUserDirectPermissions(userId: string) {
    const results = await db
      .select({
        permission: permissions,
        granted: userPermissions.granted,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userPermissions.userId, userId),
          or(
            isNull(userPermissions.expiresAt),
            sql`${userPermissions.expiresAt} > NOW()`
          )!
        )
      );

    return results;
  }

  async assignPermissionToUser(data: NewUserPermission) {
    const [existing] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, data.userId),
          eq(userPermissions.permissionId, data.permissionId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userPermissions)
        .set({
          granted: data.granted,
          expiresAt: data.expiresAt,
          grantedAt: new Date(),
          reason: data.reason,
        })
        .where(eq(userPermissions.id, existing.id))
        .returning();
      return updated;
    }

    const [userPermission] = await db.insert(userPermissions).values(data).returning();
    return userPermission;
  }

  async removePermissionFromUser(userId: string, permissionId: string) {
    const [userPermission] = await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId)
        )
      )
      .returning();
    return userPermission || null;
  }

  async logAccess(data: NewAccessLog) {
    const [log] = await db.insert(accessLogs).values(data).returning();
    return log;
  }

  async getAccessLogs(tenantId: string, userId?: string, limit = 100) {
    const conditions = [eq(accessLogs.tenantId, tenantId)];

    if (userId) {
      conditions.push(eq(accessLogs.userId, userId));
    }

    return await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.createdAt))
      .limit(limit);
  }

  async getAllPermissionsForUser(userId: string) {
    const userRolesList = await this.getUserRoles(userId);
    const roleIds = userRolesList.map(r => r.id);

    let rolePerms: typeof permissions.$inferSelect[] = [];
    if (roleIds.length > 0) {
      const results = await db
        .select({
          permission: permissions,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            inArray(rolePermissions.roleId, roleIds),
            eq(rolePermissions.granted, true)
          )
        );
      rolePerms = results.map(r => r.permission);
    }

    const directPerms = await this.getUserDirectPermissions(userId);

    const permissionMap = new Map<string, typeof permissions.$inferSelect>();

    for (const perm of rolePerms) {
      permissionMap.set(perm.id, perm);
    }

    for (const { permission, granted } of directPerms) {
      if (granted) {
        permissionMap.set(permission.id, permission);
      } else {
        permissionMap.delete(permission.id);
      }
    }

    return Array.from(permissionMap.values());
  }
}
