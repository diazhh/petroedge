import { FastifyRequest, FastifyReply } from 'fastify';
import { DataSourcesService } from './data-sources.service.js';
import {
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  CreateDataSourceTagRequest,
  UpdateDataSourceTagRequest,
} from './data-sources.types.js';

const dataSourcesService = new DataSourcesService();

export class DataSourcesController {
  // ==================== Data Sources ====================

  async listDataSources(
    request: FastifyRequest<{
      Querystring: {
        edgeGatewayId?: string;
        protocol?: string;
        status?: string;
        enabled?: boolean;
        page?: number;
        perPage?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { edgeGatewayId, protocol, status, enabled, page = 1, perPage = 20 } = request.query;

      const result = await dataSourcesService.listDataSources(
        tenantId,
        { edgeGatewayId, protocol, status, enabled },
        { page, perPage }
      );

      return reply.code(200).send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page,
          perPage,
          totalPages: Math.ceil(result.total / perPage),
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list data sources',
        },
      });
    }
  }

  async getDataSource(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { includeTags?: boolean };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;
      const { includeTags } = request.query;

      const dataSource = includeTags
        ? await dataSourcesService.getDataSourceWithTags(id, tenantId)
        : await dataSourcesService.getDataSource(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: dataSource,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get data source',
        },
      });
    }
  }

  async createDataSource(
    request: FastifyRequest<{
      Body: CreateDataSourceRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      const dataSource = await dataSourcesService.createDataSource(tenantId, userId, request.body);

      return reply.code(201).send({
        success: true,
        data: dataSource,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create data source',
        },
      });
    }
  }

  async updateDataSource(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateDataSourceRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      const dataSource = await dataSourcesService.updateDataSource(id, tenantId, request.body);

      return reply.code(200).send({
        success: true,
        data: dataSource,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update data source',
        },
      });
    }
  }

  async deleteDataSource(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      await dataSourcesService.deleteDataSource(id, tenantId);

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete data source',
        },
      });
    }
  }

  async getDataSourceHealth(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      const health = await dataSourcesService.getDataSourceHealth(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: health,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get data source health',
        },
      });
    }
  }

  // ==================== Data Source Tags ====================

  async listDataSourceTags(
    request: FastifyRequest<{
      Params: { dataSourceId: string };
      Querystring: {
        assetId?: string;
        enabled?: boolean;
        page?: number;
        perPage?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { dataSourceId } = request.params;
      const { assetId, enabled, page = 1, perPage = 50 } = request.query;

      const result = await dataSourcesService.listDataSourceTags(
        dataSourceId,
        tenantId,
        { assetId, enabled },
        { page, perPage }
      );

      return reply.code(200).send({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page,
          perPage,
          totalPages: Math.ceil(result.total / perPage),
        },
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list data source tags',
        },
      });
    }
  }

  async getDataSourceTag(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      const tag = await dataSourcesService.getDataSourceTag(id, tenantId);

      return reply.code(200).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source tag not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get data source tag',
        },
      });
    }
  }

  async createDataSourceTag(
    request: FastifyRequest<{
      Params: { dataSourceId: string };
      Body: CreateDataSourceTagRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;
      const { dataSourceId } = request.params;

      const tag = await dataSourcesService.createDataSourceTag(
        dataSourceId,
        tenantId,
        userId,
        request.body
      );

      return reply.code(201).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'TAG_ALREADY_EXISTS',
            message: error.message,
          },
        });
      }
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create data source tag',
        },
      });
    }
  }

  async updateDataSourceTag(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateDataSourceTagRequest;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      const tag = await dataSourcesService.updateDataSourceTag(id, tenantId, request.body);

      return reply.code(200).send({
        success: true,
        data: tag,
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source tag not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update data source tag',
        },
      });
    }
  }

  async deleteDataSourceTag(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const { id } = request.params;

      await dataSourcesService.deleteDataSourceTag(id, tenantId);

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source tag not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete data source tag',
        },
      });
    }
  }

  async batchCreateTags(
    request: FastifyRequest<{
      Params: { dataSourceId: string };
      Body: { tags: CreateDataSourceTagRequest[] };
    }>,
    reply: FastifyReply
  ) {
    try {
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;
      const { dataSourceId } = request.params;
      const { tags } = request.body;

      const createdTags = await dataSourcesService.createDataSourceTagsBatch(
        dataSourceId,
        tenantId,
        userId,
        tags
      );

      return reply.code(201).send({
        success: true,
        data: createdTags,
        meta: {
          total: createdTags.length,
        },
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message === 'Data source not found') {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'DATA_SOURCE_NOT_FOUND',
            message: error.message,
          },
        });
      }
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to batch create tags',
        },
      });
    }
  }
}
