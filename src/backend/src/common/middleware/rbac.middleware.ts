import type { FastifyRequest, FastifyReply } from 'fastify';
import { RbacService } from '../../modules/rbac/rbac.service.js';

const rbacService = new RbacService();

/**
 * Middleware para verificar si el usuario tiene un permiso específico
 * @param permission - Código del permiso requerido (ej: 'wells:create', 'users:update:status')
 */
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autenticación requerida',
          },
        });
      }

      const userId = (request.user as any).id || (request.user as any).userId;
      const hasPermission = await rbacService.hasPermission(userId, permission);

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `No tienes el permiso requerido: ${permission}`,
          },
        });
      }
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  };
}

/**
 * Middleware para verificar si el usuario tiene AL MENOS UNO de los permisos especificados
 * @param permissions - Array de códigos de permisos
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autenticación requerida',
          },
        });
      }

      const userId = (request.user as any).id || (request.user as any).userId;
      const hasAnyPermission = await rbacService.hasAnyPermission(userId, permissions);

      if (!hasAnyPermission) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `No tienes ninguno de los permisos requeridos: ${permissions.join(', ')}`,
          },
        });
      }
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  };
}

/**
 * Middleware para verificar si el usuario tiene TODOS los permisos especificados
 * @param permissions - Array de códigos de permisos
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autenticación requerida',
          },
        });
      }

      const userId = (request.user as any).id || (request.user as any).userId;
      const hasAllPermissions = await rbacService.hasAllPermissions(userId, permissions);

      if (!hasAllPermissions) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `No tienes todos los permisos requeridos: ${permissions.join(', ')}`,
          },
        });
      }
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  };
}

/**
 * Middleware para verificar permisos con soporte para wildcards
 * @param pattern - Patrón de permiso con wildcards (ej: 'wells:*', 'users:update:*')
 */
export function requirePermissionPattern(pattern: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Autenticación requerida',
          },
        });
      }

      const userId = (request.user as any).id || (request.user as any).userId;
      const hasPermission = await rbacService.hasPermissionWithWildcard(userId, pattern);

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `No tienes permisos que coincidan con el patrón: ${pattern}`,
          },
        });
      }
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  };
}

/**
 * Helper para registrar accesos en la tabla de auditoría
 */
export async function logAccess(
  request: FastifyRequest,
  resourceType: string,
  action: string,
  granted: boolean,
  resourceId?: string
) {
  try {
    if (!request.user) return;

    const userId = (request.user as any).id || (request.user as any).userId;
    const tenantId = (request.user as any).tenantId;

    await rbacService.logAccess({
      userId,
      tenantId,
      resourceType,
      resourceId,
      action,
      granted,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || 'Unknown',
      metadata: {
        method: request.method,
        url: request.url,
        params: request.params,
      },
    });
  } catch (error) {
    // Log silently, don't fail the request
    console.error('Failed to log access:', error);
  }
}
