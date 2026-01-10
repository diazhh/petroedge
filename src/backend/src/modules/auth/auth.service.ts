import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '../../common/database';
import { config } from '../../common/config';
import type { LoginCredentials, RegisterData, AuthTokens, JWTPayload } from './auth.types';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(data: RegisterData) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existingUsername) {
      throw new Error('El username ya está en uso');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const [newUser] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      tenantId: data.tenantId,
      role: 'viewer',
      status: 'active',
    }).returning();

    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, credentials.email),
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (user.status !== 'active') {
      throw new Error('Usuario inactivo');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async refreshAccessToken(token: string): Promise<AuthTokens> {
    const storedToken = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, token),
      with: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new Error('Refresh token inválido');
    }

    if (new Date() > storedToken.expiresAt) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
      throw new Error('Refresh token expirado');
    }

    if (storedToken.user.status !== 'active') {
      throw new Error('Usuario inactivo');
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

    const tokens = await this.generateTokens(storedToken.user);

    return tokens;
  }

  async logout(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
      return payload;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
}

export const authService = new AuthService();
