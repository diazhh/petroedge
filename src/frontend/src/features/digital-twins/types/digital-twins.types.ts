/**
 * Digital Twins Types - Eclipse Ditto Integration
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

export type ThingType = 
  | 'BASIN' 
  | 'FIELD' 
  | 'RESERVOIR' 
  | 'WELL' 
  | 'EQUIPMENT' 
  | 'TOOL' 
  | 'DEVICE' 
  | 'SENSOR' 
  | 'ACTUATOR' 
  | 'CUSTOM';

export interface ThingFilters {
  type?: ThingType;
  search?: string;
  namespace?: string;
}

export interface CreateThingInput {
  thingId: string;
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}

export interface UpdateThingInput {
  attributes?: Record<string, any>;
  features?: Record<string, DittoFeature>;
}
