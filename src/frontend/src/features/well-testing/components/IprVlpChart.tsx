import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { IprAnalysis, VlpAnalysis, NodalAnalysis } from '../types';

interface IprVlpChartProps {
  iprAnalysis?: IprAnalysis;
  vlpAnalysis?: VlpAnalysis;
  nodalAnalysis?: NodalAnalysis;
  title?: string;
  description?: string;
}

interface ChartDataPoint {
  rate: number;
  iprPressure: number | null;
  vlpPressure: number | null;
}

export function IprVlpChart({
  iprAnalysis,
  vlpAnalysis,
  nodalAnalysis,
  title = 'IPR & VLP Curves',
  description = 'Inflow Performance Relationship and Vertical Lift Performance',
}: IprVlpChartProps) {
  // Combinar datos de IPR y VLP en un solo dataset
  const chartData: ChartDataPoint[] = [];

  // Agregar puntos de la curva IPR
  if (iprAnalysis?.iprCurve) {
    iprAnalysis.iprCurve.forEach((point) => {
      chartData.push({
        rate: point.rate,
        iprPressure: point.pwf,
        vlpPressure: null,
      });
    });
  }

  // Agregar puntos de la curva VLP
  if (vlpAnalysis?.vlpCurve) {
    vlpAnalysis.vlpCurve.forEach((point) => {
      const existingPoint = chartData.find((p) => Math.abs(p.rate - point.rate) < 1);
      if (existingPoint) {
        existingPoint.vlpPressure = point.pwf;
      } else {
        chartData.push({
          rate: point.rate,
          iprPressure: null,
          vlpPressure: point.pwf,
        });
      }
    });
  }

  // Ordenar por rate
  chartData.sort((a, b) => a.rate - b.rate);

  // Punto operativo (intersección)
  const operatingPoint = nodalAnalysis ? {
    rate: parseFloat(nodalAnalysis.operatingRateBopd),
    pressure: parseFloat(nodalAnalysis.operatingPwfPsi),
  } : null;

  const formatNumber = (value: number) => {
    return value.toLocaleString('es-VE', { maximumFractionDigits: 1 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for chart
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="rate"
                  label={{ value: 'Rate (BOPD)', position: 'insideBottom', offset: -5 }}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  label={{ value: 'Pressure (psi)', angle: -90, position: 'insideLeft' }}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  labelFormatter={(label) => `Rate: ${formatNumber(label)} BOPD`}
                />
                <Legend />
                
                {/* Curva IPR */}
                {iprAnalysis && (
                  <Line
                    type="monotone"
                    dataKey="iprPressure"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="IPR (Inflow)"
                    dot={false}
                    connectNulls={false}
                  />
                )}

                {/* Curva VLP */}
                {vlpAnalysis && (
                  <Line
                    type="monotone"
                    dataKey="vlpPressure"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="VLP (Outflow)"
                    dot={false}
                    connectNulls={false}
                  />
                )}

                {/* Punto operativo */}
                {operatingPoint && (
                  <>
                    <ReferenceLine
                      x={operatingPoint.rate}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{
                        value: `Operating Point: ${formatNumber(operatingPoint.rate)} BOPD`,
                        position: 'top',
                      }}
                    />
                    <ReferenceLine
                      y={operatingPoint.pressure}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{
                        value: `${formatNumber(operatingPoint.pressure)} psi`,
                        position: 'right',
                      }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>

            {/* Información del análisis */}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {iprAnalysis && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">IPR Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    Model: {iprAnalysis.model}
                  </p>
                  {iprAnalysis.qmaxBopd && (
                    <p className="text-xs text-muted-foreground">
                      Qmax: {formatNumber(iprAnalysis.qmaxBopd)} BOPD
                    </p>
                  )}
                  {iprAnalysis.productivityIndex && (
                    <p className="text-xs text-muted-foreground">
                      PI: {formatNumber(iprAnalysis.productivityIndex)} BOPD/psi
                    </p>
                  )}
                </div>
              )}

              {vlpAnalysis && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">VLP Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    Correlation: {vlpAnalysis.correlation}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tubing ID: {vlpAnalysis.tubingIdInches}" @ {vlpAnalysis.tubingDepthFt} ft
                  </p>
                </div>
              )}

              {operatingPoint && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Operating Point</p>
                  <p className="text-xs text-muted-foreground">
                    Rate: {formatNumber(operatingPoint.rate)} BOPD
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pressure: {formatNumber(operatingPoint.pressure)} psi
                  </p>
                  {nodalAnalysis?.sensitivityResults?.isStable !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Stability: {nodalAnalysis.sensitivityResults.isStable ? 'Stable' : 'Unstable'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recomendaciones */}
            {nodalAnalysis?.recommendations && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Recommendations</p>
                <div className="text-xs text-muted-foreground whitespace-pre-line">
                  {nodalAnalysis.recommendations}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
