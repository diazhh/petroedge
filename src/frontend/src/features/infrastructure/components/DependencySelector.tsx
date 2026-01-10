/**
 * DependencySelector Component
 * Allows selecting dependencies (telemetry/attributes) for computed fields
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface DependencySelectorProps {
  value: string[];
  onChange: (dependencies: string[]) => void;
  telemetryKeys?: string[];
  attributeKeys?: string[];
  computedKeys?: string[];
}

export function DependencySelector({ 
  value, 
  onChange,
  telemetryKeys = [],
  attributeKeys = [],
  computedKeys = []
}: DependencySelectorProps) {
  const [selectedType, setSelectedType] = useState<'telemetry' | 'attributes' | 'computed'>('telemetry');
  const [selectedKey, setSelectedKey] = useState<string>('');

  const getAvailableKeys = () => {
    switch (selectedType) {
      case 'telemetry':
        return telemetryKeys;
      case 'attributes':
        return attributeKeys;
      case 'computed':
        return computedKeys;
      default:
        return [];
    }
  };

  const handleAdd = () => {
    if (!selectedKey) return;
    
    const dependency = `${selectedType}.${selectedKey}`;
    if (!value.includes(dependency)) {
      onChange([...value, dependency]);
    }
    setSelectedKey('');
  };

  const handleRemove = (dependency: string) => {
    onChange(value.filter(d => d !== dependency));
  };

  const getDependencyColor = (dep: string) => {
    if (dep.startsWith('telemetry.')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (dep.startsWith('attributes.')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (dep.startsWith('computed.')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Dependencias (Recalcular Cuando)</Label>
        <p className="text-sm text-muted-foreground">
          Selecciona las telemetrías, atributos o campos calculados que disparan el recálculo
        </p>
      </div>

      {/* Add Dependency */}
      <div className="flex gap-2">
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="telemetry">Telemetría</SelectItem>
            <SelectItem value="attributes">Atributo</SelectItem>
            <SelectItem value="computed">Calculado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleccionar campo" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableKeys().length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No hay campos disponibles
              </div>
            ) : (
              getAvailableKeys().map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button type="button" size="icon" onClick={handleAdd} disabled={!selectedKey}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Dependencies */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>Dependencias Seleccionadas</Label>
          <div className="flex flex-wrap gap-2">
            {value.map((dependency) => (
              <Badge
                key={dependency}
                variant="outline"
                className={getDependencyColor(dependency)}
              >
                <span>{dependency}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(dependency)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {value.length === 0 && (
        <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
          No hay dependencias seleccionadas. El campo se recalculará manualmente.
        </div>
      )}
    </div>
  );
}
