import { UnitsRepository } from '../units/units.repository';
import type { ConvertUnitsRequest, ConvertUnitsResponse, ValidateCompatibilityRequest, ValidateCompatibilityResponse } from './unit-converter.types';

export class UnitConverterService {
  private unitsRepository: UnitsRepository;

  constructor() {
    this.unitsRepository = new UnitsRepository();
  }

  async convert(request: ConvertUnitsRequest): Promise<ConvertUnitsResponse> {
    const { value, fromUnitId, toUnitId } = request;

    const fromUnit = await this.unitsRepository.findById(fromUnitId);
    if (!fromUnit) {
      throw new Error('Source unit not found');
    }

    const toUnit = await this.unitsRepository.findById(toUnitId);
    if (!toUnit) {
      throw new Error('Target unit not found');
    }

    if (fromUnit.magnitudeId !== toUnit.magnitudeId) {
      throw new Error('Units must belong to the same magnitude for conversion');
    }

    if (fromUnitId === toUnitId) {
      return {
        originalValue: value,
        convertedValue: value,
        fromUnit,
        toUnit,
        formula: 'Same unit, no conversion needed',
      };
    }

    const fromFactor = parseFloat(fromUnit.conversionFactor || '1');
    const toFactor = parseFloat(toUnit.conversionFactor || '1');
    const fromOffset = parseFloat(fromUnit.conversionOffset || '0');
    const toOffset = parseFloat(toUnit.conversionOffset || '0');

    const convertedValue = ((value + fromOffset) * fromFactor / toFactor) - toOffset;

    const formula = fromOffset !== 0 || toOffset !== 0
      ? `((${value} + ${fromOffset}) × ${fromFactor} / ${toFactor}) - ${toOffset} = ${convertedValue}`
      : `${value} × ${fromFactor} / ${toFactor} = ${convertedValue}`;

    return {
      originalValue: value,
      convertedValue,
      fromUnit,
      toUnit,
      formula,
    };
  }

  async validateCompatibility(request: ValidateCompatibilityRequest): Promise<ValidateCompatibilityResponse> {
    const { unitId1, unitId2 } = request;

    const unit1 = await this.unitsRepository.findById(unitId1);
    if (!unit1) {
      return {
        compatible: false,
        reason: 'First unit not found',
      };
    }

    const unit2 = await this.unitsRepository.findById(unitId2);
    if (!unit2) {
      return {
        compatible: false,
        reason: 'Second unit not found',
      };
    }

    if (unit1.magnitudeId !== unit2.magnitudeId) {
      return {
        compatible: false,
        reason: 'Units belong to different magnitudes',
      };
    }

    return {
      compatible: true,
    };
  }
}
