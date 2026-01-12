import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { CtRealtimeDataRepository, CtAlarmsRepository } from './coiled-tubing.repository';
import type { CreateCtRealtimeDataInput, CreateCtAlarmInput } from './coiled-tubing.schema';

/**
 * Servicio consumidor Kafka para procesamiento de telemetría CT en tiempo real
 * 
 * Responsabilidades:
 * - Consumir mensajes de telemetría desde Kafka topic 'coiled-tubing.telemetry'
 * - Procesar datos de sensores (depth, speed, weight, pressure, etc.)
 * - Detectar condiciones de alarma en tiempo real
 * - Guardar datos en TimescaleDB (ct_realtime_data)
 * - Publicar actualizaciones vía WebSocket para dashboard
 */
export class CoiledTubingRealtimeConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private realtimeDataRepo: CtRealtimeDataRepository;
  private alarmsRepo: CtAlarmsRepository;
  private isRunning: boolean = false;

  // Límites operacionales para detección de alarmas
  private readonly ALARM_THRESHOLDS = {
    MAX_SPEED_FPM: 150, // ft/min
    MAX_WEIGHT_LBS: 100000, // lbs
    MAX_PRESSURE_PSI: 20000, // psi
    MAX_PUMP_PRESSURE_PSI: 5000, // psi
    MIN_WEIGHT_WARNING_LBS: -5000, // Slack off warning
    OVERPULL_FACTOR: 1.2, // 20% sobre peso esperado
  };

  constructor() {
    this.kafka = new Kafka({
      clientId: 'coiled-tubing-consumer',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'coiled-tubing-realtime-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    this.realtimeDataRepo = new CtRealtimeDataRepository();
    this.alarmsRepo = new CtAlarmsRepository();
  }

  /**
   * Inicia el consumidor Kafka
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Coiled Tubing consumer is already running');
      return;
    }

    try {
      await this.consumer.connect();
      console.log('✅ Coiled Tubing Kafka consumer connected');

      await this.consumer.subscribe({
        topics: ['coiled-tubing.telemetry', 'ct.realtime'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });

      this.isRunning = true;
      console.log('✅ Coiled Tubing consumer started successfully');
    } catch (error) {
      console.error('❌ Error starting Coiled Tubing consumer:', error);
      throw error;
    }
  }

  /**
   * Detiene el consumidor Kafka
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('✅ Coiled Tubing consumer stopped');
    } catch (error) {
      console.error('❌ Error stopping Coiled Tubing consumer:', error);
      throw error;
    }
  }

  /**
   * Procesa un mensaje de telemetría desde Kafka
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;

    try {
      if (!message.value) {
        console.warn('Received empty message');
        return;
      }

      const telemetryData = JSON.parse(message.value.toString());

      // Validar estructura mínima del mensaje
      if (!telemetryData.jobId || !telemetryData.ctUnitId || !telemetryData.timestamp) {
        console.warn('Invalid telemetry data structure:', telemetryData);
        return;
      }

      // Guardar datos en TimescaleDB
      await this.saveRealtimeData(telemetryData);

      // Detectar y crear alarmas si es necesario
      await this.detectAlarms(telemetryData);

      // TODO: Publicar a WebSocket para actualización en tiempo real del dashboard
      // await this.publishToWebSocket(telemetryData);

      console.log(`✅ Processed telemetry for job ${telemetryData.jobId} at depth ${telemetryData.depthFt} ft`);
    } catch (error) {
      console.error('❌ Error processing message:', error);
      // No lanzar error para no detener el consumer
    }
  }

  /**
   * Guarda datos de telemetría en TimescaleDB
   */
  private async saveRealtimeData(data: any): Promise<void> {
    try {
      const realtimeData = {
        time: new Date(data.timestamp),
        jobId: data.jobId,
        ctUnitId: data.ctUnitId,
        depthFt: data.depthFt?.toString(),
        speedFtMin: data.speedFtMin?.toString(),
        surfaceWeightLbs: data.surfaceWeightLbs,
        hookloadLbs: data.hookloadLbs,
        pumpPressurePsi: data.pumpPressurePsi,
        annulusPressurePsi: data.annulusPressurePsi,
        downholePressurePsi: data.downholePressurePsi,
        pumpRateBpm: data.pumpRateBpm?.toString(),
        pumpStrokesPerMin: data.pumpStrokesPerMin,
        totalVolumePumpedBbl: data.totalVolumePumpedBbl?.toString(),
        injectorSpeedFtMin: data.injectorSpeedFtMin?.toString(),
        injectorForceLbs: data.injectorForceLbs,
        surfaceTempF: data.surfaceTempF?.toString(),
        downholeTempF: data.downholeTempF?.toString(),
        operationMode: data.operationMode,
      };

      await this.realtimeDataRepo.create(realtimeData);
    } catch (error) {
      console.error('❌ Error saving realtime data:', error);
      throw error;
    }
  }

  /**
   * Detecta condiciones de alarma y las crea si es necesario
   */
  private async detectAlarms(data: any): Promise<void> {
    const alarms: any[] = [];
    const now = new Date();

    // Alarma: Velocidad excesiva
    if (data.speedFtMin && data.speedFtMin > this.ALARM_THRESHOLDS.MAX_SPEED_FPM) {
      alarms.push({
        jobId: data.jobId,
        tenantId: data.tenantId,
        alarmType: 'SPEED_LIMIT_EXCEEDED',
        severity: 'MEDIUM',
        message: `Speed limit exceeded: ${data.speedFtMin} ft/min (max: ${this.ALARM_THRESHOLDS.MAX_SPEED_FPM})`,
        triggeredAt: now,
        currentValue: data.speedFtMin?.toString(),
        thresholdValue: this.ALARM_THRESHOLDS.MAX_SPEED_FPM.toString(),
      });
    }

    // Alarma: Presión de bomba alta
    if (data.pumpPressurePsi && data.pumpPressurePsi > this.ALARM_THRESHOLDS.MAX_PUMP_PRESSURE_PSI) {
      alarms.push({
        jobId: data.jobId,
        tenantId: data.tenantId,
        alarmType: 'HIGH_PUMP_PRESSURE',
        severity: 'CRITICAL',
        message: `Pump pressure critical: ${data.pumpPressurePsi} psi (max: ${this.ALARM_THRESHOLDS.MAX_PUMP_PRESSURE_PSI})`,
        triggeredAt: now,
        currentValue: data.pumpPressurePsi?.toString(),
        thresholdValue: this.ALARM_THRESHOLDS.MAX_PUMP_PRESSURE_PSI.toString(),
      });
    }

    // Alarma: Overpull (peso excesivo en pickup)
    if (data.surfaceWeightLbs && data.surfaceWeightLbs > this.ALARM_THRESHOLDS.MAX_WEIGHT_LBS) {
      alarms.push({
        jobId: data.jobId,
        tenantId: data.tenantId,
        alarmType: 'OVERPULL',
        severity: 'CRITICAL',
        message: `Overpull detected: ${data.surfaceWeightLbs} lbs (max: ${this.ALARM_THRESHOLDS.MAX_WEIGHT_LBS})`,
        triggeredAt: now,
        currentValue: data.surfaceWeightLbs?.toString(),
        thresholdValue: this.ALARM_THRESHOLDS.MAX_WEIGHT_LBS.toString(),
      });
    }

    // Alarma: Slack off (peso negativo excesivo)
    if (data.surfaceWeightLbs && data.surfaceWeightLbs < this.ALARM_THRESHOLDS.MIN_WEIGHT_WARNING_LBS) {
      alarms.push({
        jobId: data.jobId,
        tenantId: data.tenantId,
        alarmType: 'SLACK_OFF',
        severity: 'HIGH',
        message: `Slack off detected: ${data.surfaceWeightLbs} lbs (min: ${this.ALARM_THRESHOLDS.MIN_WEIGHT_WARNING_LBS})`,
        triggeredAt: now,
        currentValue: data.surfaceWeightLbs?.toString(),
        thresholdValue: this.ALARM_THRESHOLDS.MIN_WEIGHT_WARNING_LBS.toString(),
      });
    }

    // Alarma: Presión de sistema alta
    if (data.annulusPressurePsi && data.annulusPressurePsi > this.ALARM_THRESHOLDS.MAX_PRESSURE_PSI) {
      alarms.push({
        jobId: data.jobId,
        tenantId: data.tenantId,
        alarmType: 'HIGH_SYSTEM_PRESSURE',
        severity: 'CRITICAL',
        message: `System pressure critical: ${data.annulusPressurePsi} psi (max: ${this.ALARM_THRESHOLDS.MAX_PRESSURE_PSI})`,
        triggeredAt: now,
        currentValue: data.annulusPressurePsi?.toString(),
        thresholdValue: this.ALARM_THRESHOLDS.MAX_PRESSURE_PSI.toString(),
      });
    }

    // Crear alarmas detectadas
    for (const alarm of alarms) {
      try {
        // Verificar si ya existe una alarma activa del mismo tipo para este job
        const existingAlarms = await this.alarmsRepo.findByJobId(data.jobId);
        const activeAlarm = existingAlarms.find(
          (a) => a.alarmType === alarm.alarmType && a.status === 'ACTIVE'
        );

        if (!activeAlarm) {
          await this.alarmsRepo.create(alarm);
          console.log(`🚨 Alarm created: ${alarm.alarmType} for job ${data.jobId}`);
        }
      } catch (error) {
        console.error(`❌ Error creating alarm ${alarm.alarmType}:`, error);
      }
    }
  }

  /**
   * Publica datos a WebSocket para actualización en tiempo real
   * TODO: Implementar cuando se tenga WebSocket Gateway
   */
  // private async publishToWebSocket(data: any): Promise<void> {
  //   // Implementar integración con WebSocket Gateway
  //   // Ejemplo: await websocketGateway.emit(`ct-job:${data.jobId}`, data);
  // }

  /**
   * Obtiene el estado del consumidor
   */
  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}
