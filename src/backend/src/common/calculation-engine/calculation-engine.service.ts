import { kafkaService } from '../kafka/kafka.service.js';
import { redisService } from '../redis/redis.service.js';
import { logger } from '../utils/logger.js';
import type { EachMessagePayload } from 'kafkajs';
import { z } from 'zod';
import { NodalAnalysisService, NodalAnalysisInput } from '../../modules/well-testing/nodal-analysis.service.js';

// Schema for well test reading from Kafka
const wellTestReadingSchema = z.object({
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    // IPR inputs
    reservoirPressurePsi: z.number().positive(),
    testRateBopd: z.number().nonnegative(),
    testPwfPsi: z.number().nonnegative(),
    bubblePointPsi: z.number().positive().optional(),
    iprModel: z.enum(['VOGEL', 'FETKOVITCH', 'STANDING', 'COMPOSITE']).optional(),
    
    // VLP inputs
    wellDepthFt: z.number().positive().optional(),
    tubingDiameterIn: z.number().positive().optional(),
    wellheadPressurePsi: z.number().nonnegative().optional(),
    oilGravityApi: z.number().positive().optional(),
    gasGravity: z.number().positive().optional(),
    waterCut: z.number().min(0).max(1).optional(),
    gor: z.number().nonnegative().optional(),
    temperatureDegF: z.number().optional(),
  }),
});

// Schema for drilling data from Kafka
const drillingDataSchema = z.object({
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    bitDepthFt: z.number().nonnegative(),
    ropFtPerHr: z.number().nonnegative(),
    wob: z.number().nonnegative(),
    rpm: z.number().nonnegative(),
    torque: z.number().nonnegative(),
    flowRate: z.number().nonnegative(),
    spp: z.number().nonnegative(),
    mudWeightPpg: z.number().positive().optional(),
    bitDiameterIn: z.number().positive().optional(),
  }),
});

// Schema for production data from Kafka
const productionDataSchema = z.object({
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  data: z.object({
    oilRateBopd: z.number().nonnegative(),
    gasRateMscfd: z.number().nonnegative(),
    waterRateBwpd: z.number().nonnegative(),
    thp: z.number().nonnegative(),
    frequency: z.number().nonnegative().optional(),
    current: z.number().nonnegative().optional(),
    voltage: z.number().nonnegative().optional(),
    intakePressure: z.number().nonnegative().optional(),
    dischargePressure: z.number().nonnegative().optional(),
  }),
});

export class CalculationEngineService {
  private isRunning = false;
  private readonly CONSUMER_GROUP_ID = 'calculation-engine-group';
  private readonly TOPICS = [
    'well-test.readings',
    'drilling.realtime',
    'production.realtime',
    'scada.telemetry.validated',
  ];
  
  private nodalAnalysisService: NodalAnalysisService;

  constructor() {
    this.nodalAnalysisService = new NodalAnalysisService();
  }

