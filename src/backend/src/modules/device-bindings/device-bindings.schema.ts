/**
 * Device Bindings Module - Zod Schemas
 * 
 * Validation schemas for Device Binding endpoints.
 */

import { z } from 'zod';

// ==================== Create Schema ====================

export const createDeviceBindingSchema = z.object({
  dataSourceId: z.string().uuid('Invalid data source ID'),
  connectivityProfileId: z.string().uuid('Invalid connectivity profile ID'),
  digitalTwinId: z.string().uuid('Invalid digital twin ID'),
  customMappings: z.record(z.any()).optional(),
  customRuleChainId: z.string().uuid('Invalid rule chain ID').optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Update Schema ====================

export const updateDeviceBindingSchema = z.object({
  dataSourceId: z.string().uuid('Invalid data source ID').optional(),
  connectivityProfileId: z.string().uuid('Invalid connectivity profile ID').optional(),
  digitalTwinId: z.string().uuid('Invalid digital twin ID').optional(),
  customMappings: z.record(z.any()).optional(),
  customRuleChainId: z.string().uuid('Invalid rule chain ID').nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// ==================== Query Filters ====================

export const deviceBindingFiltersSchema = z.object({
  isActive: z.string().transform(val => val === 'true').optional(),
  dataSourceId: z.string().uuid().optional(),
  connectivityProfileId: z.string().uuid().optional(),
  digitalTwinId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.string().transform(val => val.split(',')).optional(),
  page: z.string().transform(Number).optional(),
  perPage: z.string().transform(Number).optional(),
  includeDataSource: z.string().transform(val => val === 'true').optional(),
  includeConnectivityProfile: z.string().transform(val => val === 'true').optional(),
  includeDigitalTwinInstance: z.string().transform(val => val === 'true').optional(),
});

// ==================== Params ====================

export const deviceBindingIdSchema = z.object({
  id: z.string().uuid('Invalid device binding ID'),
});

// ==================== Export Types ====================

export type CreateDeviceBindingInput = z.infer<typeof createDeviceBindingSchema>;
export type UpdateDeviceBindingInput = z.infer<typeof updateDeviceBindingSchema>;
export type DeviceBindingFiltersInput = z.infer<typeof deviceBindingFiltersSchema>;
