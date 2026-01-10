/**
 * ComputedFieldDefinitionForm Component
 * Form for creating/editing computed field definitions
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataType, ComputedFieldDefinition } from '../types/data-types';
import { DataTypeSelector } from './DataTypeSelector';
import { FormulaEditor } from './FormulaEditor';
import { DependencySelector } from './DependencySelector';
import { Loader2 } from 'lucide-react';

interface ComputedFieldDefinitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (definition: ComputedFieldDefinition) => Promise<void>;
  initialData?: ComputedFieldDefinition;
  isLoading?: boolean;
  assetTypeId: string;
  telemetryKeys?: string[];
  attributeKeys?: string[];
  computedKeys?: string[];
}

export function ComputedFieldDefinitionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
  assetTypeId,
  telemetryKeys = [],
  attributeKeys = [],
  computedKeys = [],
}: ComputedFieldDefinitionFormProps) {
  const [formData, setFormData] = useState<Partial<ComputedFieldDefinition>>(
    initialData || {
      key: '',
      name: '',
      type: DataType.NUMBER,
      formula: '',
      recalculateOn: [],
      unit: '',
      description: '',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key || !formData.name || !formData.type || !formData.formula || !formData.recalculateOn) {
      return;
    }

    await onSubmit(formData as ComputedFieldDefinition);
    onOpenChange(false);
  };

  const handleDefinitionChange = (updates: Partial<ComputedFieldDefinition>) => {
    setFormData({ ...formData, ...updates });
  };

  // Build available variables for formula editor
  const availableVariables = [
    ...telemetryKeys.map(k => `telemetry.${k}`),
    ...attributeKeys.map(k => `attributes.${k}`),
    ...computedKeys.filter(k => k !== formData.key).map(k => `computed.${k}`),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Campo Calculado' : 'Nuevo Campo Calculado'}
          </DialogTitle>
          <DialogDescription>
            Define un campo que se calcula automáticamente a partir de otros valores
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">
                Clave (Key) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="key"
                value={formData.key || ''}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ej: liquidRate, waterCut"
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
                placeholder="ej: Tasa Líquida"
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

          <FormulaEditor
            value={formData.formula || ''}
            onChange={(formula) => setFormData({ ...formData, formula })}
            assetTypeId={assetTypeId}
            availableVariables={availableVariables}
          />

          <DependencySelector
            value={formData.recalculateOn || []}
            onChange={(recalculateOn) => setFormData({ ...formData, recalculateOn })}
            telemetryKeys={telemetryKeys}
            attributeKeys={attributeKeys}
            computedKeys={computedKeys.filter(k => k !== formData.key)}
          />

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
