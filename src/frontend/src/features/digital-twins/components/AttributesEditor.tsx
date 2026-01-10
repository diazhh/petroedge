import { useState } from 'react';
import { Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateThingAttributes } from '../api/digital-twins.api';

interface AttributesEditorProps {
  thingId: string;
  attributes: Record<string, any>;
}

interface AttributeEdit {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isNew?: boolean;
}

export function AttributesEditor({ thingId, attributes }: AttributesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<AttributeEdit[]>([]);
  const updateMutation = useUpdateThingAttributes(thingId);

  const startEditing = () => {
    const attrs = Object.entries(attributes).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      type: (typeof value === 'object' ? 'json' : typeof value) as AttributeEdit['type'],
    }));
    setEditedAttributes(attrs);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedAttributes([]);
  };

  const addAttribute = () => {
    setEditedAttributes([...editedAttributes, { key: '', value: '', type: 'string', isNew: true }]);
  };

  const removeAttribute = (index: number) => {
    setEditedAttributes(editedAttributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof AttributeEdit, value: string) => {
    const updated = [...editedAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAttributes(updated);
  };

  const parseValue = (value: string, type: AttributeEdit['type']): any => {
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
    try {
      const attributesObj: Record<string, any> = {};
      editedAttributes.forEach((attr) => {
        if (attr.key) {
          attributesObj[attr.key] = parseValue(attr.value, attr.type);
        }
      });

      await updateMutation.mutateAsync(attributesObj);
      toast.success('Atributos actualizados exitosamente');
      setIsEditing(false);
      setEditedAttributes([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar atributos');
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Editar Atributos</CardTitle>
              <CardDescription>Modifica las propiedades estáticas del Digital Twin</CardDescription>
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
          {editedAttributes.map((attr, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Input
                placeholder="Clave"
                value={attr.key}
                onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Select
                value={attr.type}
                onValueChange={(value) => updateAttribute(index, 'type', value)}
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
                value={attr.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAttribute(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addAttribute} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Atributo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atributos</CardTitle>
            <CardDescription>Propiedades estáticas del Digital Twin</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {attributes && Object.keys(attributes).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(attributes).map(([key, value]) => (
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
            No hay atributos definidos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
