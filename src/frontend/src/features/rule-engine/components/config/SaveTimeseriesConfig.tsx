import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useNodeConfig } from '../../hooks';
import type { SaveTimeseriesConfig as SaveTimeseriesConfigType } from '../../types';

interface SaveTimeseriesConfigProps {
  nodeId: string;
}

export function SaveTimeseriesConfig({ nodeId }: SaveTimeseriesConfigProps) {
  const { config: rawConfig, updateConfig } = useNodeConfig(nodeId);
  const config = rawConfig as SaveTimeseriesConfigType;
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
        <Label htmlFor="newKey">Claves a Guardar (Opcional)</Label>
        <p className="text-xs text-muted-foreground">
          Si no se especifican claves, se guardarán todas las del mensaje.
        </p>
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

      <div className="space-y-2">
        <Label htmlFor="ttl">TTL (Time To Live) en segundos</Label>
        <Input
          id="ttl"
          type="number"
          min="0"
          value={config.ttl || ''}
          onChange={(e) => updateConfig('ttl', parseInt(e.target.value))}
          placeholder="0 (sin expiración)"
        />
        <p className="text-xs text-muted-foreground">
          0 = sin expiración, &gt;0 = segundos hasta expiración
        </p>
      </div>
    </div>
  );
}
