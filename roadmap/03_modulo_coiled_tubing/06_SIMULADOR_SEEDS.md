# BLOQUE 6: SIMULADOR Y SEEDS

> **Módulo**: Coiled Tubing  
> **Fase**: Simulador de Telemetría y Datos de Prueba  
> **Duración estimada**: 1 semana  
> **Prioridad**: 🟡 MEDIA (Testing y demostración)

---

## 📋 ÍNDICE

1. [Simulador Python Mejorado](#simulador-python-mejorado)
2. [Seeds de Assets CT](#seeds-de-assets-ct)
3. [Seeds de Jobs](#seeds-de-jobs)
4. [Casos de Uso de Prueba](#casos-de-uso-de-prueba)
5. [Implementación](#implementación)

---

## 1. SIMULADOR PYTHON MEJORADO

### 1.1 Propósito

El simulador genera telemetría realista para probar el módulo CT sin equipos físicos.

**Ubicación**: `/tools/ct-simulator/`

### 1.2 ct_simulator.py

```python
#!/usr/bin/env python3
"""
Simulador de Telemetría de Coiled Tubing
Genera datos realistas para testing del módulo CT
"""

import asyncio
import json
import random
from datetime import datetime
from typing import Dict, List
from aiokafka import AIOKafkaProducer
import numpy as np

class CtJobSimulator:
    """Simula un job de CT con telemetría realista"""
    
    def __init__(self, job_config: Dict):
        self.job_id = job_config['job_id']
        self.job_type = job_config['job_type']
        self.unit_id = job_config['unit_id']
        self.reel_id = job_config['reel_id']
        self.target_depth_ft = job_config['target_depth_ft']
        
        # Wellbore trajectory
        self.trajectory = job_config.get('trajectory', self._generate_default_trajectory())
        
        # Current state
        self.current_depth = 0
        self.current_operation = 'IDLE'
        self.start_time = datetime.now()
        
        # Kafka producer
        self.producer = None
        
    def _generate_default_trajectory(self) -> List[Dict]:
        """Genera trayectoria vertical simple"""
        return [
            {'md': 0, 'tvd': 0, 'inc': 0, 'azi': 0},
            {'md': 5000, 'tvd': 5000, 'inc': 0, 'azi': 0},
            {'md': 10000, 'tvd': 10000, 'inc': 0, 'azi': 0},
        ]
    
    async def start(self):
        """Inicia el simulador"""
        # Conectar a Kafka
        self.producer = AIOKafkaProducer(
            bootstrap_servers='localhost:9092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()
        
        try:
            await self._simulate_job()
        finally:
            await self.producer.stop()
    
    async def _simulate_job(self):
        """Simula el ciclo completo del job"""
        print(f"🚀 Iniciando simulación de job {self.job_id}")
        
        # 1. RIH (Run In Hole) hasta target depth
        await self._simulate_rih(self.target_depth_ft, speed_ft_min=50)
        
        # 2. Operación principal según job type
        if self.job_type == 'CLN':
            await self._simulate_cleanout()
        elif self.job_type == 'N2L':
            await self._simulate_nitrogen_lift()
        elif self.job_type == 'ACT':
            await self._simulate_acid_treatment()
        
        # 3. POOH (Pull Out Of Hole)
        await self._simulate_pooh(speed_ft_min=60)
        
        print(f"✅ Simulación completada: {self.job_id}")
    
    async def _simulate_rih(self, target_depth: float, speed_ft_min: float):
        """Simula Run In Hole"""
        print(f"📍 RIH: 0 → {target_depth} ft @ {speed_ft_min} ft/min")
        
        self.current_operation = 'RIH'
        self.current_depth = 0
        
        while self.current_depth < target_depth:
            # Incrementar profundidad
            depth_increment = speed_ft_min / 60  # ft/s
            self.current_depth = min(self.current_depth + depth_increment, target_depth)
            
            # Calcular peso (con variaciones)
            string_weight = self._calculate_string_weight(self.current_depth)
            friction = self._calculate_friction(self.current_depth, 'RIH')
            surface_weight = -(string_weight + friction)  # Negativo en RIH
            
            # Agregar ruido realista
            surface_weight += random.gauss(0, 100)
            
            # Calcular presiones
            pump_pressure = random.uniform(2500, 3000) if self.current_depth > 1000 else 0
            
            # Velocidad con variaciones
            actual_speed = speed_ft_min + random.gauss(0, 5)
            
            # Generar telemetría
            telemetry = {
                'timestamp': datetime.now().isoformat(),
                'jobId': self.job_id,
                'ctUnitId': self.unit_id,
                'tenantId': 'tenant-acme-petroleum',
                'dataSourceId': f'plc-{self.unit_id}',
                
                'tags': [
                    {'name': 'CT_DEPTH', 'value': self.current_depth, 'unit': 'ft', 'quality': 'GOOD'},
                    {'name': 'CT_WEIGHT', 'value': surface_weight, 'unit': 'lbs', 'quality': 'GOOD'},
                    {'name': 'CT_SPEED', 'value': actual_speed, 'unit': 'ft/min', 'quality': 'GOOD'},
                    {'name': 'CT_PUMP_PRESSURE', 'value': pump_pressure, 'unit': 'psi', 'quality': 'GOOD'},
                    {'name': 'CT_PUMP_RATE', 'value': 2.5, 'unit': 'bpm', 'quality': 'GOOD'},
                    {'name': 'CT_OPERATION_MODE', 'value': 1, 'unit': 'enum', 'quality': 'GOOD'},  # 1 = RIH
                ]
            }
            
            # Publicar a Kafka
            await self.producer.send('scada.telemetry.raw', telemetry)
            
            # Esperar 1 segundo (1Hz)
            await asyncio.sleep(1)
            
            # Log cada 500 ft
            if int(self.current_depth) % 500 == 0:
                print(f"  Depth: {self.current_depth:.0f} ft | Weight: {surface_weight:.0f} lbs | Speed: {actual_speed:.1f} ft/min")
    
    async def _simulate_pooh(self, speed_ft_min: float):
        """Simula Pull Out Of Hole"""
        print(f"📍 POOH: {self.current_depth} → 0 ft @ {speed_ft_min} ft/min")
        
        self.current_operation = 'POOH'
        
        while self.current_depth > 0:
            # Decrementar profundidad
            depth_decrement = speed_ft_min / 60
            self.current_depth = max(self.current_depth - depth_decrement, 0)
            
            # Calcular peso en pickup (positivo)
            string_weight = self._calculate_string_weight(self.current_depth)
            friction = self._calculate_friction(self.current_depth, 'POOH')
            surface_weight = string_weight + friction
            
            surface_weight += random.gauss(0, 100)
            
            # Velocidad negativa en POOH
            actual_speed = -speed_ft_min + random.gauss(0, 5)
            
            telemetry = {
                'timestamp': datetime.now().isoformat(),
                'jobId': self.job_id,
                'ctUnitId': self.unit_id,
                'tenantId': 'tenant-acme-petroleum',
                'dataSourceId': f'plc-{self.unit_id}',
                
                'tags': [
                    {'name': 'CT_DEPTH', 'value': self.current_depth, 'unit': 'ft', 'quality': 'GOOD'},
                    {'name': 'CT_WEIGHT', 'value': surface_weight, 'unit': 'lbs', 'quality': 'GOOD'},
                    {'name': 'CT_SPEED', 'value': actual_speed, 'unit': 'ft/min', 'quality': 'GOOD'},
                    {'name': 'CT_PUMP_PRESSURE', 'value': 0, 'unit': 'psi', 'quality': 'GOOD'},
                    {'name': 'CT_OPERATION_MODE', 'value': 2, 'unit': 'enum', 'quality': 'GOOD'},  # 2 = POOH
                ]
            }
            
            await self.producer.send('scada.telemetry.raw', telemetry)
            await asyncio.sleep(1)
            
            if int(self.current_depth) % 500 == 0 and self.current_depth > 0:
                print(f"  Depth: {self.current_depth:.0f} ft | Weight: {surface_weight:.0f} lbs")
    
    async def _simulate_cleanout(self):
        """Simula operación de cleanout"""
        print(f"🧹 Limpiando pozo @ {self.current_depth} ft")
        
        self.current_operation = 'CIRCULATING'
        
        # Circular durante 30 segundos
        for _ in range(30):
            # Presión alta para limpieza
            pump_pressure = random.uniform(3500, 4000)
            pump_rate = random.uniform(2.0, 3.0)
            
            telemetry = {
                'timestamp': datetime.now().isoformat(),
                'jobId': self.job_id,
                'ctUnitId': self.unit_id,
                'tenantId': 'tenant-acme-petroleum',
                'dataSourceId': f'plc-{self.unit_id}',
                
                'tags': [
                    {'name': 'CT_DEPTH', 'value': self.current_depth, 'unit': 'ft', 'quality': 'GOOD'},
                    {'name': 'CT_WEIGHT', 'value': -self._calculate_string_weight(self.current_depth), 'unit': 'lbs', 'quality': 'GOOD'},
                    {'name': 'CT_SPEED', 'value': 0, 'unit': 'ft/min', 'quality': 'GOOD'},
                    {'name': 'CT_PUMP_PRESSURE', 'value': pump_pressure, 'unit': 'psi', 'quality': 'GOOD'},
                    {'name': 'CT_PUMP_RATE', 'value': pump_rate, 'unit': 'bpm', 'quality': 'GOOD'},
                    {'name': 'CT_OPERATION_MODE', 'value': 3, 'unit': 'enum', 'quality': 'GOOD'},  # 3 = CIRCULATING
                ]
            }
            
            await self.producer.send('scada.telemetry.raw', telemetry)
            await asyncio.sleep(1)
    
    async def _simulate_nitrogen_lift(self):
        """Simula nitrogen lift"""
        print(f"💨 Nitrogen lift @ {self.current_depth} ft")
        # Similar a cleanout pero con parámetros diferentes
        await self._simulate_cleanout()
    
    async def _simulate_acid_treatment(self):
        """Simula acid treatment"""
        print(f"🧪 Acid treatment @ {self.current_depth} ft")
        await self._simulate_cleanout()
    
    def _calculate_string_weight(self, depth_ft: float) -> float:
        """Calcula peso de la sarta"""
        # Tubing: 1.75" CT90, ~2.35 lbs/ft
        weight_per_ft = 2.35
        
        # Buoyancy factor (asumiendo fluido 8.5 ppg)
        buoyancy = 1 - (8.5 * 0.052 / 7.85)
        
        return depth_ft * weight_per_ft * buoyancy
    
    def _calculate_friction(self, depth_ft: float, operation: str) -> float:
        """Calcula fricción"""
        # Coeficiente de fricción simplificado
        mu = 0.25
        
        # Fuerza normal (simplificado, asume vertical)
        normal_force = self._calculate_string_weight(depth_ft) * 0.1
        
        friction = mu * normal_force
        
        # Fricción es mayor en POOH
        if operation == 'POOH':
            friction *= 1.2
        
        return friction


async def main():
    """Main entry point"""
    
    # Configuración de jobs a simular
    jobs = [
        {
            'job_id': 'job-ct-2026-042',
            'job_type': 'CLN',
            'unit_id': 'asset-ct-unit-05',
            'reel_id': 'asset-reel-2024-012',
            'target_depth_ft': 8500
        },
        {
            'job_id': 'job-ct-2026-043',
            'job_type': 'N2L',
            'unit_id': 'asset-ct-unit-03',
            'reel_id': 'asset-reel-2024-008',
            'target_depth_ft': 6200
        },
    ]
    
    # Ejecutar simulaciones en paralelo
    tasks = [CtJobSimulator(job).start() for job in jobs]
    await asyncio.gather(*tasks)


if __name__ == '__main__':
    asyncio.run(main())
```

### 1.3 Casos de Prueba

**Script**: `test_scenarios.py`

```python
"""Escenarios de prueba específicos"""

# Escenario 1: Overpull alarm
async def test_overpull_scenario():
    """Simula condición de overpull para probar alarmas"""
    # ... código que genera peso excesivo
    
# Escenario 2: Fatigue critical
async def test_fatigue_critical():
    """Simula múltiples ciclos para alcanzar fatiga crítica"""
    # ... código que simula 50 viajes RIH/POOH
    
# Escenario 3: Lockup detection
async def test_lockup_scenario():
    """Simula lockup gradual"""
    # ... código
```

---

## 2. SEEDS DE ASSETS CT

### 2.1 Seed Script: create-ct-assets.ts

**Ubicación**: `/src/backend/scripts/seeds/create-ct-assets.ts`

```typescript
import { assetsService } from '../../modules/infrastructure/assets/assets.service';

export async function seedCtAssets(tenantId: string, userId: string) {
  console.log('🌱 Seeding CT Assets...');
  
  // 1. Crear CT Units
  const units = await seedCtUnits(tenantId, userId);
  
  // 2. Crear CT Reels
  const reels = await seedCtReels(tenantId, userId, units);
  
  // 3. Crear Reel Sections
  await seedReelSections(tenantId, userId, reels);
  
  // 4. Crear BHA Components (inventario)
  await seedBhaComponents(tenantId, userId);
  
  console.log('✅ CT Assets seeded successfully');
  
  return { units, reels };
}

async function seedCtUnits(tenantId: string, userId: string) {
  const unitsData = [
    {
      code: 'CT-UNIT-03',
      name: 'CT Unit 03 - Stewart 80K',
      assetTypeCode: 'CT_UNIT',
      properties: {
        unitNumber: 'CT-003',
        manufacturer: 'Stewart & Stevenson',
        model: 'S-80',
        serialNumber: 'STS-2022-CT-003',
        yearManufactured: 2022,
        injectorCapacityLbs: 80000,
        maxSpeedFtMin: 150,
        pumpHp: 1200,
        maxPressurePsi: 20000,
        maxFlowRateBpm: 4.0
      },
      attributes: {
        status: 'AVAILABLE',
        location: 'Base Maturín',
        certificationStatus: 'VALID',
        hoursService: 1250,
        lastMaintenanceDate: new Date('2026-01-01')
      }
    },
    {
      code: 'CT-UNIT-05',
      name: 'CT Unit 05 - NOV 60K',
      assetTypeCode: 'CT_UNIT',
      properties: {
        unitNumber: 'CT-005',
        manufacturer: 'NOV',
        model: 'C-Series 350',
        serialNumber: 'NOV-2023-CT-005',
        yearManufactured: 2023,
        injectorCapacityLbs: 60000,
        maxSpeedFtMin: 150,
        pumpHp: 1000,
        maxPressurePsi: 18000,
        maxFlowRateBpm: 3.5
      },
      attributes: {
        status: 'AVAILABLE',
        location: 'Base Maturín',
        certificationStatus: 'VALID',
        hoursService: 850,
        lastMaintenanceDate: new Date('2026-01-05')
      }
    },
    {
      code: 'CT-UNIT-07',
      name: 'CT Unit 07 - Baker 100K',
      assetTypeCode: 'CT_UNIT',
      properties: {
        unitNumber: 'CT-007',
        manufacturer: 'Baker Hughes',
        model: 'Atlas 100',
        serialNumber: 'BH-2024-CT-007',
        yearManufactured: 2024,
        injectorCapacityLbs: 100000,
        maxSpeedFtMin: 180,
        pumpHp: 1500,
        maxPressurePsi: 25000,
        maxFlowRateBpm: 5.0
      },
      attributes: {
        status: 'IN_SERVICE',
        location: 'Pozo PDC-18',
        certificationStatus: 'VALID',
        hoursService: 320,
        lastMaintenanceDate: new Date('2025-12-20')
      }
    }
  ];
  
  const units = [];
  for (const unitData of unitsData) {
    const unit = await assetsService.create(tenantId, userId, unitData);
    console.log(`  ✅ Created unit: ${unit.code}`);
    units.push(unit);
  }
  
  return units;
}

async function seedCtReels(tenantId: string, userId: string, units: any[]) {
  const reelsData = [
    {
      code: 'R-2024-003',
      name: 'Reel 2024-003 - 1.50" CT80',
      assetTypeCode: 'CT_REEL',
      parentAssetId: units[0].id, // Asignado a Unit-03
      properties: {
        reelNumber: 'R-2024-003',
        serialNumber: 'REEL-2024-003',
        manufacturer: 'Precision Tube',
        outerDiameterIn: 1.50,
        wallThicknessIn: 0.109,
        innerDiameterIn: 1.282,
        steelGrade: 'CT80',
        yieldStrengthPsi: 80000,
        totalLengthFt: 20000,
        usableLengthFt: 20000,
        weightPerFtLbs: 1.85,
        manufactureDate: new Date('2024-03-15')
      },
      attributes: {
        status: 'AVAILABLE',
        condition: 'GOOD',
        ctUnitId: units[0].id,
        fatiguePercentage: 42,
        totalCycles: 850,
        totalPressureCycles: 320,
        lastFatigueCalculation: new Date(),
        cutHistoryFt: 0
      }
    },
    {
      code: 'R-2024-008',
      name: 'Reel 2024-008 - 1.75" CT90',
      assetTypeCode: 'CT_REEL',
      properties: {
        reelNumber: 'R-2024-008',
        serialNumber: 'REEL-2024-008',
        manufacturer: 'Quality Tubing',
        outerDiameterIn: 1.75,
        wallThicknessIn: 0.134,
        innerDiameterIn: 1.482,
        steelGrade: 'CT90',
        yieldStrengthPsi: 90000,
        totalLengthFt: 16200,
        usableLengthFt: 16200,
        weightPerFtLbs: 2.35,
        manufactureDate: new Date('2024-08-10')
      },
      attributes: {
        status: 'AVAILABLE',
        condition: 'CRITICAL',
        fatiguePercentage: 87,
        totalCycles: 1450,
        totalPressureCycles: 580,
        lastFatigueCalculation: new Date(),
        cutHistoryFt: 3800
      }
    },
    {
      code: 'R-2024-012',
      name: 'Reel 2024-012 - 1.75" CT90',
      assetTypeCode: 'CT_REEL',
      parentAssetId: units[1].id, // Asignado a Unit-05
      properties: {
        reelNumber: 'R-2024-012',
        serialNumber: 'REEL-2024-012',
        manufacturer: 'Quality Tubing',
        outerDiameterIn: 1.75,
        wallThicknessIn: 0.134,
        innerDiameterIn: 1.482,
        steelGrade: 'CT90',
        yieldStrengthPsi: 90000,
        totalLengthFt: 18500,
        usableLengthFt: 18500,
        weightPerFtLbs: 2.35,
        manufactureDate: new Date('2024-12-05')
      },
      attributes: {
        status: 'IN_USE',
        condition: 'WARNING',
        ctUnitId: units[1].id,
        fatiguePercentage: 78,
        totalCycles: 1245,
        totalPressureCycles: 487,
        lastFatigueCalculation: new Date(),
        cutHistoryFt: 1500
      }
    },
    // ... más reels (total 6)
  ];
  
  const reels = [];
  for (const reelData of reelsData) {
    const reel = await assetsService.create(tenantId, userId, reelData);
    console.log(`  ✅ Created reel: ${reel.code} (${reel.attributes.fatiguePercentage}% fatigue)`);
    reels.push(reel);
  }
  
  return reels;
}

async function seedReelSections(tenantId: string, userId: string, reels: any[]) {
  // Crear 8 secciones para cada reel
  for (const reel of reels) {
    const sectionLength = 2000; // ft
    const totalSections = Math.floor(reel.properties.totalLengthFt / sectionLength);
    
    for (let i = 0; i < totalSections; i++) {
      // Fatiga varía por sección (mayor en el extremo)
      const baseFatigue = reel.attributes.fatiguePercentage;
      const sectionFatigue = baseFatigue * (1 + (totalSections - i - 1) * 0.1); // Más fatiga en extremo
      
      const section = await assetsService.create(tenantId, userId, {
        code: `${reel.code}-SEC-${i + 1}`,
        name: `${reel.code} Section ${i + 1}`,
        assetTypeCode: 'CT_REEL_SECTION',
        parentAssetId: reel.id,
        properties: {
          sectionNumber: i + 1,
          startDepthFt: i * sectionLength,
          endDepthFt: (i + 1) * sectionLength,
          lengthFt: sectionLength
        },
        attributes: {
          status: sectionFatigue > 80 ? 'CRITICAL' : sectionFatigue > 60 ? 'WARNING' : 'ACTIVE',
          fatiguePercentage: Math.min(100, sectionFatigue),
          bendingCycles: Math.floor(reel.attributes.totalCycles * (1 + i * 0.05)),
          pressureCycles: Math.floor(reel.attributes.totalPressureCycles * (1 + i * 0.05)),
          combinedDamage: 0
        }
      });
      
      console.log(`    ✅ Created section: ${section.code} (${section.attributes.fatiguePercentage.toFixed(1)}%)`);
    }
  }
}
```

---

## 3. SEEDS DE JOBS

### 3.1 Seed Script: create-ct-jobs.ts

```typescript
export async function seedCtJobs(tenantId: string, userId: string, assets: any) {
  console.log('🌱 Seeding CT Jobs...');
  
  const jobsData = [
    {
      jobNumber: 'CT-2026-042',
      jobType: 'CLN',
      wellId: 'acme:well-pdc-15',
      fieldName: 'Punta de Mata',
      ctUnitId: assets.units[1].id, // CT-Unit-05
      ctReelId: assets.reels[2].id, // R-2024-012
      plannedStartDate: new Date('2026-01-12T06:00:00'),
      actualStartDate: new Date('2026-01-12T08:00:00'),
      status: 'IN_PROGRESS',
      supervisor: 'Juan Pérez',
      operator: 'Carlos Rodríguez',
      client: 'PDVSA',
      objective: 'Limpiar arena acumulada desde 8,500 ft hasta TD 10,000 ft',
      wellDepthFt: 10000,
      targetDepthFt: 10000,
      estimatedDurationHours: 12
    },
    {
      jobNumber: 'CT-2026-043',
      jobType: 'N2L',
      wellId: 'acme:well-ven-08',
      fieldName: 'Punta de Mata',
      ctUnitId: assets.units[0].id, // CT-Unit-03
      ctReelId: assets.reels[0].id, // R-2024-003
      plannedStartDate: new Date('2026-01-12T06:00:00'),
      actualStartDate: new Date('2026-01-12T07:30:00'),
      status: 'IN_PROGRESS',
      supervisor: 'María González',
      operator: 'Pedro Martínez',
      client: 'PDVSA',
      objective: 'Nitrogen lift para descarga de pozo',
      wellDepthFt: 8000,
      targetDepthFt: 6200,
      estimatedDurationHours: 8
    },
    {
      jobNumber: 'CT-2026-044',
      jobType: 'MIL',
      wellId: 'acme:well-pet-23',
      fieldName: 'Petare',
      ctUnitId: assets.units[2].id, // CT-Unit-07
      ctReelId: assets.reels[3].id,
      plannedStartDate: new Date('2026-01-12T14:00:00'),
      status: 'PLANNED',
      supervisor: 'Luis Ramírez',
      operator: 'Ana Torres',
      client: 'Petrocarabobo',
      objective: 'Fresado de tope de cemento @ 7,500 ft',
      wellDepthFt: 9500,
      targetDepthFt: 7500,
      estimatedDurationHours: 16
    },
    // ... más jobs (total 12)
  ];
  
  const jobs = [];
  for (const jobData of jobsData) {
    const job = await ctJobsRepository.create(tenantId, userId, jobData);
    console.log(`  ✅ Created job: ${job.jobNumber} (${job.status})`);
    jobs.push(job);
    
    // Crear BHA para cada job
    if (job.status !== 'DRAFT') {
      await seedJobBha(job.id);
    }
  }
  
  return jobs;
}

async function seedJobBha(jobId: string) {
  const bha = await ctBhaRepository.create({
    jobId,
    bhaConfigName: 'Standard Cleanout BHA',
    totalLengthFt: 45.5,
    totalWeightLbs: 850,
    description: 'BHA estándar para limpieza con jetting nozzle'
  });
  
  // Componentes del BHA (de abajo hacia arriba)
  const components = [
    { seq: 1, type: 'NOZZLE', name: 'Jetting Nozzle 4x12', length: 2.5, od: 1.5, weight: 15 },
    { seq: 2, type: 'VIBRATION_TOOL', name: 'Vibration Tool', length: 6.0, od: 1.625, weight: 120 },
    { seq: 3, type: 'CIRCULATING_SUB', name: 'Circulating Sub', length: 3.0, od: 1.5, weight: 35 },
    { seq: 4, type: 'JAR', name: 'Jar Hidráulico 30K', length: 8.0, od: 1.75, weight: 180 },
    { seq: 5, type: 'CHECK_VALVE', name: 'Check Valve', length: 2.0, od: 1.5, weight: 25 },
    { seq: 6, type: 'CT_CONNECTOR', name: 'CT Connector', length: 1.5, od: 1.5, weight: 20 },
  ];
  
  for (const comp of components) {
    await ctBhaComponentsRepository.create({
      bhaId: bha.id,
      sequenceNumber: comp.seq,
      componentType: comp.type,
      componentName: comp.name,
      lengthFt: comp.length,
      outerDiameterIn: comp.od,
      weightLbs: comp.weight
    });
  }
}
```

---

## 4. CASOS DE USO DE PRUEBA

### 4.1 Casos Implementados

| Caso | Descripción | Assets | Propósito |
|------|-------------|--------|-----------|
| **Happy Path** | Job completo sin problemas | Unit-05, Reel-012 | Flujo normal |
| **Fatiga Crítica** | Reel con 87% fatiga | Unit-03, Reel-008 | Probar alarmas fatiga |
| **Lockup** | Pozo desviado con lockup | Unit-07, pozo inclinado | Predicción lockup |
| **Overpull** | Job con pega de tubería | Unit-05 | Alarmas overpull |
| **Multiple Jobs** | 2 jobs simultáneos | Unit-03 y Unit-05 | Testing RT concurrente |

### 4.2 Script: run-test-scenarios.sh

```bash
#!/bin/bash

echo "🧪 Ejecutando escenarios de prueba CT"

# 1. Seed assets y jobs
npm run seed:ct-assets
npm run seed:ct-jobs

# 2. Iniciar simulador en background
python3 tools/ct-simulator/ct_simulator.py &
SIMULATOR_PID=$!

# 3. Esperar 60 segundos
echo "⏱️ Simulando 60 segundos de operación..."
sleep 60

# 4. Detener simulador
kill $SIMULATOR_PID

echo "✅ Escenarios completados"
```

---

## 5. IMPLEMENTACIÓN

### 5.1 Estructura de Archivos

```
/tools/ct-simulator/
├── ct_simulator.py           # Simulador principal
├── test_scenarios.py         # Escenarios de prueba
├── requirements.txt          # Dependencias Python
└── README.md

/src/backend/scripts/seeds/
├── create-ct-assets.ts       # Seeds de assets
├── create-ct-jobs.ts         # Seeds de jobs
└── index.ts
```

### 5.2 Checklist

**Simulador**:
- [ ] ct_simulator.py (clase CtJobSimulator)
- [ ] Generación de telemetría realista
- [ ] Integración con Kafka
- [ ] Escenarios de prueba (5 casos)

**Seeds**:
- [ ] 3 CT Units
- [ ] 6 Reels con secciones
- [ ] 20-30 BHA components (inventario)
- [ ] 12 Jobs (3 active, 2 planned, 7 completed)
- [ ] Operaciones, fluidos, BHA configs

**Scripts**:
- [ ] npm run seed:ct-assets
- [ ] npm run seed:ct-jobs
- [ ] npm run simulate:ct
- [ ] npm run test:ct-scenarios

### 5.3 Package.json Scripts

```json
{
  "scripts": {
    "seed:ct-assets": "ts-node src/backend/scripts/seeds/create-ct-assets.ts",
    "seed:ct-jobs": "ts-node src/backend/scripts/seeds/create-ct-jobs.ts",
    "simulate:ct": "python3 tools/ct-simulator/ct_simulator.py",
    "test:ct-scenarios": "./tools/ct-simulator/run-test-scenarios.sh"
  }
}
```

---

## 📊 CRITERIOS DE ÉXITO

- ✅ Simulador genera telemetría realista a 1Hz
- ✅ 3 Units, 6 Reels, 12 Jobs seeded
- ✅ Telemetría llega a asset_telemetry vía Kafka
- ✅ Alarmas se disparan correctamente
- ✅ Fatiga se calcula en tiempo real
- ✅ 5 casos de uso funcionando
- ✅ Dashboard muestra datos reales del simulador

---

**Siguiente bloque**: [07_MIGRACION_LIMPIEZA.md](./07_MIGRACION_LIMPIEZA.md) →
