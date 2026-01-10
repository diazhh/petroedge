import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger.js';

export interface WebSocketGatewayConfig {
  httpServer: HTTPServer;
  corsOrigin: string;
  path: string;
}

export interface SubscriptionInfo {
  socketId: string;
  userId: string;
  tenantId: string;
  rooms: Set<string>;
}

/**
 * WebSocket Gateway Service
 * 
 * Gestiona conexiones WebSocket en tiempo real:
 * - Autenticación de clientes
 * - Sistema de rooms por recurso
 * - Broadcast de eventos
 * - Gestión de suscripciones
 */
export class WebSocketGatewayService {
  private io: SocketIOServer | null = null;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();

  constructor(private config: WebSocketGatewayConfig) {}

  /**
   * Inicializar WebSocket server
   */
  initialize(): void {
    logger.info('Initializing WebSocket Gateway...');

    this.io = new SocketIOServer(this.config.httpServer, {
      path: this.config.path,
      cors: {
        origin: this.config.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Middleware de autenticación
    this.io.use(this.authenticationMiddleware.bind(this));

    // Eventos de conexión
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket Gateway initialized', {
      path: this.config.path,
      cors: this.config.corsOrigin,
    });
  }

  /**
   * Middleware de autenticación
   */
  private async authenticationMiddleware(
    socket: Socket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // TODO: Validar JWT token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // socket.data.userId = decoded.userId;
      // socket.data.tenantId = decoded.tenantId;

      // Mock para desarrollo
      socket.data.userId = 'mock-user-id';
      socket.data.tenantId = 'mock-tenant-id';

      next();
    } catch (error) {
      logger.error('WebSocket authentication failed', { error });
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Manejar nueva conexión
   */
  private handleConnection(socket: Socket): void {
    const { userId, tenantId } = socket.data;

    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId,
      tenantId,
    });

    // Registrar suscripción
    this.subscriptions.set(socket.id, {
      socketId: socket.id,
      userId,
      tenantId,
      rooms: new Set(),
    });

    // Unir a room del tenant automáticamente
    const tenantRoom = `tenant:${tenantId}`;
    socket.join(tenantRoom);
    this.subscriptions.get(socket.id)?.rooms.add(tenantRoom);

    // Eventos del cliente
    socket.on('subscribe', (data) => this.handleSubscribe(socket, data));
    socket.on('unsubscribe', (data) => this.handleUnsubscribe(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Enviar confirmación de conexión
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Manejar suscripción a room
   */
  private handleSubscribe(socket: Socket, data: any): void {
    const { room } = data;

    if (!room) {
      socket.emit('error', { message: 'Room name required' });
      return;
    }

    // Validar permisos (TODO: implementar validación real)
    const hasPermission = this.validateRoomPermission(socket, room);

    if (!hasPermission) {
      socket.emit('error', { message: 'Permission denied' });
      return;
    }

    // Unir a room
    socket.join(room);
    this.subscriptions.get(socket.id)?.rooms.add(room);

    logger.debug('Client subscribed to room', {
      socketId: socket.id,
      room,
    });

    socket.emit('subscribed', { room });
  }

  /**
   * Manejar desuscripción de room
   */
  private handleUnsubscribe(socket: Socket, data: any): void {
    const { room } = data;

    if (!room) {
      socket.emit('error', { message: 'Room name required' });
      return;
    }

    // Salir de room
    socket.leave(room);
    this.subscriptions.get(socket.id)?.rooms.delete(room);

    logger.debug('Client unsubscribed from room', {
      socketId: socket.id,
      room,
    });

    socket.emit('unsubscribed', { room });
  }

  /**
   * Manejar desconexión
   */
  private handleDisconnect(socket: Socket): void {
    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId: socket.data.userId,
    });

    this.subscriptions.delete(socket.id);
  }

  /**
   * Validar permisos de room
   */
  private validateRoomPermission(socket: Socket, room: string): boolean {
    const { tenantId } = socket.data;

    // Validar que el room pertenece al tenant del usuario
    if (room.startsWith('tenant:')) {
      const roomTenantId = room.split(':')[1];
      return roomTenantId === tenantId;
    }

    if (room.startsWith('asset:') || room.startsWith('well:') || room.startsWith('field:')) {
      // TODO: Validar que el asset pertenece al tenant
      return true;
    }

    if (room.startsWith('alarms:')) {
      const roomTenantId = room.split(':')[1];
      return roomTenantId === tenantId;
    }

    return false;
  }

  /**
   * Broadcast a room específico
   */
  broadcastToRoom(room: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(room).emit(event, data);

    logger.debug('Broadcast to room', {
      room,
      event,
      dataKeys: Object.keys(data),
    });
  }

  /**
   * Broadcast a múltiples rooms
   */
  broadcastToRooms(rooms: string[], event: string, data: any): void {
    rooms.forEach((room) => this.broadcastToRoom(room, event, data));
  }

  /**
   * Broadcast a tenant
   */
  broadcastToTenant(tenantId: string, event: string, data: any): void {
    this.broadcastToRoom(`tenant:${tenantId}`, event, data);
  }

  /**
   * Broadcast a asset
   */
  broadcastToAsset(assetId: string, event: string, data: any): void {
    this.broadcastToRoom(`asset:${assetId}`, event, data);
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalConnections: number;
    totalRooms: number;
    subscriptions: Array<{ socketId: string; userId: string; rooms: string[] }>;
  } {
    const subscriptions = Array.from(this.subscriptions.values()).map((sub) => ({
      socketId: sub.socketId,
      userId: sub.userId,
      rooms: Array.from(sub.rooms),
    }));

    return {
      totalConnections: this.subscriptions.size,
      totalRooms: this.io?.sockets.adapter.rooms.size || 0,
      subscriptions,
    };
  }

  /**
   * Cerrar servicio
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket Gateway...');

    if (this.io) {
      // Desconectar todos los clientes
      this.io.disconnectSockets();
      this.io.close();
      this.io = null;
    }

    this.subscriptions.clear();

    logger.info('WebSocket Gateway shut down');
  }
}
