#!/usr/bin/env tsx
/**
 * Script de Migración: Yacimientos/Pozos → Eclipse Ditto
 * 
 * Migra todas las entidades legacy (basins, fields, reservoirs, wells)
 * a Eclipse Ditto Things para todos los tenants activos.
 * 
 * Uso:
 *   npm run migrate:ditto
 *   o
 *   tsx scripts/migrate-yacimientos-to-ditto.ts
 */

import { DittoSyncServiceFixed } from '../src/services/ditto-sync-fixed.service.js';
import postgres from 'postgres';
import { logger } from '../src/utils/logger.js';
import { CONFIG } from '../src/config/index.js';

interface MigrationStats {
  tenantId: string;
  tenantName: string;
  basins: number;
  fields: number;
  reservoirs: number;
  wells: number;
  errors: Array<{
    entityType: string;
    entityId: string;
    error: string;
  }>;
  duration: number;
}

async function main() {
  const startTime = Date.now();
  
  logger.info('🚀 Iniciando migración de Yacimientos/Pozos a Eclipse Ditto');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const client = postgres(CONFIG.postgres.url);
  const syncService = new DittoSyncServiceFixed();
  
  try {
    // Obtener todos los tenants activos
    logger.info('📋 Obteniendo tenants activos...');
    const tenants = await client`
      SELECT id, name FROM tenants WHERE status = 'active'
    `;
    
    logger.info(`✅ Encontrados ${tenants.length} tenant(s) activo(s)`);
    
    const allStats: MigrationStats[] = [];
    
    // Migrar cada tenant
    for (const tenant of tenants) {
      logger.info('');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info(`🔄 Migrando tenant: ${tenant.name} (${tenant.id})`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const tenantStartTime = Date.now();
      
      try {
        const result = await syncService.migrateAllEntities(tenant.id);
        
        const stats: MigrationStats = {
          tenantId: tenant.id,
          tenantName: tenant.name,
          basins: result.basins,
          fields: result.fields,
          reservoirs: result.reservoirs,
          wells: result.wells,
          errors: result.errors,
          duration: Date.now() - tenantStartTime,
        };
        
        allStats.push(stats);
        
        // Mostrar resumen del tenant
        logger.info('');
        logger.info('📊 Resumen de migración:');
        logger.info(`   Basins:     ${stats.basins} migrados`);
        logger.info(`   Fields:     ${stats.fields} migrados`);
        logger.info(`   Reservoirs: ${stats.reservoirs} migrados`);
        logger.info(`   Wells:      ${stats.wells} migrados`);
        logger.info(`   Errores:    ${stats.errors.length}`);
        logger.info(`   Duración:   ${(stats.duration / 1000).toFixed(2)}s`);
        
        if (stats.errors.length > 0) {
          logger.warn('');
          logger.warn('⚠️  Errores encontrados:');
          stats.errors.forEach((err, idx) => {
            logger.warn(`   ${idx + 1}. ${err.entityType} ${err.entityId}: ${err.error}`);
          });
        }
        
        logger.info('✅ Migración del tenant completada');
        
      } catch (error) {
        logger.error({ error, tenantId: tenant.id }, `❌ Error migrando tenant ${tenant.name}`);
        
        allStats.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          basins: 0,
          fields: 0,
          reservoirs: 0,
          wells: 0,
          errors: [{
            entityType: 'tenant',
            entityId: tenant.id,
            error: error instanceof Error ? error.message : String(error),
          }],
          duration: Date.now() - tenantStartTime,
        });
      }
    }
    
    // Resumen global
    logger.info('');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 MIGRACIÓN COMPLETADA');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('');
    logger.info('📊 Resumen Global:');
    
    const totalBasins = allStats.reduce((sum, s) => sum + s.basins, 0);
    const totalFields = allStats.reduce((sum, s) => sum + s.fields, 0);
    const totalReservoirs = allStats.reduce((sum, s) => sum + s.reservoirs, 0);
    const totalWells = allStats.reduce((sum, s) => sum + s.wells, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.errors.length, 0);
    const totalDuration = Date.now() - startTime;
    
    logger.info(`   Tenants procesados: ${allStats.length}`);
    logger.info(`   Total Basins:       ${totalBasins}`);
    logger.info(`   Total Fields:       ${totalFields}`);
    logger.info(`   Total Reservoirs:   ${totalReservoirs}`);
    logger.info(`   Total Wells:        ${totalWells}`);
    logger.info(`   Total Things:       ${totalBasins + totalFields + totalReservoirs + totalWells}`);
    logger.info(`   Total Errores:      ${totalErrors}`);
    logger.info(`   Duración total:     ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (totalErrors > 0) {
      logger.warn('');
      logger.warn('⚠️  Se encontraron errores durante la migración.');
      logger.warn('   Revisa los logs arriba para más detalles.');
    }
    
    logger.info('');
    logger.info('✅ Script de migración finalizado exitosamente');
    
  } catch (error) {
    logger.error({ error }, '❌ Error fatal durante la migración');
    throw error;
  } finally {
    // Cerrar conexiones
    await client.end();
    await syncService.close();
  }
}

// Ejecutar script
main()
  .then(() => {
    logger.info('👋 Adiós');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, '💥 Script terminó con error');
    process.exit(1);
  });
