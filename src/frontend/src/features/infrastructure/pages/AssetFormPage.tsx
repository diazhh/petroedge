import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsset, useAssetTypes, useCreateAsset, useUpdateAsset } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Asset } from '../types';

export function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: assetData, isLoading: loadingAsset } = useAsset(id || '');
  const { data: assetTypesData, isLoading: loadingTypes } = useAssetTypes();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const assetTypes = assetTypesData?.data || [];
  const asset = assetData?.data;

  const [formData, setFormData] = useState<{
    assetTypeId: string;
    code: string;
    name: string;
    description: string;
    parentAssetId: string;
    latitude: string;
    longitude: string;
    elevationFt: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'FAILED';
    tags: string;
  }>({
    assetTypeId: '',
    code: '',
    name: '',
    description: '',
    parentAssetId: '',
    latitude: '',
    longitude: '',
    elevationFt: '',
    status: 'ACTIVE',
    tags: '',
  });

  useEffect(() => {
    if (asset && isEditMode) {
      setFormData({
        assetTypeId: asset.assetTypeId,
        code: asset.code,
        name: asset.name,
        description: asset.description || '',
        parentAssetId: asset.parentAssetId || '',
        latitude: asset.latitude?.toString() || '',
        longitude: asset.longitude?.toString() || '',
        elevationFt: asset.elevationFt?.toString() || '',
        status: asset.status,
        tags: asset.tags?.join(', ') || '',
      });
    }
  }, [asset, isEditMode]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetTypeId || !formData.code || !formData.name) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      const payload: Partial<Asset> = {
        assetTypeId: formData.assetTypeId,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        parentAssetId: formData.parentAssetId || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        elevationFt: formData.elevationFt ? parseFloat(formData.elevationFt) : undefined,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };

      if (isEditMode) {
        await updateAsset.mutateAsync({ id: id!, data: payload });
        toast.success('Asset actualizado correctamente');
      } else {
        await createAsset.mutateAsync(payload);
        toast.success('Asset creado correctamente');
      }

      navigate('/infrastructure/assets');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el asset');
    }
  };

  if (loadingAsset || loadingTypes) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/infrastructure/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Asset' : 'Crear Nuevo Asset'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Modifica los datos del asset' : 'Completa los datos para crear un nuevo asset'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Asset</CardTitle>
            <CardDescription>
              Los campos marcados con * son obligatorios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Asset */}
            <div className="space-y-2">
              <Label htmlFor="assetTypeId">Tipo de Asset *</Label>
              <Select
                value={formData.assetTypeId}
                onValueChange={(value) => handleChange('assetTypeId', value)}
                disabled={isEditMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de asset" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  El tipo de asset no se puede cambiar después de crear el asset
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="ej: WELL-001"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  required
                />
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="ej: Pozo Productor A1"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del asset..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                  <SelectItem value="RETIRED">Retirado</SelectItem>
                  <SelectItem value="FAILED">Fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ubicación Geográfica</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="ej: -12.0464"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="ej: -77.0428"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elevationFt">Elevación (ft)</Label>
                  <Input
                    id="elevationFt"
                    type="number"
                    step="any"
                    placeholder="ej: 1500"
                    value={formData.elevationFt}
                    onChange={(e) => handleChange('elevationFt', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Separados por comas: producción, prioritario, zona-norte"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separa múltiples tags con comas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/infrastructure/assets')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createAsset.isPending || updateAsset.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Actualizar Asset' : 'Crear Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
}
