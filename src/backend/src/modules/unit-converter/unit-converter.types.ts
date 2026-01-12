import type { Unit } from '../../common/database/schema';

export interface ConvertUnitsRequest {
  value: number;
  fromUnitId: string;
  toUnitId: string;
}

export interface ConvertUnitsResponse {
  originalValue: number;
  convertedValue: number;
  fromUnit: Unit;
  toUnit: Unit;
  formula: string;
}

export interface ValidateCompatibilityRequest {
  unitId1: string;
  unitId2: string;
}

export interface ValidateCompatibilityResponse {
  compatible: boolean;
  reason?: string;
}
