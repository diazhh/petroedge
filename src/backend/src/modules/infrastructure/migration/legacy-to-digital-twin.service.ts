import { assetsRepository, assetTypesRepository } from '../assets/assets.repository.js';
import { db } from '../../../common/database/index.js';
import { basins, fields } from '../../../common/database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../../../common/utils/logger.js';

/**
 * Service to migrate legacy entities (wells, fields, basins, reservoirs) to Digital Twin assets
 */
export class LegacyToDigitalTwinMigrationService {
  /**
   * Ensure asset types exist for legacy entities
   */
  async ensureAssetTypes(tenantId: string): Promise<{
    basinTypeId: string;
    fieldTypeId: string;
    reservoirTypeId: string;
    wellTypeId: string;
  }> {
    // Check if asset types already exist
    let basinType = await assetTypesRepository.findByCode(tenantId, 'BASIN');
    let fieldType = await assetTypesRepository.findByCode(tenantId, 'FIELD');
    let reservoirType = await assetTypesRepository.findByCode(tenantId, 'RESERVOIR');
    let wellType = await assetTypesRepository.findByCode(tenantId, 'WELL');

    // Create Basin asset type if not exists
    if (!basinType) {
      basinType = await assetTypesRepository.create(tenantId, {
        code: 'BASIN',
        name: 'Cuenca Sedimentaria',
        description: 'Cuenca geológica sedimentaria',
        icon: 'layers',
        color: '#8B4513',
        isSystem: true,
        isActive: true,
        fixedSchema: {
          basinType: { type: 'string', required: true },
          country: { type: 'string', required: true },
          areaKm2: { type: 'number', unit: 'km2' },
        },
        attributeSchema: {
          totalFields: { type: 'number', default: 0 },
          totalWells: { type: 'number', default: 0 },
          description: { type: 'string' },
        },
        telemetrySchema: {},
        computedFields: [],
        sortOrder: 1,
      });
    }

    // Create Field asset type if not exists
    if (!fieldType) {
      fieldType = await assetTypesRepository.create(tenantId, {
        code: 'FIELD',
        name: 'Campo Petrolero',
        description: 'Campo de producción de hidrocarburos',
        icon: 'map-pin',
        color: '#2E7D32',
        isSystem: true,
        isActive: true,
        fixedSchema: {
          fieldCode: { type: 'string' },
          operator: { type: 'string' },
          discoveryDate: { type: 'date' },
          firstProductionDate: { type: 'date' },
          areaAcres: { type: 'number', unit: 'acres' },
        },
        attributeSchema: {
          status: { type: 'string', enum: ['PRODUCING', 'SHUT_IN', 'ABANDONED', 'DEVELOPMENT'] },
          fieldType: { type: 'string', enum: ['OIL', 'GAS', 'OIL_GAS', 'CONDENSATE'] },
          totalWells: { type: 'number', default: 0 },
          activeWells: { type: 'number', default: 0 },
          description: { type: 'string' },
        },
        telemetrySchema: {
          totalOilProduction: { type: 'number', unit: 'bopd', frequency: '1day' },
          totalGasProduction: { type: 'number', unit: 'mscfd', frequency: '1day' },
          totalWaterProduction: { type: 'number', unit: 'bwpd', frequency: '1day' },
        },
        computedFields: [],
        sortOrder: 2,
      });
    }

    // Create Reservoir asset type if not exists
    if (!reservoirType) {
      reservoirType = await assetTypesRepository.create(tenantId, {
        code: 'RESERVOIR',
        name: 'Yacimiento',
        description: 'Yacimiento de hidrocarburos',
        icon: 'database',
        color: '#1976D2',
        isSystem: true,
        isActive: true,
        fixedSchema: {
          reservoirCode: { type: 'string' },
          formationName: { type: 'string' },
          formationAge: { type: 'string' },
          lithology: { type: 'string' },
          fluidType: { type: 'string' },
        },
        attributeSchema: {
          avgPorosity: { type: 'number', unit: 'fraction' },
          avgPermeabilityMd: { type: 'number', unit: 'md' },
          avgWaterSaturation: { type: 'number', unit: 'fraction' },
          netToGross: { type: 'number', unit: 'fraction' },
          topDepthTvdFt: { type: 'number', unit: 'ft' },
          bottomDepthTvdFt: { type: 'number', unit: 'ft' },
          avgNetPayFt: { type: 'number', unit: 'ft' },
          areaAcres: { type: 'number', unit: 'acres' },
          initialPressurePsi: { type: 'number', unit: 'psi' },
          currentPressurePsi: { type: 'number', unit: 'psi' },
          reservoirTemperatureF: { type: 'number', unit: 'F' },
          ooipMmstb: { type: 'number', unit: 'mmstb' },
          ogipBcf: { type: 'number', unit: 'bcf' },
          recoveryFactor: { type: 'number', unit: 'fraction' },
          description: { type: 'string' },
        },
        telemetrySchema: {
          averagePressure: { type: 'number', unit: 'psi', frequency: '1month' },
        },
        computedFields: [],
        sortOrder: 3,
      });
    }

    // Create Well asset type if not exists
    if (!wellType) {
      wellType = await assetTypesRepository.create(tenantId, {
        code: 'WELL',
        name: 'Pozo',
        description: 'Pozo de producción o inyección',
        icon: 'droplet',
        color: '#D32F2F',
        isSystem: true,
        isActive: true,
        fixedSchema: {
          wellCode: { type: 'string' },
          apiNumber: { type: 'string' },
          wellType: { type: 'string', enum: ['PRODUCER', 'INJECTOR', 'OBSERVATION'] },
          liftMethod: { type: 'string', enum: ['NATURAL_FLOW', 'ESP', 'GAS_LIFT', 'PCP', 'BEAM_PUMP', 'HYDRAULIC_PUMP'] },
          spudDate: { type: 'date' },
          completionDate: { type: 'date' },
          firstProductionDate: { type: 'date' },
        },
        attributeSchema: {
          status: { type: 'string', enum: ['PRODUCING', 'SHUT_IN', 'SUSPENDED', 'ABANDONED', 'DRILLING', 'COMPLETION'] },
          surfaceLatitude: { type: 'number', unit: 'degrees' },
          surfaceLongitude: { type: 'number', unit: 'degrees' },
          surfaceElevationFt: { type: 'number', unit: 'ft' },
          totalDepthMdFt: { type: 'number', unit: 'ft' },
          totalDepthTvdFt: { type: 'number', unit: 'ft' },
          tubingSize: { type: 'number', unit: 'in' },
          casingSize: { type: 'number', unit: 'in' },
          cumulativeOilMbbl: { type: 'number', unit: 'mbbl' },
          cumulativeGasMmscf: { type: 'number', unit: 'mmscf' },
          cumulativeWaterMbbl: { type: 'number', unit: 'mbbl' },
        },
        telemetrySchema: {
          oilRate: { type: 'number', unit: 'bopd', frequency: '1hr' },
          gasRate: { type: 'number', unit: 'mscfd', frequency: '1hr' },
          waterRate: { type: 'number', unit: 'bwpd', frequency: '1hr' },
          tubingPressure: { type: 'number', unit: 'psi', frequency: '1min' },
          casingPressure: { type: 'number', unit: 'psi', frequency: '1min' },
          flowingBhp: { type: 'number', unit: 'psi', frequency: '5min' },
          wellheadTemp: { type: 'number', unit: 'F', frequency: '5min' },
        },
        computedFields: [
          {
            key: 'liquidRate',
            name: 'Tasa Líquida',
            unit: 'blpd',
            formula: 'telemetry.oilRate + telemetry.waterRate',
            recalculateOn: ['telemetry.oilRate', 'telemetry.waterRate'],
          },
          {
            key: 'waterCut',
            name: 'Corte de Agua',
            unit: '%',
            formula: '(telemetry.waterRate / (telemetry.oilRate + telemetry.waterRate)) * 100',
            recalculateOn: ['telemetry.oilRate', 'telemetry.waterRate'],
          },
          {
            key: 'gor',
            name: 'GOR',
            unit: 'scf/stb',
            formula: 'telemetry.gasRate * 1000 / telemetry.oilRate',
            recalculateOn: ['telemetry.oilRate', 'telemetry.gasRate'],
          },
        ],
        sortOrder: 4,
      });
    }

    logger.info('Asset types ensured for legacy migration', {
      basinTypeId: basinType.id,
      fieldTypeId: fieldType.id,
      reservoirTypeId: reservoirType.id,
      wellTypeId: wellType.id,
    });

    return {
      basinTypeId: basinType.id,
      fieldTypeId: fieldType.id,
      reservoirTypeId: reservoirType.id,
      wellTypeId: wellType.id,
    };
  }

