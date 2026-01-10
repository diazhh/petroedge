import { z } from 'zod';

// Node schema
export const ruleNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.any()),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
});

// Connection schema
export const ruleConnectionSchema = z.object({
  id: z.string(),
  fromNode: z.string(),
  fromPort: z.string(),
  toNode: z.string(),
  toPort: z.string(),
});

// Rule config schema
export const ruleConfigSchema = z.object({
  executeOnStartup: z.boolean().default(false),
  debounceMs: z.number().default(1000),
  maxExecutionsPerMinute: z.number().default(60),
  timeoutMs: z.number().default(5000),
});

// Create rule schema
export const createRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  appliesToAssetTypes: z.array(z.string().uuid()).min(1),
  appliesToAssets: z.array(z.string().uuid()).optional(),
  nodes: z.array(ruleNodeSchema).min(1),
  connections: z.array(ruleConnectionSchema),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR']).default('DRAFT'),
  priority: z.number().int().min(0).default(0),
  config: ruleConfigSchema.optional(),
});

// Update rule schema
export const updateRuleSchema = createRuleSchema.partial();

// Query params schema
export const listRulesQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ERROR']).optional(),
  assetTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const listExecutionsQuerySchema = z.object({
  success: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// Execute rule schema
export const executeRuleSchema = z.object({
  assetId: z.string().uuid(),
  triggerType: z.string(),
  triggerData: z.record(z.any()).optional(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type ListRulesQuery = z.infer<typeof listRulesQuerySchema>;
export type ListExecutionsQuery = z.infer<typeof listExecutionsQuerySchema>;
export type ExecuteRuleInput = z.infer<typeof executeRuleSchema>;
