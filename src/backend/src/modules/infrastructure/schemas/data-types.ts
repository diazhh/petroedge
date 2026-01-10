/**
 * Data Types Module
 * Defines all data types supported in the system for attributes, telemetry, and computed fields
 */

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  JSON = 'json',
  ENUM = 'enum',
}

export interface FieldDefinition {
  key: string;
  name: string;
  type: DataType;
  unit?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  enumValues?: string[];
  minValue?: number;
  maxValue?: number;
  pattern?: string; // Regex for validation
  sampleRate?: string; // For telemetry (e.g., "5s", "1m", "1h")
  quality?: string[]; // For telemetry quality values
}

export interface TelemetryDefinition extends FieldDefinition {
  sampleRate: string;
  quality?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface ComputedFieldDefinition extends FieldDefinition {
  formula: string;
  recalculateOn: string[]; // Dependencies (e.g., ["telemetry.oilRate", "attributes.density"])
}

export interface SchemaDefinition {
  [key: string]: FieldDefinition;
}

/**
 * Type guards
 */
export function isTelemetryDefinition(def: FieldDefinition): def is TelemetryDefinition {
  return 'sampleRate' in def;
}

export function isComputedFieldDefinition(def: FieldDefinition): def is ComputedFieldDefinition {
  return 'formula' in def && 'recalculateOn' in def;
}

/**
 * Data type validation helpers
 */
export class DataTypeValidator {
  static validate(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    // Required check
    if (definition.required && (value === null || value === undefined)) {
      return { valid: false, error: `Field ${definition.key} is required` };
    }

    // Skip validation if value is null/undefined and not required
    if (value === null || value === undefined) {
      return { valid: true };
    }

    // Type-specific validation
    switch (definition.type) {
      case DataType.STRING:
        return this.validateString(value, definition);
      case DataType.NUMBER:
        return this.validateNumber(value, definition);
      case DataType.BOOLEAN:
        return this.validateBoolean(value, definition);
      case DataType.DATE:
      case DataType.DATETIME:
        return this.validateDate(value, definition);
      case DataType.JSON:
        return this.validateJSON(value, definition);
      case DataType.ENUM:
        return this.validateEnum(value, definition);
      default:
        return { valid: false, error: `Unknown data type: ${definition.type}` };
    }
  }

  private static validateString(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    if (typeof value !== 'string') {
      return { valid: false, error: `Expected string, got ${typeof value}` };
    }

    if (definition.pattern) {
      const regex = new RegExp(definition.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: `Value does not match pattern: ${definition.pattern}` };
      }
    }

    return { valid: true };
  }

  private static validateNumber(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (typeof num !== 'number' || isNaN(num)) {
      return { valid: false, error: `Expected number, got ${typeof value}` };
    }

    if (definition.minValue !== undefined && num < definition.minValue) {
      return { valid: false, error: `Value ${num} is less than minimum ${definition.minValue}` };
    }

    if (definition.maxValue !== undefined && num > definition.maxValue) {
      return { valid: false, error: `Value ${num} is greater than maximum ${definition.maxValue}` };
    }

    return { valid: true };
  }

  private static validateBoolean(value: any, _definition: FieldDefinition): { valid: boolean; error?: string } {
    if (typeof value !== 'boolean') {
      return { valid: false, error: `Expected boolean, got ${typeof value}` };
    }

    return { valid: true };
  }

  private static validateDate(value: any, _definition: FieldDefinition): { valid: boolean; error?: string } {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return { valid: false, error: `Invalid date: ${value}` };
    }

    return { valid: true };
  }

  private static validateJSON(value: any, _definition: FieldDefinition): { valid: boolean; error?: string } {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
      } catch (error: any) {
        return { valid: false, error: `Invalid JSON: ${error?.message || 'Parse error'}` };
      }
    } else if (typeof value !== 'object') {
      return { valid: false, error: `Expected JSON object, got ${typeof value}` };
    }

    return { valid: true };
  }

  private static validateEnum(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    if (!definition.enumValues || definition.enumValues.length === 0) {
      return { valid: false, error: 'Enum values not defined' };
    }

    if (!definition.enumValues.includes(String(value))) {
      return { valid: false, error: `Value must be one of: ${definition.enumValues.join(', ')}` };
    }

    return { valid: true };
  }

  /**
   * Coerce value to the correct type
   */
  static coerce(value: any, type: DataType): any {
    switch (type) {
      case DataType.STRING:
        return String(value);
      case DataType.NUMBER:
        return typeof value === 'string' ? parseFloat(value) : Number(value);
      case DataType.BOOLEAN:
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      case DataType.DATE:
      case DataType.DATETIME:
        return new Date(value).toISOString();
      case DataType.JSON:
        return typeof value === 'string' ? JSON.parse(value) : value;
      case DataType.ENUM:
        return String(value);
      default:
        return value;
    }
  }
}
