import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeConfig } from '../../hooks';
import type { ThresholdFilterConfig as ThresholdFilterConfigType } from '../../types';

interface ThresholdFilterConfigProps {
  nodeId: string;
}

export function ThresholdFilterConfig({ nodeId }: ThresholdFilterConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as ThresholdFilterConfigType;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="field">Campo *</Label>
        <Input
          id="field"
          value={config.field || ''}
          onChange={(e) => updateConfig('field', e.target.value)}
          placeholder="temperature"
        />
        {errors.field && (
          <p className="text-xs text-destructive">{errors.field}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="operator">Operador *</Label>
        <Select
          value={config.operator || '>'}
          onValueChange={(value) => updateConfig('operator', value)}
        >
          <SelectTrigger id="operator">
            <SelectValue placeholder="Seleccionar operador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=">">Mayor que (&gt;)</SelectItem>
            <SelectItem value=">=">Mayor o igual (&gt;=)</SelectItem>
            <SelectItem value="<">Menor que (&lt;)</SelectItem>
            <SelectItem value="<=">Menor o igual (&lt;=)</SelectItem>
            <SelectItem value="==">Igual (==)</SelectItem>
            <SelectItem value="!=">Diferente (!=)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor *</Label>
        <Input
          id="value"
          type="number"
          value={config.value || ''}
          onChange={(e) => updateConfig('value', parseFloat(e.target.value))}
          placeholder="50"
        />
        {errors.value && (
          <p className="text-xs text-destructive">{errors.value}</p>
        )}
      </div>
    </div>
  );
}
