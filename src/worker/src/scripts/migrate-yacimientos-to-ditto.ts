#!/usr/bin/env node
/**
 * Script de Migración: Yacimientos Legacy → Eclipse Ditto
 * 
 * Migra todas las entidades de yacimientos (basins, fields, reservoirs, wells)
 * desde las tablas legacy de PostgreSQL a Eclipse Ditto Things.
 * 
 * Uso:
 *   npm run migrate:ditto
 *   npm run migrate:ditto -- --tenant-id=<tenant_id>
 */

import { DittoSyncService } from '../services/ditto-sync.service.js';
import { DittoClientService } from '../services/ditto-client.service.js';
import postgres from 'postgres';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface MigrationStats {
  tenantId: string;
  tenantName: string;
  basins: number;
  fields: number;
  reservoirs: number;
  wells: number;
  errors: number;
  duration: number;
}

async function main() {
  const startTime = Date.now();
  
  logger.info('🚀 Iniciando migración de Yacimientos a Eclipse Ditto');
  
  const client = postgres(CONFIG.postgres.url);
  const syncService = new DittoSyncService();
  const dittoClient = new DittoClientService();
  
  try {
    // Verificar conexión a Ditto (intentar crear una policy de prueba)
    logger.info('Verificando conexión a Eclipse Ditto...');
    try {
      // Intentar acceder a la API de Ditto
      const testResponse = await fetch(`${CONFIG.ditto.url}/api/2/policies`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${CONFIG.ditto.username}:${CONFIG.ditto.password}`).toString('base64')}`,
        },
      });
      
      if (testResponse.status === 401) {
        throw new Error('Credenciales de Ditto incorrectas');
      }
      
      logger.info('✅ Eclipse Ditto API está accesible');
    } catch (error) {
      logger.error({ error }, 'No se puede conectar a Eclipse Ditto');
      throw new Error('Eclipse Ditto no está disponible. Verifica que esté corriendo en ' + CONFIG.ditto.url);
    }
    
    // Obtener tenant_id de argumentos o migrar todos
    const args = process.argv.slice(2);
    const tenantIdArg = args.find(arg => arg.startsWith('--tenant-id='));
    const specificTenantId = tenantIdArg ? tenantIdArg.split('=')[1] : null;
    
    // Obtener tenants
    const tenantsQuery = specificTenantId
      ? await client`SELECT id, name FROM tenants WHERE id = ${specificTenantId}`
      : await client`SELECT id, name FROM tenants`;
    
    if (tenantsQuery.length === 0) {
      logger.warn('No se encontraron tenants activos para migrar');
      return;
    }
    
    logger.info(`📋 Se migrarán ${tenantsQuery.length} tenant(s)`);
    
    const allStats: MigrationStats[] = [];
    
    // Migrar cada tenant
    for (const tenant of tenantsQuery) {
      const tenantStartTime = Date.now();
      
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`🔄 Migrando tenant: ${tenant.name} (${tenant.id})`);
      logger.info(`${'='.repeat(60)}\n`);
      
      try {
        // Intentar crear policy para el tenant (puede fallar si no hay permisos)
        logger.info('Intentando crear policy para el tenant...');
        try {
          await dittoClient.createPolicy({
            policyId: `${tenant.id}:default-policy`,
            entries: {
              owner: {
                subjects: {
                  'nginx:ditto': { type: 'nginx basic auth user' },
                },
                resources: {
                  'thing:/': {
                    grant: ['READ', 'WRITE'],
                    revoke: [],
                  },
                  'policy:/': {
                    grant: ['READ', 'WRITE'],
                    revoke: [],
                  },
                  'message:/': {
                    grant: ['READ', 'WRITE'],
                    revoke: [],
                  },
                },
              },
            },
          });
          logger.info('✅ Policy creada');
        } catch (policyError) {
          logger.warn('⚠️  No se pudo crear policy (continuando sin ella)');
        }
        
        // Ejecutar migración
        const result = await syncService.migrateAllEntities(tenant.id);
        
        const tenantDuration = Date.now() - tenantStartTime;
        
        const stats: MigrationStats = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          basins: result.basins,
          fields: result.fields,
          reservoirs: result.reservoirs,
          wells: result.wells,
          errors: result.errors.length,
          duration: tenantDuration,
        };
        
        allStats.push(stats);
        
        // Mostrar resumen del tenant
        logger.info(`\n📊 Resumen de migración - ${tenant.name}:`);
        logger.info(`   ✅ Basins:     ${result.basins}`);
        logger.info(`   ✅ Fields:     ${result.fields}`);
        logger.info(`   ✅ Reservoirs: ${result.reservoirs}`);
        logger.info(`   ✅ Wells:      ${result.wells}`);
        logger.info(`   ❌ Errores:    ${result.errors.length}`);
        logger.info(`   ⏱️  Duración:   ${(tenantDuration / 1000).toFixed(2)}s`);
        
        if (result.errors.length > 0) {
          logger.warn('\n⚠️  Errores encontrados:');
          result.errors.forEach(err => {
            logger.warn(`   - ${err.entityType} ${err.entityId}: ${err.error}`);
          });
        }
        
      } catch (error) {
        logger.error({ error, tenantId: tenant.id }, `❌ Error migrando tenant ${tenant.name}`);
        allStats.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          basins: 0,
          fields: 0,
          reservoirs: 0,
          wells: 0,
          errors: 1,
          duration: Date.now() - tenantStartTime,
        });
      }
    }
    
    // Resumen final
    const totalDuration = Date.now() - startTime;
    
    logger.info(`\n${'='.repeat(60)}`);
    logger.info('🎉 MIGRACIÓN COMPLETADA');
    logger.info(`${'='.repeat(60)}\n`);
    
    const totals = allStats.reduce(
      (acc, stat) => ({
        basins: acc.basins + stat.basins,
        fields: acc.fields + stat.fields,
        reservoirs: acc.reservoirs + stat.reservoirs,
        wells: acc.wells + stat.wells,
        errors: acc.errors + stat.errors,
      }),
      { basins: 0, fields: 0, reservoirs: 0, wells: 0, errors: 0 }
    );
    
    logger.info('📊 RESUMEN TOTAL:');
    logger.info(`   Tenants procesados: ${allStats.length}`);
    logger.info(`   Basins migrados:    ${totals.basins}`);
    logger.info(`   Fields migrados:    ${totals.fields}`);
    logger.info(`   Reservoirs migrados: ${totals.reservoirs}`);
    logger.info(`   Wells migrados:     ${totals.wells}`);
    logger.info(`   Total Things:       ${totals.basins + totals.fields + totals.reservoirs + totals.wells}`);
    logger.info(`   Errores:            ${totals.errors}`);
    logger.info(`   Duración total:     ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (totals.errors === 0) {
      logger.info('\n✅ Migración exitosa sin errores');
    } else {
      logger.warn(`\n⚠️  Migración completada con ${totals.errors} errores`);
    }
    
  } catch (error) {
    logger.error({ error }, '❌ Error fatal durante la migración');
    process.exit(1);
  } finally {
    await syncService.close();
    await client.end();
  }
}

// Ejecutar script
main().catch((error) => {
  logger.error({ error }, 'Error no capturado');
  process.exit(1);
});
