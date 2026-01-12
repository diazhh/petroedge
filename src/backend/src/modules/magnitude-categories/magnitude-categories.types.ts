import type { MagnitudeCategory } from '../../common/database/schema';

export type { MagnitudeCategory };

export interface MagnitudeCategoryFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateMagnitudeCategoryDTO {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateMagnitudeCategoryDTO {
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface MagnitudeCategoryListResponse {
  items: MagnitudeCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
