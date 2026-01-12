import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

export interface DittoFeature {
  properties: Record<string, any>;
}

export interface DittoThing {
  thingId: string;
  policyId: string;
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}

export interface DittoPolicy {
  policyId: string;
  entries: Record<string, {
    subjects: Record<string, { type: string }>;
    resources: Record<string, { grant: string[]; revoke: string[] }>;
  }>;
}

/**
 * Client service for Eclipse Ditto Digital Twins Platform
 */
export class DittoClientService {
  private baseUrl: string;
  private auth: string;

  constructor() {
    // Use nginx proxy URL for secure access
    this.baseUrl = process.env.NGINX_DITTO_URL || CONFIG.ditto.url;
    
    // Authentication for Nginx (scadaerp user) or direct Ditto access
    const username = process.env.NGINX_USERNAME || CONFIG.ditto.username || 'scadaerp';
    const password = process.env.NGINX_PASSWORD || CONFIG.ditto.password || 'scadaerp_secure_password';
    
    this.auth = `Basic ${Buffer.from(
      `${username}:${password}`
    ).toString('base64')}`;
    
    logger.debug(`DittoClientService initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Helper method to get common headers
   */
  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Authorization': this.auth,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  /**
   * Get a Thing from Ditto
   */
  async getThing(thingId: string): Promise<DittoThing | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get thing: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const json = await response.json() as DittoThing;
      return json;
    } catch (error) {
      logger.error({ error, thingId }, 'Error getting thing');
      throw error;
    }
  }

  /**
   * Get attributes of a Thing from Ditto
   */
  async getThingAttributes(thingId: string): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}/attributes`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get attributes: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      logger.error({ error, thingId }, 'Error getting attributes');
      throw error;
    }
  }

  /**
   * Update a specific attribute of a Thing in Ditto
   */
  async updateThingAttribute(thingId: string, attributePath: string, value: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}/attributes/${attributePath}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to update attribute: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      logger.info({ thingId, attributePath }, 'Thing attribute updated');
    } catch (error) {
      logger.error({ error, thingId, attributePath }, 'Error updating thing attribute');
      throw error;
    }
  }

  /**
   * Get properties of a Feature from Ditto
   */
  async getFeatureProperties(thingId: string, featureId: string): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}/features/${featureId}/properties`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get feature properties: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error getting feature properties');
      throw error;
    }
  }

  /**
   * Update properties of a Feature in Ditto
   */
  async updateFeatureProperties(thingId: string, featureId: string, properties: Record<string, any>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}/features/${featureId}/properties`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(properties),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to update feature properties: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      logger.info({ thingId, featureId }, 'Feature properties updated');
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error updating feature properties');
      throw error;
    }
  }

  /**
   * Patch properties of a Feature in Ditto
   */
  async patchFeatureProperties(thingId: string, featureId: string, properties: Record<string, any>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}/features/${featureId}/properties`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(properties),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to patch feature properties: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      logger.info({ thingId, featureId }, 'Feature properties patched');
    } catch (error) {
      logger.error({ error, thingId, featureId }, 'Error patching feature properties');
      throw error;
    }
  }

  /**
   * Create a new Thing in Ditto
   */
  async createThing(thing: DittoThing): Promise<void> {
    try {
      // Remove policyId if it matches thingId (let Ditto create implicit policy)
      const thingData = { ...thing };
      if (thingData.policyId === thingData.thingId) {
        delete thingData.policyId;
      }
      
      const response = await fetch(`${this.baseUrl}/api/2/things/${thing.thingId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(thingData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create thing: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      logger.info({ thingId: thing.thingId }, 'Thing created');
    } catch (error) {
      logger.error({ error, thing }, 'Error creating thing');
      throw error;
    }
  }

  /**
   * Delete a Thing from Ditto
   */
  async deleteThing(thingId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/things/${thingId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok && response.status !== 404) {
        const errorBody = await response.text();
        throw new Error(`Failed to delete thing: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      logger.info({ thingId }, 'Thing deleted');
    } catch (error) {
      logger.error({ error, thingId }, 'Error deleting thing');
      throw error;
    }
  }

  /**
   * Health check for Ditto API
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      // First try the /status endpoint which is more reliable
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        return { status: 'UP' };
      }
      
      // Fallback to /health endpoint
      const healthResponse = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      });
      
      if (!healthResponse.ok) {
        return { status: 'DOWN' };
      }
      
      const data = await healthResponse.json() as { status: string };
      return data;
    } catch (error) {
      logger.error({ error }, 'Error checking Ditto health');
      throw error;
    }
  }

  /**
   * Crear Policy
   */
  async createPolicy(policy: {
    policyId: string;
    entries: Record<string, any>;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2/policies/${policy.policyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: policy.entries }),
      });

      if (!response.ok && response.status !== 409) {
        throw new Error(`Failed to create policy: ${response.statusText}`);
      }

      if (response.status === 409) {
        logger.info({ policyId: policy.policyId }, 'Policy already exists');
      } else {
        logger.info({ policyId: policy.policyId }, 'Policy created in Ditto');
      }
      
      return true;
    } catch (error) {
      logger.error({ error, policyId: policy.policyId }, 'Error creating policy in Ditto');
      throw error;
    }
  }
}