  /**
   * Start the Calculation Engine Kafka consumer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Calculation Engine is already running');
      return;
    }

    try {
      logger.info('Starting Calculation Engine Kafka consumer...');

      const consumer = await kafkaService.initConsumer(this.CONSUMER_GROUP_ID, this.TOPICS);

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('Calculation Engine Kafka consumer started successfully', { topics: this.TOPICS });
    } catch (error) {
      logger.error('Failed to start Calculation Engine Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Stop the Kafka consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const consumer = kafkaService.getConsumer(this.CONSUMER_GROUP_ID);
      if (consumer) {
        await consumer.disconnect();
        this.isRunning = false;
        logger.info('Calculation Engine Kafka consumer stopped');
      }
    } catch (error) {
      logger.error('Error stopping Calculation Engine Kafka consumer', error);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn('Received empty message', { topic, partition });
        return;
      }

      const rawMessage = message.value.toString();
      const parsedMessage = JSON.parse(rawMessage);

      // Route message to appropriate calculation handler
      if (topic === 'well-test.readings') {
        await this.handleWellTestCalculations(parsedMessage);
      } else if (topic === 'drilling.realtime') {
        await this.handleDrillingCalculations(parsedMessage);
      } else if (topic === 'production.realtime') {
        await this.handleProductionCalculations(parsedMessage);
      } else if (topic === 'scada.telemetry.validated') {
        await this.handleTelemetryCalculations(parsedMessage);
      }
    } catch (error: any) {
      logger.error('Error processing calculation message', {
        error: error.message,
        topic,
        partition,
        offset: message.offset,
      });
    }
  }

  /**
   * Handle Well Testing calculations (IPR, VLP, Nodal Analysis)
   */
  private async handleWellTestCalculations(message: any): Promise<void> {
    try {
      const reading = wellTestReadingSchema.parse(message);
      const { assetId, tenantId, timestamp, data } = reading;

      // Check if we have enough data for nodal analysis
      const hasIprData = data.reservoirPressurePsi && data.testRateBopd && data.testPwfPsi;
      const hasVlpData = data.wellDepthFt && data.tubingDiameterIn && data.wellheadPressurePsi &&
                         data.oilGravityApi && data.gasGravity && data.waterCut !== undefined && 
                         data.gor !== undefined && data.temperatureDegF;

      if (!hasIprData || !hasVlpData) {
        logger.debug('Insufficient data for nodal analysis', { assetId, hasIprData, hasVlpData });
        return;
      }

      // Prepare nodal analysis input
      const nodalInput: NodalAnalysisInput = {
        iprModel: data.iprModel || 'VOGEL',
        reservoirPressurePsi: data.reservoirPressurePsi,
        testRateBopd: data.testRateBopd,
        testPwfPsi: data.testPwfPsi,
        bubblePointPsi: data.bubblePointPsi,
        wellDepthFt: data.wellDepthFt!,
        tubingDiameterIn: data.tubingDiameterIn!,
        wellheadPressurePsi: data.wellheadPressurePsi!,
        oilGravityApi: data.oilGravityApi!,
        gasGravity: data.gasGravity!,
        waterCut: data.waterCut!,
        gor: data.gor!,
        temperatureDegF: data.temperatureDegF!,
        numPoints: 30,
      };

      // Perform nodal analysis
      const result = this.nodalAnalysisService.performNodalAnalysis(nodalInput);

      // Cache result in Redis (TTL: 5 minutes)
      const cacheKey = `well-test:nodal:${assetId}`;
      await redisService.set(cacheKey, JSON.stringify(result), 300);

      // Publish result to Kafka
      await kafkaService.publish('well-test.calculations', {
        assetId,
        tenantId,
        timestamp,
        calculationType: 'NODAL_ANALYSIS',
        result: {
          operatingPoint: result.operatingPoint,
          aofBopd: result.ipr.aofBopd,
          productivityIndex: result.ipr.productivityIndex,
          recommendations: result.recommendations,
        },
      }, assetId);

      logger.debug('Well test calculations completed', { assetId, operatingPoint: result.operatingPoint });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Invalid well test reading schema', { errors: error.errors });
      } else {
        logger.error('Error in well test calculations', error);
      }
    }
  }

  /**
   * Handle Drilling calculations (MSE, Torque & Drag)
   */
  private async handleDrillingCalculations(message: any): Promise<void> {
    try {
      const reading = drillingDataSchema.parse(message);
      const { assetId, tenantId, timestamp, data } = reading;

      // Calculate MSE (Mechanical Specific Energy)
      const mse = this.calculateMSE(data);

      // Cache result in Redis
      const cacheKey = `drilling:mse:${assetId}`;
      await redisService.set(cacheKey, JSON.stringify({ mse, timestamp }), 300);

      // Publish result to Kafka
      await kafkaService.publish('drilling.calculations', {
        assetId,
        tenantId,
        timestamp,
        calculationType: 'MSE',
        result: { mse },
      }, assetId);

      // Check for drilling inefficiency alarm
      if (mse > 500000) { // Example threshold
        await kafkaService.publish('alarms.warnings', {
          tenantId,
          assetId,
          severity: 'MEDIUM',
          message: `High MSE detected: ${mse.toFixed(0)} psi`,
          code: 'DRILLING_HIGH_MSE',
          timestamp: new Date().toISOString(),
        }, assetId);
      }

      logger.debug('Drilling calculations completed', { assetId, mse });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Invalid drilling data schema', { errors: error.errors });
      } else {
        logger.error('Error in drilling calculations', error);
      }
    }
  }

  /**
   * Handle Production calculations (ESP efficiency, Gas Lift optimization)
   */
  private async handleProductionCalculations(message: any): Promise<void> {
    try {
      const reading = productionDataSchema.parse(message);
      const { assetId, tenantId, timestamp, data } = reading;

      // Calculate ESP efficiency if ESP data is available
      if (data.frequency && data.current && data.voltage && data.intakePressure && data.dischargePressure) {
        const espEfficiency = this.calculateESPEfficiency(data);

        // Cache result in Redis
        const cacheKey = `production:esp:${assetId}`;
        await redisService.set(cacheKey, JSON.stringify({ espEfficiency, timestamp }), 300);

        // Publish result to Kafka
        await kafkaService.publish('production.calculations', {
          assetId,
          tenantId,
          timestamp,
          calculationType: 'ESP_EFFICIENCY',
          result: { espEfficiency },
        }, assetId);

        // Check for low efficiency alarm
        if (espEfficiency < 0.4) { // 40% threshold
          await kafkaService.publish('alarms.warnings', {
            tenantId,
            assetId,
            severity: 'HIGH',
            message: `Low ESP efficiency: ${(espEfficiency * 100).toFixed(1)}%`,
            code: 'PRODUCTION_LOW_ESP_EFFICIENCY',
            timestamp: new Date().toISOString(),
          }, assetId);
        }

        logger.debug('Production calculations completed', { assetId, espEfficiency });
      }

      // Calculate production rates
      const totalLiquidBpd = data.oilRateBopd + data.waterRateBwpd;
      const waterCut = totalLiquidBpd > 0 ? data.waterRateBwpd / totalLiquidBpd : 0;

      // Cache production summary
      const summaryKey = `production:summary:${assetId}`;
      await redisService.set(summaryKey, JSON.stringify({
        oilRateBopd: data.oilRateBopd,
        gasRateMscfd: data.gasRateMscfd,
        waterRateBwpd: data.waterRateBwpd,
        totalLiquidBpd,
        waterCut,
        timestamp,
      }), 300);

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Invalid production data schema', { errors: error.errors });
      } else {
        logger.error('Error in production calculations', error);
      }
    }
  }

  /**
   * Handle generic telemetry calculations
   */
  private async handleTelemetryCalculations(message: any): Promise<void> {
    try {
      // This handler can process generic telemetry that doesn't fit other categories
      // For now, we'll just log it
      logger.debug('Telemetry calculation handler called', { 
        assetId: message.assetId,
        telemetryKey: message.telemetryKey 
      });
    } catch (error: any) {
      logger.error('Error in telemetry calculations', error);
    }
  }

  /**
   * Calculate Mechanical Specific Energy (MSE)
   * MSE = (WOB / A) + (120 * π * N * T) / (A * ROP)
   * Where: A = bit area, N = RPM, T = Torque, ROP = Rate of Penetration
   */
  private calculateMSE(data: z.infer<typeof drillingDataSchema>['data']): number {
    const { wob, rpm, torque, ropFtPerHr, bitDiameterIn = 8.5 } = data;

    if (ropFtPerHr === 0) {
      return 0; // Avoid division by zero
    }

    // Bit area in square inches
    const bitArea = Math.PI * Math.pow(bitDiameterIn / 2, 2);

    // MSE formula
    const term1 = wob / bitArea;
    const term2 = (120 * Math.PI * rpm * torque) / (bitArea * ropFtPerHr);
    const mse = term1 + term2;

    return mse;
  }

  /**
   * Calculate ESP (Electric Submersible Pump) Efficiency
   * Simplified calculation based on power and hydraulic work
   */
  private calculateESPEfficiency(data: z.infer<typeof productionDataSchema>['data']): number {
    const { frequency, current, voltage, intakePressure, dischargePressure, oilRateBopd, waterRateBwpd } = data;

    if (!frequency || !current || !voltage || !intakePressure || !dischargePressure) {
      return 0;
    }

    // Electrical power (kW)
    const electricalPower = (voltage * current * Math.sqrt(3) * 0.9) / 1000; // 3-phase, 0.9 power factor

    // Hydraulic power (kW)
    const totalLiquidBpd = oilRateBopd + waterRateBwpd;
    const totalLiquidBpm = totalLiquidBpd / (24 * 60); // Convert to bpm
    const pressureDiffPsi = dischargePressure - intakePressure;
    const hydraulicPower = (totalLiquidBpm * pressureDiffPsi * 5.615) / 1714; // Convert to kW

    // Efficiency
    const efficiency = electricalPower > 0 ? hydraulicPower / electricalPower : 0;

    return Math.min(efficiency, 1.0); // Cap at 100%
  }
}

// Singleton instance
export const calculationEngineService = new CalculationEngineService();
