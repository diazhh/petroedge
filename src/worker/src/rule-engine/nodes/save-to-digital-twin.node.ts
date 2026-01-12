import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

/**
 * Save to Digital Twin Node
 * 
 * Writes telemetry data to Digital Twin in Eclipse Ditto.
 * Optionally saves to TimescaleDB, caches in Redis, and broadcasts via WebSocket.
 * 
 * Input: Message with thingId, features (feature → properties)
 * Output: Same message with save confirmation metadata
 */

export interface SaveToDigitalTwinNodeConfig extends RuleNodeConfig {
  updateDitto: boolean; // Write to Eclipse Ditto
  saveTimeSeries: boolean; // Save to TimescaleDB
  cacheInRedis: boolean; // Cache current values in Redis
  broadcastWebSocket: boolean; // Broadcast to WebSocket clients
}

export class SaveToDigitalTwinNode extends RuleNode {
  constructor(config: SaveToDigitalTwinNodeConfig) {
    super('save_to_digital_twin', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage> {
    const config = this.config as SaveToDigitalTwinNodeConfig;
    const thingId = message.data.thingId;
    const features = message.data.features;

    if (!thingId || !features) {
      this.log(context, 'warn', 'Missing thingId or features in message data');
      throw new Error('Missing thingId or features');
    }

    const results: Record<string, boolean> = {
      ditto: false,
      timeseries: false,
      redis: false,
      websocket: false,
    };

    // 1. Update Eclipse Ditto
    if (config.updateDitto && context.ditto) {
      try {
        for (const [featureName, properties] of Object.entries(features)) {
          await context.ditto.updateFeatureProperties(thingId, featureName, properties as Record<string, any>);
        }
        results.ditto = true;
        this.log(context, 'debug', 'Updated Ditto features', {
          thingId,
          featureCount: Object.keys(features).length,
        });
      } catch (error: any) {
        this.log(context, 'error', 'Failed to update Ditto', {
          thingId,
          error: error.message,
        });
      }
    }

    // 2. Save to TimescaleDB
    if (config.saveTimeSeries && context.db) {
      try {
        const timestamp = message.timestamp || new Date().toISOString();

        for (const [featureName, properties] of Object.entries(features)) {
          for (const [propertyName, value] of Object.entries(properties as Record<string, any>)) {
            await context.db.query(
              `INSERT INTO asset_telemetry (thing_id, feature, property, value, timestamp, tenant_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [thingId, featureName, propertyName, value, timestamp, context.tenantId]
            );
          }
        }

        results.timeseries = true;
        this.log(context, 'debug', 'Saved to TimescaleDB', { thingId });
      } catch (error: any) {
        this.log(context, 'error', 'Failed to save timeseries', {
          thingId,
          error: error.message,
        });
      }
    }

    // 3. Cache in Redis
    if (config.cacheInRedis && context.redis) {
      try {
        const cacheKey = `thing:${thingId}:current`;
        const cacheValue = JSON.stringify({
          features,
          timestamp: message.timestamp || new Date().toISOString(),
        });

        await context.redis.setex(cacheKey, 300, cacheValue); // 5 min TTL
        results.redis = true;

        this.log(context, 'debug', 'Cached in Redis', { thingId });
      } catch (error: any) {
        this.log(context, 'error', 'Failed to cache in Redis', {
          thingId,
          error: error.message,
        });
      }
    }

    // 4. Broadcast via WebSocket
    if (config.broadcastWebSocket && context.websocket) {
      try {
        await context.websocket.broadcast(`thing:${thingId}`, {
          type: 'TELEMETRY_UPDATE',
          thingId,
          features,
          timestamp: message.timestamp || new Date().toISOString(),
        });

        results.websocket = true;
        this.log(context, 'debug', 'Broadcasted via WebSocket', { thingId });
      } catch (error: any) {
        this.log(context, 'error', 'Failed to broadcast WebSocket', {
          thingId,
          error: error.message,
        });
      }
    }

    this.log(context, 'info', 'Saved to digital twin', {
      thingId,
      results,
    });

    // Return message with save results
    return {
      ...message,
      metadata: {
        ...message.metadata,
        saveResults: results,
      },
    };
  }
}
