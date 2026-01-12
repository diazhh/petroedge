import type { Magnitude } from '../../common/database/schema';

export type { Magnitude };

export interface MagnitudeFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateMagnitudeDTO {
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  symbol?: string;
  siUnitId?: string;
}

export interface UpdateMagnitudeDTO {
  categoryId?: string;
  code?: string;
  name?: string;
  description?: string;
  symbol?: string;
  siUnitId?: string;
  isActive?: boolean;
}

export interface MagnitudeListResponse {
  items: Magnitude[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
