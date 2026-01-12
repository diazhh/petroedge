/**
 * Device Profiles Module - Repository Layer
 * 
 * Handles database operations for Device Profiles using Drizzle ORM.
 */

import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { deviceProfiles, rules, dataSources } from '../../common/database/schema.js';
import {
  DeviceProfile,
  NewDeviceProfile,
  FindDeviceProfilesOptions,
  DeviceProfileWithRelations,
  DeviceProfileStats,
  TransportType,
} from './device-profiles.types.js';

export class DeviceProfilesRepository {
  /**
   * Find all device profiles with filters and pagination
   */
  async findAll(options: FindDeviceProfilesOptions): Promise<{
    profiles: DeviceProfileWithRelations[];
    total: number;
  }> {
    const {
      tenantId,
      filters = {},
      page = 1,
      perPage = 20,
      includeRuleChain = false,
      includeStats = false,
    } = options;

    const offset = (page - 1) * perPage;

    const conditions = [eq(deviceProfiles.tenantId, tenantId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(deviceProfiles.isActive, filters.isActive));
    }

    if (filters.transportType) {
      conditions.push(eq(deviceProfiles.transportType, filters.transportType));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(deviceProfiles.name, `%${filters.search}%`),
          ilike(deviceProfiles.code, `%${filters.search}%`),
          ilike(deviceProfiles.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${deviceProfiles.tags} && ${filters.tags}`);
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deviceProfiles)
      .where(and(...conditions));

    const results = await db
      .select()
      .from(deviceProfiles)
      .where(and(...conditions))
      .orderBy(desc(deviceProfiles.createdAt))
      .limit(perPage)
      .offset(offset);

    const profilesWithRelations: DeviceProfileWithRelations[] = await Promise.all(
      results.map(async (profile) => {
        const relations: DeviceProfileWithRelations = { ...profile };

        if (includeRuleChain && profile.defaultRuleChainId) {
          const [ruleChain] = await db
            .select()
            .from(rules)
            .where(eq(rules.id, profile.defaultRuleChainId));
          relations.defaultRuleChain = ruleChain;
        }

        if (includeStats) {
          const [{ count: dsCount }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(dataSources)
            .where(eq(dataSources.deviceProfileId, profile.id));
          relations.dataSourcesCount = dsCount;
        }

        return relations;
      })
    );

    return {
      profiles: profilesWithRelations,
      total: count,
    };
  }

  /**
   * Find device profile by ID
   */
  async findById(id: string, tenantId: string): Promise<DeviceProfile | null> {
    const [profile] = await db
      .select()
      .from(deviceProfiles)
      .where(and(eq(deviceProfiles.id, id), eq(deviceProfiles.tenantId, tenantId)));

    return profile || null;
  }

  /**
   * Find device profile by code
   */
  async findByCode(code: string, tenantId: string): Promise<DeviceProfile | null> {
    const [profile] = await db
      .select()
      .from(deviceProfiles)
      .where(and(eq(deviceProfiles.code, code), eq(deviceProfiles.tenantId, tenantId)));

    return profile || null;
  }

  /**
   * Create new device profile
   */
  async create(data: NewDeviceProfile): Promise<DeviceProfile> {
    const [profile] = await db.insert(deviceProfiles).values(data).returning();
    return profile;
  }

  /**
   * Update device profile
   */
  async update(id: string, tenantId: string, data: Partial<NewDeviceProfile>): Promise<DeviceProfile | null> {
    const [profile] = await db
      .update(deviceProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(deviceProfiles.id, id), eq(deviceProfiles.tenantId, tenantId)))
      .returning();

    return profile || null;
  }

  /**
   * Delete device profile
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(deviceProfiles)
      .where(and(eq(deviceProfiles.id, id), eq(deviceProfiles.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Get statistics
   */
  async getStats(tenantId: string): Promise<DeviceProfileStats> {
    const allProfiles = await db
      .select()
      .from(deviceProfiles)
      .where(eq(deviceProfiles.tenantId, tenantId));

    const stats: DeviceProfileStats = {
      total: allProfiles.length,
      active: allProfiles.filter(p => p.isActive).length,
      inactive: allProfiles.filter(p => !p.isActive).length,
      byTransportType: {} as Record<TransportType, number>,
    };

    Object.values(TransportType).forEach(type => {
      stats.byTransportType[type] = allProfiles.filter(p => p.transportType === type).length;
    });

    return stats;
  }

  /**
   * Check if code exists
   */
  async codeExists(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(deviceProfiles.code, code),
      eq(deviceProfiles.tenantId, tenantId),
    ];

    if (excludeId) {
      conditions.push(sql`${deviceProfiles.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(deviceProfiles)
      .where(and(...conditions));

    return result.count > 0;
  }
}
