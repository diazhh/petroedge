import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useNodeConfig } from '../../hooks';
import type { FetchAssetTelemetryConfig as FetchAssetTelemetryConfigType } from '../../types';

interface FetchAssetTelemetryConfigProps {
  nodeId: string;
}

export function FetchAssetTelemetryConfig({ nodeId }: FetchAssetTelemetryConfigProps) {
  const { config: rawConfig, updateConfig } = useNodeConfig(nodeId);
  const config = rawConfig as FetchAssetTelemetryConfigType;
  const [newKey, setNewKey] = useState('');

  const keys: string[] = config.keys || [];

  const addKey = () => {
    if (newKey.trim() && !keys.includes(newKey.trim())) {
      updateConfig('keys', [...keys, newKey.trim()]);
      setNewKey('');
    }
  };

  const removeKey = (key: string) => {
    updateConfig('keys', keys.filter(k => k !== key));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newKey">Claves de Telemetría *</Label>
        <div className="flex gap-2">
          <Input
            id="newKey"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKey()}
            placeholder="temperature, pressure"
          />
          <Button onClick={addKey} size="sm">
            Agregar
          </Button>
        </div>

        {keys.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {keys.map((key) => (
              <Badge key={key} variant="secondary" className="gap-1">
                {key}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeKey(key)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="startTs">Start Timestamp</Label>
          <Input
            id="startTs"
            type="number"
            value={config.startTs || ''}
            onChange={(e) => updateConfig('startTs', parseInt(e.target.value))}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTs">End Timestamp</Label>
          <Input
            id="endTs"
            type="number"
            value={config.endTs || ''}
            onChange={(e) => updateConfig('endTs', parseInt(e.target.value))}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Límite de Registros</Label>
        <Input
          id="limit"
          type="number"
          min="1"
          max="1000"
          value={config.limit || ''}
          onChange={(e) => updateConfig('limit', parseInt(e.target.value))}
          placeholder="100"
        />
      </div>
    </div>
  );
}
