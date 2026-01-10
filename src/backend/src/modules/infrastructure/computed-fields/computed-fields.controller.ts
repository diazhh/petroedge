import type { FastifyRequest, FastifyReply } from 'fastify';
import { computedFieldsService } from './computed-fields.service';
import { assetTypesService, assetsService } from '../assets/assets.service';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const calculateFieldsSchema = z.object({
  assetId: z.string().uuid(),
  fields: z.array(z.object({
    key: z.string(),
    name: z.string(),
    unit: z.string().optional(),
    formula: z.string(),
    recalculateOn: z.array(z.string()),
  })).optional(),
});

const recalculateSchema = z.object({
  assetId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

const validateFormulaSchema = z.object({
  formula: z.string(),
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Calculate computed fields for an asset
 * Uses field definitions from asset type or provided fields
 */
export async function calculateComputedFields(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = calculateFieldsSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    // Get asset
    const asset = await assetsService.getAssetById(tenantId, input.assetId);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${input.assetId} not found` },
      });
    }

    // Get field definitions
    let fieldDefinitions = input.fields;
    
    if (!fieldDefinitions) {
      // Get from asset type
      const assetType = await assetTypesService.getAssetTypeById(tenantId, asset.assetTypeId);
      if (!assetType || !assetType.computedFields) {
        return reply.status(400).send({
          success: false,
          error: { 
            code: 'NO_COMPUTED_FIELDS', 
            message: 'No computed fields defined for this asset type' 
          },
        });
      }
      fieldDefinitions = assetType.computedFields as any[];
    }

    // Calculate fields
    const results = await computedFieldsService.calculateFields(
      tenantId,
      input.assetId,
      fieldDefinitions
    );

    return reply.send({
      success: true,
      data: {
        assetId: input.assetId,
        computedFields: results,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'CALCULATE_FIELDS_ERROR', message: error.message },
    });
  }
}

/**
 * Get computed fields for an asset
 * Returns the current computed values stored in the asset
 */
export async function getComputedFields(
  request: FastifyRequest<{ Params: { assetId: string } }>,
  reply: FastifyReply
) {
  try {
    const { assetId } = request.params;
    const tenantId = request.user!.tenantId;

    const asset = await assetsService.getAssetById(tenantId, assetId);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${assetId} not found` },
      });
    }

    return reply.send({
      success: true,
      data: {
        assetId,
        computedFields: asset.computedValues || {},
        computedAt: asset.computedAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_COMPUTED_FIELDS_ERROR', message: error.message },
    });
  }
}

/**
 * Recalculate computed fields for an asset
 * Forces recalculation using asset type definitions
 */
export async function recalculateComputedFields(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = recalculateSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    // Get asset
    const asset = await assetsService.getAssetById(tenantId, input.assetId);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${input.assetId} not found` },
      });
    }

    // Get asset type with computed fields
    const assetType = await assetTypesService.getAssetTypeById(tenantId, asset.assetTypeId);
    if (!assetType || !assetType.computedFields || (Array.isArray(assetType.computedFields) && assetType.computedFields.length === 0)) {
      return reply.status(400).send({
        success: false,
        error: { 
          code: 'NO_COMPUTED_FIELDS', 
          message: 'No computed fields defined for this asset type' 
        },
      });
    }

    // Recalculate and update
    await computedFieldsService.updateComputedFields(
      tenantId,
      input.assetId,
      assetType.computedFields as any[]
    );

    // Get updated asset
    const updatedAsset = await assetsService.getAssetById(tenantId, input.assetId);

    return reply.send({
      success: true,
      data: {
        assetId: input.assetId,
        computedFields: updatedAsset?.computedValues || {},
        computedAt: updatedAsset?.computedAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'RECALCULATE_FIELDS_ERROR', message: error.message },
    });
  }
}

/**
 * Validate a formula without executing it
 */
export async function validateFormula(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = validateFormulaSchema.parse(request.body);

    const result = computedFieldsService.validateFormula(input.formula);

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATE_FORMULA_ERROR', message: error.message },
    });
  }
}

/**
 * Get computed field definitions from asset type
 */
export async function getComputedFieldDefinitions(
  request: FastifyRequest<{ Params: { assetTypeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { assetTypeId } = request.params;
    const tenantId = request.user!.tenantId;

    const assetType = await assetTypesService.getAssetTypeById(tenantId, assetTypeId);
    if (!assetType) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_TYPE_NOT_FOUND', message: `Asset type ${assetTypeId} not found` },
      });
    }

    return reply.send({
      success: true,
      data: {
        assetTypeId,
        assetTypeName: assetType.name,
        computedFields: assetType.computedFields || [],
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_DEFINITIONS_ERROR', message: error.message },
    });
  }
}
