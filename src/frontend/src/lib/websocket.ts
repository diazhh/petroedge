/**
 * WebSocket Client Service
 * 
 * Gestiona la conexión WebSocket con el backend para datos en tiempo real.
 * Basado en Socket.IO para comunicación bidireccional.
 */

import { io, Socket } from 'socket.io-client';

// Tipos de eventos del servidor
export interface ServerToClientEvents {
  // Telemetría
  'telemetry:update': (data: TelemetryUpdate) => void;
  'telemetry:batch': (data: TelemetryBatch) => void;
  
  // Cálculos
  'calculation:ipr': (data: IprResult) => void;
  'calculation:vlp': (data: VlpResult) => void;
  'calculation:nodal': (data: NodalResult) => void;
  
  // Alarmas
  'alarm:new': (alarm: Alarm) => void;
  'alarm:ack': (alarmId: string) => void;
  'alarm:clear': (alarmId: string) => void;
  
  // Estado
  'well:status': (data: WellStatus) => void;
  'system:status': (data: SystemStatus) => void;
  
  // Conexión
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: Error) => void;
}

// Tipos de eventos del cliente
export interface ClientToServerEvents {
  // Suscripciones
  'subscribe:well': (wellId: string) => void;
  'subscribe:field': (fieldId: string) => void;
  'subscribe:asset': (assetId: string) => void;
  'subscribe:alarms': (tenantId: string) => void;
  'unsubscribe': (room: string) => void;
  
  // Comandos
  'command:ack-alarm': (alarmId: string) => void;
  'command:request-calculation': (params: CalcRequest) => void;
}

// Tipos de datos
export interface TelemetryUpdate {
  wellId: string;
  timestamp: string;
  metrics: Record<string, number>;
}

export interface TelemetryBatch {
  wellId: string;
  readings: TelemetryUpdate[];
}

export interface IprResult {
  wellId: string;
  testId: string;
  timestamp: string;
  curve: Array<{ rate: number; pressure: number }>;
  aof: number;
  pi: number;
}

export interface VlpResult {
  wellId: string;
  testId: string;
  timestamp: string;
  curve: Array<{ rate: number; pressure: number }>;
}

export interface NodalResult {
  wellId: string;
  testId: string;
  timestamp: string;
  operatingPoint: { rate: number; pressure: number };
  iprCurve: Array<{ rate: number; pressure: number }>;
  vlpCurve: Array<{ rate: number; pressure: number }>;
}

export interface Alarm {
  id: string;
  tenantId: string;
  wellId?: string;
  assetId?: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface WellStatus {
  wellId: string;
  status: 'producing' | 'shut-in' | 'testing' | 'maintenance';
  lastUpdate: string;
}

export interface SystemStatus {
  tenantId: string;
  status: 'online' | 'degraded' | 'offline';
  message?: string;
}

export interface CalcRequest {
  type: 'ipr' | 'vlp' | 'nodal';
  wellId: string;
  testId: string;
}

/**
 * WebSocket Client Manager
 */
class WebSocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private url: string;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(url: string = import.meta.env.VITE_WS_URL || 'http://localhost:3000') {
    this.url = url;
  }

  /**
   * Conectar al servidor WebSocket
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Ya conectado');
      return;
    }

    this.socket = io(this.url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  /**
   * Desconectar del servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('[WebSocket] Desconectado');
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Suscribirse a un pozo
   */
  subscribeToWell(wellId: string): void {
    if (!this.socket) {
      console.warn('[WebSocket] No conectado, no se puede suscribir');
      return;
    }
    this.socket.emit('subscribe:well', wellId);
    console.log(`[WebSocket] Suscrito a well:${wellId}`);
  }

  /**
   * Suscribirse a un campo
   */
  subscribeToField(fieldId: string): void {
    if (!this.socket) {
      console.warn('[WebSocket] No conectado, no se puede suscribir');
      return;
    }
    this.socket.emit('subscribe:field', fieldId);
    console.log(`[WebSocket] Suscrito a field:${fieldId}`);
  }

  /**
   * Suscribirse a un asset
   */
  subscribeToAsset(assetId: string): void {
    if (!this.socket) {
      console.warn('[WebSocket] No conectado, no se puede suscribir');
      return;
    }
    this.socket.emit('subscribe:asset', assetId);
    console.log(`[WebSocket] Suscrito a asset:${assetId}`);
  }

  /**
   * Suscribirse a alarmas
   */
  subscribeToAlarms(tenantId: string): void {
    if (!this.socket) {
      console.warn('[WebSocket] No conectado, no se puede suscribir');
      return;
    }
    this.socket.emit('subscribe:alarms', tenantId);
    console.log(`[WebSocket] Suscrito a alarms:${tenantId}`);
  }

  /**
   * Desuscribirse de un room
   */
  unsubscribe(room: string): void {
    if (!this.socket) return;
    this.socket.emit('unsubscribe', room);
    console.log(`[WebSocket] Desuscrito de ${room}`);
  }

  /**
   * Escuchar un evento
   */
  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.warn('[WebSocket] No conectado, no se puede escuchar eventos');
      return;
    }

    this.socket.on(event, callback as any);

    // Guardar referencia para cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Dejar de escuchar un evento
   */
  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback as any);
      this.listeners.get(event)?.delete(callback);
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  /**
   * Enviar comando de reconocimiento de alarma
   */
  acknowledgeAlarm(alarmId: string): void {
    if (!this.socket) return;
    this.socket.emit('command:ack-alarm', alarmId);
  }

  /**
   * Solicitar cálculo
   */
  requestCalculation(params: CalcRequest): void {
    if (!this.socket) return;
    this.socket.emit('command:request-calculation', params);
  }

  /**
   * Configurar manejadores de eventos de conexión
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Conectado al servidor');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Desconectado: ${reason}`);
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[WebSocket] Intento de reconexión ${attempt}/${this.maxReconnectAttempts}`);
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('[WebSocket] Falló la reconexión después de múltiples intentos');
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log(`[WebSocket] Reconectado después de ${attempt} intentos`);
    });
  }
}

// Instancia singleton
export const wsClient = new WebSocketClient();

export default wsClient;
