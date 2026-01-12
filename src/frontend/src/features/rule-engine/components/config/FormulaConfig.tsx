import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { FormulaConfig as FormulaConfigType } from '../../types';

interface FormulaConfigProps {
  nodeId: string;
}

export function FormulaConfig({ nodeId }: FormulaConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as FormulaConfigType;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Usa sintaxis de mathjs. Ejemplo: <code className="bg-muted px-1 py-0.5 rounded">sqrt(a^2 + b^2)</code>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="formula">Fórmula *</Label>
        <Textarea
          id="formula"
          value={config.formula || ''}
          onChange={(e) => updateConfig('formula', e.target.value)}
          placeholder="(temperature - 32) * 5/9"
          rows={4}
          className="font-mono text-xs"
        />
        {errors.formula && (
          <p className="text-xs text-destructive">{errors.formula}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputKey">Clave de Salida *</Label>
        <Input
          id="outputKey"
          value={config.outputKey || ''}
          onChange={(e) => updateConfig('outputKey', e.target.value)}
          placeholder="celsius"
        />
        {errors.outputKey && (
          <p className="text-xs text-destructive">{errors.outputKey}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-normal text-muted-foreground">Funciones disponibles:</Label>
        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">sqrt(x)</code>
          <code className="bg-muted px-1 py-0.5 rounded">pow(x, y)</code>
          <code className="bg-muted px-1 py-0.5 rounded">abs(x)</code>
          <code className="bg-muted px-1 py-0.5 rounded">sin(x)</code>
          <code className="bg-muted px-1 py-0.5 rounded">cos(x)</code>
          <code className="bg-muted px-1 py-0.5 rounded">log(x)</code>
        </div>
      </div>
    </div>
  );
}
