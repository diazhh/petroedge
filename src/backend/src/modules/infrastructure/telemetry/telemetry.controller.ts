import type { FastifyRequest, FastifyReply } from 'fastify';
import { telemetryService } from './telemetry.service';
import {
  ingestTelemetrySchema,
  batchIngestTelemetrySchema,
  queryTelemetrySchema,
  assetIdParamSchema,
} from './telemetry.schema';
import { z } from 'zod';

export async function ingestTelemetry(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = ingestTelemetrySchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    await telemetryService.ingestTelemetry(tenantId, input);

    return reply.status(201).send({ success: true });
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
      error: { code: 'INGEST_ERROR', message: error.message },
    });
  }
}

export async function batchIngestTelemetry(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  try {
    const input = batchIngestTelemetrySchema.parse(request.body);
    const tenantId = request.user!.tenantId;

    const result = await telemetryService.batchIngestTelemetry(tenantId, input);

    return reply.status(201).send({
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
      error: { code: 'BATCH_INGEST_ERROR', message: error.message },
    });
  }
}

export async function queryTelemetry(
  request: FastifyRequest<{ Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const query = queryTelemetrySchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const data = await telemetryService.queryTelemetry(tenantId, query);

    return reply.send({ success: true, data });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'QUERY_ERROR', message: error.message },
    });
  }
}

export async function getLatestTelemetry(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { telemetryKeys?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId;
    const telemetryKeys = request.query.telemetryKeys?.split(',').filter(Boolean);

    const data = await telemetryService.getLatestTelemetry(tenantId, {
      assetId: id,
      telemetryKeys,
    });

    return reply.send({ success: true, data });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_LATEST_ERROR', message: error.message },
    });
  }
}

const rawQuerySchema = z.object({
  telemetryKey: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  limit: z.coerce.number().int().positive().max(10000).optional().default(1000),
});

export async function getRawTelemetry(
  request: FastifyRequest<{ Params: { id: string }; Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const query = rawQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const data = await telemetryService.getRawTelemetry(
      tenantId,
      id,
      query.telemetryKey,
      query.startTime,
      query.endTime,
      query.limit
    );

    return reply.send({ success: true, data });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_RAW_ERROR', message: error.message },
    });
  }
}

const statsQuerySchema = z.object({
  telemetryKey: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export async function getTelemetryStats(
  request: FastifyRequest<{ Params: { id: string }; Querystring: unknown }>,
  reply: FastifyReply
) {
  try {
    const { id } = assetIdParamSchema.parse(request.params);
    const query = statsQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId;

    const data = await telemetryService.getTelemetryStats(
      tenantId,
      id,
      query.telemetryKey,
      query.startTime,
      query.endTime
    );

    return reply.send({ success: true, data });
  } catch (error: any) {
    request.log.error(error);
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.errors },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: 'GET_STATS_ERROR', message: error.message },
    });
  }
}
