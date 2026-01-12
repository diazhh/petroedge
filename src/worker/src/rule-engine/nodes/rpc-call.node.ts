import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface RpcCallConfig extends RuleNodeConfig {
  deviceIdKey?: string; // Key to get device ID (default: 'deviceId')
  method: string; // RPC method name (required)
  params?: Record<string, string>; // Parameters mapping (optional)
  timeout?: number; // Timeout in ms (default: 5000)
}

/**
 * RPC Call Node
 * 
 * Makes Remote Procedure Call to a device or service.
 * Used for device control and command execution.
 * 
 * Config:
 * - deviceIdKey: Key to get device ID (default: 'deviceId')
 * - method: RPC method name (required)
 * - params: Parameter mapping from message to RPC params (optional)
 * - timeout: Request timeout in ms (default: 5000)
 * 
 * Common RPC methods:
 * - 'setpoint': Set device setpoint
 * - 'start', 'stop': Control device operation
 * - 'reset': Reset device state
 * - 'configure': Update device configuration
 * 
 * Example:
 * Send command to close valve when pressure exceeds threshold
 */
export class RpcCallNode extends RuleNode {
  constructor(config: RpcCallConfig) {
    super('rpc_call', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as RpcCallConfig;
    const deviceIdKey = config.deviceIdKey || 'deviceId';
    const timeout = config.timeout || 5000;

    const deviceId = message.data[deviceIdKey];
    if (!deviceId) {
      this.log(context, 'warn', `Device ID not found at ${deviceIdKey}`);
      return null;
    }

    if (!config.method) {
      this.log(context, 'error', 'RPC method not configured');
      return null;
    }

    try {
      // Build RPC parameters
      const params: Record<string, any> = {};
      if (config.params) {
        for (const [paramName, messagePath] of Object.entries(config.params)) {
          const value = this.getNestedValue(message, messagePath);
          if (value !== undefined) {
            params[paramName] = value;
          }
        }
      }

      const rpcRequest = {
        deviceId,
        method: config.method,
        params,
        timeout,
        requestId: `rpc_${Date.now()}`,
      };

      // TODO: Integrate with RPC service/MQTT
      // For now, just log
      this.log(context, 'info', 'RPC call sent', rpcRequest);

      return {
        ...message,
        data: {
          ...message.data,
          rpcSent: true,
          rpcRequestId: rpcRequest.requestId,
          rpcMethod: config.method,
        },
      };
    } catch (error) {
      this.log(context, 'error', 'Failed to send RPC call', { error, deviceId });
      return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
