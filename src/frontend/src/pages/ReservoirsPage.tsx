import { useState } from 'react';
import { useReservoirs, useCreateReservoir, useUpdateReservoir, useDeleteReservoir } from '@/features/geology/api/reservoirs.api';
import { useFields } from '@/features/geology/api/fields.api';
import { Lithology, FluidType, type Reservoir, type CreateReservoirDTO } from '@/types/geology.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectOption } from '@/components/ui/select-legacy';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function ReservoirsPage() {
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservoir, setEditingReservoir] = useState<Reservoir | null>(null);
  const [formData, setFormData] = useState<CreateReservoirDTO>({
    field_id: '',
    name: '',
    formation: '',
    lithology: Lithology.SANDSTONE,
    depth_top_m: undefined,
    depth_bottom_m: undefined,
    thickness_m: undefined,
    porosity_percent: undefined,
    permeability_md: undefined,
    temperature_c: undefined,
    pressure_psi: undefined,
    fluid_type: FluidType.OIL,
    oil_api: undefined,
    gas_gravity: undefined,
    water_salinity_ppm: undefined
  });

  const { data, isLoading, error } = useReservoirs({ page, per_page: 10 });
  const { data: fieldsData } = useFields();
  const createMutation = useCreateReservoir();
  const updateMutation = useUpdateReservoir();
  const deleteMutation = useDeleteReservoir();

  const handleOpenDialog = (reservoir?: Reservoir) => {
    if (reservoir) {
      setEditingReservoir(reservoir);
      setFormData({
        field_id: reservoir.field_id,
        name: reservoir.name,
        formation: reservoir.formation,
        lithology: reservoir.lithology,
        depth_top_m: reservoir.depth_top_m,
        depth_bottom_m: reservoir.depth_bottom_m,
        thickness_m: reservoir.thickness_m,
        porosity_percent: reservoir.porosity_percent,
        permeability_md: reservoir.permeability_md,
        temperature_c: reservoir.temperature_c,
        pressure_psi: reservoir.pressure_psi,
        fluid_type: reservoir.fluid_type,
        oil_api: reservoir.oil_api,
        gas_gravity: reservoir.gas_gravity,
        water_salinity_ppm: reservoir.water_salinity_ppm
      });
    } else {
      setEditingReservoir(null);
      setFormData({
        field_id: '',
        name: '',
        formation: '',
        lithology: Lithology.SANDSTONE,
        depth_top_m: undefined,
        depth_bottom_m: undefined,
        thickness_m: undefined,
        porosity_percent: undefined,
        permeability_md: undefined,
        temperature_c: undefined,
        pressure_psi: undefined,
        fluid_type: FluidType.OIL,
        oil_api: undefined,
        gas_gravity: undefined,
        water_salinity_ppm: undefined
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReservoir) {
        await updateMutation.mutateAsync({ id: editingReservoir.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving reservoir:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este yacimiento?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting reservoir:', err);
      }
    }
  };

  const getLithologyLabel = (lithology: Lithology) => {
    const labels = {
      [Lithology.SANDSTONE]: 'Arenisca',
      [Lithology.LIMESTONE]: 'Caliza',
      [Lithology.DOLOMITE]: 'Dolomita',
      [Lithology.SHALE]: 'Lutita',
      [Lithology.CONGLOMERATE]: 'Conglomerado',
      [Lithology.MIXED]: 'Mixta'
    };
    return labels[lithology];
  };

  const getFluidTypeLabel = (fluidType?: FluidType) => {
    if (!fluidType) return '-';
    const labels = {
      [FluidType.OIL]: 'Petróleo',
      [FluidType.GAS]: 'Gas',
      [FluidType.CONDENSATE]: 'Condensado',
      [FluidType.WATER]: 'Agua',
      [FluidType.MIXED]: 'Mixto'
    };
    return labels[fluidType];
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">Error al cargar yacimientos</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yacimientos</h1>
        <Button onClick={() => handleOpenDialog()}>Nuevo Yacimiento</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Yacimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Formación</TableHead>
                <TableHead>Litología</TableHead>
                <TableHead>Fluido</TableHead>
                <TableHead>Profundidad (m)</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((reservoir) => (
                <TableRow key={reservoir.id}>
                  <TableCell className="font-medium">{reservoir.name}</TableCell>
                  <TableCell>{reservoir.field?.name || '-'}</TableCell>
                  <TableCell>{reservoir.formation}</TableCell>
                  <TableCell>
                    <Badge variant="info">{getLithologyLabel(reservoir.lithology)}</Badge>
                  </TableCell>
                  <TableCell>{getFluidTypeLabel(reservoir.fluid_type)}</TableCell>
                  <TableCell>
                    {reservoir.depth_top_m && reservoir.depth_bottom_m
                      ? `${reservoir.depth_top_m} - ${reservoir.depth_bottom_m}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(reservoir)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(reservoir.id)}>
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
                Mostrando {data.data.length} de {data.meta.total} yacimientos
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
            <DialogTitle>{editingReservoir ? 'Editar Yacimiento' : 'Nuevo Yacimiento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field_id">Campo *</Label>
                  <Select
                    id="field_id"
                    value={formData.field_id}
                    onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                    required
                  >
                    <SelectOption value="">Seleccionar campo</SelectOption>
                    {fieldsData?.data.map((field) => (
                      <SelectOption key={field.id} value={field.id}>
                        {field.name}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formation">Formación *</Label>
                  <Input
                    id="formation"
                    value={formData.formation}
                    onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lithology">Litología *</Label>
                  <Select
                    id="lithology"
                    value={formData.lithology}
                    onChange={(e) => setFormData({ ...formData, lithology: e.target.value as Lithology })}
                    required
                  >
                    <SelectOption value={Lithology.SANDSTONE}>Arenisca</SelectOption>
                    <SelectOption value={Lithology.LIMESTONE}>Caliza</SelectOption>
                    <SelectOption value={Lithology.DOLOMITE}>Dolomita</SelectOption>
                    <SelectOption value={Lithology.SHALE}>Lutita</SelectOption>
                    <SelectOption value={Lithology.CONGLOMERATE}>Conglomerado</SelectOption>
                    <SelectOption value={Lithology.MIXED}>Mixta</SelectOption>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="depth_top_m">Prof. Tope (m)</Label>
                  <Input
                    id="depth_top_m"
                    type="number"
                    value={formData.depth_top_m || ''}
                    onChange={(e) => setFormData({ ...formData, depth_top_m: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="depth_bottom_m">Prof. Base (m)</Label>
                  <Input
                    id="depth_bottom_m"
                    type="number"
                    value={formData.depth_bottom_m || ''}
                    onChange={(e) => setFormData({ ...formData, depth_bottom_m: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="thickness_m">Espesor (m)</Label>
                  <Input
                    id="thickness_m"
                    type="number"
                    value={formData.thickness_m || ''}
                    onChange={(e) => setFormData({ ...formData, thickness_m: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="porosity_percent">Porosidad (%)</Label>
                  <Input
                    id="porosity_percent"
                    type="number"
                    step="0.1"
                    value={formData.porosity_percent || ''}
                    onChange={(e) => setFormData({ ...formData, porosity_percent: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="permeability_md">Permeabilidad (mD)</Label>
                  <Input
                    id="permeability_md"
                    type="number"
                    step="0.1"
                    value={formData.permeability_md || ''}
                    onChange={(e) => setFormData({ ...formData, permeability_md: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="fluid_type">Tipo de Fluido</Label>
                  <Select
                    id="fluid_type"
                    value={formData.fluid_type}
                    onChange={(e) => setFormData({ ...formData, fluid_type: e.target.value as FluidType })}
                  >
                    <SelectOption value={FluidType.OIL}>Petróleo</SelectOption>
                    <SelectOption value={FluidType.GAS}>Gas</SelectOption>
                    <SelectOption value={FluidType.CONDENSATE}>Condensado</SelectOption>
                    <SelectOption value={FluidType.WATER}>Agua</SelectOption>
                    <SelectOption value={FluidType.MIXED}>Mixto</SelectOption>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature_c">Temperatura (°C)</Label>
                  <Input
                    id="temperature_c"
                    type="number"
                    step="0.1"
                    value={formData.temperature_c || ''}
                    onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="pressure_psi">Presión (psi)</Label>
                  <Input
                    id="pressure_psi"
                    type="number"
                    step="0.1"
                    value={formData.pressure_psi || ''}
                    onChange={(e) => setFormData({ ...formData, pressure_psi: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="oil_api">API Petróleo</Label>
                  <Input
                    id="oil_api"
                    type="number"
                    step="0.1"
                    value={formData.oil_api || ''}
                    onChange={(e) => setFormData({ ...formData, oil_api: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="gas_gravity">Gravedad Gas</Label>
                  <Input
                    id="gas_gravity"
                    type="number"
                    step="0.001"
                    value={formData.gas_gravity || ''}
                    onChange={(e) => setFormData({ ...formData, gas_gravity: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="water_salinity_ppm">Salinidad (ppm)</Label>
                  <Input
                    id="water_salinity_ppm"
                    type="number"
                    value={formData.water_salinity_ppm || ''}
                    onChange={(e) => setFormData({ ...formData, water_salinity_ppm: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingReservoir ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
