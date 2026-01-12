import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeConfig } from '../../hooks';
import type { LogConfig as LogConfigType } from '../../types';

interface LogConfigProps {
  nodeId: string;
}

export function LogConfig({ nodeId }: LogConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as LogConfigType;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="level">Nivel de Log *</Label>
        <Select
          value={config.level || 'info'}
          onValueChange={(value) => updateConfig('level', value)}
        >
          <SelectTrigger id="level">
            <SelectValue placeholder="Seleccionar nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensaje *</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="Procesando mensaje de tipo: ${msgType}"
          rows={4}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Puedes usar variables: $&#123;msg.campo&#125;, $&#123;msgType&#125;, $&#123;metadata.key&#125;
        </p>
      </div>
    </div>
  );
}
