import { useState } from 'react';
import { useBasins, useCreateBasin, useUpdateBasin, useDeleteBasin } from '@/features/geology/api/basins.api';
import { BasinType, type Basin, type CreateBasinDTO } from '@/types/geology.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select-legacy';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function BasinsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBasin, setEditingBasin] = useState<Basin | null>(null);
  const [formData, setFormData] = useState<CreateBasinDTO>({
    name: '',
    type: BasinType.SEDIMENTARY,
    country: '',
    region: '',
    area_km2: undefined,
    description: '',
    geological_age: ''
  });

  const { data, isLoading, error } = useBasins({ page, per_page: 10 });
  const createMutation = useCreateBasin();
  const updateMutation = useUpdateBasin();
  const deleteMutation = useDeleteBasin();

  const handleOpenDialog = (basin?: Basin) => {
    if (basin) {
      setEditingBasin(basin);
      setFormData({
        name: basin.name,
        type: basin.type,
        country: basin.country,
        region: basin.region,
        area_km2: basin.area_km2,
        description: basin.description,
        geological_age: basin.geological_age
      });
    } else {
      setEditingBasin(null);
      setFormData({
        name: '',
        type: BasinType.SEDIMENTARY,
        country: '',
        region: '',
        area_km2: undefined,
        description: '',
        geological_age: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBasin) {
        await updateMutation.mutateAsync({ id: editingBasin.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving basin:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta cuenca?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting basin:', err);
      }
    }
  };

  const getBasinTypeLabel = (type: BasinType) => {
    const labels = {
      [BasinType.SEDIMENTARY]: 'Sedimentaria',
      [BasinType.STRUCTURAL]: 'Estructural',
      [BasinType.FORELAND]: 'Antepaís',
      [BasinType.RIFT]: 'Rift',
      [BasinType.PASSIVE_MARGIN]: 'Margen Pasivo'
    };
    return labels[type];
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">Error al cargar cuencas</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cuencas Petroleras</h1>
        <Button onClick={() => handleOpenDialog()}>Nueva Cuenca</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cuencas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Área (km²)</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((basin) => (
                <TableRow key={basin.id}>
                  <TableCell className="font-medium">{basin.name}</TableCell>
                  <TableCell>
                    <Badge variant="info">{getBasinTypeLabel(basin.type)}</Badge>
                  </TableCell>
                  <TableCell>{basin.country}</TableCell>
                  <TableCell>{basin.region || '-'}</TableCell>
                  <TableCell>{basin.area_km2?.toLocaleString() || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(basin)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(basin.id)}>
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
                Mostrando {data.data.length} de {data.meta.total} cuencas
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBasin ? 'Editar Cuenca' : 'Nueva Cuenca'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BasinType })}
                  required
                >
                  <SelectOption value={BasinType.SEDIMENTARY}>Sedimentaria</SelectOption>
                  <SelectOption value={BasinType.STRUCTURAL}>Estructural</SelectOption>
                  <SelectOption value={BasinType.FORELAND}>Antepaís</SelectOption>
                  <SelectOption value={BasinType.RIFT}>Rift</SelectOption>
                  <SelectOption value={BasinType.PASSIVE_MARGIN}>Margen Pasivo</SelectOption>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">País *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
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
                <Label htmlFor="geological_age">Edad Geológica</Label>
                <Input
                  id="geological_age"
                  value={formData.geological_age}
                  onChange={(e) => setFormData({ ...formData, geological_age: e.target.value })}
                />
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
                {editingBasin ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
