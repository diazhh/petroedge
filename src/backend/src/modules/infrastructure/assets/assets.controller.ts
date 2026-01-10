import type { FastifyRequest, FastifyReply } from 'fastify';
import { assetTypesService, assetsService } from './assets.service';
import {
  createAssetTypeSchema,
  updateAssetTypeSchema,
  queryAssetTypesSchema,
  createAssetSchema,
  updateAssetSchema,
  updateAssetAttributesSchema,
  queryAssetsSchema,
  assetIdParamSchema,
  assetTypeIdParamSchema,
} from './assets.schema';

// ============================================================================
// ASSET TYPES CONTROLLER
// ============================================================================

export async function createAssetType(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = createAssetTypeSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const assetType = await assetTypesService.createAssetType(tenantId, input);

    return reply.status(201).send({
      success: true,
      data: assetType,
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
      error: { code: 'CREATE_ASSET_TYPE_ERROR', message: error.message },
    });
  }
}

export async function getAssetType(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetTypeIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;

    const assetType = await assetTypesService.getAssetTypeById(tenantId, id);
    if (!assetType) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_TYPE_NOT_FOUND', message: `Asset type ${id} not found` },
      });
    }

    return reply.send({ success: true, data: assetType });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_ASSET_TYPE_ERROR', message: error.message },
    });
  }
}

export async function getAllAssetTypes(
  request: FastifyRequest<{ Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const query = queryAssetTypesSchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const result = await assetTypesService.getAllAssetTypes(tenantId, query);

    return reply.send({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: query.page,
        perPage: query.perPage,
        totalPages: Math.ceil(result.total / query.perPage),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'LIST_ASSET_TYPES_ERROR', message: error.message },
    });
  }
}

export async function updateAssetType(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetTypeIdParamSchema.parse(request.params);
    const input = updateAssetTypeSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const assetType = await assetTypesService.updateAssetType(tenantId, id, input);
    if (!assetType) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_TYPE_NOT_FOUND', message: `Asset type ${id} not found` },
      });
    }

    return reply.send({ success: true, data: assetType });
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
      error: { code: 'UPDATE_ASSET_TYPE_ERROR', message: error.message },
    });
  }
}

export async function deleteAssetType(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetTypeIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;

    const deleted = await assetTypesService.deleteAssetType(tenantId, id);
    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_TYPE_NOT_FOUND', message: `Asset type ${id} not found` },
      });
    }

    return reply.status(204).send();
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: { code: 'DELETE_ASSET_TYPE_ERROR', message: error.message },
    });
  }
}

// ============================================================================
// ASSETS CONTROLLER
// ============================================================================

export async function createAsset(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = createAssetSchema.parse(request.body);
    const tenantId = request.user!.tenantId;
    const userId = request.user!.userId;

    const asset = await assetsService.createAsset(tenantId, userId, input);

    return reply.status(201).send({
      success: true,
      data: asset,
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
      error: { code: 'CREATE_ASSET_ERROR', message: error.message },
    });
  }
}

export async function getAsset(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;

    const asset = await assetsService.getAssetById(tenantId, id);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${id} not found` },
      });
    }

    return reply.send({ success: true, data: asset });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_ASSET_ERROR', message: error.message },
    });
  }
}

export async function getAllAssets(
  request: FastifyRequest<{ Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const query = queryAssetsSchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const result = await assetsService.getAllAssets(tenantId, query);

    return reply.send({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: query.page,
        perPage: query.perPage,
        totalPages: Math.ceil(result.total / query.perPage),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'LIST_ASSETS_ERROR', message: error.message },
    });
  }
}

export async function updateAsset(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const input = updateAssetSchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const asset = await assetsService.updateAsset(tenantId, id, input);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${id} not found` },
      });
    }

    return reply.send({ success: true, data: asset });
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
      error: { code: 'UPDATE_ASSET_ERROR', message: error.message },
    });
  }
}

export async function updateAssetAttributes(
  request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const input = updateAssetAttributesSchema.parse(request.body);
    const tenantId = request.user!.tenantId;
    const userId = request.user!.userId;

    const asset = await assetsService.updateAssetAttributes(tenantId, id, userId, input);
    if (!asset) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${id} not found` },
      });
    }

    return reply.send({ success: true, data: asset });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: { code: 'UPDATE_ATTRIBUTES_ERROR', message: error.message },
    });
  }
}

export async function deleteAsset(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;

    const deleted = await assetsService.deleteAsset(tenantId, id);
    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ASSET_NOT_FOUND', message: `Asset ${id} not found` },
      });
    }

    return reply.status(204).send();
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: { code: 'DELETE_ASSET_ERROR', message: error.message },
    });
  }
}

export async function getAssetChildren(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;

    const children = await assetsService.getAssetChildren(tenantId, id);

    return reply.send({ success: true, data: children });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_CHILDREN_ERROR', message: error.message },
    });
  }
}

export async function getAssetAttributeHistory(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { attributeKey?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const { attributeKey } = request.query;

    const history = await assetsService.getAssetAttributeHistory(id, attributeKey);

    return reply.send({ success: true, data: history });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_HISTORY_ERROR', message: error.message },
    });
  }
}
