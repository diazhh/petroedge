import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../../modules/auth/auth.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
      tenantId: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido',
        },
      });
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    request.user = payload;
  } catch (error: any) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
    });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Autenticación requerida',
        },
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para acceder a este recurso',
        },
      });
    }
  };
}
