import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface AttributeEditorProps {
  attributes: Record<string, any>;
  onSave: (attributes: Record<string, any>, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

type AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'json';

export function AttributeEditor({ attributes, onSave, isLoading }: AttributeEditorProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<Record<string, any>>(attributes || {});
  const [reason, setReason] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<AttributeType>('string');

  const handleEdit = () => {
    setEditedAttributes({ ...attributes });
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditedAttributes({ ...attributes });
    setEditMode(false);
    setReason('');
  };

  const handleSave = async () => {
    try {
      await onSave(editedAttributes, reason || undefined);
      setEditMode(false);
      setReason('');
      toast.success('Atributos actualizados correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar atributos');
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedAttributes(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDelete = (key: string) => {
    const newAttrs = { ...editedAttributes };
    delete newAttrs[key];
    setEditedAttributes(newAttrs);
  };

  const handleAddAttribute = () => {
    if (!newKey.trim()) {
      toast.error('El nombre del atributo es requerido');
      return;
    }

    if (editedAttributes[newKey]) {
      toast.error('Ya existe un atributo con ese nombre');
      return;
    }

    let parsedValue: any = newValue;

    try {
      switch (newType) {
        case 'number':
          parsedValue = parseFloat(newValue);
          if (isNaN(parsedValue)) {
            toast.error('Valor numérico inválido');
            return;
          }
          break;
        case 'boolean':
          parsedValue = newValue.toLowerCase() === 'true';
          break;
        case 'json':
          parsedValue = JSON.parse(newValue);
          break;
        case 'date':
          parsedValue = newValue; // Keep as ISO string
          break;
        default:
          parsedValue = newValue;
      }
    } catch (error) {
      toast.error('Error al parsear el valor');
      return;
    }

    setEditedAttributes(prev => ({
      ...prev,
      [newKey]: parsedValue,
    }));

    setNewKey('');
    setNewValue('');
    setNewType('string');
    setShowAddDialog(false);
    toast.success('Atributo agregado');
  };

  const getValueType = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      // Check if it's a date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      return 'string';
    }
    if (typeof value === 'object') return 'json';
    return 'unknown';
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atributos Dinámicos</CardTitle>
            <CardDescription>
              Atributos personalizables del asset
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <Button onClick={handleEdit} size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editMode && (
          <div className="mb-4 space-y-2">
            <Label htmlFor="reason">Razón del cambio (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Describe por qué estás modificando estos atributos..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {Object.keys(editedAttributes).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(editedAttributes).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{key}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getValueType(value)}
                      </Badge>
                    </div>
                    {editMode ? (
                      <Textarea
                        value={formatValue(value)}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        className="mt-2 font-mono text-sm"
                        rows={typeof value === 'object' ? 4 : 1}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 font-mono whitespace-pre-wrap">
                        {formatValue(value)}
                      </p>
                    )}
                  </div>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(key)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin atributos definidos
          </p>
        )}

        {editMode && (
          <>
            <Button variant="outline" className="w-full mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Atributo
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Atributo</DialogTitle>
                <DialogDescription>
                  Define un nuevo atributo personalizado para este asset
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Nombre del Atributo</Label>
                  <Input
                    id="key"
                    placeholder="ej: reservoirPressure"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Dato</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as AttributeType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="boolean">Booleano (true/false)</SelectItem>
                      <SelectItem value="date">Fecha</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor</Label>
                  {newType === 'boolean' ? (
                    <Select value={newValue} onValueChange={setNewValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un valor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : newType === 'date' ? (
                    <Input
                      id="value"
                      type="date"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  ) : newType === 'json' ? (
                    <Textarea
                      id="value"
                      placeholder='{"key": "value"}'
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      rows={4}
                      className="font-mono"
                    />
                  ) : (
                    <Input
                      id="value"
                      type={newType === 'number' ? 'number' : 'text'}
                      placeholder={newType === 'number' ? '123.45' : 'Valor del atributo'}
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAttribute}>
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
