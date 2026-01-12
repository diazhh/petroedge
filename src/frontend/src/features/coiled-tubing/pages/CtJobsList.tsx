import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';
import { CtJobsTable, CtJobFilters, CtJobStats } from '../components';
import { useCtJobs, useDeleteCtJob } from '../api';
import type { CtJobsFilters } from '../types';
import { toast } from 'sonner';

export function CtJobsList() {
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CtJobsFilters>({});

  const { data, isLoading } = useCtJobs(filters, page, 10);
  const deleteJob = useDeleteCtJob();

  const handleFilterChange = (key: keyof CtJobsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm(t('jobs.delete_confirm'))) return;

    try {
      await deleteJob.mutateAsync(jobId);
      toast.success(t('jobs.delete_success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('jobs.title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('jobs.list_title')}</h1>
          <p className="text-muted-foreground">{t('jobs.title')}</p>
        </div>
        <CanDo permission="coiled-tubing:jobs:create">
          <Button onClick={() => navigate('/coiled-tubing/jobs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </CanDo>
      </div>

      {data && (
        <CtJobStats
          stats={{
            total: data.meta.total,
            planned: data.data.filter((j) => j.status === 'planned').length,
            in_progress: data.data.filter((j) => j.status === 'in_progress').length,
            completed: data.data.filter((j) => j.status === 'completed').length,
            cancelled: data.data.filter((j) => j.status === 'cancelled').length,
          }}
        />
      )}

      <CtJobFilters filters={filters} onFilterChange={handleFilterChange} />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <CtJobsTable
              jobs={data?.data || []}
              onEdit={(job) => navigate(`/coiled-tubing/jobs/${job.id}/edit`)}
              onDelete={(job) => handleDelete(job.id)}
            />
          )}
        </CardContent>
      </Card>

      {data && data.meta.total > 10 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.meta.total)} of{' '}
            {data.meta.total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('actions.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= data.meta.total}
            >
              {t('actions.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
