import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { MessageTypeSwitchConfig as MessageTypeSwitchConfigType, MessageTypeSwitchRoute } from '../../types';

interface MessageTypeSwitchConfigProps {
  nodeId: string;
}

export function MessageTypeSwitchConfig({ nodeId }: MessageTypeSwitchConfigProps) {
  const { config: rawConfig, updateConfig } = useNodeConfig(nodeId);
  const config = rawConfig as MessageTypeSwitchConfigType;
  const routes: MessageTypeSwitchRoute[] = config.routes || [];

  const addRoute = () => {
    const newRoutes = [...routes, { messageType: '', outputLabel: '' }];
    updateConfig('routes', newRoutes);
  };

  const updateRoute = (index: number, field: keyof MessageTypeSwitchRoute, value: string) => {
    const newRoutes = [...routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    updateConfig('routes', newRoutes);
  };

  const removeRoute = (index: number) => {
    const newRoutes = routes.filter((_, i) => i !== index);
    updateConfig('routes', newRoutes);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Rutas de Mensajes</Label>
        <Button onClick={addRoute} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Agregar Ruta
        </Button>
      </div>

      <div className="space-y-2">
        {routes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay rutas configuradas. Agrega al menos una ruta.
          </p>
        ) : (
          routes.map((route, index) => (
            <Card key={index}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Ruta {index + 1}</span>
                  <Button
                    onClick={() => removeRoute(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Input
                    value={route.messageType}
                    onChange={(e) => updateRoute(index, 'messageType', e.target.value)}
                    placeholder="Tipo de mensaje (ej: POST_TELEMETRY)"
                    className="text-xs"
                  />
                  <Input
                    value={route.outputLabel}
                    onChange={(e) => updateRoute(index, 'outputLabel', e.target.value)}
                    placeholder="Etiqueta de salida"
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
