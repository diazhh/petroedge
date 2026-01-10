/**
 * Heartbeat Service (Edge Gateway)
 * 
 * Sends periodic heartbeat messages to Cloud via Kafka to indicate gateway health and status.
 * Includes gateway metadata, system metrics, and connection status.
 */

import { kafkaService } from './kafka.service.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { dataCollectorServiceV2 } from './data-collector-v2.service.js';
import os from 'os';

interface HeartbeatMessage {
  gatewayId: string;
  gatewayName: string;
  siteName: string;
  status: 'online' | 'offline' | 'error';
  timestamp: string;
  uptime: number;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    memoryTotal: number;
    memoryFree: number;
    loadAverage: number[];
  };
  dataCollector: {
    tagsRegistered: number;
    tagsActive: number;
    readingsPerSecond: number;
    errorsPerSecond: number;
    bufferSize: number;
  };
  drivers: Array<{
    protocol: string;
    status: 'connected' | 'disconnected' | 'error';
    host?: string;
    port?: number;
    lastError?: string;
  }>;
  version: string;
}

export class HeartbeatService {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number = 30000; // 30 seconds
  private isRunning: boolean = false;
  private startTime: number = Date.now();

  constructor(intervalMs?: number) {
    if (intervalMs) {
      this.intervalMs = intervalMs;
    }
  }

  /**
   * Start sending heartbeat messages
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Heartbeat Service already running');
      return;
    }

    try {
      // Send initial heartbeat immediately
      await this.sendHeartbeat();

      // Schedule periodic heartbeats
      this.intervalId = setInterval(async () => {
        try {
          await this.sendHeartbeat();
        } catch (error) {
          logger.error('Failed to send heartbeat', error);
          // Don't throw - continue sending heartbeats
        }
      }, this.intervalMs);

      this.isRunning = true;
      logger.info(`✅ Heartbeat Service started (interval: ${this.intervalMs}ms)`);
    } catch (error) {
      logger.error('❌ Failed to start Heartbeat Service', error);
      throw error;
    }
  }

  /**
   * Send heartbeat message to Kafka
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const heartbeat = await this.buildHeartbeatMessage();

      await kafkaService.publish(
        'edge.heartbeat',
        heartbeat,
        config.gateway.id // Use gatewayId as message key
      );

      logger.debug('💓 Heartbeat sent', {
        gatewayId: heartbeat.gatewayId,
        status: heartbeat.status,
        uptime: Math.floor(heartbeat.uptime / 1000) + 's',
      });
    } catch (error) {
      logger.error('Failed to send heartbeat', error);
      throw error;
    }
  }

  /**
   * Build heartbeat message with current gateway status
   */
  private async buildHeartbeatMessage(): Promise<HeartbeatMessage> {
    // Get system metrics
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Calculate CPU usage (average across all cores)
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Get data collector stats
    const collectorStats = dataCollectorServiceV2.getStats();

    // Get driver health status
    const driversHealth = await dataCollectorServiceV2.getDriversHealth();

    // Determine overall status based on driver connectivity
    let status: 'online' | 'offline' | 'error' = 'online';
    const hasDisconnected = driversHealth.some(d => !d.connected || d.error);
    if (hasDisconnected) {
      status = 'error';
    }

    const heartbeat: HeartbeatMessage = {
      gatewayId: config.gateway.id,
      gatewayName: config.gateway.name,
      siteName: config.gateway.siteName,
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      systemMetrics: {
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
        memoryTotal: totalMemory,
        memoryFree: freeMemory,
        loadAverage: os.loadavg(),
      },
      dataCollector: {
        tagsRegistered: collectorStats.tagsCount,
        tagsActive: collectorStats.tagsCount,
        readingsPerSecond: 0, // Not available in current stats
        errorsPerSecond: 0, // Not available in current stats
        bufferSize: collectorStats.bufferSize,
      },
      drivers: driversHealth.map(driver => ({
        protocol: driver.protocol,
        status: driver.connected ? 'connected' : 'disconnected',
        host: undefined, // Not available in current health check
        port: undefined, // Not available in current health check
        lastError: (driver as any).lastError || (driver as any).error,
      })),
      version: process.env.npm_package_version || '1.0.0',
    };

    return heartbeat;
  }

  /**
   * Get heartbeat interval in milliseconds
   */
  getInterval(): number {
    return this.intervalMs;
  }

  /**
   * Get gateway uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Check if heartbeat service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Stop sending heartbeat messages
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Clear interval
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      // Send final heartbeat with offline status
      try {
        await kafkaService.publish(
          'edge.heartbeat',
          {
            gatewayId: config.gateway.id,
            gatewayName: config.gateway.name,
            siteName: config.gateway.siteName,
            status: 'offline',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
          },
          config.gateway.id
        );
      } catch (error) {
        logger.warn('Failed to send final heartbeat', error);
      }

      this.isRunning = false;
      logger.info('Heartbeat Service stopped');
    } catch (error) {
      logger.error('Error stopping Heartbeat Service', error);
      throw error;
    }
  }
}

// Singleton instance
export const heartbeatService = new HeartbeatService();
