/**
 * TelemetryHistoryChart Component
 * Displays historical telemetry data in a chart
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTelemetryHistory } from '../api/telemetry.api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';

interface TelemetryHistoryChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  telemetryKey: string;
  telemetryName: string;
  unit?: string;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type Aggregation = 'avg' | 'min' | 'max' | 'sum';

export function TelemetryHistoryChart({
  open,
  onOpenChange,
  assetId,
  telemetryKey,
  telemetryName,
  unit,
}: TelemetryHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [aggregation, setAggregation] = useState<Aggregation>('avg');

  const getTimeRangeDates = (range: TimeRange) => {
    const endTime = new Date();
    const startTime = new Date();

    switch (range) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(startTime.getHours() - 6);
        break;
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
    }

    return { startTime, endTime };
  };

  const getInterval = (range: TimeRange): string => {
    switch (range) {
      case '1h':
        return '1m';
      case '6h':
        return '5m';
      case '24h':
        return '15m';
      case '7d':
        return '1h';
      case '30d':
        return '6h';
      default:
        return '5m';
    }
  };

  const { startTime, endTime } = getTimeRangeDates(timeRange);

  const { data, isLoading } = useTelemetryHistory(
    {
      assetId,
      telemetryKey,
      startTime,
      endTime,
      aggregation,
      interval: getInterval(timeRange),
    },
    open
  );

  const chartData = data?.data?.map((point: any) => ({
    time: new Date(point.time).toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    value: point.valueNumeric,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Histórico: {telemetryName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Rango de Tiempo</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="6h">Últimas 6 horas</SelectItem>
                  <SelectItem value="24h">Último día</SelectItem>
                  <SelectItem value="7d">Última semana</SelectItem>
                  <SelectItem value="30d">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Agregación</Label>
              <Select value={aggregation} onValueChange={(v) => setAggregation(v as Aggregation)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avg">Promedio</SelectItem>
                  <SelectItem value="min">Mínimo</SelectItem>
                  <SelectItem value="max">Máximo</SelectItem>
                  <SelectItem value="sum">Suma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart */}
          <div className="h-96">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full border rounded-md bg-muted/50">
                <div className="text-center space-y-2">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No hay datos disponibles para el rango seleccionado</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: unit || '', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${unit || ''}`,
                      telemetryName
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    name={telemetryName}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats */}
          {!isLoading && chartData.length > 0 && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Puntos</p>
                <p className="text-2xl font-bold">{chartData.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold">
                  {(chartData.reduce((sum: number, d: any) => sum + d.value, 0) / chartData.length).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Mínimo</p>
                <p className="text-2xl font-bold">
                  {Math.min(...chartData.map((d: any) => d.value)).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Máximo</p>
                <p className="text-2xl font-bold">
                  {Math.max(...chartData.map((d: any) => d.value)).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
