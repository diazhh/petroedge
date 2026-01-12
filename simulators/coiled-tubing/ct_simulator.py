#!/usr/bin/env python3
"""
Coiled Tubing Simulator
Simula operaciones de CT en tiempo real publicando telemetría a Kafka
"""

import time
import json
import random
import math
from datetime import datetime
from typing import Dict, Optional
from dataclasses import dataclass
from kafka import KafkaProducer

@dataclass
class CTSimulatorConfig:
    job_id: str
    ct_unit_id: str
    job_type: str  # CLN, N2L, ACT, MIL, etc.
    target_depth_ft: int
    rih_speed_fpm: float = 60.0  # Running In Hole speed
    pooh_speed_fpm: float = 80.0  # Pulling Out Of Hole speed
    pump_rate_bpm: float = 2.5
    max_pressure_psi: int = 5000
    kafka_broker: str = 'localhost:9092'
    kafka_topic: str = 'ct.telemetry'

class CTSimulator:
    def __init__(self, config: CTSimulatorConfig):
        self.config = config
        self.current_depth = 0.0
        self.current_operation = 'IDLE'
        self.running = True
        
        # Parámetros operacionales
        self.surface_weight = 0.0
        self.pump_pressure = 0.0
        self.pump_rate = 0.0
        self.annulus_pressure = 0.0
        self.injector_speed = 0.0
        
        # Kafka producer
        self.producer = KafkaProducer(
            bootstrap_servers=config.kafka_broker,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
    def calculate_weight(self, depth: float, operation: str) -> float:
        """Calcula peso en superficie basado en profundidad y operación"""
        # Peso de string: ~2.5 lbs/ft para 1.75" CT
        string_weight = depth * 2.45
        
        if operation == 'RIH':
            # Slackoff: peso compresivo
            return -string_weight * random.uniform(0.8, 0.95)
        elif operation == 'POOH':
            # Pickup: peso tensión + friction
            return string_weight * random.uniform(1.1, 1.25)
        elif operation == 'CIRCULATE':
            # Neutral con variación por presión
            return string_weight * random.uniform(0.95, 1.05)
        else:
            return 0.0
    
    def calculate_pressure(self, depth: float, pumping: bool) -> tuple:
        """Calcula presiones de bomba y anular"""
        if not pumping:
            return 0.0, depth * 0.465  # Solo presión hidrostática en anular
        
        # Presión de bomba: fricción + hidrostática
        friction_pressure = self.pump_rate * 200  # ~200 psi por bpm
        hydrostatic_pressure = depth * 0.465  # Gradiente de fluido
        pump_pressure = friction_pressure + random.uniform(50, 150)
        
        # Presión anular
        annulus_pressure = hydrostatic_pressure * random.uniform(0.1, 0.3)
        
        return min(pump_pressure, self.config.max_pressure_psi), annulus_pressure
    
    def publish_telemetry(self):
        """Publica punto de telemetría a Kafka"""
        telemetry = {
            'time': datetime.utcnow().isoformat() + 'Z',
            'job_id': self.config.job_id,
            'ct_unit_id': self.config.ct_unit_id,
            'depth_ft': round(self.current_depth, 2),
            'speed_ft_min': round(self.injector_speed, 2),
            'surface_weight_lbs': int(self.surface_weight),
            'hookload_lbs': int(abs(self.surface_weight)),
            'pump_pressure_psi': int(self.pump_pressure),
            'annulus_pressure_psi': int(self.annulus_pressure),
            'pump_rate_bpm': round(self.pump_rate, 2),
            'injector_speed_ft_min': round(self.injector_speed, 2),
            'injector_force_lbs': int(abs(self.surface_weight) * 0.8),
            'operation_mode': self.current_operation
        }
        
        self.producer.send(self.config.kafka_topic, value=telemetry)
        print(f"[{telemetry['time']}] Depth: {telemetry['depth_ft']:.1f} ft | "
              f"Weight: {telemetry['surface_weight_lbs']:+5d} lbs | "
              f"Pressure: {telemetry['pump_pressure_psi']:4d} psi | "
              f"Op: {self.current_operation}")
    
    def run_in_hole(self):
        """Simula operación RIH (Running In Hole)"""
        self.current_operation = 'RIH'
        print(f"\n=== INICIANDO RIH - Target: {self.config.target_depth_ft} ft ===")
        
        while self.current_depth < self.config.target_depth_ft and self.running:
            # Incrementar profundidad
            self.injector_speed = self.config.rih_speed_fpm * random.uniform(0.9, 1.1)
            self.current_depth += self.injector_speed / 60.0  # Convertir a ft/s
            
            if self.current_depth > self.config.target_depth_ft:
                self.current_depth = self.config.target_depth_ft
            
            # Calcular parámetros
            self.surface_weight = self.calculate_weight(self.current_depth, 'RIH')
            self.pump_pressure, self.annulus_pressure = self.calculate_pressure(self.current_depth, False)
            self.pump_rate = 0.0
            
            self.publish_telemetry()
            time.sleep(1)
    
    def circulate(self, duration_minutes: int = 30):
        """Simula circulación/limpieza"""
        self.current_operation = 'CIRCULATE'
        self.pump_rate = self.config.pump_rate_bpm
        
        print(f"\n=== CIRCULANDO @ {self.current_depth:.1f} ft por {duration_minutes} min ===")
        
        start_time = time.time()
        while (time.time() - start_time) < (duration_minutes * 60) and self.running:
            self.injector_speed = 0.0
            self.surface_weight = self.calculate_weight(self.current_depth, 'CIRCULATE')
            self.pump_pressure, self.annulus_pressure = self.calculate_pressure(
                self.current_depth, True
            )
            
            self.publish_telemetry()
            time.sleep(1)
    
    def pull_out_of_hole(self):
        """Simula operación POOH (Pulling Out Of Hole)"""
        self.current_operation = 'POOH'
        self.pump_rate = 0.0
        
        print(f"\n=== INICIANDO POOH desde {self.current_depth:.1f} ft ===")
        
        while self.current_depth > 0 and self.running:
            # Decrementar profundidad
            self.injector_speed = -self.config.pooh_speed_fpm * random.uniform(0.9, 1.1)
            self.current_depth += self.injector_speed / 60.0
            
            if self.current_depth < 0:
                self.current_depth = 0
            
            # Calcular parámetros
            self.surface_weight = self.calculate_weight(self.current_depth, 'POOH')
            self.pump_pressure, self.annulus_pressure = self.calculate_pressure(self.current_depth, False)
            
            self.publish_telemetry()
            time.sleep(1)
    
    def simulate_job(self):
        """Simula un job completo de CT"""
        try:
            print(f"\n{'='*60}")
            print(f"SIMULADOR COILED TUBING")
            print(f"Job: {self.config.job_id} | Type: {self.config.job_type}")
            print(f"Unit: {self.config.ct_unit_id}")
            print(f"Target Depth: {self.config.target_depth_ft} ft")
            print(f"Kafka: {self.config.kafka_broker} -> {self.config.kafka_topic}")
            print(f"{'='*60}\n")
            
            # Simular secuencia de operaciones
            if self.config.job_type == 'CLN':  # Cleanout
                self.run_in_hole()
                time.sleep(2)
                self.circulate(duration_minutes=5)
                time.sleep(2)
                self.pull_out_of_hole()
                
            elif self.config.job_type == 'N2L':  # Nitrogen Lift
                self.run_in_hole()
                time.sleep(2)
                self.circulate(duration_minutes=10)
                time.sleep(2)
                self.pull_out_of_hole()
                
            elif self.config.job_type == 'ACT':  # Acid Treatment
                self.run_in_hole()
                time.sleep(2)
                self.circulate(duration_minutes=15)
                time.sleep(2)
                self.pull_out_of_hole()
            
            else:
                # Secuencia genérica
                self.run_in_hole()
                time.sleep(2)
                self.circulate(duration_minutes=8)
                time.sleep(2)
                self.pull_out_of_hole()
            
            print(f"\n{'='*60}")
            print("JOB COMPLETADO")
            print(f"{'='*60}\n")
            
        except KeyboardInterrupt:
            print("\n\nSimulación detenida por usuario")
        finally:
            self.producer.flush()
            self.producer.close()

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Simulador de Coiled Tubing')
    parser.add_argument('--job-id', required=True, help='Job ID (UUID)')
    parser.add_argument('--unit-id', required=True, help='CT Unit ID (UUID)')
    parser.add_argument('--job-type', default='CLN', 
                       choices=['CLN', 'N2L', 'ACT', 'MIL', 'FSH', 'LOG'],
                       help='Tipo de job')
    parser.add_argument('--target-depth', type=int, default=10000, 
                       help='Profundidad objetivo (ft)')
    parser.add_argument('--kafka-broker', default='localhost:9092',
                       help='Kafka broker address')
    parser.add_argument('--kafka-topic', default='ct.telemetry',
                       help='Kafka topic')
    
    args = parser.parse_args()
    
    config = CTSimulatorConfig(
        job_id=args.job_id,
        ct_unit_id=args.unit_id,
        job_type=args.job_type,
        target_depth_ft=args.target_depth,
        kafka_broker=args.kafka_broker,
        kafka_topic=args.kafka_topic
    )
    
    simulator = CTSimulator(config)
    simulator.simulate_job()