  /**
   * Migrate a single basin to Digital Twin
   */
  async migrateBasin(tenantId: string, userId: string, basinId: string, basinTypeId: string): Promise<string> {
    // Get legacy basin
    const [basin] = await db.select().from(basins).where(eq(basins.id, basinId));
    if (!basin) {
      throw new Error(`Basin not found: ${basinId}`);
    }

    // Check if already migrated
    const existing = await assetsRepository.findByLegacyId(tenantId, 'basin', basinId);
    if (existing) {
      logger.debug('Basin already migrated', { basinId, assetId: existing.id });
      return existing.id;
    }

    // Create Digital Twin asset
    const asset = await assetsRepository.create(tenantId, userId, {
      assetTypeId: basinTypeId,
      code: `BASIN-${basin.id.substring(0, 8)}`,
      name: basin.name,
      status: 'ACTIVE',
      properties: {
        basinType: basin.basinType,
        country: basin.country,
        areaKm2: basin.areaKm2 ? parseFloat(basin.areaKm2) : null,
      },
      attributes: {
        description: basin.description,
      },
      latitude: basin.minLatitude && basin.maxLatitude ? 
        ((parseFloat(basin.minLatitude) + parseFloat(basin.maxLatitude)) / 2).toString() : null,
      longitude: basin.minLongitude && basin.maxLongitude ?
        ((parseFloat(basin.minLongitude) + parseFloat(basin.maxLongitude)) / 2).toString() : null,
      legacyType: 'basin',
      legacyId: basinId,
    });

    logger.info('Basin migrated to Digital Twin', { basinId, assetId: asset.id });
    return asset.id;
  }

