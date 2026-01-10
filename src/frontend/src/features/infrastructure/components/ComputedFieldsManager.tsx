/**
 * ComputedFieldsManager Component
 * Complete computed fields management interface
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Calculator, RefreshCw } from 'lucide-react';
import {
  useComputedFieldDefinitions,
  useComputedFieldValues,
  useCreateComputedField,
  useUpdateComputedField,
  useDeleteComputedField,
  useRecalculateComputedFields,
} from '../api/computed-fields.api';
import { useTelemetryDefinitions } from '../api/telemetry.api';
import { ComputedFieldDefinition } from '../types/data-types';
import { ComputedFieldDefinitionForm } from './ComputedFieldDefinitionForm';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ComputedFieldsManagerProps {
  assetId: string;
  assetTypeId: string;
}

export function ComputedFieldsManager({ assetId, assetTypeId }: ComputedFieldsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<ComputedFieldDefinition | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const { data: definitionsData, isLoading: loadingDefinitions } = useComputedFieldDefinitions(assetTypeId);
  const { data: valuesData, isLoading: loadingValues } = useComputedFieldValues(assetId);
  const { data: telemetryDefsData } = useTelemetryDefinitions(assetTypeId);
  
  const createField = useCreateComputedField();
  const updateField = useUpdateComputedField();
  const deleteField = useDeleteComputedField();
  const recalculate = useRecalculateComputedFields();

  const definitions = definitionsData?.data || [];
  const values = valuesData?.data || {};
  const telemetryDefs = telemetryDefsData?.data || {};

  const handleCreate = async (definition: ComputedFieldDefinition) => {
    await createField.mutateAsync({ assetTypeId, definition });
    setShowAddDialog(false);
  };

  const handleUpdate = async (definition: ComputedFieldDefinition) => {
    await updateField.mutateAsync({
      assetTypeId,
      key: definition.key,
      definition,
    });
    setEditingDefinition(null);
  };

  const handleDelete = async () => {
    if (!deletingKey) return;
    await deleteField.mutateAsync({ assetTypeId, key: deletingKey });
    setDeletingKey(null);
  };

  const handleRecalculate = async () => {
    await recalculate.mutateAsync(assetId);
  };

  if (loadingDefinitions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Extract keys for form
  const telemetryKeys = Object.keys(telemetryDefs);
  const attributeKeys: string[] = []; // TODO: Get from asset attributes
  const computedKeys = definitions.map((d: ComputedFieldDefinition) => d.key);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Campos Calculados</h3>
          <p className="text-sm text-muted-foreground">
            Campos que se calculan automáticamente a partir de otros valores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalculate} disabled={recalculate.isPending}>
            {recalculate.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalcular
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Campo
          </Button>
        </div>
      </div>

      {/* Fields List */}
      {definitions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay campos calculados definidos</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando campos calculados para este tipo de asset
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Campo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {definitions.map((definition: ComputedFieldDefinition) => {
            const value = values[definition.key];
            
            return (
              <div key={definition.key} className="relative">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-medium text-sm">{definition.name}</h4>
                          {definition.description && (
                            <p className="text-xs text-muted-foreground">{definition.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Value */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {value !== null && value !== undefined 
                            ? typeof value === 'number' 
                              ? value.toLocaleString('es-ES', { maximumFractionDigits: 2 })
                              : String(value)
                            : 'N/A'
                          }
                        </span>
                        {definition.unit && (
                          <span className="text-sm text-muted-foreground">{definition.unit}</span>
                        )}
                      </div>

                      {/* Formula */}
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Fórmula:</p>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {definition.formula}
                        </code>
                      </div>

                      {/* Dependencies */}
                      {definition.recalculateOn && definition.recalculateOn.length > 0 && (
                        <div className="text-xs">
                          <p className="text-muted-foreground mb-1">Dependencias:</p>
                          <div className="flex flex-wrap gap-1">
                            {definition.recalculateOn.map((dep) => (
                              <span key={dep} className="bg-muted px-2 py-0.5 rounded text-xs">
                                {dep}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingDefinition(definition)}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingKey(definition.key)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator for values */}
      {loadingValues && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Actualizando valores...</span>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ComputedFieldDefinitionForm
        open={showAddDialog || !!editingDefinition}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingDefinition(null);
          }
        }}
        onSubmit={editingDefinition ? handleUpdate : handleCreate}
        initialData={editingDefinition || undefined}
        isLoading={createField.isPending || updateField.isPending}
        assetTypeId={assetTypeId}
        telemetryKeys={telemetryKeys}
        attributeKeys={attributeKeys}
        computedKeys={computedKeys}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingKey} onOpenChange={() => setDeletingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campo calculado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la definición del campo calculado "{deletingKey}". 
              Los valores calculados se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
