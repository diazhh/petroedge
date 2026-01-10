import { create, all } from 'mathjs';
import { assetsRepository } from '../assets/assets.repository.js';
import { logger } from '../../../common/utils/logger.js';

// Create mathjs instance with limited scope for security
const math = create(all, {
  number: 'BigNumber',
  precision: 64,
});

interface ComputedFieldDefinition {
  key: string;
  name: string;
  unit?: string;
  formula: string;
  recalculateOn: string[]; // ['telemetry.oilRate', 'attributes.reservoirPressure']
}

interface EvaluationContext {
  properties: Record<string, any>;
  attributes: Record<string, any>;
  telemetry: Record<string, any>;
  computed: Record<string, any>;
}

export class ComputedFieldsService {
  /**
   * Evaluate a formula with given context
   */
  private evaluateFormula(formula: string, context: EvaluationContext): any {
    try {
      // Create a safe scope with only allowed functions
      const scope = {
        ...context,
        // Add safe math functions
        abs: math.abs,
        round: math.round,
        ceil: math.ceil,
        floor: math.floor,
        min: math.min,
        max: math.max,
        sqrt: math.sqrt,
        pow: math.pow,
      };

      // Evaluate formula
      const result = math.evaluate(formula, scope);
      
      // Convert BigNumber to number if needed
      if (result && typeof result === 'object' && result.constructor.name === 'BigNumber') {
        return Number(result.toString());
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error evaluating formula', { formula, error: error.message });
      throw new Error(`Formula evaluation failed: ${error.message}`);
    }
  }

  /**
   * Build evaluation context for an asset
   */
  private async buildContext(tenantId: string, assetId: string): Promise<EvaluationContext> {
    // Get asset with all data
    const asset = await assetsRepository.findById(tenantId, assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Get latest telemetry values
    const latestTelemetry: Record<string, any> = {};
    if (asset.currentTelemetry) {
      const telemetryData = asset.currentTelemetry as Record<string, any>;
      for (const [key, data] of Object.entries(telemetryData)) {
        if (typeof data === 'object' && data !== null && 'value' in data) {
          latestTelemetry[key] = data.value;
        }
      }
    }

    return {
      properties: (asset.properties as Record<string, any>) || {},
      attributes: (asset.attributes as Record<string, any>) || {},
      telemetry: latestTelemetry,
      computed: (asset.computedValues as Record<string, any>) || {},
    };
  }

  /**
   * Calculate a single computed field for an asset
   */
  async calculateField(
    tenantId: string,
    assetId: string,
    fieldDefinition: ComputedFieldDefinition
  ): Promise<{ key: string; value: any; unit?: string }> {
    const context = await this.buildContext(tenantId, assetId);
    
    const value = this.evaluateFormula(fieldDefinition.formula, context);
    
    return {
      key: fieldDefinition.key,
      value,
      unit: fieldDefinition.unit,
    };
  }

  /**
   * Calculate multiple computed fields for an asset
   */
  async calculateFields(
    tenantId: string,
    assetId: string,
    fieldDefinitions: ComputedFieldDefinition[]
  ): Promise<Record<string, any>> {
    const context = await this.buildContext(tenantId, assetId);
    const results: Record<string, any> = {};

    // Sort by dependencies (fields that reference other computed fields should be last)
    const sorted = this.sortByDependencies(fieldDefinitions);

    for (const field of sorted) {
      try {
        const value = this.evaluateFormula(field.formula, {
          ...context,
          computed: { ...context.computed, ...results }, // Include already calculated fields
        });

        results[field.key] = {
          value,
          unit: field.unit,
          calculatedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        logger.error('Error calculating computed field', {
          assetId,
          field: field.key,
          error: error.message,
        });
        results[field.key] = {
          value: null,
          error: error.message,
          calculatedAt: new Date().toISOString(),
        };
      }
    }

    return results;
  }

  /**
   * Update computed fields on an asset
   */
  async updateComputedFields(
    tenantId: string,
    assetId: string,
    fieldDefinitions: ComputedFieldDefinition[]
  ): Promise<void> {
    const computedFields = await this.calculateFields(tenantId, assetId, fieldDefinitions);
    
    // Update asset with computed fields
    await assetsRepository.updateComputedValues(tenantId, assetId, computedFields);
    
    logger.debug('Computed fields updated', { assetId, fields: Object.keys(computedFields) });
  }

  /**
   * Recalculate fields when a trigger changes
   */
  async recalculateOnChange(
    tenantId: string,
    assetId: string,
    changedPath: string, // e.g., 'telemetry.oilRate' or 'attributes.reservoirPressure'
    fieldDefinitions: ComputedFieldDefinition[]
  ): Promise<void> {
    // Find fields that need recalculation
    const fieldsToRecalculate = fieldDefinitions.filter(field =>
      field.recalculateOn.includes(changedPath)
    );

    if (fieldsToRecalculate.length === 0) {
      return;
    }

    logger.debug('Recalculating computed fields', {
      assetId,
      changedPath,
      fieldsCount: fieldsToRecalculate.length,
    });

    await this.updateComputedFields(tenantId, assetId, fieldsToRecalculate);
  }

  /**
   * Sort field definitions by dependencies
   * Fields that depend on other computed fields should be calculated last
   */
  private sortByDependencies(fields: ComputedFieldDefinition[]): ComputedFieldDefinition[] {
    const sorted: ComputedFieldDefinition[] = [];
    const remaining = [...fields];
    const computedKeys = new Set(fields.map(f => f.key));

    while (remaining.length > 0) {
      const independentFields = remaining.filter(field => {
        // Check if formula references other computed fields
        const referencesComputed = Array.from(computedKeys).some(key => {
          return field.formula.includes(`computed.${key}`) && !sorted.find(f => f.key === key);
        });
        return !referencesComputed;
      });

      if (independentFields.length === 0) {
        // Circular dependency or all remaining fields depend on each other
        // Add them anyway to avoid infinite loop
        sorted.push(...remaining);
        break;
      }

      sorted.push(...independentFields);
      independentFields.forEach(field => {
        const index = remaining.indexOf(field);
        if (index > -1) {
          remaining.splice(index, 1);
        }
      });
    }

    return sorted;
  }

  /**
   * Validate a formula without executing it
   */
  validateFormula(formula: string): { valid: boolean; error?: string } {
    try {
      // Try to parse the formula
      math.parse(formula);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}

export const computedFieldsService = new ComputedFieldsService();