  /**
   * Migrate all basins for a tenant
   */
  async migrateAllBasins(tenantId: string, userId: string): Promise<{ migrated: number; skipped: number }> {
    const assetTypes = await this.ensureAssetTypes(tenantId);
    
    const allBasins = await db.select().from(basins).where(eq(basins.tenantId, tenantId));
    
    let migrated = 0;
    let skipped = 0;

    for (const basin of allBasins) {
      try {
        const existing = await assetsRepository.findByLegacyId(tenantId, 'basin', basin.id);
        if (existing) {
          skipped++;
          continue;
        }

        await this.migrateBasin(tenantId, userId, basin.id, assetTypes.basinTypeId);
        migrated++;
      } catch (error: any) {
        logger.error('Error migrating basin', { basinId: basin.id, error: error.message });
      }
    }

    logger.info('Basin migration completed', { migrated, skipped, total: allBasins.length });
    return { migrated, skipped };
  }

  /**
   * Migrate a single field to Digital Twin
   */
  async migrateField(
    tenantId: string,
    userId: string,
    fieldId: string,
    fieldTypeId: string,
    parentAssetId?: string
  ): Promise<string> {
    const [field] = await db.select().from(fields).where(eq(fields.id, fieldId));
    if (!field) {
      throw new Error(`Field not found: ${fieldId}`);
    }

    const existing = await assetsRepository.findByLegacyId(tenantId, 'field', fieldId);
    if (existing) {
      logger.debug('Field already migrated', { fieldId, assetId: existing.id });
      return existing.id;
    }

    // If field has a basin, find the migrated basin asset
    let parentId = parentAssetId;
    if (!parentId && field.basinId) {
      const basinAsset = await assetsRepository.findByLegacyId(tenantId, 'basin', field.basinId);
      if (basinAsset) {
        parentId = basinAsset.id;
      }
    }

    const asset = await assetsRepository.create(tenantId, userId, {
      assetTypeId: fieldTypeId,
      code: field.fieldCode || `FIELD-${field.id.substring(0, 8)}`,
      name: field.fieldName,
      status: 'ACTIVE',
      parentAssetId: parentId,
      properties: {
        fieldCode: field.fieldCode,
        operator: field.operator,
        discoveryDate: field.discoveryDate,
        firstProductionDate: field.firstProductionDate,
        areaAcres: field.areaAcres ? parseFloat(field.areaAcres) : null,
      },
      attributes: {
        status: field.status,
        fieldType: field.fieldType,
        totalWells: field.totalWells,
        activeWells: field.activeWells,
        description: field.description,
      },
      latitude: field.centerLatitude,
      longitude: field.centerLongitude,
      legacyType: 'field',
      legacyId: fieldId,
    });

    logger.info('Field migrated to Digital Twin', { fieldId, assetId: asset.id });
    return asset.id;
  }

  /**
   * Migrate all fields for a tenant
   */
  async migrateAllFields(tenantId: string, userId: string): Promise<{ migrated: number; skipped: number }> {
    const assetTypes = await this.ensureAssetTypes(tenantId);
    
    const allFields = await db.select().from(fields).where(eq(fields.tenantId, tenantId));
    
    let migrated = 0;
    let skipped = 0;

    for (const field of allFields) {
      try {
        const existing = await assetsRepository.findByLegacyId(tenantId, 'field', field.id);
        if (existing) {
          skipped++;
          continue;
        }

        await this.migrateField(tenantId, userId, field.id, assetTypes.fieldTypeId);
        migrated++;
      } catch (error: any) {
        logger.error('Error migrating field', { fieldId: field.id, error: error.message });
      }
    }

    logger.info('Field migration completed', { migrated, skipped, total: allFields.length });
    return { migrated, skipped };
  }

  /**
   * Migrate all legacy entities for a tenant
   */
  async migrateAll(tenantId: string, userId: string): Promise<{
    basins: { migrated: number; skipped: number };
    fields: { migrated: number; skipped: number };
  }> {
    logger.info('Starting full legacy migration', { tenantId });

    // Migrate in order: basins -> fields -> reservoirs -> wells
    const basins = await this.migrateAllBasins(tenantId, userId);
    const fields = await this.migrateAllFields(tenantId, userId);

    logger.info('Full legacy migration completed', { basins, fields });

    return { basins, fields };
  }
}

export const legacyMigrationService = new LegacyToDigitalTwinMigrationService();
