import { MagnitudeCategoriesRepository } from './magnitude-categories.repository';
import type { CreateMagnitudeCategoryDTO, UpdateMagnitudeCategoryDTO, MagnitudeCategoryFilters } from './magnitude-categories.types';

export class MagnitudeCategoriesService {
  private repository: MagnitudeCategoriesRepository;

  constructor() {
    this.repository = new MagnitudeCategoriesRepository();
  }

  async list(filters: MagnitudeCategoryFilters) {
    return this.repository.findAll(filters);
  }

  async getById(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error('Magnitude category not found');
    }
    return category;
  }

  async create(data: CreateMagnitudeCategoryDTO) {
    const existingCategory = await this.repository.findByCode(data.code);
    if (existingCategory) {
      throw new Error('Magnitude category with this code already exists');
    }

    return this.repository.create(data);
  }

  async update(id: string, data: UpdateMagnitudeCategoryDTO) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error('Magnitude category not found');
    }

    if (data.code && data.code !== category.code) {
      const existingCategory = await this.repository.findByCode(data.code);
      if (existingCategory) {
        throw new Error('Magnitude category with this code already exists');
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new Error('Magnitude category not found');
    }

    return this.repository.delete(id);
  }
}
