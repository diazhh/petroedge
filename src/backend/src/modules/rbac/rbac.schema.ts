import { z } from 'zod';

export const createRoleSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[a-z_]+$/),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  parentRoleId: z.string().uuid().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  parentRoleId: z.string().uuid().optional().nullable(),
});

export const createPermissionSchema = z.object({
  code: z.string().min(2).max(100),
  module: z.string().min(2).max(50),
  resource: z.string().max(50).optional(),
  action: z.string().max(50).optional(),
  field: z.string().max(50).optional(),
  description: z.string().optional(),
});

export const assignRoleToUserSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});

export const assignPermissionToUserSchema = z.object({
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
  granted: z.boolean(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().optional(),
});

export const assignPermissionsToRoleSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const checkPermissionSchema = z.object({
  userId: z.string().uuid(),
  permissionCode: z.string(),
});

export const queryRolesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isSystem: z.coerce.boolean().optional(),
});

export const queryPermissionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  module: z.string().optional(),
  search: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type AssignRoleToUserInput = z.infer<typeof assignRoleToUserSchema>;
export type AssignPermissionToUserInput = z.infer<typeof assignPermissionToUserSchema>;
export type AssignPermissionsToRoleInput = z.infer<typeof assignPermissionsToRoleSchema>;
export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
export type QueryRolesInput = z.infer<typeof queryRolesSchema>;
export type QueryPermissionsInput = z.infer<typeof queryPermissionsSchema>;
