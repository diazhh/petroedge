import { useState } from 'react';
import { Activity, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLatestTelemetry, useTelemetryQuery } from '../api/telemetry.api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subHours, subDays } from 'date-fns';

interface TelemetryViewerProps {
  assetId: string;
}

export function TelemetryViewer({ assetId }: TelemetryViewerProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  
  const { data: latestData, isLoading: loadingLatest, refetch } = useLatestTelemetry(assetId);

  const getTimeRange = () => {
    const endTime = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = subHours(endTime, 1);
        break;
      case '6h':
        startTime = subHours(endTime, 6);
        break;
      case '24h':
        startTime = subHours(endTime, 24);
        break;
      case '7d':
        startTime = subDays(endTime, 7);
        break;
      default:
        startTime = subHours(endTime, 24);
    }
    
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  };

  const { startTime, endTime } = getTimeRange();
  
  const { data: historyData, isLoading: loadingHistory } = useTelemetryQuery(
    selectedKey
      ? {
          assetId,
          telemetryKey: selectedKey,
          startTime,
          endTime,
          interval: timeRange === '7d' ? '1 hour' : timeRange === '24h' ? '10 minutes' : '1 minute',
          aggregation: 'avg',
          limit: 500,
        }
      : null
  );

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'GOOD':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'BAD':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'UNCERTAIN':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'SIMULATED':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatValue = (point: any) => {
    if (point.valueNumeric !== undefined && point.valueNumeric !== null) {
      return `${point.valueNumeric.toFixed(2)} ${point.unit || ''}`;
    }
    if (point.valueBoolean !== undefined && point.valueBoolean !== null) {
      return point.valueBoolean ? 'Sí' : 'No';
    }
    if (point.valueText) {
      return point.valueText;
    }
    return 'N/A';
  };

  if (loadingLatest) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando telemetría...</p>
        </CardContent>
      </Card>
    );
  }

  if (!latestData || Object.keys(latestData).length === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground p-12">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay datos de telemetría</p>
          <p className="text-sm mt-2">
            Los datos de telemetría se almacenan en TimescaleDB cuando los sensores envían información
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest Values Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Valores Actuales
              </CardTitle>
              <CardDescription>Última telemetría recibida (actualización automática cada 5s)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(latestData).map(([key, point]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedKey === key ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedKey(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{key}</CardTitle>
                    <Badge variant="outline" className={getQualityColor(point.quality)}>
                      {point.quality}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{formatValue(point)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {point.source}
                      </Badge>
                      <span>{format(new Date(point.time), 'HH:mm:ss')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Chart */}
      {selectedKey && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Histórico: {selectedKey}
                </CardTitle>
                <CardDescription>Datos históricos de TimescaleDB</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        1 hora
                      </div>
                    </SelectItem>
                    <SelectItem value="6h">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        6 horas
                      </div>
                    </SelectItem>
                    <SelectItem value="24h">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        24 horas
                      </div>
                    </SelectItem>
                    <SelectItem value="7d">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        7 días
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="h-80 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : historyData && historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(time) => format(new Date(time), 'HH:mm')}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(time) => format(new Date(time), 'dd/MM/yyyy HH:mm:ss')}
                    formatter={(value: any) => [
                      `${Number(value).toFixed(2)} ${latestData[selectedKey]?.unit || ''}`,
                      selectedKey,
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valueNumeric"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name={selectedKey}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>No hay datos históricos para el rango seleccionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
