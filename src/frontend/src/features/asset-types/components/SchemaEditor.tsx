import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMagnitudes } from '@/features/magnitudes/api/magnitudes.api';
import { useUnits } from '@/features/units/api/units.api';

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'json';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  magnitudeId?: string;
  unitId?: string;
  values?: string[];
  description?: string;
}

export interface AssetTypeSchema {
  [key: string]: SchemaField;
}

interface SchemaEditorProps {
  title: string;
  description: string;
  schema: AssetTypeSchema;
  onChange: (schema: AssetTypeSchema) => void;
}

export function SchemaEditor({ title, description, schema, onChange }: SchemaEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<{
    name: string;
    field: SchemaField;
  } | null>(null);

  const handleAddField = () => {
    setNewField({
      name: '',
      field: {
        type: 'string',
        required: false,
      },
    });
  };

  const handleSaveNewField = () => {
    if (!newField || !newField.name.trim()) return;

    const updatedSchema = {
      ...schema,
      [newField.name]: newField.field,
    };
    onChange(updatedSchema);
    setNewField(null);
  };

  const handleCancelNewField = () => {
    setNewField(null);
  };

  const handleDeleteField = (fieldName: string) => {
    const updatedSchema = { ...schema };
    delete updatedSchema[fieldName];
    onChange(updatedSchema);
  };

  const handleUpdateField = (fieldName: string, field: SchemaField) => {
    const updatedSchema = {
      ...schema,
      [fieldName]: field,
    };
    onChange(updatedSchema);
    setEditingField(null);
  };

  const fields = Object.entries(schema);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Campo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 && !newField ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay campos definidos. Haz clic en "Agregar Campo" para comenzar.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Requerido</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Min/Max</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map(([fieldName, field]) =>
                  editingField === fieldName ? (
                    <FieldEditor
                      key={fieldName}
                      fieldName={fieldName}
                      field={field}
                      onSave={(updatedField) => handleUpdateField(fieldName, updatedField)}
                      onCancel={() => setEditingField(null)}
                    />
                  ) : (
                    <TableRow key={fieldName}>
                      <TableCell className="font-mono font-medium">{fieldName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {field.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {field.required ? (
                          <span className="text-red-600 font-medium">Sí</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {field.magnitudeId && field.unitId ? (
                          <span className="text-xs">Configurado</span>
                        ) : field.magnitudeId ? (
                          <span className="text-xs">Solo magnitud</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {field.min !== undefined || field.max !== undefined
                          ? `${field.min ?? '∞'} - ${field.max ?? '∞'}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {field.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingField(fieldName)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(fieldName)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
                {newField && (
                  <FieldEditor
                    fieldName={newField.name}
                    field={newField.field}
                    isNew
                    onSave={(updatedField) => {
                      setNewField({ ...newField, field: updatedField });
                      handleSaveNewField();
                    }}
                    onCancel={handleCancelNewField}
                    onNameChange={(name) => setNewField({ ...newField, name })}
                  />
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FieldEditorProps {
  fieldName: string;
  field: SchemaField;
  isNew?: boolean;
  onSave: (field: SchemaField) => void;
  onCancel: () => void;
  onNameChange?: (name: string) => void;
}

function FieldEditor({ fieldName, field, isNew, onSave, onCancel, onNameChange }: FieldEditorProps) {
  const [editedField, setEditedField] = useState<SchemaField>(field);
  const [editedName, setEditedName] = useState(fieldName);
  
  const { data: magnitudes } = useMagnitudes({ isActive: true });
  const { data: units } = useUnits({ 
    magnitudeId: editedField.magnitudeId || undefined,
    isActive: true 
  });

  const handleSave = () => {
    onSave(editedField);
  };

  return (
    <TableRow className="bg-muted/50">
      <TableCell>
        {isNew ? (
          <Input
            value={editedName}
            onChange={(e) => {
              setEditedName(e.target.value);
              onNameChange?.(e.target.value);
            }}
            placeholder="nombre_campo"
            className="font-mono"
          />
        ) : (
          <span className="font-mono font-medium">{fieldName}</span>
        )}
      </TableCell>
      <TableCell>
        <Select
          value={editedField.type}
          onValueChange={(value: any) => {
            const newField = { ...editedField, type: value };
            // Limpiar magnitud y unidad si el tipo no es number
            if (value !== 'number') {
              newField.magnitudeId = undefined;
              newField.unitId = undefined;
              newField.min = undefined;
              newField.max = undefined;
            }
            setEditedField(newField);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">string</SelectItem>
            <SelectItem value="number">number</SelectItem>
            <SelectItem value="boolean">boolean</SelectItem>
            <SelectItem value="enum">enum</SelectItem>
            <SelectItem value="date">date</SelectItem>
            <SelectItem value="json">json</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={editedField.required}
          onChange={(e) =>
            setEditedField({ ...editedField, required: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300"
        />
      </TableCell>
      <TableCell>
        {editedField.type === 'number' ? (
          <div className="space-y-2 min-w-[180px]">
            <Select
              value={editedField.magnitudeId || 'none'}
              onValueChange={(value) => {
                setEditedField({
                  ...editedField,
                  magnitudeId: value === 'none' ? undefined : value,
                  unitId: undefined,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar magnitud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin magnitud</SelectItem>
                {magnitudes?.data?.map((magnitude: any) => (
                  <SelectItem key={magnitude.id} value={magnitude.id}>
                    {magnitude.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editedField.magnitudeId && (
              <Select
                value={editedField.unitId || 'none'}
                onValueChange={(value) =>
                  setEditedField({
                    ...editedField,
                    unitId: value === 'none' ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin unidad</SelectItem>
                  {units?.data?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell>
        {editedField.type === 'number' && (
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              value={editedField.min ?? ''}
              onChange={(e) =>
                setEditedField({
                  ...editedField,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Min"
              className="w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              value={editedField.max ?? ''}
              onChange={(e) =>
                setEditedField({
                  ...editedField,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Max"
              className="w-20"
            />
          </div>
        )}
      </TableCell>
      <TableCell>
        <Input
          value={editedField.description || ''}
          onChange={(e) =>
            setEditedField({ ...editedField, description: e.target.value || undefined })
          }
          placeholder="Descripción..."
          className="w-48"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
