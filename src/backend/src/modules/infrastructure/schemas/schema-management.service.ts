/**
 * Schema Management Service
 * Handles validation and management of schemas for asset types
 */

import { DataType, DataTypeValidator, FieldDefinition, SchemaDefinition } from './data-types';

export class SchemaManagementService {
  /**
   * Validate a value against a field definition
   */
  validateValue(value: any, definition: FieldDefinition): { valid: boolean; error?: string } {
    return DataTypeValidator.validate(value, definition);
  }

  /**
   * Validate multiple values against a schema
   */
  validateValues(values: Record<string, any>, schema: SchemaDefinition): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate each field in the schema
    for (const [key, definition] of Object.entries(schema)) {
      const value = values[key];
      const result = this.validateValue(value, definition);

      if (!result.valid) {
        errors[key] = result.error || 'Validation failed';
      }
    }

    // Check for required fields
    for (const [key, definition] of Object.entries(schema)) {
      if (definition.required && !(key in values)) {
        errors[key] = `Required field ${key} is missing`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Coerce values to their correct types according to schema
   */
  coerceValues(values: Record<string, any>, schema: SchemaDefinition): Record<string, any> {
    const coerced: Record<string, any> = {};

    for (const [key, value] of Object.entries(values)) {
      const definition = schema[key];
      if (definition) {
        try {
          coerced[key] = DataTypeValidator.coerce(value, definition.type);
        } catch (error) {
          // If coercion fails, keep original value
          coerced[key] = value;
        }
      } else {
        // Field not in schema, keep as is
        coerced[key] = value;
      }
    }

    return coerced;
  }

  /**
   * Validate a complete schema definition
   */
  validateSchema(schema: SchemaDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, definition] of Object.entries(schema)) {
      // Validate key format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        errors.push(`Invalid key format: ${key}. Must start with letter or underscore and contain only alphanumeric characters and underscores.`);
      }

      // Validate required fields
      if (!definition.name) {
        errors.push(`Field ${key} is missing required property: name`);
      }

      if (!definition.type) {
        errors.push(`Field ${key} is missing required property: type`);
      }

      // Validate type
      if (definition.type && !Object.values(DataType).includes(definition.type)) {
        errors.push(`Field ${key} has invalid type: ${definition.type}`);
      }

      // Validate enum
      if (definition.type === DataType.ENUM) {
        if (!definition.enumValues || definition.enumValues.length === 0) {
          errors.push(`Field ${key} is of type ENUM but has no enumValues defined`);
        }
      }

      // Validate number constraints
      if (definition.type === DataType.NUMBER) {
        if (definition.minValue !== undefined && definition.maxValue !== undefined) {
          if (definition.minValue > definition.maxValue) {
            errors.push(`Field ${key} has minValue greater than maxValue`);
          }
        }
      }

      // Validate pattern
      if (definition.pattern) {
        try {
          new RegExp(definition.pattern);
        } catch (error) {
          errors.push(`Field ${key} has invalid regex pattern: ${definition.pattern}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge schemas (for inheritance)
   */
  mergeSchemas(baseSchema: SchemaDefinition, overrideSchema: SchemaDefinition): SchemaDefinition {
    return {
      ...baseSchema,
      ...overrideSchema,
    };
  }

  /**
   * Get default values from schema
   */
  getDefaultValues(schema: SchemaDefinition): Record<string, any> {
    const defaults: Record<string, any> = {};

    for (const [key, definition] of Object.entries(schema)) {
      if (definition.defaultValue !== undefined) {
        defaults[key] = definition.defaultValue;
      }
    }

    return defaults;
  }

  /**
   * Extract schema from JSONB field
   */
  extractSchema(jsonbSchema: any): SchemaDefinition {
    if (!jsonbSchema || typeof jsonbSchema !== 'object') {
      return {};
    }

    return jsonbSchema as SchemaDefinition;
  }

  /**
   * Validate telemetry schema
   */
  validateTelemetrySchema(schema: SchemaDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, definition] of Object.entries(schema)) {
      // Telemetry must have sampleRate
      if (!('sampleRate' in definition)) {
        errors.push(`Telemetry field ${key} is missing required property: sampleRate`);
      }

      // Validate sampleRate format (e.g., "5s", "1m", "1h")
      if ('sampleRate' in definition) {
        const sampleRate = (definition as any).sampleRate;
        if (!/^\d+[smhd]$/.test(sampleRate)) {
          errors.push(`Telemetry field ${key} has invalid sampleRate format: ${sampleRate}. Expected format: <number><unit> (e.g., "5s", "1m", "1h")`);
        }
      }
    }

    // Also validate base schema
    const baseValidation = this.validateSchema(schema);
    if (!baseValidation.valid) {
      errors.push(...baseValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate computed fields schema
   */
  validateComputedFieldsSchema(computedFields: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(computedFields)) {
      errors.push('Computed fields must be an array');
      return { valid: false, errors };
    }

    for (let i = 0; i < computedFields.length; i++) {
      const field = computedFields[i];

      // Validate required properties
      if (!field.key) {
        errors.push(`Computed field at index ${i} is missing required property: key`);
      }

      if (!field.name) {
        errors.push(`Computed field at index ${i} is missing required property: name`);
      }

      if (!field.formula) {
        errors.push(`Computed field at index ${i} is missing required property: formula`);
      }

      if (!field.recalculateOn || !Array.isArray(field.recalculateOn)) {
        errors.push(`Computed field at index ${i} is missing or has invalid recalculateOn array`);
      }

      // Validate type
      if (field.type && !Object.values(DataType).includes(field.type)) {
        errors.push(`Computed field ${field.key} has invalid type: ${field.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const schemaManagementService = new SchemaManagementService();
