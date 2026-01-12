import { RuleNode, RuleNodeMessage, RuleNodeContext, RuleNodeConfig } from '../node-registry.js';

export interface UnitConversionConfig extends RuleNodeConfig {
  inputKey: string; // Key to get value
  outputKey?: string; // Key to store result (default: same as inputKey)
  fromUnit: string; // Source unit
  toUnit: string; // Target unit
  category: 'pressure' | 'temperature' | 'length' | 'volume' | 'flow' | 'mass' | 'density'; // Unit category
}

/**
 * Unit Conversion Node
 * 
 * Converts values between different units.
 * Supports common oil & gas units.
 * 
 * Categories and units:
 * - pressure: psi, bar, kPa, MPa, atm
 * - temperature: F, C, K, R
 * - length: ft, m, in, cm, mm
 * - volume: bbl, m3, gal, L, ft3
 * - flow: bopd, m3/d, gpm, L/s
 * - mass: lb, kg, ton, tonne
 * - density: lb/ft3, kg/m3, API
 * 
 * Config:
 * - inputKey: Key to get value (required)
 * - outputKey: Where to store result (default: same as inputKey)
 * - fromUnit: Source unit (required)
 * - toUnit: Target unit (required)
 * - category: Unit category (required)
 */
export class UnitConversionNode extends RuleNode {
  private conversionFactors: Record<string, Record<string, number>> = {
    // Pressure conversions (to psi)
    pressure: {
      psi: 1,
      bar: 14.5038,
      kPa: 0.145038,
      MPa: 145.038,
      atm: 14.6959,
    },
    // Temperature (special handling needed)
    temperature: {},
    // Length conversions (to meters)
    length: {
      m: 1,
      ft: 0.3048,
      in: 0.0254,
      cm: 0.01,
      mm: 0.001,
    },
    // Volume conversions (to barrels)
    volume: {
      bbl: 1,
      'm3': 6.28981,
      gal: 0.0238095,
      L: 0.00628981,
      'ft3': 0.178108,
    },
    // Flow rate conversions (to bopd)
    flow: {
      bopd: 1,
      'm3/d': 6.28981,
      gpm: 34.2857,
      'L/s': 1371.43,
    },
    // Mass conversions (to kg)
    mass: {
      kg: 1,
      lb: 0.453592,
      ton: 907.185,
      tonne: 1000,
    },
    // Density conversions (to kg/m3)
    density: {
      'kg/m3': 1,
      'lb/ft3': 16.0185,
    },
  };

  constructor(config: UnitConversionConfig) {
    super('unit_conversion', config);
  }

  async execute(message: RuleNodeMessage, context: RuleNodeContext): Promise<RuleNodeMessage | null> {
    const config = this.config as UnitConversionConfig;
    const outputKey = config.outputKey || config.inputKey;

    const value = this.getNestedValue(message.data, config.inputKey);
    if (typeof value !== 'number') {
      this.log(context, 'warn', `Value at ${config.inputKey} is not a number: ${value}`);
      return null;
    }

    let convertedValue: number;

    // Special handling for temperature
    if (config.category === 'temperature') {
      convertedValue = this.convertTemperature(value, config.fromUnit, config.toUnit);
    } else {
      const factors = this.conversionFactors[config.category];
      if (!factors) {
        this.log(context, 'error', `Unknown category: ${config.category}`);
        return null;
      }

      const fromFactor = factors[config.fromUnit];
      const toFactor = factors[config.toUnit];

      if (fromFactor === undefined || toFactor === undefined) {
        this.log(context, 'error', `Unknown units: ${config.fromUnit} or ${config.toUnit}`);
        return null;
      }

      // Convert to base unit, then to target unit
      convertedValue = (value * fromFactor) / toFactor;
    }

    // Set the converted value
    const outputParts = outputKey.split('.');
    const newData = { ...message.data };
    
    if (outputParts.length === 1) {
      newData[outputKey] = convertedValue;
    } else {
      // Handle nested keys
      let current = newData;
      for (let i = 0; i < outputParts.length - 1; i++) {
        if (!current[outputParts[i]]) {
          current[outputParts[i]] = {};
        }
        current = current[outputParts[i]];
      }
      current[outputParts[outputParts.length - 1]] = convertedValue;
    }

    return {
      ...message,
      data: newData,
    };
  }

  private convertTemperature(value: number, from: string, to: string): number {
    // Convert to Celsius first
    let celsius: number;
    switch (from) {
      case 'C':
        celsius = value;
        break;
      case 'F':
        celsius = (value - 32) * 5 / 9;
        break;
      case 'K':
        celsius = value - 273.15;
        break;
      case 'R':
        celsius = (value - 491.67) * 5 / 9;
        break;
      default:
        throw new Error(`Unknown temperature unit: ${from}`);
    }

    // Convert from Celsius to target
    switch (to) {
      case 'C':
        return celsius;
      case 'F':
        return celsius * 9 / 5 + 32;
      case 'K':
        return celsius + 273.15;
      case 'R':
        return celsius * 9 / 5 + 491.67;
      default:
        throw new Error(`Unknown temperature unit: ${to}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
