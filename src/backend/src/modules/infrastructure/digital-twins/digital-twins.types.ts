export interface CreateDigitalTwinInput {
  type: 'BASIN' | 'FIELD' | 'RESERVOIR' | 'WELL' | 'EQUIPMENT' | 'TOOL';
  code: string;
  name: string;
  description?: string;
  attributes?: Record<string, any>;
  features?: Record<string, DigitalTwinFeature>;
  parentThingId?: string;
}

export interface UpdateDigitalTwinInput {
  attributes?: Record<string, any>;
  features?: Record<string, DigitalTwinFeature>;
}

export interface DigitalTwinFeature {
  properties?: Record<string, any>;
  desiredProperties?: Record<string, any>;
}

export interface DigitalTwin {
  thingId: string;
  policyId?: string;
  attributes?: Record<string, any>;
  features?: Record<string, DigitalTwinFeature>;
}

export interface TelemetryUpdate {
  [tagName: string]: {
    value: any;
    unit?: string;
    timestamp?: string;
  };
}

export interface MigrationRequest {
  entityType: 'basin' | 'field' | 'reservoir' | 'well';
  entityId: string;
}

export interface MigrationResult {
  success: boolean;
  thingId?: string;
  error?: string;
}

export interface BulkMigrationResult {
  basins: number;
  fields: number;
  reservoirs: number;
  wells: number;
  errors: Array<{
    entityType: string;
    entityId: string;
    error: string;
  }>;
}
