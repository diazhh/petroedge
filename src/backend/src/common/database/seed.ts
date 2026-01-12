import { db, tenants, users, basins, fields, reservoirs, wells, assets, assetTypes } from './index';
import bcrypt from 'bcrypt';
import { seedAssetTypes } from './seed-asset-types';
import { seedAssets } from './seeds/assets.seed';
import { seedRootTelemetryRuleChain } from './seeds/root-telemetry-rule-chain.seed';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default tenant
    console.log('Creating default tenant...');
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: 'ACME Petroleum',
        slug: 'acme-petroleum',
        status: 'active',
        metadata: {
          industry: 'oil_and_gas',
          country: 'Venezuela',
          timezone: 'America/Caracas',
        },
      })
      .returning();

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // Create admin user
    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const [adminUser] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: 'admin@acme-petroleum.com',
        username: 'admin',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        metadata: {
          department: 'IT',
          position: 'System Administrator',
        },
      })
      .returning();

    console.log(`✅ Admin user created: ${adminUser.email} (${adminUser.id})`);

    // Create engineer user
    console.log('Creating engineer user...');
    const engineerPasswordHash = await bcrypt.hash('Engineer123!', 10);

    const [engineerUser] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: 'engineer@acme-petroleum.com',
        username: 'engineer',
        passwordHash: engineerPasswordHash,
        firstName: 'John',
        lastName: 'Engineer',
        role: 'engineer',
        status: 'active',
        emailVerified: true,
        metadata: {
          department: 'Operations',
          position: 'Petroleum Engineer',
        },
      })
      .returning();

    console.log(`✅ Engineer user created: ${engineerUser.email} (${engineerUser.id})`);

    // Create operator user
    console.log('Creating operator user...');
    const operatorPasswordHash = await bcrypt.hash('Operator123!', 10);

    const [operatorUser] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: 'operator@acme-petroleum.com',
        username: 'operator',
        passwordHash: operatorPasswordHash,
        firstName: 'Jane',
        lastName: 'Operator',
        role: 'operator',
        status: 'active',
        emailVerified: true,
        metadata: {
          department: 'Operations',
          position: 'Field Operator',
        },
      })
      .returning();

    console.log(`✅ Operator user created: ${operatorUser.email} (${operatorUser.id})`);

    // ========================================
    // CREATE ASSET TYPES (DIGITAL TWINS)
    // ========================================
    console.log('\n🏗️  Creating Digital Twin Asset Types...');
    const assetTypesCreated = await seedAssetTypes(tenant.id);
    console.log(`✅ Asset Types created: BASIN, FIELD, RESERVOIR, WELL`);

    // Create Yacimientos data (basins, fields, reservoirs, wells)
    console.log('\nCreating Yacimientos data...');

    // ========================================
    // CUENCA ORIENTAL DE VENEZUELA
    // ========================================
    const [basinOriental] = await db
      .insert(basins)
      .values({
        tenantId: tenant.id,
        name: 'Cuenca Oriental de Venezuela',
        basinType: 'FORELAND',
        country: 'Venezuela',
        region: 'Anzoátegui',
        areaKm2: '153000',
        age: 'Cretaceous-Tertiary',
        tectonicSetting: 'Foreland basin associated with Andean orogeny',
        minLatitude: '7.5',
        maxLatitude: '10.5',
        minLongitude: '-65.0',
        maxLongitude: '-60.0',
        description: 'Principal cuenca petrolera de Venezuela, ubicada al este del país. Produce principalmente crudo pesado y extrapesado.',
      })
      .returning();

    console.log(`✅ Basin created: ${basinOriental.name}`);

    // Campo Morichal
    const [fieldMorichal] = await db
      .insert(fields)
      .values({
        tenantId: tenant.id,
        basinId: basinOriental.id,
        fieldName: 'Campo Morichal',
        fieldCode: 'MOR',
        operator: 'PDVSA',
        status: 'PRODUCING',
        fieldType: 'ONSHORE',
        discoveryDate: new Date('1985-03-15'),
        firstProductionDate: new Date('1987-06-01'),
        areaAcres: '125000',
        centerLatitude: '9.2345',
        centerLongitude: '-62.1234',
        totalWells: 8,
        activeWells: 7,
        description: 'Campo productor de crudo mediano en la Cuenca Oriental. Produce principalmente de las formaciones Oficina y Merecure.',
      })
      .returning();

    // Campo Cerro Negro
    const [fieldCerroNegro] = await db
      .insert(fields)
      .values({
        tenantId: tenant.id,
        basinId: basinOriental.id,
        fieldName: 'Campo Cerro Negro',
        fieldCode: 'CN',
        operator: 'PDVSA',
        status: 'PRODUCING',
        fieldType: 'ONSHORE',
        discoveryDate: new Date('1979-11-20'),
        firstProductionDate: new Date('2001-05-15'),
        areaAcres: '85000',
        centerLatitude: '8.9876',
        centerLongitude: '-63.4567',
        totalWells: 5,
        activeWells: 5,
        description: 'Campo de crudo extrapesado en la Faja Petrolífera del Orinoco. Requiere mejoramiento para su comercialización.',
      })
      .returning();

    console.log(`✅ Fields created: ${fieldMorichal.fieldName}, ${fieldCerroNegro.fieldName}`);

    // Yacimientos Campo Morichal
    const [resMorichalOfSup] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        reservoirName: 'Oficina Superior',
        reservoirCode: 'MOR-OF-SUP',
        formationName: 'Oficina',
        formationAge: 'Oligocene-Miocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'SOLUTION_GAS',
        topDepthTvdFt: '4500',
        bottomDepthTvdFt: '4850',
        avgNetPayFt: '280',
        avgPorosity: '0.22',
        avgPermeabilityMd: '450',
        avgWaterSaturation: '0.35',
        initialPressurePsi: '2100',
        currentPressurePsi: '1850',
        reservoirTemperatureF: '180',
        areaAcres: '45000',
        ooipMmstb: '850',
        recoveryFactor: '0.28',
        description: 'Yacimiento principal de areniscas Oficina Superior con buena calidad petrofísica.',
      })
      .returning();

    const [resMorichalOfInf] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        reservoirName: 'Oficina Inferior',
        reservoirCode: 'MOR-OF-INF',
        formationName: 'Oficina',
        formationAge: 'Oligocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'WATER_DRIVE',
        topDepthTvdFt: '5200',
        bottomDepthTvdFt: '5600',
        avgNetPayFt: '320',
        avgPorosity: '0.25',
        avgPermeabilityMd: '650',
        avgWaterSaturation: '0.30',
        initialPressurePsi: '2400',
        currentPressurePsi: '2050',
        reservoirTemperatureF: '195',
        areaAcres: '38000',
        ooipMmstb: '720',
        recoveryFactor: '0.32',
        description: 'Yacimiento secundario con mejor permeabilidad y empuje hidráulico activo.',
      })
      .returning();

    const [resMorichalMerecure] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        reservoirName: 'Merecure',
        reservoirCode: 'MOR-MER',
        formationName: 'Merecure',
        formationAge: 'Eocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'COMBINATION',
        topDepthTvdFt: '6100',
        bottomDepthTvdFt: '6450',
        avgNetPayFt: '250',
        avgPorosity: '0.19',
        avgPermeabilityMd: '280',
        avgWaterSaturation: '0.38',
        initialPressurePsi: '2850',
        currentPressurePsi: '2600',
        reservoirTemperatureF: '210',
        areaAcres: '28000',
        ooipMmstb: '480',
        recoveryFactor: '0.25',
        description: 'Yacimiento profundo con crudo de mejor calidad API.',
      })
      .returning();

    // Yacimientos Campo Cerro Negro
    const [resCerroNegroC1] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        reservoirName: 'C-1',
        reservoirCode: 'CN-C1',
        formationName: 'Oficina',
        formationAge: 'Miocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'SOLUTION_GAS',
        topDepthTvdFt: '2800',
        bottomDepthTvdFt: '3150',
        avgNetPayFt: '280',
        avgPorosity: '0.32',
        avgPermeabilityMd: '3500',
        avgWaterSaturation: '0.25',
        initialPressurePsi: '1200',
        currentPressurePsi: '950',
        reservoirTemperatureF: '140',
        areaAcres: '55000',
        ooipMmstb: '4200',
        recoveryFactor: '0.12',
        description: 'Yacimiento de crudo extrapesado (8-10 API) con alta permeabilidad. Requiere métodos de recuperación mejorada.',
      })
      .returning();

    const [resCerroNegroC2] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        reservoirName: 'C-2',
        reservoirCode: 'CN-C2',
        formationName: 'Oficina',
        formationAge: 'Miocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'SOLUTION_GAS',
        topDepthTvdFt: '3200',
        bottomDepthTvdFt: '3580',
        avgNetPayFt: '310',
        avgPorosity: '0.30',
        avgPermeabilityMd: '2800',
        avgWaterSaturation: '0.28',
        initialPressurePsi: '1350',
        currentPressurePsi: '1100',
        reservoirTemperatureF: '155',
        areaAcres: '48000',
        ooipMmstb: '3800',
        recoveryFactor: '0.10',
        description: 'Yacimiento más profundo de crudo extrapesado con mejor temperatura de yacimiento.',
      })
      .returning();

    console.log(`✅ Reservoirs created: 5 reservoirs`);

    // ========================================
    // CUENCA DEL LAGO DE MARACAIBO
    // ========================================
    const [basinMaracaibo] = await db
      .insert(basins)
      .values({
        tenantId: tenant.id,
        name: 'Cuenca del Lago de Maracaibo',
        basinType: 'RIFT',
        country: 'Venezuela',
        region: 'Zulia',
        areaKm2: '67000',
        age: 'Cretaceous-Tertiary',
        tectonicSetting: 'Rift basin with pull-apart structure',
        minLatitude: '8.5',
        maxLatitude: '11.0',
        minLongitude: '-72.5',
        maxLongitude: '-70.5',
        description: 'Segunda cuenca más importante de Venezuela. Produce crudo liviano y mediano de excelente calidad.',
      })
      .returning();

    // Campo Tía Juana
    const [fieldTiaJuana] = await db
      .insert(fields)
      .values({
        tenantId: tenant.id,
        basinId: basinMaracaibo.id,
        fieldName: 'Campo Tía Juana',
        fieldCode: 'TJ',
        operator: 'PDVSA',
        status: 'PRODUCING',
        fieldType: 'ONSHORE',
        discoveryDate: new Date('1928-07-14'),
        firstProductionDate: new Date('1930-01-20'),
        areaAcres: '95000',
        centerLatitude: '10.1234',
        centerLongitude: '-71.2345',
        totalWells: 6,
        activeWells: 5,
        description: 'Campo histórico de la Cuenca del Lago de Maracaibo. Uno de los campos más prolíficos de Venezuela.',
      })
      .returning();

    console.log(`✅ Basin and Field created: ${basinMaracaibo.name}, ${fieldTiaJuana.fieldName}`);

    // Yacimientos Campo Tía Juana
    const [resTiaJuanaLagunillas] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        reservoirName: 'Lagunillas Superior',
        reservoirCode: 'TJ-LAG-SUP',
        formationName: 'Lagunillas',
        formationAge: 'Miocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'WATER_DRIVE',
        topDepthTvdFt: '3200',
        bottomDepthTvdFt: '3650',
        avgNetPayFt: '380',
        avgPorosity: '0.28',
        avgPermeabilityMd: '1200',
        avgWaterSaturation: '0.32',
        initialPressurePsi: '1650',
        currentPressurePsi: '1450',
        reservoirTemperatureF: '165',
        areaAcres: '62000',
        ooipMmstb: '1850',
        recoveryFactor: '0.42',
        description: 'Yacimiento principal del campo con excelente calidad de crudo (28-32 API).',
      })
      .returning();

    const [resTiaJuanaBachaquero] = await db
      .insert(reservoirs)
      .values({
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        reservoirName: 'Bachaquero',
        reservoirCode: 'TJ-BACH',
        formationName: 'Bachaquero',
        formationAge: 'Eocene',
        lithology: 'SANDSTONE',
        fluidType: 'BLACK_OIL',
        driveMechanism: 'COMBINATION',
        topDepthTvdFt: '5800',
        bottomDepthTvdFt: '6250',
        avgNetPayFt: '320',
        avgPorosity: '0.24',
        avgPermeabilityMd: '850',
        avgWaterSaturation: '0.35',
        initialPressurePsi: '2950',
        currentPressurePsi: '2700',
        reservoirTemperatureF: '220',
        areaAcres: '48000',
        ooipMmstb: '980',
        recoveryFactor: '0.38',
        description: 'Yacimiento profundo con crudo liviano de alta calidad (34-36 API).',
      })
      .returning();

    console.log(`✅ All reservoirs created: 7 total`);

    // ========================================
    // POZOS - CAMPO MORICHAL
    // ========================================
    const wellsMorichal = [
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfSup.id,
        wellName: 'MOR-001',
        wellCode: 'MOR-001',
        apiNumber: 'VE-ANZ-MOR-001',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'ESP',
        surfaceLatitude: '9.2356',
        surfaceLongitude: '-62.1245',
        surfaceElevationFt: '245',
        totalDepthMdFt: '5100',
        totalDepthTvdFt: '5050',
        spudDate: new Date('2010-03-15'),
        completionDate: new Date('2010-05-20'),
        firstProductionDate: new Date('2010-06-01'),
        tubingSize: '2.875',
        casingSize: '7.0',
        currentOilRateBopd: '850',
        currentGasRateMscfd: '1200',
        currentWaterRateBwpd: '320',
        cumulativeOilMbbl: '2450',
        cumulativeGasMmscf: '3200',
        cumulativeWaterMbbl: '890',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfSup.id,
        wellName: 'MOR-002',
        wellCode: 'MOR-002',
        apiNumber: 'VE-ANZ-MOR-002',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'GAS_LIFT',
        surfaceLatitude: '9.2378',
        surfaceLongitude: '-62.1267',
        surfaceElevationFt: '238',
        totalDepthMdFt: '4950',
        totalDepthTvdFt: '4920',
        spudDate: new Date('2011-01-10'),
        completionDate: new Date('2011-03-15'),
        firstProductionDate: new Date('2011-04-01'),
        tubingSize: '2.875',
        casingSize: '7.0',
        currentOilRateBopd: '720',
        currentGasRateMscfd: '980',
        currentWaterRateBwpd: '280',
        cumulativeOilMbbl: '2100',
        cumulativeGasMmscf: '2800',
        cumulativeWaterMbbl: '750',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfInf.id,
        wellName: 'MOR-003',
        wellCode: 'MOR-003',
        apiNumber: 'VE-ANZ-MOR-003',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'ESP',
        surfaceLatitude: '9.2390',
        surfaceLongitude: '-62.1289',
        surfaceElevationFt: '252',
        totalDepthMdFt: '5750',
        totalDepthTvdFt: '5680',
        spudDate: new Date('2012-06-20'),
        completionDate: new Date('2012-08-25'),
        firstProductionDate: new Date('2012-09-10'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '1100',
        currentGasRateMscfd: '1500',
        currentWaterRateBwpd: '450',
        cumulativeOilMbbl: '3200',
        cumulativeGasMmscf: '4100',
        cumulativeWaterMbbl: '1200',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfInf.id,
        wellName: 'MOR-004',
        wellCode: 'MOR-004',
        apiNumber: 'VE-ANZ-MOR-004',
        wellType: 'PRODUCER',
        status: 'SHUT_IN',
        liftMethod: 'ESP',
        surfaceLatitude: '9.2412',
        surfaceLongitude: '-62.1301',
        surfaceElevationFt: '248',
        totalDepthMdFt: '5650',
        totalDepthTvdFt: '5600',
        spudDate: new Date('2015-02-10'),
        completionDate: new Date('2015-04-15'),
        firstProductionDate: new Date('2015-05-01'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '0',
        currentGasRateMscfd: '0',
        currentWaterRateBwpd: '0',
        cumulativeOilMbbl: '1850',
        cumulativeGasMmscf: '2400',
        cumulativeWaterMbbl: '680',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalMerecure.id,
        wellName: 'MOR-005',
        wellCode: 'MOR-005',
        apiNumber: 'VE-ANZ-MOR-005',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'GAS_LIFT',
        surfaceLatitude: '9.2334',
        surfaceLongitude: '-62.1223',
        surfaceElevationFt: '241',
        totalDepthMdFt: '6580',
        totalDepthTvdFt: '6520',
        spudDate: new Date('2018-09-05'),
        completionDate: new Date('2018-11-10'),
        firstProductionDate: new Date('2018-12-01'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '950',
        currentGasRateMscfd: '1350',
        currentWaterRateBwpd: '180',
        cumulativeOilMbbl: '1450',
        cumulativeGasMmscf: '1950',
        cumulativeWaterMbbl: '320',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfSup.id,
        wellName: 'MOR-006W',
        wellCode: 'MOR-006W',
        apiNumber: 'VE-ANZ-MOR-006W',
        wellType: 'INJECTOR',
        status: 'INJECTING',
        liftMethod: 'FLOWING',
        surfaceLatitude: '9.2298',
        surfaceLongitude: '-62.1189',
        surfaceElevationFt: '239',
        totalDepthMdFt: '4920',
        totalDepthTvdFt: '4890',
        spudDate: new Date('2016-03-12'),
        completionDate: new Date('2016-05-18'),
        firstProductionDate: new Date('2016-06-05'),
        tubingSize: '3.5',
        casingSize: '7.0',
        currentWaterRateBwpd: '3200',
        cumulativeWaterMbbl: '12500',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalOfInf.id,
        wellName: 'MOR-007',
        wellCode: 'MOR-007',
        apiNumber: 'VE-ANZ-MOR-007',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'ESP',
        surfaceLatitude: '9.2445',
        surfaceLongitude: '-62.1312',
        surfaceElevationFt: '256',
        totalDepthMdFt: '5820',
        totalDepthTvdFt: '5750',
        spudDate: new Date('2020-01-15'),
        completionDate: new Date('2020-03-22'),
        firstProductionDate: new Date('2020-04-10'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '1250',
        currentGasRateMscfd: '1680',
        currentWaterRateBwpd: '520',
        cumulativeOilMbbl: '1850',
        cumulativeGasMmscf: '2450',
        cumulativeWaterMbbl: '780',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldMorichal.id,
        primaryReservoirId: resMorichalMerecure.id,
        wellName: 'MOR-008',
        wellCode: 'MOR-008',
        apiNumber: 'VE-ANZ-MOR-008',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'GAS_LIFT',
        surfaceLatitude: '9.2367',
        surfaceLongitude: '-62.1278',
        surfaceElevationFt: '247',
        totalDepthMdFt: '6720',
        totalDepthTvdFt: '6650',
        spudDate: new Date('2024-08-10'),
        completionDate: new Date('2024-10-15'),
        firstProductionDate: new Date('2024-11-01'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '780',
        currentGasRateMscfd: '1050',
        currentWaterRateBwpd: '95',
        cumulativeOilMbbl: '125',
        cumulativeGasMmscf: '168',
        cumulativeWaterMbbl: '15',
      },
    ];

    // Pozos Campo Cerro Negro
    const wellsCerroNegro = [
      {
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        primaryReservoirId: resCerroNegroC1.id,
        wellName: 'CN-H001',
        wellCode: 'CN-H001',
        apiNumber: 'VE-ANZ-CN-H001',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'PCP',
        surfaceLatitude: '8.9890',
        surfaceLongitude: '-63.4580',
        surfaceElevationFt: '185',
        totalDepthMdFt: '3250',
        totalDepthTvdFt: '3100',
        spudDate: new Date('2002-03-10'),
        completionDate: new Date('2002-05-15'),
        firstProductionDate: new Date('2002-06-01'),
        tubingSize: '3.5',
        casingSize: '7.0',
        currentOilRateBopd: '450',
        currentGasRateMscfd: '180',
        currentWaterRateBwpd: '850',
        cumulativeOilMbbl: '3200',
        cumulativeGasMmscf: '1280',
        cumulativeWaterMbbl: '6500',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        primaryReservoirId: resCerroNegroC1.id,
        wellName: 'CN-H002',
        wellCode: 'CN-H002',
        apiNumber: 'VE-ANZ-CN-H002',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'PCP',
        surfaceLatitude: '8.9912',
        surfaceLongitude: '-63.4602',
        surfaceElevationFt: '188',
        totalDepthMdFt: '3180',
        totalDepthTvdFt: '3050',
        spudDate: new Date('2003-07-20'),
        completionDate: new Date('2003-09-25'),
        firstProductionDate: new Date('2003-10-10'),
        tubingSize: '3.5',
        casingSize: '7.0',
        currentOilRateBopd: '520',
        currentGasRateMscfd: '210',
        currentWaterRateBwpd: '920',
        cumulativeOilMbbl: '3850',
        cumulativeGasMmscf: '1540',
        cumulativeWaterMbbl: '7200',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        primaryReservoirId: resCerroNegroC2.id,
        wellName: 'CN-H003',
        wellCode: 'CN-H003',
        apiNumber: 'VE-ANZ-CN-H003',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'PCP',
        surfaceLatitude: '8.9934',
        surfaceLongitude: '-63.4625',
        surfaceElevationFt: '192',
        totalDepthMdFt: '3680',
        totalDepthTvdFt: '3520',
        spudDate: new Date('2005-11-15'),
        completionDate: new Date('2006-01-20'),
        firstProductionDate: new Date('2006-02-05'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '580',
        currentGasRateMscfd: '240',
        currentWaterRateBwpd: '1050',
        cumulativeOilMbbl: '4100',
        cumulativeGasMmscf: '1680',
        cumulativeWaterMbbl: '8200',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        primaryReservoirId: resCerroNegroC2.id,
        wellName: 'CN-H004',
        wellCode: 'CN-H004',
        apiNumber: 'VE-ANZ-CN-H004',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'PCP',
        surfaceLatitude: '8.9856',
        surfaceLongitude: '-63.4548',
        surfaceElevationFt: '183',
        totalDepthMdFt: '3720',
        totalDepthTvdFt: '3560',
        spudDate: new Date('2008-04-10'),
        completionDate: new Date('2008-06-15'),
        firstProductionDate: new Date('2008-07-01'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '610',
        currentGasRateMscfd: '255',
        currentWaterRateBwpd: '1120',
        cumulativeOilMbbl: '3950',
        cumulativeGasMmscf: '1620',
        cumulativeWaterMbbl: '7850',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldCerroNegro.id,
        primaryReservoirId: resCerroNegroC1.id,
        wellName: 'CN-S001',
        wellCode: 'CN-S001',
        apiNumber: 'VE-ANZ-CN-S001',
        wellType: 'INJECTOR',
        status: 'INJECTING',
        liftMethod: 'FLOWING',
        surfaceLatitude: '8.9878',
        surfaceLongitude: '-63.4512',
        surfaceElevationFt: '180',
        totalDepthMdFt: '3100',
        totalDepthTvdFt: '2980',
        spudDate: new Date('2010-09-05'),
        completionDate: new Date('2010-11-10'),
        firstProductionDate: new Date('2010-12-01'),
        tubingSize: '4.5',
        casingSize: '9.625',
        currentWaterRateBwpd: '5500',
        cumulativeWaterMbbl: '28000',
      },
    ];

    // Pozos Campo Tía Juana
    const wellsTiaJuana = [
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaLagunillas.id,
        wellName: 'TJ-0125',
        wellCode: 'TJ-0125',
        apiNumber: 'VE-ZUL-TJ-0125',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'GAS_LIFT',
        surfaceLatitude: '10.1245',
        surfaceLongitude: '-71.2356',
        surfaceElevationFt: '125',
        totalDepthMdFt: '3850',
        totalDepthTvdFt: '3820',
        spudDate: new Date('1995-02-10'),
        completionDate: new Date('1995-04-15'),
        firstProductionDate: new Date('1995-05-01'),
        tubingSize: '2.875',
        casingSize: '7.0',
        currentOilRateBopd: '1850',
        currentGasRateMscfd: '2400',
        currentWaterRateBwpd: '620',
        cumulativeOilMbbl: '12500',
        cumulativeGasMmscf: '16200',
        cumulativeWaterMbbl: '4200',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaLagunillas.id,
        wellName: 'TJ-0156',
        wellCode: 'TJ-0156',
        apiNumber: 'VE-ZUL-TJ-0156',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'GAS_LIFT',
        surfaceLatitude: '10.1267',
        surfaceLongitude: '-71.2378',
        surfaceElevationFt: '128',
        totalDepthMdFt: '3920',
        totalDepthTvdFt: '3890',
        spudDate: new Date('1998-06-15'),
        completionDate: new Date('1998-08-20'),
        firstProductionDate: new Date('1998-09-05'),
        tubingSize: '2.875',
        casingSize: '7.0',
        currentOilRateBopd: '1650',
        currentGasRateMscfd: '2150',
        currentWaterRateBwpd: '580',
        cumulativeOilMbbl: '10800',
        cumulativeGasMmscf: '14100',
        cumulativeWaterMbbl: '3650',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaBachaquero.id,
        wellName: 'TJ-0187',
        wellCode: 'TJ-0187',
        apiNumber: 'VE-ZUL-TJ-0187',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'ESP',
        surfaceLatitude: '10.1289',
        surfaceLongitude: '-71.2401',
        surfaceElevationFt: '132',
        totalDepthMdFt: '6380',
        totalDepthTvdFt: '6320',
        spudDate: new Date('2005-03-20'),
        completionDate: new Date('2005-06-25'),
        firstProductionDate: new Date('2005-07-10'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '2250',
        currentGasRateMscfd: '3100',
        currentWaterRateBwpd: '450',
        cumulativeOilMbbl: '14200',
        cumulativeGasMmscf: '19500',
        cumulativeWaterMbbl: '2850',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaBachaquero.id,
        wellName: 'TJ-0201',
        wellCode: 'TJ-0201',
        apiNumber: 'VE-ZUL-TJ-0201',
        wellType: 'PRODUCER',
        status: 'PRODUCING',
        liftMethod: 'ESP',
        surfaceLatitude: '10.1312',
        surfaceLongitude: '-71.2423',
        surfaceElevationFt: '135',
        totalDepthMdFt: '6450',
        totalDepthTvdFt: '6390',
        spudDate: new Date('2010-09-10'),
        completionDate: new Date('2010-11-15'),
        firstProductionDate: new Date('2010-12-01'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '2100',
        currentGasRateMscfd: '2900',
        currentWaterRateBwpd: '420',
        cumulativeOilMbbl: '9850',
        cumulativeGasMmscf: '13500',
        cumulativeWaterMbbl: '1950',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaLagunillas.id,
        wellName: 'TJ-W012',
        wellCode: 'TJ-W012',
        apiNumber: 'VE-ZUL-TJ-W012',
        wellType: 'INJECTOR',
        status: 'INJECTING',
        liftMethod: 'FLOWING',
        surfaceLatitude: '10.1198',
        surfaceLongitude: '-71.2312',
        surfaceElevationFt: '122',
        totalDepthMdFt: '3780',
        totalDepthTvdFt: '3750',
        spudDate: new Date('2012-05-15'),
        completionDate: new Date('2012-07-20'),
        firstProductionDate: new Date('2012-08-05'),
        tubingSize: '3.5',
        casingSize: '7.0',
        currentWaterRateBwpd: '4200',
        cumulativeWaterMbbl: '18500',
      },
      {
        tenantId: tenant.id,
        fieldId: fieldTiaJuana.id,
        primaryReservoirId: resTiaJuanaBachaquero.id,
        wellName: 'TJ-0215',
        wellCode: 'TJ-0215',
        apiNumber: 'VE-ZUL-TJ-0215',
        wellType: 'PRODUCER',
        status: 'SUSPENDED',
        liftMethod: 'ESP',
        surfaceLatitude: '10.1334',
        surfaceLongitude: '-71.2445',
        surfaceElevationFt: '138',
        totalDepthMdFt: '6520',
        totalDepthTvdFt: '6460',
        spudDate: new Date('2015-11-20'),
        completionDate: new Date('2016-01-25'),
        firstProductionDate: new Date('2016-02-10'),
        tubingSize: '3.5',
        casingSize: '9.625',
        currentOilRateBopd: '0',
        currentGasRateMscfd: '0',
        currentWaterRateBwpd: '0',
        cumulativeOilMbbl: '6850',
        cumulativeGasMmscf: '9400',
        cumulativeWaterMbbl: '1350',
      },
    ];

    await db.insert(wells).values([...wellsMorichal, ...wellsCerroNegro, ...wellsTiaJuana]);

    console.log(`✅ Wells created: ${wellsMorichal.length + wellsCerroNegro.length + wellsTiaJuana.length} wells total`);

    // ========================================
    // CREATE ASSETS (DIGITAL TWINS)
    // ========================================
    console.log('\n🏗️  Creating Assets (Digital Twins)...');
    await seedAssets();

    // ========================================
    // CREATE ROOT TELEMETRY RULE CHAIN
    // ========================================
    console.log('\n⚙️  Creating ROOT_TELEMETRY_PROCESSING Rule Chain...');
    await seedRootTelemetryRuleChain({
      tenantId: tenant.id,
      createdBy: adminUser.id,
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin User:');
    console.log('  Email: admin@acme-petroleum.com');
    console.log('  Password: Admin123!');
    console.log('  Role: admin');
    console.log('');
    console.log('Engineer User:');
    console.log('  Email: engineer@acme-petroleum.com');
    console.log('  Password: Engineer123!');
    console.log('  Role: engineer');
    console.log('');
    console.log('Operator User:');
    console.log('  Email: operator@acme-petroleum.com');
    console.log('  Password: Operator123!');
    console.log('  Role: operator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
