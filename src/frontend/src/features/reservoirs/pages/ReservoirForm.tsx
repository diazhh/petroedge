import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useReservoir,
  useCreateReservoir,
  useUpdateReservoir,
} from '@/features/geology/api/reservoirs.api';
import { useFields } from '@/features/geology/api/fields.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { Lithology, FluidType } from '@/types/geology.types';
import { toast } from 'sonner';

const reservoirSchema = z.object({
  field_id: z.string().min(1, 'Field is required'),
  name: z.string().min(1, 'Name is required'),
  formation: z.string().min(1, 'Formation is required'),
  lithology: z.nativeEnum(Lithology),
  depth_top_m: z.number().optional(),
  depth_bottom_m: z.number().optional(),
  thickness_m: z.number().optional(),
  porosity_percent: z.number().min(0).max(100).optional(),
  permeability_md: z.number().min(0).optional(),
  temperature_c: z.number().optional(),
  pressure_psi: z.number().min(0).optional(),
  fluid_type: z.nativeEnum(FluidType).optional(),
  oil_api: z.number().min(0).optional(),
  gas_gravity: z.number().min(0).optional(),
  water_salinity_ppm: z.number().min(0).optional(),
});

type ReservoirFormData = z.infer<typeof reservoirSchema>;

export function ReservoirForm() {
  const { t } = useTranslation('reservoirs');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: reservoirData, isLoading: isLoadingReservoir } = useReservoir(
    isEditing ? id! : ''
  );
  const { data: fieldsData } = useFields();
  const createMutation = useCreateReservoir();
  const updateMutation = useUpdateReservoir();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReservoirFormData>({
    resolver: zodResolver(reservoirSchema),
    defaultValues: {
      lithology: Lithology.SANDSTONE,
      fluid_type: FluidType.OIL,
    },
  });

  useEffect(() => {
    if (isEditing && reservoirData?.data) {
      const reservoir = reservoirData.data;
      setValue('field_id', reservoir.field_id);
      setValue('name', reservoir.name);
      setValue('formation', reservoir.formation);
      setValue('lithology', reservoir.lithology);
      setValue('depth_top_m', reservoir.depth_top_m);
      setValue('depth_bottom_m', reservoir.depth_bottom_m);
      setValue('thickness_m', reservoir.thickness_m);
      setValue('porosity_percent', reservoir.porosity_percent);
      setValue('permeability_md', reservoir.permeability_md);
      setValue('temperature_c', reservoir.temperature_c);
      setValue('pressure_psi', reservoir.pressure_psi);
      setValue('fluid_type', reservoir.fluid_type);
      setValue('oil_api', reservoir.oil_api);
      setValue('gas_gravity', reservoir.gas_gravity);
      setValue('water_salinity_ppm', reservoir.water_salinity_ppm);
    }
  }, [isEditing, reservoirData, setValue]);

  const onSubmit = async (data: ReservoirFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: id!, data });
        toast.success(t('messages.updateSuccess'));
        navigate(`/reservoirs/${id}`);
      } else {
        const result = await createMutation.mutateAsync(data);
        toast.success(t('messages.createSuccess'));
        navigate(`/reservoirs/${result.data.id}`);
      }
    } catch (err) {
      toast.error(isEditing ? t('messages.updateError') : t('messages.createError'));
    }
  };

  if (isEditing && isLoadingReservoir) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reservoirs')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('list.title')}
        </Button>
        <span>/</span>
        <span>{isEditing ? t('form.editTitle') : t('form.createTitle')}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isEditing ? t('form.editTitle') : t('form.createTitle')}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.tabs.general')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_id">
                  {t('fields.field')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('field_id')}
                  onValueChange={(value) => setValue('field_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('list.filters.field')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldsData?.data.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.field_id && (
                  <p className="text-sm text-destructive">{errors.field_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('fields.name')} <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="formation">
                  {t('fields.formation')} <span className="text-destructive">*</span>
                </Label>
                <Input id="formation" {...register('formation')} />
                {errors.formation && (
                  <p className="text-sm text-destructive">{errors.formation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lithology">
                  {t('fields.lithology')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('lithology')}
                  onValueChange={(value) => setValue('lithology', value as Lithology)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Lithology).map((lithology) => (
                      <SelectItem key={lithology} value={lithology}>
                        {t(`lithology.${lithology}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Depth Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depth_top_m">
                  {t('fields.depthTop')} ({t('units.meters')})
                </Label>
                <Input
                  id="depth_top_m"
                  type="number"
                  step="0.1"
                  {...register('depth_top_m', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depth_bottom_m">
                  {t('fields.depthBottom')} ({t('units.meters')})
                </Label>
                <Input
                  id="depth_bottom_m"
                  type="number"
                  step="0.1"
                  {...register('depth_bottom_m', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thickness_m">
                  {t('fields.thickness')} ({t('units.meters')})
                </Label>
                <Input
                  id="thickness_m"
                  type="number"
                  step="0.1"
                  {...register('thickness_m', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Reservoir Properties */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="porosity_percent">
                  {t('fields.porosity')} ({t('units.percent')})
                </Label>
                <Input
                  id="porosity_percent"
                  type="number"
                  step="0.1"
                  {...register('porosity_percent', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permeability_md">
                  {t('fields.permeability')} ({t('units.millidarcies')})
                </Label>
                <Input
                  id="permeability_md"
                  type="number"
                  step="0.1"
                  {...register('permeability_md', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fluid_type">{t('fields.fluidType')}</Label>
                <Select
                  value={watch('fluid_type')}
                  onValueChange={(value) => setValue('fluid_type', value as FluidType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FluidType).map((fluidType) => (
                      <SelectItem key={fluidType} value={fluidType}>
                        {t(`fluidType.${fluidType}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature_c">
                  {t('fields.temperature')} ({t('units.celsius')})
                </Label>
                <Input
                  id="temperature_c"
                  type="number"
                  step="0.1"
                  {...register('temperature_c', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pressure_psi">
                  {t('fields.pressure')} ({t('units.psi')})
                </Label>
                <Input
                  id="pressure_psi"
                  type="number"
                  step="0.1"
                  {...register('pressure_psi', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Fluid Properties */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oil_api">{t('fields.oilApi')}</Label>
                <Input
                  id="oil_api"
                  type="number"
                  step="0.1"
                  {...register('oil_api', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gas_gravity">{t('fields.gasGravity')}</Label>
                <Input
                  id="gas_gravity"
                  type="number"
                  step="0.001"
                  {...register('gas_gravity', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="water_salinity_ppm">
                  {t('fields.waterSalinity')} ({t('units.ppm')})
                </Label>
                <Input
                  id="water_salinity_ppm"
                  type="number"
                  {...register('water_salinity_ppm', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEditing ? `/reservoirs/${id}` : '/reservoirs')}
          >
            {t('form.cancelButton')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t('form.savingButton') : t('form.saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
