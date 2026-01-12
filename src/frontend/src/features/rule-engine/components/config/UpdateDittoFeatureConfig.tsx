import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { UpdateDittoFeatureConfig as UpdateDittoFeatureConfigType } from '../../types';

interface UpdateDittoFeatureConfigProps {
  nodeId: string;
}

export function UpdateDittoFeatureConfig({ nodeId }: UpdateDittoFeatureConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as UpdateDittoFeatureConfigType;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Actualiza las propiedades de un Feature en Eclipse Ditto.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="thingId">Thing ID *</Label>
        <Input
          id="thingId"
          value={config.thingId || ''}
          onChange={(e) => updateConfig('thingId', e.target.value)}
          placeholder="com.acme:well-001"
        />
        {errors.thingId && (
          <p className="text-xs text-destructive">{errors.thingId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="featureId">Feature ID *</Label>
        <Input
          id="featureId"
          value={config.featureId || ''}
          onChange={(e) => updateConfig('featureId', e.target.value)}
          placeholder="telemetry"
        />
        {errors.featureId && (
          <p className="text-xs text-destructive">{errors.featureId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="properties">Properties (JSON)</Label>
        <Textarea
          id="properties"
          value={config.properties ? JSON.stringify(config.properties, null, 2) : ''}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateConfig('properties', parsed);
            } catch {
              // Invalid JSON, keep typing
            }
          }}
          placeholder='{\n  "temperature": 25.5,\n  "pressure": 100\n}'
          rows={6}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Si está vacío, se usarán los valores del mensaje entrante.
        </p>
      </div>
    </div>
  );
}
