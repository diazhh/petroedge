/**
 * Protocol Factory
 * Creates protocol driver instances based on configuration
 */

import { logger } from '../../utils/logger.js';
import {
  IProtocolDriver,
  ProtocolType,
  TagConfig,
  ConnectionConfig,
} from './protocol-interface.js';
import { ModbusService } from '../modbus.service.js';
import { EthernetIpService, EthernetIpConfig } from './ethernet-ip.service.js';
import { S7Service, S7Config } from './s7.service.js';
import { OpcuaService, OpcuaConfig } from './opcua.service.js';

export interface ProtocolDriverConfig {
  protocol: ProtocolType;
  connection: ConnectionConfig & Partial<EthernetIpConfig & S7Config & OpcuaConfig>;
}

export class ProtocolFactory {
  /**
   * Create a protocol driver instance
   */
  static createDriver(config: ProtocolDriverConfig): IProtocolDriver {
    logger.info(`Creating ${config.protocol} driver`);

    switch (config.protocol) {
      case 'modbus':
        return new ModbusService({
          host: config.connection.host,
          port: config.connection.port || 502,
          timeout: config.connection.timeout || 5000,
          retryAttempts: config.connection.retryAttempts || 3,
        });

      case 'ethernet-ip':
        return new EthernetIpService({
          host: config.connection.host,
          slot: config.connection.slot || 0,
          timeout: config.connection.timeout || 5000,
          retryAttempts: config.connection.retryAttempts || 3,
        });

      case 's7':
        return new S7Service({
          host: config.connection.host,
          rack: config.connection.rack || 0,
          slot: config.connection.slot || 1,
          timeout: config.connection.timeout || 5000,
          retryAttempts: config.connection.retryAttempts || 3,
        });

      case 'opcua':
        if (!config.connection.endpointUrl) {
          throw new Error('endpointUrl is required for OPC-UA');
        }
        return new OpcuaService({
          host: config.connection.host,
          endpointUrl: config.connection.endpointUrl,
          securityMode: config.connection.securityMode,
          securityPolicy: config.connection.securityPolicy,
          username: config.connection.username,
          password: config.connection.password,
          timeout: config.connection.timeout || 5000,
          retryAttempts: config.connection.retryAttempts || 3,
        });

      case 'fins':
        throw new Error('FINS protocol not yet implemented');

      case 'mc-protocol':
        throw new Error('MC Protocol not yet implemented');

      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  /**
   * Create multiple drivers from configurations
   */
  static createDrivers(configs: ProtocolDriverConfig[]): Map<string, IProtocolDriver> {
    const drivers = new Map<string, IProtocolDriver>();

    for (const config of configs) {
      const key = `${config.protocol}:${config.connection.host}`;
      try {
        const driver = this.createDriver(config);
        drivers.set(key, driver);
        logger.info(`Created driver: ${key}`);
      } catch (error) {
        logger.error(`Failed to create driver ${key}`, error);
      }
    }

    return drivers;
  }

  /**
   * Validate protocol configuration
   */
  static validateConfig(config: ProtocolDriverConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.protocol) {
      errors.push('Protocol is required');
    }

    if (!config.connection.host && config.protocol !== 'opcua') {
      errors.push('Host is required');
    }

    if (config.protocol === 'opcua' && !config.connection.endpointUrl) {
      errors.push('endpointUrl is required for OPC-UA');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get supported protocols
   */
  static getSupportedProtocols(): ProtocolType[] {
    return ['modbus', 'ethernet-ip', 's7', 'opcua'];
  }

  /**
   * Check if a protocol is supported
   */
  static isProtocolSupported(protocol: string): boolean {
    return this.getSupportedProtocols().includes(protocol as ProtocolType);
  }
}
