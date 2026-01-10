import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Http2SecureServer, Http2Server } from 'http2';
import { logger } from '../utils/logger.js';
import { authService } from '../../modules/auth/auth.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

type AnyHttpServer = HttpServer | HttpsServer | Http2Server | Http2SecureServer;

export class WebSocketGatewayService {
  private io: SocketIOServer | null = null;
  private connections: Map<string, AuthenticatedSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: AnyHttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
      path: '/ws',
      transports: ['websocket', 'polling'],
    });

    this.io.use(this.authMiddleware.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket Gateway initialized');
  }

  /**
   * Authentication middleware for WebSocket connections
   */
  private async authMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = authService.verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.tenantId = payload.tenantId;
      socket.role = payload.role;

      next();
    } catch (error: any) {
      logger.error('WebSocket authentication failed', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, tenantId, role } = socket;
    logger.info(`WebSocket client connected: ${socket.id}`, { userId, tenantId, role });

    this.connections.set(socket.id, socket);

    // Handle room subscriptions
    socket.on('subscribe', (data: { room: string }) => {
      this.handleSubscribe(socket, data.room);
    });

    socket.on('unsubscribe', (data: { room: string }) => {
      this.handleUnsubscribe(socket, data.room);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle room subscription
   */
  private handleSubscribe(socket: AuthenticatedSocket, room: string): void {
    // Validate room format: well:{id}, field:{id}, asset:{id}, alarms:{tenantId}
    if (!this.isValidRoom(room, socket.tenantId!)) {
      socket.emit('error', { message: 'Invalid room format or unauthorized' });
      return;
    }

    socket.join(room);

    if (!this.subscriptions.has(room)) {
      this.subscriptions.set(room, new Set());
    }
    this.subscriptions.get(room)!.add(socket.id);

    logger.debug(`Socket ${socket.id} subscribed to room: ${room}`);
    socket.emit('subscribed', { room, timestamp: new Date().toISOString() });
  }

  /**
   * Handle room unsubscription
   */
  private handleUnsubscribe(socket: AuthenticatedSocket, room: string): void {
    socket.leave(room);

    if (this.subscriptions.has(room)) {
      this.subscriptions.get(room)!.delete(socket.id);
      if (this.subscriptions.get(room)!.size === 0) {
        this.subscriptions.delete(room);
      }
    }

    logger.debug(`Socket ${socket.id} unsubscribed from room: ${room}`);
    socket.emit('unsubscribed', { room, timestamp: new Date().toISOString() });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    logger.info(`WebSocket client disconnected: ${socket.id}`);

    // Remove from all subscriptions
    this.subscriptions.forEach((sockets, room) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.subscriptions.delete(room);
      }
    });

    this.connections.delete(socket.id);
  }

  /**
   * Validate room format and permissions
   */
  private isValidRoom(room: string, tenantId: string): boolean {
    const validPatterns = [
      /^well:[a-f0-9-]{36}$/,
      /^field:[a-f0-9-]{36}$/,
      /^asset:[a-f0-9-]{36}$/,
      /^basin:[a-f0-9-]{36}$/,
      /^reservoir:[a-f0-9-]{36}$/,
      /^alarms:[a-f0-9-]{36}$/,
      /^events:[a-f0-9-]{36}$/,
    ];

    const isValid = validPatterns.some((pattern) => pattern.test(room));

    if (!isValid) {
      return false;
    }

    // Check if room belongs to user's tenant
    if (room.startsWith('alarms:') || room.startsWith('events:')) {
      const roomTenantId = room.split(':')[1];
      return roomTenantId === tenantId;
    }

    return true;
  }

  /**
   * Broadcast data to a specific room
   */
  broadcast(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Broadcast to room ${room}:`, { event, dataKeys: Object.keys(data) });
  }

  /**
   * Broadcast to multiple rooms
   */
  broadcastToRooms(rooms: string[], event: string, data: any): void {
    rooms.forEach((room) => this.broadcast(room, event, data));
  }

  /**
   * Send message to specific socket
   */
  sendToSocket(socketId: string, event: string, data: any): void {
    const socket = this.connections.get(socketId);
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get active connections count
   */
  getConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * Get subscriptions count
   */
  getSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get stats
   */
  getStats(): {
    connections: number;
    rooms: number;
    subscriptions: Map<string, number>;
  } {
    const subscriptions = new Map<string, number>();
    this.subscriptions.forEach((sockets, room) => {
      subscriptions.set(room, sockets.size);
    });

    return {
      connections: this.connections.size,
      rooms: this.subscriptions.size,
      subscriptions,
    };
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    if (this.io) {
      logger.info('Shutting down WebSocket Gateway...');
      
      // Disconnect all clients
      this.io.disconnectSockets();
      
      // Close server
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          logger.info('WebSocket Gateway closed');
          resolve();
        });
      });

      this.io = null;
      this.connections.clear();
      this.subscriptions.clear();
    }
  }
}

export const websocketGateway = new WebSocketGatewayService();
