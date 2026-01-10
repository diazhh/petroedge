import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReservoir, useDeleteReservoir } from '@/features/geology/api/reservoirs.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Layers } from 'lucide-react';
import { Lithology, FluidType } from '@/types/geology.types';
import { toast } from 'sonner';

export function ReservoirDetail() {
  const { t } = useTranslation('reservoirs');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useReservoir(id!);
  const deleteMutation = useDeleteReservoir();

  const getLithologyLabel = (lithology: Lithology) => {
    return t(`lithology.${lithology}`);
  };

  const getFluidTypeLabel = (fluidType?: FluidType) => {
    if (!fluidType) return '-';
    return t(`fluidType.${fluidType}`);
  };

  const handleDelete = async () => {
    if (!window.confirm(t('detail.deleteConfirm'))) return;

    try {
      await deleteMutation.mutateAsync(id!);
      toast.success(t('messages.deleteSuccess'));
      navigate('/reservoirs');
    } catch (err) {
      toast.error(t('messages.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{t('common:loading')}</div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">{t('messages.loadError')}</div>
      </div>
    );
  }

  const reservoir = data.data;

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
        <span>{reservoir.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{reservoir.name}</h1>
            <p className="text-muted-foreground">{reservoir.formation}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/reservoirs/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('detail.editButton')}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('detail.deleteButton')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t('detail.tabs.general')}</TabsTrigger>
          <TabsTrigger value="properties">{t('detail.tabs.properties')}</TabsTrigger>
          <TabsTrigger value="wells">{t('detail.tabs.wells')}</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.tabs.general')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.field')}
                  </label>
                  <p className="text-lg">{reservoir.field?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.formation')}
                  </label>
                  <p className="text-lg">{reservoir.formation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.lithology')}
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline">{getLithologyLabel(reservoir.lithology)}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.fluidType')}
                  </label>
                  <p className="text-lg">{getFluidTypeLabel(reservoir.fluid_type)}</p>
                </div>
              </div>

              <hr className="my-4" />

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.depthTop')}
                  </label>
                  <p className="text-lg">
                    {reservoir.depth_top_m ? `${reservoir.depth_top_m} ${t('units.meters')}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.depthBottom')}
                  </label>
                  <p className="text-lg">
                    {reservoir.depth_bottom_m
                      ? `${reservoir.depth_bottom_m} ${t('units.meters')}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.thickness')}
                  </label>
                  <p className="text-lg">
                    {reservoir.thickness_m ? `${reservoir.thickness_m} ${t('units.meters')}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.tabs.properties')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.porosity')}
                  </label>
                  <p className="text-lg">
                    {reservoir.porosity_percent
                      ? `${reservoir.porosity_percent} ${t('units.percent')}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.permeability')}
                  </label>
                  <p className="text-lg">
                    {reservoir.permeability_md
                      ? `${reservoir.permeability_md} ${t('units.millidarcies')}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.temperature')}
                  </label>
                  <p className="text-lg">
                    {reservoir.temperature_c
                      ? `${reservoir.temperature_c} ${t('units.celsius')}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.pressure')}
                  </label>
                  <p className="text-lg">
                    {reservoir.pressure_psi ? `${reservoir.pressure_psi} ${t('units.psi')}` : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.oilApi')}
                  </label>
                  <p className="text-lg">{reservoir.oil_api || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.gasGravity')}
                  </label>
                  <p className="text-lg">{reservoir.gas_gravity || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('fields.waterSalinity')}
                  </label>
                  <p className="text-lg">
                    {reservoir.water_salinity_ppm
                      ? `${reservoir.water_salinity_ppm} ${t('units.ppm')}`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wells Tab */}
        <TabsContent value="wells" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.tabs.wells')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                {t('common:comingSoon')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
