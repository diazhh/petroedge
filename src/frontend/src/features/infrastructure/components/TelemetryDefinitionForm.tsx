/**
 * TelemetryDefinitionForm Component
 * Form for creating/editing telemetry definitions
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataType, TelemetryDefinition } from '../types/data-types';
import { DataTypeSelector } from './DataTypeSelector';
import { Loader2 } from 'lucide-react';

interface TelemetryDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (definition: TelemetryDefinition) => Promise<void>;
  initialData?: TelemetryDefinition;
  isLoading?: boolean;
}

export function TelemetryDefinitionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: TelemetryDefinitionFormProps) {
  const [formData, setFormData] = useState<Partial<TelemetryDefinition>>(
    initialData || {
      key: '',
      name: '',
      type: DataType.NUMBER,
      sampleRate: '5s',
      unit: '',
      description: '',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key || !formData.name || !formData.type || !formData.sampleRate) {
      return;
    }

    await onSubmit(formData as TelemetryDefinition);
    onOpenChange(false);
  };

  const handleDefinitionChange = (updates: Partial<TelemetryDefinition>) => {
    setFormData({ ...formData, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Definición de Telemetría' : 'Nueva Definición de Telemetría'}
          </DialogTitle>
          <DialogDescription>
            Define los parámetros de telemetría para este tipo de asset
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">
                Clave (Key) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="key"
                value={formData.key || ''}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ej: oilRate, pressure"
                required
                disabled={!!initialData}
              />
              <p className="text-xs text-muted-foreground">
                Identificador único (solo letras, números y guiones bajos)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej: Tasa de Petróleo"
                required
              />
            </div>
          </div>

          <DataTypeSelector
            value={formData.type || DataType.NUMBER}
            onChange={(type) => setFormData({ ...formData, type })}
            showAdvanced
            definition={formData}
            onDefinitionChange={handleDefinitionChange}
          />

          <div className="space-y-2">
            <Label htmlFor="sampleRate">
              Frecuencia de Muestreo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sampleRate"
              value={formData.sampleRate || ''}
              onChange={(e) => setFormData({ ...formData, sampleRate: e.target.value })}
              placeholder="ej: 5s, 1m, 1h"
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: número + unidad (s=segundos, m=minutos, h=horas, d=días)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
