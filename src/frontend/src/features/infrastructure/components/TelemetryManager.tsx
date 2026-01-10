/**
 * TelemetryManager Component
 * Complete telemetry management interface
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import {
  useTelemetryDefinitions,
  useLatestTelemetry,
  useCreateTelemetryDefinition,
  useUpdateTelemetryDefinition,
  useDeleteTelemetryDefinition,
} from '../api/telemetry.api';
import { TelemetryDefinition } from '../types/data-types';
import { TelemetryDefinitionForm } from './TelemetryDefinitionForm';
import { TelemetryHistoryChart } from './TelemetryHistoryChart';
import { ValueCard } from './ValueCard';
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

interface TelemetryManagerProps {
  assetId: string;
  assetTypeId: string;
}

export function TelemetryManager({ assetId, assetTypeId }: TelemetryManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<TelemetryDefinition | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const { data: definitionsData, isLoading: loadingDefinitions } = useTelemetryDefinitions(assetTypeId);
  const { data: latestData, isLoading: loadingLatest } = useLatestTelemetry(assetId);
  
  const createDefinition = useCreateTelemetryDefinition();
  const updateDefinition = useUpdateTelemetryDefinition();
  const deleteDefinition = useDeleteTelemetryDefinition();

  const definitions = definitionsData?.data || {};
  const latestValues = latestData?.data || {};

  const handleCreate = async (definition: TelemetryDefinition) => {
    await createDefinition.mutateAsync({ assetTypeId, definition });
    setShowAddDialog(false);
  };

  const handleUpdate = async (definition: TelemetryDefinition) => {
    await updateDefinition.mutateAsync({
      assetTypeId,
      key: definition.key,
      definition,
    });
    setEditingDefinition(null);
  };

  const handleDelete = async () => {
    if (!deletingKey) return;
    await deleteDefinition.mutateAsync({ assetTypeId, key: deletingKey });
    setDeletingKey(null);
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

  const definitionsList = Object.values(definitions) as TelemetryDefinition[];
  const selectedDefinition = historyKey ? definitions[historyKey] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Telemetría</h3>
          <p className="text-sm text-muted-foreground">
            Definiciones de telemetría y valores en tiempo real
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Telemetría
        </Button>
      </div>

      {/* Definitions List */}
      {definitionsList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay telemetrías definidas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando definiciones de telemetría para este tipo de asset
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Telemetría
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {definitionsList.map((definition) => {
            const latestValue = latestValues[definition.key];
            
            return (
              <div key={definition.key} className="relative">
                <ValueCard
                  label={definition.name}
                  value={latestValue?.value}
                  type={definition.type}
                  unit={definition.unit}
                  quality={latestValue?.quality}
                  timestamp={latestValue?.time}
                  description={definition.description}
                  onClick={() => setHistoryKey(definition.key)}
                />
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistoryKey(definition.key);
                    }}
                    title="Ver histórico"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDefinition(definition);
                    }}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingKey(definition.key);
                    }}
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

      {/* Loading indicator for latest values */}
      {loadingLatest && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Actualizando valores...</span>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <TelemetryDefinitionForm
        open={showAddDialog || !!editingDefinition}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingDefinition(null);
          }
        }}
        onSubmit={editingDefinition ? handleUpdate : handleCreate}
        initialData={editingDefinition || undefined}
        isLoading={createDefinition.isPending || updateDefinition.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingKey} onOpenChange={() => setDeletingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar definición de telemetría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la definición de telemetría "{deletingKey}". 
              Los datos históricos se mantendrán pero no se podrán agregar nuevos valores.
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

      {/* History Chart */}
      {historyKey && selectedDefinition && (
        <TelemetryHistoryChart
          open={!!historyKey}
          onOpenChange={(open) => !open && setHistoryKey(null)}
          assetId={assetId}
          telemetryKey={historyKey}
          telemetryName={selectedDefinition.name}
          unit={selectedDefinition.unit}
        />
      )}
    </div>
  );
}
