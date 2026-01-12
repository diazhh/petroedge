import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNodeConfig } from '../../hooks';
import type { KafkaPublishConfig as KafkaPublishConfigType } from '../../types';

interface KafkaPublishConfigProps {
  nodeId: string;
}

export function KafkaPublishConfig({ nodeId }: KafkaPublishConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as KafkaPublishConfigType;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic *</Label>
        <Input
          id="topic"
          value={config.topic || ''}
          onChange={(e) => updateConfig('topic', e.target.value)}
          placeholder="telemetry.processed"
        />
        {errors.topic && (
          <p className="text-xs text-destructive">{errors.topic}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="key">Key (Opcional)</Label>
        <Input
          id="key"
          value={config.key || ''}
          onChange={(e) => updateConfig('key', e.target.value)}
          placeholder="asset-id"
        />
        <p className="text-xs text-muted-foreground">
          Clave para particionamiento. Si está vacío, se usa round-robin.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partition">Partición (Opcional)</Label>
        <Input
          id="partition"
          type="number"
          min="0"
          value={config.partition || ''}
          onChange={(e) => updateConfig('partition', parseInt(e.target.value))}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Partición específica. Si se especifica, se ignora la key.
        </p>
      </div>
    </div>
  );
}
