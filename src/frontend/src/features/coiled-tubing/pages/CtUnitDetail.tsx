import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';
import { useCtUnit, useDeleteCtUnit } from '../api';
import { CT_UNIT_STATUS_COLORS } from '../constants';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function CtUnitDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();

  const { data: unit, isLoading } = useCtUnit(id!);
  const deleteUnit = useDeleteCtUnit();

  const handleDelete = async () => {
    if (!confirm(t('units.delete_confirm'))) return;

    try {
      await deleteUnit.mutateAsync(id!);
      toast.success(t('units.delete_success'));
      navigate('/coiled-tubing/units');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">{t('common.no_data')}</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('units.title'), href: '/coiled-tubing/units' },
    { label: unit.unit_number },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{unit.unit_number}</h1>
          <p className="text-muted-foreground">
            {unit.manufacturer} {unit.model}
          </p>
        </div>
        <div className="flex gap-2">
          <CanDo permission="coiled-tubing:units:update">
            <Button onClick={() => navigate(`/coiled-tubing/units/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Button>
          </CanDo>
          <CanDo permission="coiled-tubing:units:delete">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </CanDo>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">{t('units.tabs.info')}</TabsTrigger>
          <TabsTrigger value="specs">{t('units.tabs.specs')}</TabsTrigger>
          <TabsTrigger value="reels">{t('units.tabs.reels')}</TabsTrigger>
          <TabsTrigger value="jobs">{t('units.tabs.jobs')}</TabsTrigger>
          <TabsTrigger value="maintenance">{t('units.tabs.maintenance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.unit_number')}
                  </p>
                  <p className="text-lg">{unit.unit_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.status')}
                  </p>
                  <Badge className={CT_UNIT_STATUS_COLORS[unit.status]}>
                    {t(`units.status_${unit.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.manufacturer')}
                  </p>
                  <p className="text-lg">{unit.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.model')}
                  </p>
                  <p className="text-lg">{unit.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.year')}
                  </p>
                  <p className="text-lg">{unit.year}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.current_location')}
                  </p>
                  <p className="text-lg">{unit.current_location || '-'}</p>
                </div>
              </div>
              {unit.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.notes')}
                  </p>
                  <p className="text-sm">{unit.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.specs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.max_pressure')}
                  </p>
                  <p className="text-lg">{unit.max_pressure_psi.toLocaleString()} PSI</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.max_flow_rate')}
                  </p>
                  <p className="text-lg">{unit.max_flow_rate_bpm.toLocaleString()} BPM</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.power_rating')}
                  </p>
                  <p className="text-lg">{unit.power_rating_hp.toLocaleString()} HP</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.injector_capacity')}
                  </p>
                  <p className="text-lg">{unit.injector_capacity_lbs.toLocaleString()} LBS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.reels')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('common.no_data')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.jobs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('common.no_data')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.maintenance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.last_maintenance')}
                  </p>
                  <p className="text-lg">
                    {unit.last_maintenance_date
                      ? format(new Date(unit.last_maintenance_date), 'MMM dd, yyyy')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('units.next_maintenance')}
                  </p>
                  <p className="text-lg">
                    {unit.next_maintenance_date
                      ? format(new Date(unit.next_maintenance_date), 'MMM dd, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
