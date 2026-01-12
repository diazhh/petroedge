import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeConfig } from '../../hooks';
import type { CreateAlarmConfig as CreateAlarmConfigType } from '../../types';

interface CreateAlarmConfigProps {
  nodeId: string;
}

export function CreateAlarmConfig({ nodeId }: CreateAlarmConfigProps) {
  const { config: rawConfig, updateConfig, errors } = useNodeConfig(nodeId);
  const config = rawConfig as CreateAlarmConfigType;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="alarmType">Tipo de Alarma *</Label>
        <Input
          id="alarmType"
          value={config.alarmType || ''}
          onChange={(e) => updateConfig('alarmType', e.target.value)}
          placeholder="HIGH_TEMPERATURE"
        />
        {errors.alarmType && (
          <p className="text-xs text-destructive">{errors.alarmType}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="severity">Severidad *</Label>
        <Select
          value={config.severity || 'WARNING'}
          onValueChange={(value) => updateConfig('severity', value)}
        >
          <SelectTrigger id="severity">
            <SelectValue placeholder="Seleccionar severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="MAJOR">Major</SelectItem>
            <SelectItem value="MINOR">Minor</SelectItem>
            <SelectItem value="WARNING">Warning</SelectItem>
            <SelectItem value="INDETERMINATE">Indeterminate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensaje *</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="La temperatura excedió el umbral de ${msg.threshold}°C"
          rows={3}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Puedes usar variables del mensaje con sintaxis: $&#123;msg.campo&#125;
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="propagate"
          checked={config.propagate || false}
          onChange={(e) => updateConfig('propagate', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="propagate" className="text-sm font-normal cursor-pointer">
          Propagar a activos relacionados
        </Label>
      </div>
    </div>
  );
}
