import { useState } from 'react';
import { useFields, useCreateField, useUpdateField, useDeleteField } from '@/features/geology/api/fields.api';
import { useBasins } from '@/features/geology/api/basins.api';
import { FieldStatus, type Field, type CreateFieldDTO } from '@/types/geology.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select-legacy';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function FieldsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [formData, setFormData] = useState<CreateFieldDTO>({
    basin_id: '',
    name: '',
    status: FieldStatus.EXPLORATION,
    discovery_date: '',
    area_km2: undefined,
    latitude: undefined,
    longitude: undefined,
    description: '',
    operator: ''
  });

  const { data, isLoading, error } = useFields({ page, per_page: 10 });
  const { data: basinsData } = useBasins();
  const createMutation = useCreateField();
  const updateMutation = useUpdateField();
  const deleteMutation = useDeleteField();

  const handleOpenDialog = (field?: Field) => {
    if (field) {
      setEditingField(field);
      setFormData({
        basin_id: field.basin_id,
        name: field.name,
        status: field.status,
        discovery_date: field.discovery_date,
        area_km2: field.area_km2,
        latitude: field.latitude,
        longitude: field.longitude,
        description: field.description,
        operator: field.operator
      });
    } else {
      setEditingField(null);
      setFormData({
        basin_id: '',
        name: '',
        status: FieldStatus.EXPLORATION,
        discovery_date: '',
        area_km2: undefined,
        latitude: undefined,
        longitude: undefined,
        description: '',
        operator: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingField) {
        await updateMutation.mutateAsync({ id: editingField.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving field:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este campo?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting field:', err);
      }
    }
  };

  const getStatusLabel = (status: FieldStatus) => {
    const labels = {
      [FieldStatus.EXPLORATION]: 'Exploración',
      [FieldStatus.DEVELOPMENT]: 'Desarrollo',
      [FieldStatus.PRODUCTION]: 'Producción',
      [FieldStatus.MATURE]: 'Maduro',
      [FieldStatus.DEPLETED]: 'Agotado',
      [FieldStatus.ABANDONED]: 'Abandonado'
    };
    return labels[status];
  };

  const getStatusVariant = (status: FieldStatus) => {
    const variants: Record<FieldStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      [FieldStatus.EXPLORATION]: 'info',
      [FieldStatus.DEVELOPMENT]: 'warning',
      [FieldStatus.PRODUCTION]: 'success',
      [FieldStatus.MATURE]: 'warning',
      [FieldStatus.DEPLETED]: 'danger',
      [FieldStatus.ABANDONED]: 'default'
    };
    return variants[status];
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">Error al cargar campos</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campos Petroleros</h1>
        <Button onClick={() => handleOpenDialog()}>Nuevo Campo</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cuenca</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Área (km²)</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>{field.basin?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(field.status)}>
                      {getStatusLabel(field.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{field.operator || '-'}</TableCell>
                  <TableCell>{field.area_km2?.toLocaleString() || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(field)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(field.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data?.meta && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando {data.data.length} de {data.meta.total} campos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.meta.total_pages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar Campo' : 'Nuevo Campo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="basin_id">Cuenca *</Label>
                <Select
                  id="basin_id"
                  value={formData.basin_id}
                  onChange={(e) => setFormData({ ...formData, basin_id: e.target.value })}
                  required
                >
                  <SelectOption value="">Seleccionar cuenca</SelectOption>
                  {basinsData?.data.map((basin) => (
                    <SelectOption key={basin.id} value={basin.id}>
                      {basin.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FieldStatus })}
                  required
                >
                  <SelectOption value={FieldStatus.EXPLORATION}>Exploración</SelectOption>
                  <SelectOption value={FieldStatus.DEVELOPMENT}>Desarrollo</SelectOption>
                  <SelectOption value={FieldStatus.PRODUCTION}>Producción</SelectOption>
                  <SelectOption value={FieldStatus.MATURE}>Maduro</SelectOption>
                  <SelectOption value={FieldStatus.DEPLETED}>Agotado</SelectOption>
                  <SelectOption value={FieldStatus.ABANDONED}>Abandonado</SelectOption>
                </Select>
              </div>
              <div>
                <Label htmlFor="operator">Operador</Label>
                <Input
                  id="operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area_km2">Área (km²)</Label>
                  <Input
                    id="area_km2"
                    type="number"
                    value={formData.area_km2 || ''}
                    onChange={(e) => setFormData({ ...formData, area_km2: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="discovery_date">Fecha de Descubrimiento</Label>
                  <Input
                    id="discovery_date"
                    type="date"
                    value={formData.discovery_date}
                    onChange={(e) => setFormData({ ...formData, discovery_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingField ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
