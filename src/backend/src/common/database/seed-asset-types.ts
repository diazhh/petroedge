import { db, assetTypes } from './index';

/**
 * Seed Asset Types for Yacimientos Module
 * 
 * This creates the Digital Twin definitions for:
 * - BASIN (Cuenca)
 * - FIELD (Campo)
 * - RESERVOIR (Yacimiento)
 * - WELL (Pozo)
 */
export async function seedAssetTypes(tenantId: string) {
  console.log('\n🏗️  Creating Asset Types for Yacimientos module...');

  // ============================================================================
  // BASIN ASSET TYPE
  // ============================================================================
  const [basinType] = await db
    .insert(assetTypes)
    .values({
      tenantId,
      code: 'BASIN',
      name: 'Cuenca Sedimentaria',
      description: 'Cuenca geológica sedimentaria con potencial petrolero',
      icon: 'mountain',
      color: '#8B4513',
      
      // Fixed properties (schema estático)
      fixedSchema: {
        basinType: {
          type: 'enum',
          values: ['FORELAND', 'RIFT', 'PASSIVE_MARGIN', 'INTRACRATONIC', 'FOREARC'],
          required: true,
          description: 'Tipo de cuenca según origen tectónico',
        },
        country: {
          type: 'string',
          required: true,
          description: 'País donde se ubica la cuenca',
        },
        region: {
          type: 'string',
          required: false,
          description: 'Región o estado',
        },
        age: {
          type: 'string',
          required: false,
          description: 'Edad geológica (ej: Cretaceous-Tertiary)',
        },
        tectonicSetting: {
          type: 'string',
          required: false,
          description: 'Configuración tectónica',
        },
      },
      
      // Dynamic attributes (configurables por usuario)
      attributeSchema: {
        areaKm2: {
          type: 'number',
          unit: 'km²',
          min: 0,
          description: 'Área de la cuenca',
        },
        minLatitude: {
          type: 'number',
          unit: 'degrees',
          min: -90,
          max: 90,
          description: 'Latitud mínima',
        },
        maxLatitude: {
          type: 'number',
          unit: 'degrees',
          min: -90,
          max: 90,
          description: 'Latitud máxima',
        },
        minLongitude: {
          type: 'number',
          unit: 'degrees',
          min: -180,
          max: 180,
          description: 'Longitud mínima',
        },
        maxLongitude: {
          type: 'number',
          unit: 'degrees',
          min: -180,
          max: 180,
          description: 'Longitud máxima',
        },
        totalFields: {
          type: 'number',
          default: 0,
          description: 'Número total de campos',
        },
        totalWells: {
          type: 'number',
          default: 0,
          description: 'Número total de pozos',
        },
      },
      
      // Telemetry schema (datos en tiempo real)
      telemetrySchema: {
        totalProduction: {
          type: 'number',
          unit: 'bopd',
          frequency: '1hr',
          description: 'Producción total de petróleo',
        },
        totalGasProduction: {
          type: 'number',
          unit: 'mscfd',
          frequency: '1hr',
          description: 'Producción total de gas',
        },
        activeWells: {
          type: 'number',
          frequency: '1hr',
          description: 'Pozos activos',
        },
      },
      
      // Computed fields (campos calculados)
      computedFields: [
        {
          key: 'averageProductionPerWell',
          name: 'Producción Promedio por Pozo',
          unit: 'bopd',
          formula: 'telemetry.totalProduction / telemetry.activeWells',
          recalculateOn: ['telemetry.totalProduction', 'telemetry.activeWells'],
        },
      ],
      
      sortOrder: 1,
    })
    .returning();

  console.log(`✅ Asset Type created: ${basinType.name} (${basinType.code})`);

  // ============================================================================
  // FIELD ASSET TYPE
  // ============================================================================
  const [fieldType] = await db
    .insert(assetTypes)
    .values({
      tenantId,
      code: 'FIELD',
      name: 'Campo Petrolero',
      description: 'Campo de producción de hidrocarburos',
      icon: 'map-pin',
      color: '#2E7D32',
      
      fixedSchema: {
        fieldCode: {
          type: 'string',
          required: true,
          description: 'Código único del campo',
        },
        operator: {
          type: 'string',
          required: true,
          description: 'Operador del campo',
        },
        status: {
          type: 'enum',
          values: ['PRODUCING', 'DEVELOPING', 'ABANDONED', 'EXPLORATION'],
          required: true,
          default: 'PRODUCING',
          description: 'Estado del campo',
        },
        fieldType: {
          type: 'enum',
          values: ['ONSHORE', 'OFFSHORE_SHALLOW', 'OFFSHORE_DEEP', 'UNCONVENTIONAL'],
          required: false,
          description: 'Tipo de campo',
        },
        discoveryDate: {
          type: 'date',
          required: false,
          description: 'Fecha de descubrimiento',
        },
        firstProductionDate: {
          type: 'date',
          required: false,
          description: 'Fecha de primera producción',
        },
      },
      
      attributeSchema: {
        areaAcres: {
          type: 'number',
          unit: 'acres',
          min: 0,
          description: 'Área del campo',
        },
        centerLatitude: {
          type: 'number',
          unit: 'degrees',
          min: -90,
          max: 90,
          description: 'Latitud del centro',
        },
        centerLongitude: {
          type: 'number',
          unit: 'degrees',
          min: -180,
          max: 180,
          description: 'Longitud del centro',
        },
        totalWells: {
          type: 'number',
          default: 0,
          description: 'Total de pozos',
        },
        activeWells: {
          type: 'number',
          default: 0,
          description: 'Pozos activos',
        },
        totalReservoirs: {
          type: 'number',
          default: 0,
          description: 'Total de yacimientos',
        },
      },
      
      telemetrySchema: {
        currentOilRate: {
          type: 'number',
          unit: 'bopd',
          frequency: '1hr',
          description: 'Tasa actual de petróleo',
        },
        currentGasRate: {
          type: 'number',
          unit: 'mscfd',
          frequency: '1hr',
          description: 'Tasa actual de gas',
        },
        currentWaterRate: {
          type: 'number',
          unit: 'bwpd',
          frequency: '1hr',
          description: 'Tasa actual de agua',
        },
        producingWells: {
          type: 'number',
          frequency: '1hr',
          description: 'Pozos produciendo',
        },
      },
      
      computedFields: [
        {
          key: 'liquidRate',
          name: 'Tasa Líquida Total',
          unit: 'blpd',
          formula: 'telemetry.currentOilRate + telemetry.currentWaterRate',
          recalculateOn: ['telemetry.currentOilRate', 'telemetry.currentWaterRate'],
        },
        {
          key: 'waterCut',
          name: 'Corte de Agua',
          unit: '%',
          formula: '(telemetry.currentWaterRate / (telemetry.currentOilRate + telemetry.currentWaterRate)) * 100',
          recalculateOn: ['telemetry.currentOilRate', 'telemetry.currentWaterRate'],
        },
        {
          key: 'averageOilPerWell',
          name: 'Producción Promedio por Pozo',
          unit: 'bopd',
          formula: 'telemetry.currentOilRate / telemetry.producingWells',
          recalculateOn: ['telemetry.currentOilRate', 'telemetry.producingWells'],
        },
      ],
      
      sortOrder: 2,
    })
    .returning();

  console.log(`✅ Asset Type created: ${fieldType.name} (${fieldType.code})`);

  // ============================================================================
  // RESERVOIR ASSET TYPE
  // ============================================================================
  const [reservoirType] = await db
    .insert(assetTypes)
    .values({
      tenantId,
      code: 'RESERVOIR',
      name: 'Yacimiento',
      description: 'Yacimiento de hidrocarburos',
      icon: 'layers',
      color: '#1976D2',
      
      fixedSchema: {
        reservoirCode: {
          type: 'string',
          required: true,
          description: 'Código del yacimiento',
        },
        formationName: {
          type: 'string',
          required: true,
          description: 'Nombre de la formación geológica',
        },
        formationAge: {
          type: 'string',
          required: false,
          description: 'Edad geológica de la formación',
        },
        lithology: {
          type: 'enum',
          values: ['SANDSTONE', 'CARBONATE', 'SHALE', 'CONGLOMERATE', 'FRACTURED'],
          required: true,
          description: 'Litología predominante',
        },
        fluidType: {
          type: 'enum',
          values: ['BLACK_OIL', 'VOLATILE_OIL', 'RETROGRADE_GAS', 'WET_GAS', 'DRY_GAS'],
          required: true,
          description: 'Tipo de fluido',
        },
        driveMechanism: {
          type: 'enum',
          values: ['SOLUTION_GAS', 'GAS_CAP', 'WATER_DRIVE', 'GRAVITY_DRAINAGE', 'COMBINATION'],
          required: false,
          description: 'Mecanismo de empuje',
        },
      },
      
      attributeSchema: {
        avgPorosity: {
          type: 'number',
          unit: 'fraction',
          min: 0,
          max: 1,
          description: 'Porosidad promedio',
        },
        avgPermeabilityMd: {
          type: 'number',
          unit: 'mD',
          min: 0,
          description: 'Permeabilidad promedio',
        },
        avgWaterSaturation: {
          type: 'number',
          unit: 'fraction',
          min: 0,
          max: 1,
          description: 'Saturación de agua promedio',
        },
        netToGross: {
          type: 'number',
          unit: 'fraction',
          min: 0,
          max: 1,
          description: 'Relación neto/bruto',
        },
        topDepthTvdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad al tope (TVD)',
        },
        bottomDepthTvdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad a la base (TVD)',
        },
        avgNetPayFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Espesor neto promedio',
        },
        areaAcres: {
          type: 'number',
          unit: 'acres',
          min: 0,
          description: 'Área del yacimiento',
        },
        bulkVolumeAcreFt: {
          type: 'number',
          unit: 'acre-ft',
          min: 0,
          description: 'Volumen bruto',
        },
        initialPressurePsi: {
          type: 'number',
          unit: 'psi',
          min: 0,
          description: 'Presión inicial',
        },
        reservoirTemperatureF: {
          type: 'number',
          unit: '°F',
          min: 0,
          description: 'Temperatura del yacimiento',
        },
        pressureGradientPsiFt: {
          type: 'number',
          unit: 'psi/ft',
          min: 0,
          description: 'Gradiente de presión',
        },
        owcDepthTvdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad del contacto agua-petróleo',
        },
        gocDepthTvdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad del contacto gas-petróleo',
        },
        ooipMmstb: {
          type: 'number',
          unit: 'MMstb',
          min: 0,
          description: 'Petróleo original in-situ',
        },
        ogipBcf: {
          type: 'number',
          unit: 'Bcf',
          min: 0,
          description: 'Gas original in-situ',
        },
        recoveryFactor: {
          type: 'number',
          unit: 'fraction',
          min: 0,
          max: 1,
          description: 'Factor de recuperación',
        },
      },
      
      telemetrySchema: {
        currentPressurePsi: {
          type: 'number',
          unit: 'psi',
          frequency: '1hr',
          description: 'Presión actual promedio',
        },
        totalOilRate: {
          type: 'number',
          unit: 'bopd',
          frequency: '1hr',
          description: 'Tasa total de petróleo',
        },
        totalGasRate: {
          type: 'number',
          unit: 'mscfd',
          frequency: '1hr',
          description: 'Tasa total de gas',
        },
        totalWaterRate: {
          type: 'number',
          unit: 'bwpd',
          frequency: '1hr',
          description: 'Tasa total de agua',
        },
        activeWells: {
          type: 'number',
          frequency: '1hr',
          description: 'Pozos activos',
        },
      },
      
      computedFields: [
        {
          key: 'pressureDepletion',
          name: 'Depleción de Presión',
          unit: 'psi',
          formula: 'attributes.initialPressurePsi - telemetry.currentPressurePsi',
          recalculateOn: ['attributes.initialPressurePsi', 'telemetry.currentPressurePsi'],
        },
        {
          key: 'currentWaterCut',
          name: 'Corte de Agua Actual',
          unit: '%',
          formula: '(telemetry.totalWaterRate / (telemetry.totalOilRate + telemetry.totalWaterRate)) * 100',
          recalculateOn: ['telemetry.totalOilRate', 'telemetry.totalWaterRate'],
        },
        {
          key: 'remainingReservesMmstb',
          name: 'Reservas Remanentes',
          unit: 'MMstb',
          formula: 'attributes.ooipMmstb * attributes.recoveryFactor - computed.cumulativeOilMmstb',
          recalculateOn: ['attributes.ooipMmstb', 'attributes.recoveryFactor'],
        },
      ],
      
      sortOrder: 3,
    })
    .returning();

  console.log(`✅ Asset Type created: ${reservoirType.name} (${reservoirType.code})`);

  // ============================================================================
  // WELL ASSET TYPE
  // ============================================================================
  const [wellType] = await db
    .insert(assetTypes)
    .values({
      tenantId,
      code: 'WELL',
      name: 'Pozo',
      description: 'Pozo de producción o inyección',
      icon: 'droplet',
      color: '#D32F2F',
      
      fixedSchema: {
        wellCode: {
          type: 'string',
          required: true,
          description: 'Código del pozo',
        },
        apiNumber: {
          type: 'string',
          required: false,
          description: 'Número API',
        },
        wellType: {
          type: 'enum',
          values: ['PRODUCER', 'INJECTOR', 'OBSERVATION', 'DISPOSAL'],
          required: true,
          default: 'PRODUCER',
          description: 'Tipo de pozo',
        },
        status: {
          type: 'enum',
          values: ['PRODUCING', 'INJECTING', 'SHUT_IN', 'ABANDONED', 'DRILLING', 'SUSPENDED'],
          required: true,
          default: 'PRODUCING',
          description: 'Estado del pozo',
        },
        liftMethod: {
          type: 'enum',
          values: ['FLOWING', 'ESP', 'GAS_LIFT', 'SUCKER_ROD', 'PCP', 'PLUNGER_LIFT', 'HYDRAULIC_PUMP'],
          required: false,
          description: 'Método de levantamiento artificial',
        },
        spudDate: {
          type: 'date',
          required: false,
          description: 'Fecha de inicio de perforación',
        },
        completionDate: {
          type: 'date',
          required: false,
          description: 'Fecha de completación',
        },
        firstProductionDate: {
          type: 'date',
          required: false,
          description: 'Fecha de primera producción',
        },
        abandonmentDate: {
          type: 'date',
          required: false,
          description: 'Fecha de abandono',
        },
      },
      
      attributeSchema: {
        surfaceLatitude: {
          type: 'number',
          unit: 'degrees',
          min: -90,
          max: 90,
          description: 'Latitud de superficie',
        },
        surfaceLongitude: {
          type: 'number',
          unit: 'degrees',
          min: -180,
          max: 180,
          description: 'Longitud de superficie',
        },
        surfaceElevationFt: {
          type: 'number',
          unit: 'ft',
          description: 'Elevación de superficie',
        },
        totalDepthMdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad total medida',
        },
        totalDepthTvdFt: {
          type: 'number',
          unit: 'ft',
          min: 0,
          description: 'Profundidad total vertical',
        },
        tubingSize: {
          type: 'number',
          unit: 'in',
          min: 0,
          description: 'Diámetro de tubería',
        },
        casingSize: {
          type: 'number',
          unit: 'in',
          min: 0,
          description: 'Diámetro de revestidor',
        },
        reservoirPressure: {
          type: 'number',
          unit: 'psi',
          min: 0,
          description: 'Presión del yacimiento',
        },
        bubblePoint: {
          type: 'number',
          unit: 'psi',
          min: 0,
          description: 'Punto de burbuja',
        },
        oilApi: {
          type: 'number',
          unit: 'API',
          min: 0,
          description: 'Gravedad API del petróleo',
        },
        gor: {
          type: 'number',
          unit: 'scf/stb',
          min: 0,
          description: 'Relación gas-petróleo',
        },
        cumulativeOilMbbl: {
          type: 'number',
          unit: 'Mbbl',
          min: 0,
          default: 0,
          description: 'Petróleo acumulado',
        },
        cumulativeGasMmscf: {
          type: 'number',
          unit: 'MMscf',
          min: 0,
          default: 0,
          description: 'Gas acumulado',
        },
        cumulativeWaterMbbl: {
          type: 'number',
          unit: 'Mbbl',
          min: 0,
          default: 0,
          description: 'Agua acumulada',
        },
      },
      
      telemetrySchema: {
        tubingPressure: {
          type: 'number',
          unit: 'psi',
          frequency: '1min',
          description: 'Presión de tubería',
        },
        casingPressure: {
          type: 'number',
          unit: 'psi',
          frequency: '1min',
          description: 'Presión de casing',
        },
        flowingBhp: {
          type: 'number',
          unit: 'psi',
          frequency: '5min',
          description: 'Presión de fondo fluyente',
        },
        oilRate: {
          type: 'number',
          unit: 'bopd',
          frequency: '1hr',
          description: 'Tasa de petróleo',
        },
        waterRate: {
          type: 'number',
          unit: 'bwpd',
          frequency: '1hr',
          description: 'Tasa de agua',
        },
        gasRate: {
          type: 'number',
          unit: 'mscfd',
          frequency: '1hr',
          description: 'Tasa de gas',
        },
        wellheadTemp: {
          type: 'number',
          unit: '°F',
          frequency: '5min',
          description: 'Temperatura de cabezal',
        },
        // ESP telemetries
        espAmps: {
          type: 'number',
          unit: 'A',
          frequency: '1min',
          description: 'Amperaje ESP',
        },
        espFrequency: {
          type: 'number',
          unit: 'Hz',
          frequency: '1min',
          description: 'Frecuencia ESP',
        },
        intakeTemp: {
          type: 'number',
          unit: '°F',
          frequency: '5min',
          description: 'Temperatura de intake',
        },
        intakePressure: {
          type: 'number',
          unit: 'psi',
          frequency: '5min',
          description: 'Presión de intake',
        },
        motorTemp: {
          type: 'number',
          unit: '°F',
          frequency: '5min',
          description: 'Temperatura de motor',
        },
        vibrationX: {
          type: 'number',
          unit: 'g',
          frequency: '1min',
          description: 'Vibración eje X',
        },
        vibrationY: {
          type: 'number',
          unit: 'g',
          frequency: '1min',
          description: 'Vibración eje Y',
        },
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
          key: 'actualWaterCut',
          name: 'Corte de Agua Actual',
          unit: '%',
          formula: '(telemetry.waterRate / (telemetry.oilRate + telemetry.waterRate)) * 100',
          recalculateOn: ['telemetry.oilRate', 'telemetry.waterRate'],
        },
        {
          key: 'drawdown',
          name: 'Drawdown',
          unit: 'psi',
          formula: 'attributes.reservoirPressure - telemetry.flowingBhp',
          recalculateOn: ['attributes.reservoirPressure', 'telemetry.flowingBhp'],
        },
        {
          key: 'productivityIndex',
          name: 'Índice de Productividad',
          unit: 'bopd/psi',
          formula: 'telemetry.oilRate / computed.drawdown',
          recalculateOn: ['telemetry.oilRate', 'computed.drawdown'],
        },
        {
          key: 'actualGor',
          name: 'GOR Actual',
          unit: 'scf/stb',
          formula: '(telemetry.gasRate * 1000) / telemetry.oilRate',
          recalculateOn: ['telemetry.gasRate', 'telemetry.oilRate'],
        },
      ],
      
      sortOrder: 4,
    })
    .returning();

  console.log(`✅ Asset Type created: ${wellType.name} (${wellType.code})`);

  console.log('\n✅ All Asset Types created successfully!');
  
  return {
    basinType,
    fieldType,
    reservoirType,
    wellType,
  };
}
