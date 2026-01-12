/**
 * Connectivity Profiles Module - Repository Layer
 * 
 * Handles database operations for Connectivity Profiles using Drizzle ORM.
 */

import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../../common/database/index.js';
import { connectivityProfiles, deviceProfiles, assetTemplates, deviceBindings } from '../../common/database/schema.js';
import {
  ConnectivityProfile,
  NewConnectivityProfile,
  FindConnectivityProfilesOptions,
  ConnectivityProfileWithRelations,
  ConnectivityProfileStats,
} from './connectivity-profiles.types.js';

export class ConnectivityProfilesRepository {
  async findAll(options: FindConnectivityProfilesOptions): Promise<{
    profiles: ConnectivityProfileWithRelations[];
    total: number;
  }> {
    const {
      tenantId,
      filters = {},
      page = 1,
      perPage = 20,
      includeDeviceProfile = false,
      includeAssetTemplate = false,
      includeStats = false,
    } = options;

    const offset = (page - 1) * perPage;

    const conditions = [eq(connectivityProfiles.tenantId, tenantId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(connectivityProfiles.isActive, filters.isActive));
    }

    if (filters.deviceProfileId) {
      conditions.push(eq(connectivityProfiles.deviceProfileId, filters.deviceProfileId));
    }

    if (filters.assetTemplateId) {
      conditions.push(eq(connectivityProfiles.assetTemplateId, filters.assetTemplateId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(connectivityProfiles.name, `%${filters.search}%`),
          ilike(connectivityProfiles.code, `%${filters.search}%`),
          ilike(connectivityProfiles.description, `%${filters.search}%`)
        )!
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${connectivityProfiles.tags} && ${filters.tags}`);
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(connectivityProfiles)
      .where(and(...conditions));

    const results = await db
      .select()
      .from(connectivityProfiles)
      .where(and(...conditions))
      .orderBy(desc(connectivityProfiles.createdAt))
      .limit(perPage)
      .offset(offset);

    const profilesWithRelations: ConnectivityProfileWithRelations[] = await Promise.all(
      results.map(async (profile) => {
        const relations: ConnectivityProfileWithRelations = { ...profile };

        if (includeDeviceProfile) {
          const [deviceProfile] = await db
            .select()
            .from(deviceProfiles)
            .where(eq(deviceProfiles.id, profile.deviceProfileId));
          relations.deviceProfile = deviceProfile;
        }

        if (includeAssetTemplate) {
          const [assetTemplate] = await db
            .select()
            .from(assetTemplates)
            .where(eq(assetTemplates.id, profile.assetTemplateId));
          relations.assetTemplate = assetTemplate;
        }

        if (includeStats) {
          const [{ count: bindingsCount }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(deviceBindings)
            .where(eq(deviceBindings.connectivityProfileId, profile.id));
          relations.bindingsCount = bindingsCount;
        }

        return relations;
      })
    );

    return {
      profiles: profilesWithRelations,
      total: count,
    };
  }

  async findById(id: string, tenantId: string): Promise<ConnectivityProfile | null> {
    const [profile] = await db
      .select()
      .from(connectivityProfiles)
      .where(and(eq(connectivityProfiles.id, id), eq(connectivityProfiles.tenantId, tenantId)));

    return profile || null;
  }

  async findByCode(code: string, tenantId: string): Promise<ConnectivityProfile | null> {
    const [profile] = await db
      .select()
      .from(connectivityProfiles)
      .where(and(eq(connectivityProfiles.code, code), eq(connectivityProfiles.tenantId, tenantId)));

    return profile || null;
  }

  async codeExists(code: string, tenantId: string, excludeId?: string): Promise<boolean> {
    const conditions = [
      eq(connectivityProfiles.code, code),
      eq(connectivityProfiles.tenantId, tenantId),
    ];

    if (excludeId) {
      conditions.push(sql`${connectivityProfiles.id} != ${excludeId}`);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(connectivityProfiles)
      .where(and(...conditions));

    return result.count > 0;
  }

  async create(data: NewConnectivityProfile): Promise<ConnectivityProfile> {
    const [profile] = await db.insert(connectivityProfiles).values(data).returning();
    return profile;
  }

  async update(id: string, tenantId: string, data: Partial<NewConnectivityProfile>): Promise<ConnectivityProfile | null> {
    const [profile] = await db
      .update(connectivityProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(connectivityProfiles.id, id), eq(connectivityProfiles.tenantId, tenantId)))
      .returning();

    return profile || null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(connectivityProfiles)
      .where(and(eq(connectivityProfiles.id, id), eq(connectivityProfiles.tenantId, tenantId)))
      .returning();

    return result.length > 0;
  }

  async getStats(tenantId: string): Promise<ConnectivityProfileStats> {
    const allProfiles = await db
      .select()
      .from(connectivityProfiles)
      .where(eq(connectivityProfiles.tenantId, tenantId));

    const stats: ConnectivityProfileStats = {
      total: allProfiles.length,
      active: allProfiles.filter(p => p.isActive).length,
      inactive: allProfiles.filter(p => !p.isActive).length,
      byDeviceProfile: {},
      byAssetTemplate: {},
    };

    for (const profile of allProfiles) {
      const dpId = profile.deviceProfileId;
      const atId = profile.assetTemplateId;
      
      stats.byDeviceProfile[dpId] = (stats.byDeviceProfile[dpId] || 0) + 1;
      stats.byAssetTemplate[atId] = (stats.byAssetTemplate[atId] || 0) + 1;
    }

    return stats;
  }
}
