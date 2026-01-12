import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';
import { 
  useCtJob, 
  useDeleteCtJob, 
  useCtJobBhaComponents, 
  useCtJobOperations,
  useCtJobFluids 
} from '../api';
import { CT_JOB_STATUS_COLORS } from '../constants';
import { 
  CtBhaDesigner, 
  CtOperationsTimeline, 
  CtJobTicketViewer 
} from '../components';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function CtJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();

  const { data: job, isLoading } = useCtJob(id!);
  const { data: bhaComponents = [] } = useCtJobBhaComponents(id!);
  const { data: operations = [] } = useCtJobOperations(id!);
  const { data: fluids = [] } = useCtJobFluids(id!);
  const deleteJob = useDeleteCtJob();

  const handleDelete = async () => {
    if (!confirm(t('jobs.delete_confirm'))) return;

    try {
      await deleteJob.mutateAsync(id!);
      toast.success(t('jobs.delete_success'));
      navigate('/coiled-tubing/jobs');
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

  if (!job) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">{t('common.no_data')}</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('jobs.title'), href: '/coiled-tubing/jobs' },
    { label: job.job_number },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.job_number}</h1>
          <p className="text-muted-foreground">
            {t(`jobs.type_${job.job_type}`)}
          </p>
        </div>
        <div className="flex gap-2">
          {job.status === 'in_progress' && (
            <CanDo permission="coiled-tubing:jobs:read">
              <Button 
                variant="default"
                onClick={() => navigate(`/coiled-tubing/jobs/${id}/monitor`)}
              >
                <Activity className="mr-2 h-4 w-4" />
                {t('jobs.monitor')}
              </Button>
            </CanDo>
          )}
          <CanDo permission="coiled-tubing:jobs:update">
            <Button variant="outline" onClick={() => navigate(`/coiled-tubing/jobs/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Button>
          </CanDo>
          <CanDo permission="coiled-tubing:jobs:delete">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </CanDo>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">{t('jobs.tabs.info')}</TabsTrigger>
          <TabsTrigger value="bha">{t('jobs.tabs.bha')}</TabsTrigger>
          <TabsTrigger value="fluids">{t('jobs.tabs.fluids')}</TabsTrigger>
          <TabsTrigger value="operations">{t('jobs.tabs.operations')}</TabsTrigger>
          <TabsTrigger value="calculations">{t('jobs.tabs.calculations')}</TabsTrigger>
          <TabsTrigger value="alarms">{t('jobs.tabs.alarms')}</TabsTrigger>
          <TabsTrigger value="costs">{t('jobs.tabs.costs')}</TabsTrigger>
          <TabsTrigger value="ticket">{t('jobs.tabs.ticket')}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('jobs.job_number')}
                  </p>
                  <p className="text-lg">{job.job_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('jobs.status')}
                  </p>
                  <Badge className={CT_JOB_STATUS_COLORS[job.status]}>
                    {t(`jobs.status_${job.status}`)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('jobs.job_type')}
                  </p>
                  <Badge variant="outline">
                    {t(`jobs.type_${job.job_type}`)}
                  </Badge>
                </div>
                {job.unit && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('jobs.unit')}
                    </p>
                    <p className="text-lg">{job.unit.unit_number}</p>
                  </div>
                )}
                {job.reel && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('jobs.reel')}
                    </p>
                    <p className="text-lg">{job.reel.reel_number}</p>
                  </div>
                )}
                {job.planned_start_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('jobs.planned_start')}
                    </p>
                    <p className="text-lg">
                      {format(new Date(job.planned_start_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                {job.planned_end_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('jobs.planned_end')}
                    </p>
                    <p className="text-lg">
                      {format(new Date(job.planned_end_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                {job.target_depth_ft && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('jobs.target_depth')}
                    </p>
                    <p className="text-lg">{job.target_depth_ft.toLocaleString()} ft</p>
                  </div>
                )}
              </div>
              {job.objectives && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('jobs.objectives')}
                  </p>
                  <p className="text-sm">{job.objectives}</p>
                </div>
              )}
              {job.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('jobs.notes')}
                  </p>
                  <p className="text-sm">{job.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bha" className="space-y-4">
          <CtBhaDesigner 
            components={bhaComponents} 
            onAdd={() => {}} 
            onDelete={() => {}}
          />
        </TabsContent>

        <TabsContent value="fluids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.fluids')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fluids information will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <CtOperationsTimeline operations={operations} />
        </TabsContent>

        <TabsContent value="calculations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.calculations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calculations results will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alarms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.alarms')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Alarms history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.costs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cost breakdown will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket" className="space-y-4">
          <CtJobTicketViewer job={job} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
