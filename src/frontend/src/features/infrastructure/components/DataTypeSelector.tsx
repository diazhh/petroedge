/**
 * DataTypeSelector Component
 * Allows selecting a data type with optional advanced configuration
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataType, DATA_TYPE_LABELS, FieldDefinition } from '../types/data-types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface DataTypeSelectorProps {
  value: DataType;
  onChange: (type: DataType) => void;
  showAdvanced?: boolean;
  definition?: Partial<FieldDefinition>;
  onDefinitionChange?: (definition: Partial<FieldDefinition>) => void;
}

export function DataTypeSelector({ 
  value, 
  onChange, 
  showAdvanced = false,
  definition = {},
  onDefinitionChange 
}: DataTypeSelectorProps) {
  const [enumInput, setEnumInput] = useState('');

  const handleAddEnumValue = () => {
    if (!enumInput.trim() || !onDefinitionChange) return;
    
    const currentValues = definition.enumValues || [];
    if (!currentValues.includes(enumInput.trim())) {
      onDefinitionChange({
        ...definition,
        enumValues: [...currentValues, enumInput.trim()],
      });
    }
    setEnumInput('');
  };

  const handleRemoveEnumValue = (valueToRemove: string) => {
    if (!onDefinitionChange) return;
    
    onDefinitionChange({
      ...definition,
      enumValues: (definition.enumValues || []).filter(v => v !== valueToRemove),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Dato</Label>
        <Select value={value} onValueChange={(v) => onChange(v as DataType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATA_TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAdvanced && onDefinitionChange && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-medium">Configuración Avanzada</h4>

            {/* Unit */}
            {(value === DataType.NUMBER) && (
              <div className="space-y-2">
                <Label>Unidad de Medida</Label>
                <Input
                  placeholder="ej: psi, m³/d, °C"
                  value={definition.unit || ''}
                  onChange={(e) => onDefinitionChange({ ...definition, unit: e.target.value })}
                />
              </div>
            )}

            {/* Min/Max for numbers */}
            {value === DataType.NUMBER && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="Opcional"
                    value={definition.minValue ?? ''}
                    onChange={(e) => onDefinitionChange({ 
                      ...definition, 
                      minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    placeholder="Opcional"
                    value={definition.maxValue ?? ''}
                    onChange={(e) => onDefinitionChange({ 
                      ...definition, 
                      maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            )}

            {/* Pattern for strings */}
            {value === DataType.STRING && (
              <div className="space-y-2">
                <Label>Patrón de Validación (Regex)</Label>
                <Input
                  placeholder="ej: ^[A-Z0-9-]+$"
                  value={definition.pattern || ''}
                  onChange={(e) => onDefinitionChange({ ...definition, pattern: e.target.value })}
                />
              </div>
            )}

            {/* Enum values */}
            {value === DataType.ENUM && (
              <div className="space-y-2">
                <Label>Valores Permitidos</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar valor"
                    value={enumInput}
                    onChange={(e) => setEnumInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEnumValue();
                      }
                    }}
                  />
                  <Button type="button" size="icon" onClick={handleAddEnumValue}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {definition.enumValues && definition.enumValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {definition.enumValues.map((value) => (
                      <div
                        key={value}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        <span>{value}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnumValue(value)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Default value */}
            <div className="space-y-2">
              <Label>Valor por Defecto (Opcional)</Label>
              {value === DataType.BOOLEAN ? (
                <Select 
                  value={definition.defaultValue?.toString() || ''} 
                  onValueChange={(v) => onDefinitionChange({ 
                    ...definition, 
                    defaultValue: v === 'true' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Verdadero</SelectItem>
                    <SelectItem value="false">Falso</SelectItem>
                  </SelectContent>
                </Select>
              ) : value === DataType.ENUM ? (
                <Select 
                  value={definition.defaultValue || ''} 
                  onValueChange={(v) => onDefinitionChange({ ...definition, defaultValue: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(definition.enumValues || []).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={value === DataType.NUMBER ? 'number' : value === DataType.DATE ? 'date' : 'text'}
                  placeholder="Opcional"
                  value={definition.defaultValue || ''}
                  onChange={(e) => onDefinitionChange({ ...definition, defaultValue: e.target.value })}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
