import postgres from 'postgres';
import { DittoClientService, DittoThing } from './ditto-client.service.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

/**
 * Ditto Sync Service - FIXED VERSION
 * 
 * Migración correcta de tablas legacy a Eclipse Ditto
 * Mapeo exacto de columnas según esquema real de PostgreSQL
 */
export class DittoSyncServiceFixed {
  private client: postgres.Sql;
  private dittoClient: DittoClientService;

  constructor() {
    this.client = postgres(CONFIG.postgres.url);
    this.dittoClient = new DittoClientService();
  }

  /**
   * Migrar Basin a Ditto Thing
   * Columnas reales: id, tenant_id, name, country, region, basin_type, area_km2, 
   * age, tectonic_setting, min_latitude, max_latitude, min_longitude, max_longitude, 
   * description, created_at, updated_at
   */
  async migrateBasinToDitto(basinId: string, tenantId: string): Promise<string> {
    try {
      const result = await this.client`
        SELECT * FROM basins WHERE id = ${basinId} AND tenant_id = ${tenantId}
      `;

      if (result.length === 0) {
        throw new Error(`Basin ${basinId} not found`);
      }

      const basin = result[0];
      // Usar name como identificador, convertir a slug
      const slug = basin.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const thingId = `${tenantId}:basin-${slug}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: `${tenantId}:default-policy`,
        attributes: {
          type: 'BASIN',
          name: basin.name,
          country: basin.country,
          region: basin.region,
          description: basin.description,
          legacyId: basin.id,
          legacyType: 'basin',
        },
        features: {
          geology: {
            properties: {
              basinType: basin.basin_type,
              age: basin.age,
              tectonicSetting: basin.tectonic_setting,
            },
          },
          location: {
            properties: {
              areaKm2: basin.area_km2 ? parseFloat(basin.area_km2) : null,
              bounds: {
                minLat: basin.min_latitude ? parseFloat(basin.min_latitude) : null,
                maxLat: basin.max_latitude ? parseFloat(basin.max_latitude) : null,
                minLon: basin.min_longitude ? parseFloat(basin.min_longitude) : null,
                maxLon: basin.max_longitude ? parseFloat(basin.max_longitude) : null,
              },
            },
          },
          metadata: {
            properties: {
              createdAt: basin.created_at,
              updatedAt: basin.updated_at,
            },
          },
        },
      };

      await this.dittoClient.createThing(dittoThing);
      logger.info({ basinId, thingId }, 'Basin migrated to Ditto');

      return thingId;
    } catch (error) {
      logger.error({ error, basinId }, 'Error migrating basin to Ditto');
      throw error;
    }
  }

  /**
   * Migrar Field a Ditto Thing
   * Columnas reales: id, tenant_id, basin_id, field_name, field_code, operator, 
   * discovery_date, first_production_date, area_acres, center_latitude, center_longitude, 
   * status, field_type, total_wells, active_wells, description, created_at, updated_at
   */
  async migrateFieldToDitto(fieldId: string, tenantId: string): Promise<string> {
    try {
      const result = await this.client`
        SELECT * FROM fields WHERE id = ${fieldId} AND tenant_id = ${tenantId}
      `;

      if (result.length === 0) {
        throw new Error(`Field ${fieldId} not found`);
      }

      const field = result[0];
      const thingId = `${tenantId}:field-${field.field_code || fieldId}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: `${tenantId}:default-policy`,
        attributes: {
          type: 'FIELD',
          name: field.field_name,
          code: field.field_code,
          description: field.description,
          legacyId: field.id,
          legacyType: 'field',
          parentBasinId: field.basin_id,
        },
        features: {
          operations: {
            properties: {
              operator: field.operator,
              discoveryDate: field.discovery_date,
              firstProductionDate: field.first_production_date,
              status: field.status,
              fieldType: field.field_type,
              totalWells: field.total_wells,
              activeWells: field.active_wells,
            },
          },
          location: {
            properties: {
              areaAcres: field.area_acres ? parseFloat(field.area_acres) : null,
              centerLatitude: field.center_latitude ? parseFloat(field.center_latitude) : null,
              centerLongitude: field.center_longitude ? parseFloat(field.center_longitude) : null,
            },
          },
          metadata: {
            properties: {
              createdAt: field.created_at,
              updatedAt: field.updated_at,
            },
          },
        },
      };

      await this.dittoClient.createThing(dittoThing);
      logger.info({ fieldId, thingId }, 'Field migrated to Ditto');

      return thingId;
    } catch (error) {
      logger.error({ error, fieldId }, 'Error migrating field to Ditto');
      throw error;
    }
  }

  /**
   * Migrar Reservoir a Ditto Thing
   * NOTA: Verificar columnas reales antes de ejecutar
   */
  async migrateReservoirToDitto(reservoirId: string, tenantId: string): Promise<string> {
    try {
      const result = await this.client`
        SELECT * FROM reservoirs WHERE id = ${reservoirId} AND tenant_id = ${tenantId}
      `;

      if (result.length === 0) {
        throw new Error(`Reservoir ${reservoirId} not found`);
      }

      const reservoir = result[0];
      const thingId = `${tenantId}:reservoir-${reservoir.reservoir_code || reservoirId}`;

      // Mapeo básico - ajustar según columnas reales
      const dittoThing: DittoThing = {
        thingId,
        policyId: `${tenantId}:default-policy`,
        attributes: {
          type: 'RESERVOIR',
          name: reservoir.name || reservoir.reservoir_name,
          code: reservoir.reservoir_code,
          description: reservoir.description,
          legacyId: reservoir.id,
          legacyType: 'reservoir',
          parentFieldId: reservoir.field_id,
        },
        features: {
          metadata: {
            properties: {
              createdAt: reservoir.created_at,
              updatedAt: reservoir.updated_at,
            },
          },
        },
      };

      await this.dittoClient.createThing(dittoThing);
      logger.info({ reservoirId, thingId }, 'Reservoir migrated to Ditto');

      return thingId;
    } catch (error) {
      logger.error({ error, reservoirId }, 'Error migrating reservoir to Ditto');
      throw error;
    }
  }

  /**
   * Migrar Well a Ditto Thing
   * Columnas reales: id, tenant_id, field_id, primary_reservoir_id, well_name, well_code, 
   * api_number, well_type, status, lift_method, surface_latitude, surface_longitude, 
   * surface_elevation_ft, total_depth_md_ft, total_depth_tvd_ft, spud_date, completion_date, 
   * first_production_date, abandonment_date, tubing_size, casing_size, current_oil_rate_bopd, 
   * current_gas_rate_mscfd, current_water_rate_bwpd, cumulative_oil_mbbl, cumulative_gas_mmscf, 
   * cumulative_water_mbbl, metadata, created_at, updated_at
   */
  async migrateWellToDitto(wellId: string, tenantId: string): Promise<string> {
    try {
      const result = await this.client`
        SELECT * FROM wells WHERE id = ${wellId} AND tenant_id = ${tenantId}
      `;

      if (result.length === 0) {
        throw new Error(`Well ${wellId} not found`);
      }

      const well = result[0];
      const thingId = `${tenantId}:well-${well.well_code || wellId}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: `${tenantId}:default-policy`,
        attributes: {
          type: 'WELL',
          name: well.well_name,
          code: well.well_code,
          apiNumber: well.api_number,
          wellType: well.well_type,
          legacyId: well.id,
          legacyType: 'well',
          parentFieldId: well.field_id,
          parentReservoirId: well.primary_reservoir_id,
        },
        features: {
          completion: {
            properties: {
              liftMethod: well.lift_method,
              tubingSize: well.tubing_size ? parseFloat(well.tubing_size) : null,
              casingSize: well.casing_size ? parseFloat(well.casing_size) : null,
              totalDepthMdFt: well.total_depth_md_ft ? parseFloat(well.total_depth_md_ft) : null,
              totalDepthTvdFt: well.total_depth_tvd_ft ? parseFloat(well.total_depth_tvd_ft) : null,
            },
          },
          location: {
            properties: {
              surfaceLatitude: well.surface_latitude ? parseFloat(well.surface_latitude) : null,
              surfaceLongitude: well.surface_longitude ? parseFloat(well.surface_longitude) : null,
              surfaceElevationFt: well.surface_elevation_ft ? parseFloat(well.surface_elevation_ft) : null,
            },
          },
          production: {
            properties: {
              currentOilRateBopd: well.current_oil_rate_bopd ? parseFloat(well.current_oil_rate_bopd) : null,
              currentGasRateMscfd: well.current_gas_rate_mscfd ? parseFloat(well.current_gas_rate_mscfd) : null,
              currentWaterRateBwpd: well.current_water_rate_bwpd ? parseFloat(well.current_water_rate_bwpd) : null,
              cumulativeOilMbbl: well.cumulative_oil_mbbl ? parseFloat(well.cumulative_oil_mbbl) : null,
              cumulativeGasMmscf: well.cumulative_gas_mmscf ? parseFloat(well.cumulative_gas_mmscf) : null,
              cumulativeWaterMbbl: well.cumulative_water_mbbl ? parseFloat(well.cumulative_water_mbbl) : null,
            },
          },
          status: {
            properties: {
              current: well.status,
              spudDate: well.spud_date,
              completionDate: well.completion_date,
              firstProductionDate: well.first_production_date,
              abandonmentDate: well.abandonment_date,
            },
          },
          metadata: {
            properties: {
              createdAt: well.created_at,
              updatedAt: well.updated_at,
              customMetadata: well.metadata,
            },
          },
        },
      };

      await this.dittoClient.createThing(dittoThing);
      logger.info({ wellId, thingId }, 'Well migrated to Ditto');

      return thingId;
    } catch (error) {
      logger.error({ error, wellId }, 'Error migrating well to Ditto');
      throw error;
    }
  }

  /**
   * Migrar todas las entidades de un tenant
   */
  async migrateAllEntities(tenantId: string): Promise<{
    basins: number;
    fields: number;
    reservoirs: number;
    wells: number;
    errors: Array<{
      entityType: string;
      entityId: string;
      error: string;
    }>;
  }> {
    try {
      logger.info({ tenantId }, 'Starting full migration to Ditto');

      const errors: Array<{ entityType: string; entityId: string; error: string }> = [];

      // Migrar basins
      const basinsResult = await this.client`
        SELECT id FROM basins WHERE tenant_id = ${tenantId}
      `;
      let basinsCount = 0;
      for (const row of basinsResult) {
        try {
          await this.migrateBasinToDitto(row.id, tenantId);
          basinsCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error({ error, basinId: row.id }, 'Failed to migrate basin');
          errors.push({ entityType: 'basin', entityId: row.id, error: errorMsg });
        }
      }

      // Migrar fields
      const fieldsResult = await this.client`
        SELECT id FROM fields WHERE tenant_id = ${tenantId}
      `;
      let fieldsCount = 0;
      for (const row of fieldsResult) {
        try {
          await this.migrateFieldToDitto(row.id, tenantId);
          fieldsCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error({ error, fieldId: row.id }, 'Failed to migrate field');
          errors.push({ entityType: 'field', entityId: row.id, error: errorMsg });
        }
      }

      // Migrar reservoirs
      const reservoirsResult = await this.client`
        SELECT id FROM reservoirs WHERE tenant_id = ${tenantId}
      `;
      let reservoirsCount = 0;
      for (const row of reservoirsResult) {
        try {
          await this.migrateReservoirToDitto(row.id, tenantId);
          reservoirsCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error({ error, reservoirId: row.id }, 'Failed to migrate reservoir');
          errors.push({ entityType: 'reservoir', entityId: row.id, error: errorMsg });
        }
      }

      // Migrar wells
      const wellsResult = await this.client`
        SELECT id FROM wells WHERE tenant_id = ${tenantId}
      `;
      let wellsCount = 0;
      for (const row of wellsResult) {
        try {
          await this.migrateWellToDitto(row.id, tenantId);
          wellsCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error({ error, wellId: row.id }, 'Failed to migrate well');
          errors.push({ entityType: 'well', entityId: row.id, error: errorMsg });
        }
      }

      logger.info({
        tenantId,
        basins: basinsCount,
        fields: fieldsCount,
        reservoirs: reservoirsCount,
        wells: wellsCount,
        errors: errors.length,
      }, 'Migration completed');

      return {
        basins: basinsCount,
        fields: fieldsCount,
        reservoirs: reservoirsCount,
        wells: wellsCount,
        errors,
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Error during migration');
      throw error;
    }
  }

  /**
   * Cerrar conexión
   */
  async close(): Promise<void> {
    await this.client.end();
  }
}
