import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { ScriptFilterConfig as ScriptFilterConfigType } from '../../types';

interface ScriptFilterConfigProps {
  nodeId: string;
}

export function ScriptFilterConfig({ nodeId }: ScriptFilterConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as ScriptFilterConfigType;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-xs">
          El script debe retornar <code className="bg-muted px-1 py-0.5 rounded">true</code> para pasar el mensaje o <code className="bg-muted px-1 py-0.5 rounded">false</code> para filtrarlo.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="script">Script de Filtro *</Label>
        <Textarea
          id="script"
          value={config.script || ''}
          onChange={(e) => updateConfig('script', e.target.value)}
          placeholder="return msg.temperature > 50;"
          rows={8}
          className="font-mono text-xs"
        />
        {errors.script && (
          <p className="text-xs text-destructive">{errors.script}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-normal text-muted-foreground">Variables disponibles:</Label>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li><code className="bg-muted px-1 py-0.5 rounded">msg</code> - Mensaje entrante</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">metadata</code> - Metadatos del mensaje</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">msgType</code> - Tipo de mensaje</li>
        </ul>
      </div>
    </div>
  );
}
