import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBasin, useCreateBasin, useUpdateBasin } from '@/features/geology/api/basins.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { BasinType } from '@/types/geology.types';
import { toast } from 'sonner';

const basinSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  type: z.nativeEnum(BasinType),
  country: z.string().min(1, 'País es requerido'),
  region: z.string().optional(),
  area_km2: z.number().min(0).optional(),
  description: z.string().optional(),
  geological_age: z.string().optional(),
});

type BasinFormData = z.infer<typeof basinSchema>;

export function BasinForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: basinData, isLoading: isLoadingBasin } = useBasin(isEditing ? id! : '');
  const createMutation = useCreateBasin();
  const updateMutation = useUpdateBasin();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BasinFormData>({
    resolver: zodResolver(basinSchema),
    defaultValues: {
      type: BasinType.SEDIMENTARY,
    },
  });

  useEffect(() => {
    if (isEditing && basinData?.data) {
      const basin = basinData.data;
      setValue('name', basin.name);
      setValue('type', basin.type);
      setValue('country', basin.country);
      setValue('region', basin.region);
      setValue('area_km2', basin.area_km2);
      setValue('description', basin.description);
      setValue('geological_age', basin.geological_age);
    }
  }, [isEditing, basinData, setValue]);

  const onSubmit = async (data: BasinFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data });
        toast.success('Cuenca actualizada exitosamente');
        navigate(`/basins/${id}`);
      } else {
        const result = await createMutation.mutateAsync(data);
        toast.success('Cuenca creada exitosamente');
        navigate(`/basins/${result.data.id}`);
      }
    } catch (err) {
      toast.error(isEditing ? 'Error al actualizar la cuenca' : 'Error al crear la cuenca');
    }
  };

  if (isEditing && isLoadingBasin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/basins')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Cuencas
        </Button>
        <span>/</span>
        <span>{isEditing ? 'Editar Cuenca' : 'Nueva Cuenca'}</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{isEditing ? 'Editar Cuenca' : 'Nueva Cuenca'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Select value={watch('type')} onValueChange={(value) => setValue('type', value as BasinType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BasinType.SEDIMENTARY}>Sedimentaria</SelectItem>
                    <SelectItem value={BasinType.STRUCTURAL}>Estructural</SelectItem>
                    <SelectItem value={BasinType.FORELAND}>Antepaís</SelectItem>
                    <SelectItem value={BasinType.RIFT}>Rift</SelectItem>
                    <SelectItem value={BasinType.PASSIVE_MARGIN}>Margen Pasivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">
                  País <span className="text-destructive">*</span>
                </Label>
                <Input id="country" {...register('country')} />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input id="region" {...register('region')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_km2">Área (km²)</Label>
              <Input id="area_km2" type="number" step="0.01" {...register('area_km2', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geological_age">Edad Geológica</Label>
              <Input id="geological_age" {...register('geological_age')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" {...register('description')} rows={4} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(isEditing ? `/basins/${id}` : '/basins')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
