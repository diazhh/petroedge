import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      description: 'Registrar nuevo usuario',
      body: {
        type: 'object',
        required: ['email', 'username', 'password', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 100 },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', maxLength: 100 },
          lastName: { type: 'string', maxLength: 100 },
          tenantId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                role: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.register.bind(authController),
  });

  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      description: 'Iniciar sesión',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: authController.login.bind(authController),
  });

  fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      description: 'Renovar access token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
    handler: authController.refresh.bind(authController),
  });

  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      description: 'Cerrar sesión',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
    handler: authController.logout.bind(authController),
  });

  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      description: 'Obtener información del usuario autenticado',
      security: [{ Bearer: [] }],
    },
    preHandler: authMiddleware,
    handler: authController.me.bind(authController),
  });
}
