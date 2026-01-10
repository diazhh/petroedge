import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { DittoClientService, DittoThing } from './ditto-client.service.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';

/**
 * Ditto Sync Service
 * 
 * Servicio de sincronización bidireccional entre:
 * - Tablas legacy (basins, fields, reservoirs, wells)
 * - Eclipse Ditto Things
 * 
 * Estrategia: Dual Write Pattern
 */
export class DittoSyncService {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;
  private dittoClient: DittoClientService;

  constructor() {
    this.client = postgres(CONFIG.postgres.url);
    this.db = drizzle(this.client);
    this.dittoClient = new DittoClientService();
  }

  /**
   * Migrar Basin a Ditto Thing
   */
  async migrateBasinToDitto(basinId: string, tenantId: string): Promise<string> {
    try {
      // Obtener basin de BD legacy
      const result = await this.client`
        SELECT * FROM basins WHERE id = ${basinId} AND tenant_id = ${tenantId}
      `;

      if (result.length === 0) {
        throw new Error(`Basin ${basinId} not found`);
      }

      const basin = result[0];
      // Ditto Thing IDs must follow pattern: namespace:name (alphanumeric, dots, dashes, underscores)
      // Remove special characters and limit length
      const sanitizedName = basin.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 50);
      const thingId = `acme:basin_${sanitizedName}`;

      // Crear Thing en Ditto (sin policyId - Ditto creará una implícita)
      const dittoThing: DittoThing = {
        thingId,
        policyId: thingId, // Use same ID as thing for implicit policy
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
              areaKm2: basin.area_km2,
              bounds: basin.bounds,
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
      // Sanitize field code for Ditto Thing ID
      const sanitizedCode = (field.field_code || field.id)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50);
      const thingId = `acme:field_${sanitizedCode}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: thingId, // Use same ID as thing for implicit policy
        attributes: {
          type: 'FIELD',
          name: field.name,
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
              productionStartDate: field.production_start_date,
              status: field.status,
            },
          },
          location: {
            properties: {
              areaKm2: field.area_km2,
              latitude: field.latitude,
              longitude: field.longitude,
            },
          },
          production: {
            properties: {
              oilRateBopd: field.oil_rate_bopd,
              gasRateMscfd: field.gas_rate_mscfd,
              waterRateBwpd: field.water_rate_bwpd,
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
      // Sanitize reservoir code for Ditto Thing ID
      const sanitizedCode = (reservoir.reservoir_code || reservoir.id)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50);
      const thingId = `acme:reservoir_${sanitizedCode}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: thingId, // Use same ID as thing for implicit policy
        attributes: {
          type: 'RESERVOIR',
          name: reservoir.name,
          code: reservoir.reservoir_code,
          description: reservoir.description,
          legacyId: reservoir.id,
          legacyType: 'reservoir',
          parentFieldId: reservoir.field_id,
        },
        features: {
          petrophysics: {
            properties: {
              porosity: reservoir.porosity,
              permeability: reservoir.permeability,
              saturation: reservoir.saturation,
              netPay: reservoir.net_pay,
            },
          },
          fluids: {
            properties: {
              fluidType: reservoir.fluid_type,
              apiGravity: reservoir.api_gravity,
              gasGravity: reservoir.gas_gravity,
              bubblePointPressure: reservoir.bubble_point_pressure,
            },
          },
          reserves: {
            properties: {
              ooip: reservoir.ooip,
              ogip: reservoir.ogip,
              recoveryFactor: reservoir.recovery_factor,
              reserves1p: reservoir.reserves_1p,
              reserves2p: reservoir.reserves_2p,
              reserves3p: reservoir.reserves_3p,
            },
          },
          pressure: {
            properties: {
              initialPressure: reservoir.initial_pressure,
              currentPressure: reservoir.current_pressure,
              depletionRate: reservoir.depletion_rate,
            },
          },
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
      // Sanitize well code for Ditto Thing ID
      const sanitizedCode = (well.well_code || well.id)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50);
      const thingId = `acme:well_${sanitizedCode}`;

      const dittoThing: DittoThing = {
        thingId,
        policyId: thingId, // Use same ID as thing for implicit policy
        attributes: {
          type: 'WELL',
          name: well.name,
          wellCode: well.well_code,
          apiNumber: well.api_number,
          description: well.description,
          legacyId: well.id,
          legacyType: 'well',
          parentFieldId: well.field_id,
          parentReservoirId: well.reservoir_id,
        },
        features: {
          completion: {
            properties: {
              wellType: well.well_type,
              liftMethod: well.lift_method,
              tubingSize: well.tubing_size,
              casingSize: well.casing_size,
              totalDepth: well.total_depth,
              measuredDepth: well.measured_depth,
            },
          },
          location: {
            properties: {
              latitude: well.latitude,
              longitude: well.longitude,
              surfaceElevation: well.surface_elevation,
            },
          },
          production: {
            properties: {
              oilRateBopd: well.oil_rate_bopd,
              gasRateMscfd: well.gas_rate_mscfd,
              waterRateBwpd: well.water_rate_bwpd,
              waterCut: well.water_cut,
              gor: well.gor,
            },
          },
          pressure: {
            properties: {
              staticPressure: well.static_pressure,
              flowingPressure: well.flowing_pressure,
              casingPressure: well.casing_pressure,
              tubingPressure: well.tubing_pressure,
            },
          },
          status: {
            properties: {
              current: well.status,
              spudDate: well.spud_date,
              completionDate: well.completion_date,
              lastUpdate: well.updated_at,
            },
          },
          metadata: {
            properties: {
              createdAt: well.created_at,
              updatedAt: well.updated_at,
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
