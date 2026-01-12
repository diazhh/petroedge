import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { ScriptTransformConfig as ScriptTransformConfigType } from '../../types';

interface ScriptTransformConfigProps {
  nodeId: string;
}

export function ScriptTransformConfig({ nodeId }: ScriptTransformConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as ScriptTransformConfigType;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-xs">
          El script debe retornar el mensaje transformado. Modifica <code className="bg-muted px-1 py-0.5 rounded">msg</code> y <code className="bg-muted px-1 py-0.5 rounded">metadata</code> según necesites.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="script">Script de Transformación *</Label>
        <Textarea
          id="script"
          value={config.script || ''}
          onChange={(e) => updateConfig('script', e.target.value)}
          placeholder="msg.tempF = msg.tempC * 9/5 + 32;\nreturn { msg, metadata, msgType };"
          rows={10}
          className="font-mono text-xs"
        />
        {errors.script && (
          <p className="text-xs text-destructive">{errors.script}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-normal text-muted-foreground">Variables disponibles:</Label>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li><code className="bg-muted px-1 py-0.5 rounded">msg</code> - Mensaje entrante (modificable)</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">metadata</code> - Metadatos (modificable)</li>
          <li><code className="bg-muted px-1 py-0.5 rounded">msgType</code> - Tipo de mensaje</li>
        </ul>
      </div>
    </div>
  );
}
