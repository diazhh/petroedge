import { UnitsRepository } from './units.repository';
import type { CreateUnitDTO, UpdateUnitDTO, UnitFilters } from './units.types';

export class UnitsService {
  private repository: UnitsRepository;

  constructor() {
    this.repository = new UnitsRepository();
  }

  async list(filters: UnitFilters) {
    return this.repository.findAll(filters);
  }

  async getById(id: string) {
    const unit = await this.repository.findById(id);
    if (!unit) {
      throw new Error('Unit not found');
    }
    return unit;
  }

  async getByMagnitudeId(magnitudeId: string) {
    return this.repository.findByMagnitudeId(magnitudeId);
  }

  async create(data: CreateUnitDTO) {
    const existingUnit = await this.repository.findByCode(data.code);
    if (existingUnit) {
      throw new Error('Unit with this code already exists');
    }

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateUnitDTO) {
    const unit = await this.repository.findById(id);
    if (!unit) {
      throw new Error('Unit not found');
    }

    if (data.code && data.code !== unit.code) {
      const existingUnit = await this.repository.findByCode(data.code);
      if (existingUnit) {
        throw new Error('Unit with this code already exists');
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const unit = await this.repository.findById(id);
    if (!unit) {
      throw new Error('Unit not found');
    }

    return this.repository.delete(id);
  }
}
