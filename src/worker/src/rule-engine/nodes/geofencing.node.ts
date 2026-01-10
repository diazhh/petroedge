import { RuleNode, RuleNodeConfig, RuleNodeMessage, RuleNodeContext } from '../node-registry.js';

export interface GeofencingNodeConfig extends RuleNodeConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  condition: 'INSIDE' | 'OUTSIDE';
}

export class GeofencingNode extends RuleNode {
  constructor(config: GeofencingNodeConfig) {
    super('geofencing', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    try {
      const config = this.config as GeofencingNodeConfig;
      const lat = message.data.latitude || message.data.lat;
      const lon = message.data.longitude || message.data.lon || message.data.lng;

      if (lat === undefined || lon === undefined) {
        this.log(context, 'warn', 'No coordinates found in message');
        return null;
      }

      const distance = this.calculateDistance(
        lat,
        lon,
        config.latitude,
        config.longitude
      );

      const isInside = distance <= config.radiusMeters;
      const conditionMet = config.condition === 'INSIDE' ? isInside : !isInside;

      if (conditionMet) {
        this.log(context, 'info', 'Geofencing condition met', {
          distance,
          radiusMeters: config.radiusMeters,
          condition: config.condition,
        });
        return {
          ...message,
          data: {
            ...message.data,
            distanceMeters: distance,
            geofenceConditionMet: true,
          },
        };
      } else {
        this.log(context, 'info', 'Geofencing condition not met', {
          distance,
          radiusMeters: config.radiusMeters,
          condition: config.condition,
        });
        return null;
      }
    } catch (error) {
      this.log(context, 'error', 'Geofencing error', { error: (error as Error).message });
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
