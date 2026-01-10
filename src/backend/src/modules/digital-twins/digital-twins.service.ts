/**
 * Digital Twins Service - Proxy to Eclipse Ditto
 */
import type { DittoThing, DittoThingsList, CreateThingDto, UpdateThingDto, ThingQueryParams } from './digital-twins.types';

const DITTO_URL = process.env.DITTO_URL || 'http://localhost:30080';
const DITTO_USERNAME = process.env.DITTO_USERNAME || 'ditto';
const DITTO_PASSWORD = process.env.DITTO_PASSWORD || 'ditto';
const DITTO_AUTH = Buffer.from(`${DITTO_USERNAME}:${DITTO_PASSWORD}`).toString('base64');

class DittoClient {
  private baseUrl = `${DITTO_URL}/api/2`;

  private getHeaders() {
    return {
      'Authorization': `Basic ${DITTO_AUTH}`,
      'Content-Type': 'application/json',
    };
  }

  async get(url: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Ditto API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async put(url: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Ditto API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async patch(url: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Ditto API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async delete(url: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Ditto API error: ${response.status} ${response.statusText}`);
    }
  }
}

export class DigitalTwinsService {
  private dittoClient = new DittoClient();

  /**
   * List Things with filters
   */
  async listThings(tenantId: string, params: ThingQueryParams): Promise<DittoThingsList> {
    const filters: string[] = [];

    // Filter by namespace (use 'acme' for now, should be mapped from tenant)
    // TODO: Map tenantId to namespace (e.g., tenant slug)
    const namespace = params.namespace || 'acme';
    filters.push(`like(thingId,"${namespace}:*")`);

    // Filter by type
    if (params.type) {
      filters.push(`eq(attributes/type,"${params.type}")`);
    }

    const filterQuery = filters.length > 0 ? `and(${filters.join(',')})` : '';
    const url = filterQuery 
      ? `/search/things?filter=${encodeURIComponent(filterQuery)}`
      : '/search/things';

    return this.dittoClient.get(url);
  }

  /**
   * Get a single Thing by ID
   */
  async getThing(thingId: string): Promise<DittoThing> {
    return this.dittoClient.get(`/things/${thingId}`);
  }

  /**
   * Create a new Thing
   */
  async createThing(dto: CreateThingDto): Promise<DittoThing> {
    const thingData: any = {
      attributes: dto.attributes,
      features: dto.features,
    };

    return this.dittoClient.put(`/things/${dto.thingId}`, thingData);
  }

  /**
   * Update a Thing
   */
  async updateThing(thingId: string, dto: UpdateThingDto): Promise<DittoThing> {
    return this.dittoClient.patch(`/things/${thingId}`, dto);
  }

  /**
   * Delete a Thing
   */
  async deleteThing(thingId: string): Promise<void> {
    return this.dittoClient.delete(`/things/${thingId}`);
  }

  /**
   * Update Thing attributes
   */
  async updateAttributes(thingId: string, attributes: Record<string, any>): Promise<void> {
    return this.dittoClient.patch(`/things/${thingId}/attributes`, attributes);
  }

  /**
   * Update Feature properties
   */
  async updateFeatureProperties(
    thingId: string,
    featureId: string,
    properties: Record<string, any>
  ): Promise<void> {
    return this.dittoClient.patch(
      `/things/${thingId}/features/${featureId}/properties`,
      properties
    );
  }
}
