/**
 * Device Bindings Module - Repository Layer
 * 
 * Handles database operations for Device Bindings using Drizzle ORM.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { 
  deviceBindings, 
  dataSources, 
  connectivityProfiles, 
  digitalTwinInstances 
} from '../../common/database/schema.js';
import {
  DeviceBinding,
  NewDeviceBinding,
  FindDeviceBindingsOptions,
  DeviceBindingWithRelations,
  DeviceBindingStats,
} from './device-bindings.types.js';

export class DeviceBindingsRepository {
  async findAll(options: FindDeviceBindingsOptions): Promise<{
    bindings: DeviceBindingWithRelations[];
    total: number;
  }> {
    const {
      tenantId,
      filters = {},
      page = 1,
      perPage = 20,
      includeDataSource = false,
      includeConnectivityProfile = false,
      includeDigitalTwinInstance = false,
    } = options;

    const offset = (page - 1) * perPage;

    const conditions = [eq(deviceBindings.tenantId, tenantId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(deviceBindings.isActive, filters.isActive));
    }

    if (filters.dataSourceId) {
      conditions.push(eq(deviceBindings.dataSourceId, filters.dataSourceId));
    }

    if (filters.connectivityProfileId) {
      conditions.push(eq(deviceBindings.connectivityProfileId, filters.connectivityProfileId));
    }

    if (filters.digitalTwinId) {
      conditions.push(eq(deviceBindings.digitalTwinId, filters.digitalTwinId));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${deviceBindings.tags} && ${filters.tags}`);
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deviceBindings)
      .where(and(...conditions));

    const results = await db
      .select()
      .from(deviceBindings)
      .where(and(...conditions))
      .orderBy(desc(deviceBindings.createdAt))
      .limit(perPage)
      .offset(offset);

    const bindingsWithRelations: DeviceBindingWithRelations[] = await Promise.all(
      results.map(async (binding) => {
        const relations: DeviceBindingWithRelations = { ...binding };

        if (includeDataSource) {
          const [dataSource] = await db
            .select()
            .from(dataSources)
            .where(eq(dataSources.id, binding.dataSourceId));
          relations.dataSource = dataSource;
        }

        if (includeConnectivityProfile) {
          const [profile] = await db
            .select()
            .from(connectivityProfiles)
            .where(eq(connectivityProfiles.id, binding.connectivityProfileId));
          relations.connectivityProfile = profile;
        }

        if (includeDigitalTwinInstance) {
          const [instance] = await db
            .select()
            .from(digitalTwinInstances)
            .where(eq(digitalTwinInstances.id, binding.digitalTwinId));
          relations.digitalTwinInstance = instance;
        }

        return relations;
      })
    );

    return {
      bindings: bindingsWithRelations,
      total: count,
    };
  }

  async findById(id: string, tenantId: string): Promise<DeviceBinding | null> {
    const [binding] = await db
      .select()
      .from(deviceBindings)
      .where(and(eq(deviceBindings.id, id), eq(deviceBindings.tenantId, tenantId)));

    return binding || null;
  }

  async findByDataSource(dataSourceId: string, tenantId: string): Promise<DeviceBinding[]> {
    return db
      .select()
      .from(deviceBindings)
      .where(and(
        eq(deviceBindings.dataSourceId, dataSourceId),
        eq(deviceBindings.tenantId, tenantId)
      ));
  }

  async findByDigitalTwin(digitalTwinId: string, tenantId: string): Promise<DeviceBinding[]> {
    return db
      .select()
      .from(deviceBindings)
      .where(and(
        eq(deviceBindings.digitalTwinId, digitalTwinId),
        eq(deviceBindings.tenantId, tenantId)
      ));
  }

  async bindingExists(
    dataSourceId: string,
    digitalTwinId: string,
    tenantId: string,
    excludeId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(deviceBindings.dataSourceId, dataSourceId),
      eq(deviceBindings.digitalTwinId, digitalTwinId),
      eq(deviceBindings.tenantId, tenantId),
    ];

    if (excludeId) {
      conditions.push(sql`${deviceBindings.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deviceBindings)
      .where(and(...conditions));

    return result.count > 0;
  }

  async create(data: NewDeviceBinding): Promise<DeviceBinding> {
    const [binding] = await db.insert(deviceBindings).values(data).returning();
    return binding;
  }

  async update(id: string, tenantId: string, data: Partial<NewDeviceBinding>): Promise<DeviceBinding | null> {
    const [binding] = await db
      .update(deviceBindings)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(deviceBindings.id, id), eq(deviceBindings.tenantId, tenantId)))
      .returning();

    return binding || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(deviceBindings)
      .where(and(eq(deviceBindings.id, id), eq(deviceBindings.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  async getStats(tenantId: string): Promise<DeviceBindingStats> {
    const allBindings = await db
      .select()
      .from(deviceBindings)
      .where(eq(deviceBindings.tenantId, tenantId));

    const stats: DeviceBindingStats = {
      total: allBindings.length,
      active: allBindings.filter(b => b.isActive).length,
      inactive: allBindings.filter(b => !b.isActive).length,
      byConnectivityProfile: {},
      byDataSource: {},
    };

    for (const binding of allBindings) {
      const profileId = binding.connectivityProfileId;
      const dsId = binding.dataSourceId;
      
      stats.byConnectivityProfile[profileId] = (stats.byConnectivityProfile[profileId] || 0) + 1;
      stats.byDataSource[dsId] = (stats.byDataSource[dsId] || 0) + 1;
    }

    return stats;
  }
}
