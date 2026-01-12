import { MagnitudesRepository } from './magnitudes.repository';
import type { CreateMagnitudeDTO, UpdateMagnitudeDTO, MagnitudeFilters } from './magnitudes.types';

export class MagnitudesService {
  private repository: MagnitudesRepository;

  constructor() {
    this.repository = new MagnitudesRepository();
  }

  async list(filters: MagnitudeFilters) {
    return this.repository.findAll(filters);
  }

  async getById(id: string) {
    const magnitude = await this.repository.findById(id);
    if (!magnitude) {
      throw new Error('Magnitude not found');
    }
    return magnitude;
  }

  async getByCategoryId(categoryId: string) {
    return this.repository.findByCategoryId(categoryId);
  }

  async create(data: CreateMagnitudeDTO) {
    const existingMagnitude = await this.repository.findByCode(data.code);
    if (existingMagnitude) {
      throw new Error('Magnitude with this code already exists');
    }

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateMagnitudeDTO) {
    const magnitude = await this.repository.findById(id);
    if (!magnitude) {
      throw new Error('Magnitude not found');
    }

    if (data.code && data.code !== magnitude.code) {
      const existingMagnitude = await this.repository.findByCode(data.code);
      if (existingMagnitude) {
        throw new Error('Magnitude with this code already exists');
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const magnitude = await this.repository.findById(id);
    if (!magnitude) {
      throw new Error('Magnitude not found');
    }

    return this.repository.delete(id);
  }
}
