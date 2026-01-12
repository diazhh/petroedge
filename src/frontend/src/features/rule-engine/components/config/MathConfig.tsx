import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeConfig } from '../../hooks';
import type { MathConfig as MathConfigType } from '../../types';

interface MathConfigProps {
  nodeId: string;
}

export function MathConfig({ nodeId }: MathConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as MathConfigType;

  const requiresOperand2 = ['add', 'subtract', 'multiply', 'divide', 'power'].includes(config.operation);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operation">Operación *</Label>
        <Select
          value={config.operation || 'add'}
          onValueChange={(value) => updateConfig('operation', value)}
        >
          <SelectTrigger id="operation">
            <SelectValue placeholder="Seleccionar operación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Suma (+)</SelectItem>
            <SelectItem value="subtract">Resta (-)</SelectItem>
            <SelectItem value="multiply">Multiplicación (×)</SelectItem>
            <SelectItem value="divide">División (÷)</SelectItem>
            <SelectItem value="power">Potencia (^)</SelectItem>
            <SelectItem value="sqrt">Raíz Cuadrada (√)</SelectItem>
            <SelectItem value="abs">Valor Absoluto (|x|)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operand1">Operando 1 *</Label>
        <Input
          id="operand1"
          value={config.operand1 || ''}
          onChange={(e) => updateConfig('operand1', e.target.value)}
          placeholder="msg.temperature"
        />
        {errors.operand1 && (
          <p className="text-xs text-destructive">{errors.operand1}</p>
        )}
      </div>

      {requiresOperand2 && (
        <div className="space-y-2">
          <Label htmlFor="operand2">Operando 2 *</Label>
          <Input
            id="operand2"
            value={config.operand2 || ''}
            onChange={(e) => updateConfig('operand2', e.target.value)}
            placeholder="msg.pressure"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="outputKey">Clave de Salida *</Label>
        <Input
          id="outputKey"
          value={config.outputKey || ''}
          onChange={(e) => updateConfig('outputKey', e.target.value)}
          placeholder="result"
        />
        {errors.outputKey && (
          <p className="text-xs text-destructive">{errors.outputKey}</p>
        )}
      </div>
    </div>
  );
}
