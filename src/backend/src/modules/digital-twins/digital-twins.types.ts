/**
 * Digital Twins Module Types
 */

export interface DittoFeature {
  properties: Record<string, any>;
}

export interface DittoThing {
  thingId: string;
  policyId?: string;
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
  _revision?: number;
  _modified?: string;
  _created?: string;
}

export interface DittoThingsList {
  items: DittoThing[];
  cursor?: string;
}

export interface CreateThingDto {
  thingId: string;
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}

export interface UpdateThingDto {
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}

export interface ThingQueryParams {
  type?: string;
  namespace?: string;
  search?: string;
}
