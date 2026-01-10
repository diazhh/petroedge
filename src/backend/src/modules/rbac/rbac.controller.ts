import type { FastifyRequest, FastifyReply } from 'fastify';
import { RbacService } from './rbac.service.js';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  AssignRoleToUserInput,
  AssignPermissionToUserInput,
  QueryRolesInput,
  QueryPermissionsInput,
} from './rbac.schema.js';

export class RbacController {
  private service: RbacService;

  constructor() {
    this.service = new RbacService();
  }

  // ==================== ROLES ====================

  async getRoles(
    request: FastifyRequest<{ Querystring: QueryRolesInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const result = await this.service.getRoles(tenantId, request.query);

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_ROLES_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getRoleById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const role = await this.service.getRoleById(request.params.id, tenantId);

      if (!role) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: role,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async createRole(
    request: FastifyRequest<{ Body: CreateRoleInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const role = await this.service.createRole(tenantId, request.body);

      return reply.code(201).send({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: 'CREATE_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async updateRole(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateRoleInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const role = await this.service.updateRole(request.params.id, tenantId, request.body);

      if (!role) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('system role') ? 403 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: 'UPDATE_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async deleteRole(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      await this.service.deleteRole(request.params.id, tenantId);

      return reply.code(204).send();
    } catch (error: any) {
      const statusCode = error.message.includes('system role') ? 403 : 404;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: 'DELETE_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async assignPermissionsToRole(
    request: FastifyRequest<{ Params: { id: string }; Body: { permissionIds: string[] } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      await this.service.assignPermissionsToRole(
        request.params.id,
        tenantId,
        request.body.permissionIds
      );

      return reply.send({
        success: true,
        message: 'Permissions assigned to role successfully',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'ASSIGN_PERMISSIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ==================== PERMISSIONS ====================

  async getPermissions(
    request: FastifyRequest<{ Querystring: QueryPermissionsInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const result = await this.service.getPermissions(tenantId, request.query);

      return reply.send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.perPage,
        },
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_PERMISSIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getPermissionById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const permission = await this.service.getPermissionById(request.params.id, tenantId);

      if (!permission) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'PERMISSION_NOT_FOUND',
            message: 'Permission not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: permission,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_PERMISSION_FAILED',
          message: error.message,
        },
      });
    }
  }

  async createPermission(
    request: FastifyRequest<{ Body: CreatePermissionInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const permission = await this.service.createPermission(tenantId, request.body);

      return reply.code(201).send({
        success: true,
        data: permission,
        message: 'Permission created successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: 'CREATE_PERMISSION_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ==================== USER ASSIGNMENTS ====================

  async assignRoleToUser(
    request: FastifyRequest<{ Body: AssignRoleToUserInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const grantedBy = (request.user as any).id;

      await this.service.assignRoleToUser(request.body, grantedBy, tenantId);

      return reply.code(201).send({
        success: true,
        message: 'Role assigned to user successfully',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'ASSIGN_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async removeRoleFromUser(
    request: FastifyRequest<{ Params: { userId: string; roleId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      await this.service.removeRoleFromUser(
        request.params.userId,
        request.params.roleId,
        tenantId
      );

      return reply.code(204).send();
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REMOVE_ROLE_FAILED',
          message: error.message,
        },
      });
    }
  }

  async assignPermissionToUser(
    request: FastifyRequest<{ Body: AssignPermissionToUserInput }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      const grantedBy = (request.user as any).id;

      await this.service.assignPermissionToUser(request.body, grantedBy, tenantId);

      return reply.code(201).send({
        success: true,
        message: 'Permission assigned to user successfully',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'ASSIGN_PERMISSION_FAILED',
          message: error.message,
        },
      });
    }
  }

  async removePermissionFromUser(
    request: FastifyRequest<{ Params: { userId: string; permissionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = (request.user as any).tenantId;
      await this.service.removePermissionFromUser(
        request.params.userId,
        request.params.permissionId,
        tenantId
      );

      return reply.code(204).send();
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REMOVE_PERMISSION_FAILED',
          message: error.message,
        },
      });
    }
  }

  async getUserPermissions(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const permissions = await this.service.getUserPermissions(request.params.userId);

      return reply.send({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'GET_USER_PERMISSIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  async checkPermission(
    request: FastifyRequest<{ Body: { userId: string; permission: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.service.checkPermission(
        request.body.userId,
        request.body.permission
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'CHECK_PERMISSION_FAILED',
          message: error.message,
        },
      });
    }
  }
}

export const rbacController = new RbacController();
