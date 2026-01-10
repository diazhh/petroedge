import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service';
import type { LoginInput, RegisterInput, RefreshTokenInput } from './auth.schema';

export class AuthController {
  async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = await authService.register(request.body);

      return reply.code(201).send({
        success: true,
        data: user,
        message: 'Usuario registrado exitosamente',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    try {
      const tokens = await authService.login(request.body);

      return reply.send({
        success: true,
        data: tokens,
        message: 'Login exitoso',
      });
    } catch (error: any) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error.message,
        },
      });
    }
  }

  async refresh(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ) {
    try {
      const tokens = await authService.refreshAccessToken(request.body.refreshToken);

      return reply.send({
        success: true,
        data: tokens,
        message: 'Token renovado exitosamente',
      });
    } catch (error: any) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: error.message,
        },
      });
    }
  }

  async logout(
    request: FastifyRequest<{ Body: RefreshTokenInput }>,
    reply: FastifyReply
  ) {
    try {
      await authService.logout(request.body.refreshToken);

      return reply.send({
        success: true,
        message: 'Logout exitoso',
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: error.message,
        },
      });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      success: true,
      data: request.user,
    });
  }
}

export const authController = new AuthController();
