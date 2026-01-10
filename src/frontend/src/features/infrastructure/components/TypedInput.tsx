/**
 * TypedInput Component
 * Input component that validates and formats values according to data type
 */

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataType, FieldDefinition } from '../types/data-types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TypedInputProps {
  definition: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function TypedInput({ definition, value, onChange, error, disabled }: TypedInputProps) {
  const renderInput = () => {
    switch (definition.type) {
      case DataType.STRING:
        if (definition.pattern || (value && typeof value === 'string' && value.length > 100)) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={definition.description}
              disabled={disabled}
              className={error ? 'border-destructive' : ''}
            />
          );
        }
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.description}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case DataType.NUMBER:
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={definition.description}
              min={definition.minValue}
              max={definition.maxValue}
              step="any"
              disabled={disabled}
              className={error ? 'border-destructive' : ''}
            />
            {definition.unit && (
              <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                {definition.unit}
              </div>
            )}
          </div>
        );

      case DataType.BOOLEAN:
        return (
          <Select 
            value={value?.toString() || ''} 
            onValueChange={(v) => onChange(v === 'true')}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Verdadero</SelectItem>
              <SelectItem value="false">Falso</SelectItem>
            </SelectContent>
          </Select>
        );

      case DataType.DATE:
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case DataType.DATETIME:
        return (
          <Input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case DataType.ENUM:
        return (
          <Select 
            value={value || ''} 
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {(definition.enumValues || []).map((enumValue) => (
                <SelectItem key={enumValue} value={enumValue}>
                  {enumValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case DataType.JSON:
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder='{"key": "value"}'
            disabled={disabled}
            className={`font-mono text-sm ${error ? 'border-destructive' : ''}`}
            rows={5}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {definition.name}
        {definition.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {definition.description && !error && (
        <p className="text-sm text-muted-foreground">{definition.description}</p>
      )}
      {definition.minValue !== undefined && definition.maxValue !== undefined && (
        <p className="text-xs text-muted-foreground">
          Rango: {definition.minValue} - {definition.maxValue}
        </p>
      )}
    </div>
  );
}
