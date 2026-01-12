import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';
import { useCtReel, useDeleteCtReel, useCtReelSections } from '../api';
import { CT_REEL_STATUS_COLORS, FATIGUE_COLORS, FATIGUE_THRESHOLDS } from '../constants';
import { CtReelSectionsTable, CtFatigueChart } from '../components';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

function getFatigueColor(fatigue: number): string {
  if (fatigue >= FATIGUE_THRESHOLDS.CRITICAL) return FATIGUE_COLORS.CRITICAL;
  if (fatigue >= FATIGUE_THRESHOLDS.HIGH) return FATIGUE_COLORS.HIGH;
  if (fatigue >= FATIGUE_THRESHOLDS.MEDIUM) return FATIGUE_COLORS.MEDIUM;
  return FATIGUE_COLORS.LOW;
}

export function CtReelDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();

  const { data: reel, isLoading } = useCtReel(id!);
  const { data: sections } = useCtReelSections(id!);
  const deleteReel = useDeleteCtReel();

  const handleDelete = async () => {
    if (!confirm(t('reels.delete_confirm'))) return;

    try {
      await deleteReel.mutateAsync(id!);
      toast.success(t('reels.delete_success'));
      navigate('/coiled-tubing/reels');
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

  if (!reel) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">{t('common.no_data')}</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('reels.title'), href: '/coiled-tubing/reels' },
    { label: reel.reel_number },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{reel.reel_number}</h1>
          <p className="text-muted-foreground">
            {reel.manufacturer} - {reel.material_grade}
          </p>
        </div>
        <div className="flex gap-2">
          <CanDo permission="coiled-tubing:reels:update">
            <Button onClick={() => navigate(`/coiled-tubing/reels/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Button>
          </CanDo>
          <CanDo permission="coiled-tubing:reels:delete">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </CanDo>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">{t('reels.tabs.info')}</TabsTrigger>
          <TabsTrigger value="specs">{t('reels.tabs.specs')}</TabsTrigger>
          <TabsTrigger value="fatigue">{t('reels.tabs.fatigue')}</TabsTrigger>
          <TabsTrigger value="cuts">{t('reels.tabs.cuts')}</TabsTrigger>
          <TabsTrigger value="jobs">{t('reels.tabs.jobs')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.reel_number')}
                  </p>
                  <p className="text-lg">{reel.reel_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.status')}
                  </p>
                  <Badge className={CT_REEL_STATUS_COLORS[reel.status]}>
                    {t(`reels.status_${reel.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.manufacturer')}
                  </p>
                  <p className="text-lg">{reel.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.material_grade')}
                  </p>
                  <p className="text-lg">{reel.material_grade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.total_runs')}
                  </p>
                  <p className="text-lg">{reel.total_runs}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.total_hours')}
                  </p>
                  <p className="text-lg">{reel.total_hours.toFixed(1)} hrs</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.fatigue_percentage')}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative h-3 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={cn("h-full transition-all", getFatigueColor(reel.fatigue_percentage))}
                        style={{ width: `${reel.fatigue_percentage}%` }}
                      />
                    </div>
                    <span className="text-lg font-semibold">
                      {reel.fatigue_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {reel.current_unit && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('reels.current_unit')}
                    </p>
                    <p className="text-lg">{reel.current_unit.unit_number}</p>
                  </div>
                )}
              </div>
              {reel.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.notes')}
                  </p>
                  <p className="text-sm">{reel.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.specs')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.outer_diameter')}
                  </p>
                  <p className="text-lg">{reel.outer_diameter_in} in</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.inner_diameter')}
                  </p>
                  <p className="text-lg">{reel.inner_diameter_in} in</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.wall_thickness')}
                  </p>
                  <p className="text-lg">{reel.wall_thickness_in} in</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.total_length')}
                  </p>
                  <p className="text-lg">{reel.total_length_ft.toLocaleString()} ft</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.yield_strength')}
                  </p>
                  <p className="text-lg">{reel.yield_strength_psi.toLocaleString()} PSI</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('reels.tensile_strength')}
                  </p>
                  <p className="text-lg">{reel.tensile_strength_psi.toLocaleString()} PSI</p>
                </div>
                {reel.manufacture_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('reels.manufacture_date')}
                    </p>
                    <p className="text-lg">
                      {format(new Date(reel.manufacture_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fatigue" className="space-y-4">
          {sections && sections.length > 0 ? (
            <>
              <CtFatigueChart sections={sections} />
              <CtReelSectionsTable sections={sections} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('reels.tabs.fatigue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('reels.no_sections')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.cuts')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sections && sections.length > 0 ? (
                <div className="space-y-2">
                  {sections.filter(s => s.is_cut).map((section) => (
                    <div key={section.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-medium">Section {section.section_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Cut on {section.cut_date ? format(new Date(section.cut_date), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      {section.cut_reason && (
                        <p className="text-sm">{section.cut_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No cuts recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.jobs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Jobs history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
