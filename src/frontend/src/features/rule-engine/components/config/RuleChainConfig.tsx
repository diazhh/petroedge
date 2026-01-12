import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useNodeConfig } from '../../hooks';
import type { RuleChainConfig as RuleChainConfigType } from '../../types';

interface RuleChainConfigProps {
  nodeId: string;
}

export function RuleChainConfig({ nodeId }: RuleChainConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as RuleChainConfigType;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Invoca otra cadena de reglas. El mensaje se procesará en la cadena especificada.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="ruleChainId">Rule Chain ID *</Label>
        <Input
          id="ruleChainId"
          value={config.ruleChainId || ''}
          onChange={(e) => updateConfig('ruleChainId', e.target.value)}
          placeholder="uuid-de-la-regla"
        />
        {errors.ruleChainId && (
          <p className="text-xs text-destructive">{errors.ruleChainId}</p>
        )}
        <p className="text-xs text-muted-foreground">
          ID de la regla a invocar. El mensaje actual se pasará como entrada.
        </p>
      </div>
    </div>
  );
}
