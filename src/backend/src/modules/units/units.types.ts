import type { Unit } from '../../common/database/schema';

export type { Unit };

export interface UnitFilters {
  magnitudeId?: string;
  isActive?: boolean;
  isSiUnit?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateUnitDTO {
  magnitudeId: string;
  code: string;
  name: string;
  symbol: string;
  description?: string;
  isSiUnit?: boolean;
  conversionFactor?: string;
  conversionOffset?: string;
}

export interface UpdateUnitDTO {
  magnitudeId?: string;
  code?: string;
  name?: string;
  symbol?: string;
  description?: string;
  isSiUnit?: boolean;
  conversionFactor?: string;
  conversionOffset?: string;
  isActive?: boolean;
}

export interface UnitListResponse {
  items: Unit[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
