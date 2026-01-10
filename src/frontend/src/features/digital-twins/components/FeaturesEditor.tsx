import { useState } from 'react';
import { Pencil, Save, X, Plus, Trash2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateThing } from '../api/digital-twins.api';
import type { DittoFeature } from '../types/digital-twins.types';

interface FeaturesEditorProps {
  thingId: string;
  features?: Record<string, DittoFeature>;
}

interface PropertyEdit {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

interface FeatureEdit {
  id: string;
  properties: PropertyEdit[];
  isNew?: boolean;
}

export function FeaturesEditor({ thingId, features = {} }: FeaturesEditorProps) {
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editedFeature, setEditedFeature] = useState<FeatureEdit | null>(null);
  const updateMutation = useUpdateThing(thingId);

  const startEditing = (featureId: string, feature: DittoFeature) => {
    const props = Object.entries(feature.properties || {}).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      type: (typeof value === 'object' ? 'json' : typeof value) as PropertyEdit['type'],
    }));
    setEditedFeature({ id: featureId, properties: props });
    setEditingFeatureId(featureId);
  };

  const cancelEditing = () => {
    setEditingFeatureId(null);
    setEditedFeature(null);
  };

  const addProperty = () => {
    if (!editedFeature) return;
    setEditedFeature({
      ...editedFeature,
      properties: [...editedFeature.properties, { key: '', value: '', type: 'string' }],
    });
  };

  const removeProperty = (index: number) => {
    if (!editedFeature) return;
    setEditedFeature({
      ...editedFeature,
      properties: editedFeature.properties.filter((_, i) => i !== index),
    });
  };

  const updateProperty = (index: number, field: keyof PropertyEdit, value: string) => {
    if (!editedFeature) return;
    const updated = [...editedFeature.properties];
    updated[index] = { ...updated[index], [field]: value };
    setEditedFeature({ ...editedFeature, properties: updated });
  };

  const parseValue = (value: string, type: PropertyEdit['type']): any => {
    if (!value) return null;
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  const saveChanges = async () => {
    if (!editedFeature) return;

    try {
      const props: Record<string, any> = {};
      editedFeature.properties.forEach((prop) => {
        if (prop.key) {
          props[prop.key] = parseValue(prop.value, prop.type);
        }
      });

      const updatedFeatures = {
        ...features,
        [editedFeature.id]: { properties: props },
      };

      await updateMutation.mutateAsync({ features: updatedFeatures });
      toast.success('Feature actualizada exitosamente');
      setEditingFeatureId(null);
      setEditedFeature(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar feature');
    }
  };

  if (Object.keys(features).length === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground p-12">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay features definidas</p>
          <p className="text-sm mt-2">Las features representan capacidades del Digital Twin</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(features).map(([featureId, feature]) => {
        const isEditing = editingFeatureId === featureId;

        if (isEditing && editedFeature) {
          return (
            <Card key={featureId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <CardTitle>{featureId}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={saveChanges} disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editedFeature.properties.map((prop, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Propiedad"
                      value={prop.key}
                      onChange={(e) => updateProperty(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={prop.type}
                      onValueChange={(value) => updateProperty(index, 'type', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Valor"
                      value={prop.value}
                      onChange={(e) => updateProperty(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProperty(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addProperty} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Propiedad
                </Button>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={featureId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>{featureId}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(featureId, feature)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
              <CardDescription>Propiedades dinámicas de la feature</CardDescription>
            </CardHeader>
            <CardContent>
              {feature.properties && Object.keys(feature.properties).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(feature.properties).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium font-mono">{key}</TableCell>
                        <TableCell>
                          {typeof value === 'object' ? (
                            <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-sm">{String(value)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeof value}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  No hay propiedades definidas
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
