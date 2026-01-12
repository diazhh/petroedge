import { z } from 'zod';

export const ruleNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    config: z.record(z.string(), z.any()),
  }),
});

export const ruleEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
});

export const ruleConfigSchema = z.object({
  trigger: z.object({
    type: z.enum(['telemetry', 'attribute', 'schedule', 'manual', 'kafka']),
    config: z.record(z.string(), z.any()),
  }),
  timeout: z.number().optional(),
  maxRetries: z.number().optional(),
  dlqEnabled: z.boolean().optional(),
  dlqTopic: z.string().optional(),
});

export const ruleMetadataSchema = z.object({
  executionCount: z.number(),
  lastExecutionAt: z.string().optional(),
  successRate: z.number(),
  avgDuration: z.number(),
  errorCount: z.number(),
});

export const ruleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  status: z.enum(['active', 'inactive', 'draft', 'error']),
  nodes: z.array(ruleNodeSchema),
  edges: z.array(ruleEdgeSchema),
  config: ruleConfigSchema,
  metadata: ruleMetadataSchema,
  createdBy: z.string(),
  createdAt: z.string(),
  updatedBy: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export const createRuleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  nodes: z.array(ruleNodeSchema).min(1, 'Debe tener al menos un nodo'),
  edges: z.array(ruleEdgeSchema),
  config: ruleConfigSchema,
});

export const updateRuleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo').optional(),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  category: z.string().min(1, 'La categoría es requerida').optional(),
  nodes: z.array(ruleNodeSchema).min(1, 'Debe tener al menos un nodo').optional(),
  edges: z.array(ruleEdgeSchema).optional(),
  config: ruleConfigSchema.optional(),
});

export const testRuleSchema = z.object({
  input: z.record(z.string(), z.any()),
});

export type RuleFormData = z.infer<typeof createRuleSchema>;
export type UpdateRuleFormData = z.infer<typeof updateRuleSchema>;
export type TestRuleFormData = z.infer<typeof testRuleSchema>;
