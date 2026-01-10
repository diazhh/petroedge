/**
 * Helper functions for Well Testing module
 * Converts numeric values to strings for database decimal fields
 */

export function convertWellTestToDb(data: any) {
  return {
    ...data,
    durationHours: data.durationHours?.toString(),
    separatorPressurePsi: data.separatorPressurePsi?.toString(),
    separatorTemperatureF: data.separatorTemperatureF?.toString(),
    oilRateBopd: data.oilRateBopd?.toString(),
    waterRateBwpd: data.waterRateBwpd?.toString(),
    gasRateMscfd: data.gasRateMscfd?.toString(),
    liquidRateBlpd: data.liquidRateBlpd?.toString(),
    tubingPressurePsi: data.tubingPressurePsi?.toString(),
    casingPressurePsi: data.casingPressurePsi?.toString(),
    flowingBhpPsi: data.flowingBhpPsi?.toString(),
    staticBhpPsi: data.staticBhpPsi?.toString(),
    wellheadTempF: data.wellheadTempF?.toString(),
    bottomholeTempF: data.bottomholeTempF?.toString(),
    bswPercent: data.bswPercent?.toString(),
    waterCutPercent: data.waterCutPercent?.toString(),
    oilApiGravity: data.oilApiGravity?.toString(),
    gasSpecificGravity: data.gasSpecificGravity?.toString(),
    gorScfStb: data.gorScfStb?.toString(),
  };
}

export function convertTestReadingToDb(data: any) {
  return {
    ...data,
    elapsedHours: data.elapsedHours?.toString(),
    tubingPressurePsi: data.tubingPressurePsi?.toString(),
    casingPressurePsi: data.casingPressurePsi?.toString(),
    bottomholePressurePsi: data.bottomholePressurePsi?.toString(),
    oilRateBopd: data.oilRateBopd?.toString(),
    waterRateBwpd: data.waterRateBwpd?.toString(),
    gasRateMscfd: data.gasRateMscfd?.toString(),
    wellheadTempF: data.wellheadTempF?.toString(),
    bottomholeTempF: data.bottomholeTempF?.toString(),
  };
}
