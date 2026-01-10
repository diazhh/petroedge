/**
 * RealtimeStatus Component
 * 
 * Componente de ejemplo que muestra el estado de conexión WebSocket
 * y datos en tiempo real.
 */

import { useEffect, useState } from 'react';
import { useWebSocketConnection } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export function RealtimeStatus() {
  const { isConnected, client } = useWebSocketConnection();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Escuchar eventos de telemetría
    const handleTelemetryUpdate = () => {
      setLastUpdate(new Date().toLocaleTimeString());
    };

    client.on('telemetry:update', handleTelemetryUpdate);

    return () => {
      client.off('telemetry:update', handleTelemetryUpdate);
    };
  }, [isConnected, client]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Estado en Tiempo Real
        </CardTitle>
        <CardDescription>
          Conexión WebSocket al servidor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Conectado
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Desconectado
                </Badge>
              </>
            )}
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Última actualización: {lastUpdate}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
