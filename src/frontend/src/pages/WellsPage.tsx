import { useState } from 'react';
import { useWells, useCreateWell, useUpdateWell, useDeleteWell } from '@/features/geology/api/wells.api';
import { useReservoirs } from '@/features/geology/api/reservoirs.api';
import { WellType, WellStatus, type Well, type Reservoir, type CreateWellDTO } from '@/types/geology.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select-legacy';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function WellsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWell, setEditingWell] = useState<Well | null>(null);
  const [formData, setFormData] = useState<CreateWellDTO>({
    reservoir_id: '',
    name: '',
    api_number: '',
    type: WellType.PRODUCER,
    status: WellStatus.PRODUCING,
    spud_date: '',
    completion_date: '',
    measured_depth_m: undefined,
    true_vertical_depth_m: undefined,
    latitude: undefined,
    longitude: undefined,
    surface_elevation_m: undefined
  });

  const { data, isLoading, error } = useWells({ page, per_page: 10 });
  const { data: reservoirsData } = useReservoirs();
  const createMutation = useCreateWell();
  const updateMutation = useUpdateWell();
  const deleteMutation = useDeleteWell();

  const handleOpenDialog = (well?: Well) => {
    if (well) {
      setEditingWell(well);
      setFormData({
        reservoir_id: well.reservoir_id || well.primaryReservoirId || '',
        name: well.name || well.wellName || '',
        api_number: well.api_number || well.apiNumber || '',
        type: well.type || well.wellType,
        status: well.status,
        spud_date: well.spud_date || well.spudDate || '',
        completion_date: well.completion_date || well.completionDate || '',
        measured_depth_m: well.measured_depth_m,
        true_vertical_depth_m: well.true_vertical_depth_m,
        latitude: well.latitude,
        longitude: well.longitude,
        surface_elevation_m: well.surface_elevation_m
      });
    } else {
      setEditingWell(null);
      setFormData({
        reservoir_id: '',
        name: '',
        api_number: '',
        type: WellType.PRODUCER,
        status: WellStatus.PRODUCING,
        spud_date: '',
        completion_date: '',
        measured_depth_m: undefined,
        true_vertical_depth_m: undefined,
        latitude: undefined,
        longitude: undefined,
        surface_elevation_m: undefined
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWell) {
        await updateMutation.mutateAsync({ id: editingWell.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving well:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este pozo?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting well:', err);
      }
    }
  };

  const getWellTypeLabel = (type: WellType) => {
    const labels = {
      [WellType.PRODUCER]: 'Productor',
      [WellType.INJECTOR]: 'Inyector',
      [WellType.OBSERVATION]: 'Observación',
      [WellType.DISPOSAL]: 'Disposición'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: WellStatus) => {
    const labels = {
      [WellStatus.PRODUCING]: 'Produciendo',
      [WellStatus.INJECTING]: 'Inyectando',
      [WellStatus.SHUT_IN]: 'Cerrado',
      [WellStatus.SUSPENDED]: 'Suspendido',
      [WellStatus.ABANDONED]: 'Abandonado',
      [WellStatus.DRILLING]: 'Perforando'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: WellStatus) => {
    const variants: Record<WellStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      [WellStatus.PRODUCING]: 'success',
      [WellStatus.INJECTING]: 'info',
      [WellStatus.SHUT_IN]: 'warning',
      [WellStatus.SUSPENDED]: 'warning',
      [WellStatus.ABANDONED]: 'danger',
      [WellStatus.DRILLING]: 'info'
    };
    return variants[status] || 'default';
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">Error al cargar pozos</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pozos</h1>
        <Button onClick={() => handleOpenDialog()}>Nuevo Pozo</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pozos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Yacimiento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>API</TableHead>
                <TableHead>Profundidad (m)</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((well: Well) => (
                <TableRow key={well.id}>
                  <TableCell className="font-medium">{well.name || well.wellName}</TableCell>
                  <TableCell>{well.reservoir?.name || well.reservoir?.reservoirName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="info">{getWellTypeLabel(well.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(well.status)}>
                      {getStatusLabel(well.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{well.api_number || well.apiNumber || '-'}</TableCell>
                  <TableCell>{well.measured_depth_m?.toLocaleString() || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(well)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(well.id)}>
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
                Mostrando {data.data.length} de {data.meta.total} pozos
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWell ? 'Editar Pozo' : 'Nuevo Pozo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservoir_id">Yacimiento *</Label>
                  <Select
                    id="reservoir_id"
                    value={formData.reservoir_id}
                    onChange={(e) => setFormData({ ...formData, reservoir_id: e.target.value })}
                    required
                  >
                    <SelectOption value="">Seleccionar yacimiento</SelectOption>
                    {reservoirsData?.data.map((reservoir: Reservoir) => (
                      <SelectOption key={reservoir.id} value={reservoir.id}>
                        {reservoir.name || reservoir.reservoirName}
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="api_number">Número API</Label>
                  <Input
                    id="api_number"
                    value={formData.api_number}
                    onChange={(e) => setFormData({ ...formData, api_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as WellType })}
                    required
                  >
                    <SelectOption value={WellType.PRODUCER}>Productor</SelectOption>
                    <SelectOption value={WellType.INJECTOR}>Inyector</SelectOption>
                    <SelectOption value={WellType.OBSERVATION}>Observación</SelectOption>
                    <SelectOption value={WellType.DISPOSAL}>Disposición</SelectOption>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as WellStatus })}
                    required
                  >
                    <SelectOption value={WellStatus.PRODUCING}>Produciendo</SelectOption>
                    <SelectOption value={WellStatus.INJECTING}>Inyectando</SelectOption>
                    <SelectOption value={WellStatus.SHUT_IN}>Cerrado</SelectOption>
                    <SelectOption value={WellStatus.SUSPENDED}>Suspendido</SelectOption>
                    <SelectOption value={WellStatus.ABANDONED}>Abandonado</SelectOption>
                    <SelectOption value={WellStatus.DRILLING}>Perforando</SelectOption>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spud_date">Fecha de Inicio</Label>
                  <Input
                    id="spud_date"
                    type="date"
                    value={formData.spud_date}
                    onChange={(e) => setFormData({ ...formData, spud_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="completion_date">Fecha de Completación</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="measured_depth_m">Prof. Medida (m)</Label>
                  <Input
                    id="measured_depth_m"
                    type="number"
                    step="0.1"
                    value={formData.measured_depth_m || ''}
                    onChange={(e) => setFormData({ ...formData, measured_depth_m: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="true_vertical_depth_m">Prof. Vertical (m)</Label>
                  <Input
                    id="true_vertical_depth_m"
                    type="number"
                    step="0.1"
                    value={formData.true_vertical_depth_m || ''}
                    onChange={(e) => setFormData({ ...formData, true_vertical_depth_m: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="surface_elevation_m">Elevación (m)</Label>
                  <Input
                    id="surface_elevation_m"
                    type="number"
                    step="0.1"
                    value={formData.surface_elevation_m || ''}
                    onChange={(e) => setFormData({ ...formData, surface_elevation_m: e.target.value ? Number(e.target.value) : undefined })}
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingWell ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
