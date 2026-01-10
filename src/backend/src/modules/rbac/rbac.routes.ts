import type { FastifyInstance } from 'fastify';
import { rbacController } from './rbac.controller.js';
import { authMiddleware } from '../../common/middleware/auth.middleware.js';

export default async function rbacRoutes(fastify: FastifyInstance) {
  // ==================== ROLES ====================
  
  fastify.get('/roles', {
    preHandler: authMiddleware,
    handler: rbacController.getRoles.bind(rbacController),
  });

  fastify.get('/roles/:id', {
    preHandler: authMiddleware,
    handler: rbacController.getRoleById.bind(rbacController),
  });

  fastify.post('/roles', {
    preHandler: authMiddleware,
    handler: rbacController.createRole.bind(rbacController),
  });

  fastify.put('/roles/:id', {
    preHandler: authMiddleware,
    handler: rbacController.updateRole.bind(rbacController),
  });

  fastify.delete('/roles/:id', {
    preHandler: authMiddleware,
    handler: rbacController.deleteRole.bind(rbacController),
  });

  fastify.post('/roles/:id/permissions', {
    preHandler: authMiddleware,
    handler: rbacController.assignPermissionsToRole.bind(rbacController),
  });

  // ==================== PERMISSIONS ====================

  fastify.get('/permissions', {
    preHandler: authMiddleware,
    handler: rbacController.getPermissions.bind(rbacController),
  });

  fastify.get('/permissions/:id', {
    preHandler: authMiddleware,
    handler: rbacController.getPermissionById.bind(rbacController),
  });

  fastify.post('/permissions', {
    preHandler: authMiddleware,
    handler: rbacController.createPermission.bind(rbacController),
  });

  // ==================== USER ASSIGNMENTS ====================

  fastify.post('/users/roles', {
    preHandler: authMiddleware,
    handler: rbacController.assignRoleToUser.bind(rbacController),
  });

  fastify.delete('/users/:userId/roles/:roleId', {
    preHandler: authMiddleware,
    handler: rbacController.removeRoleFromUser.bind(rbacController),
  });

  fastify.post('/users/permissions', {
    preHandler: authMiddleware,
    handler: rbacController.assignPermissionToUser.bind(rbacController),
  });

  fastify.delete('/users/:userId/permissions/:permissionId', {
    preHandler: authMiddleware,
    handler: rbacController.removePermissionFromUser.bind(rbacController),
  });

  fastify.get('/users/:userId/permissions', {
    preHandler: authMiddleware,
    handler: rbacController.getUserPermissions.bind(rbacController),
  });

  fastify.post('/check-permission', {
    preHandler: authMiddleware,
    handler: rbacController.checkPermission.bind(rbacController),
  });
}
