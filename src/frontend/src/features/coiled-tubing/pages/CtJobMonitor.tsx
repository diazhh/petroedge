import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useCtJob } from '../api';
import { CtRealtimeDashboard } from '../components';

export function CtJobMonitor() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');

  const { data: job, isLoading } = useCtJob(id!);

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
    { label: job.job_number, href: `/coiled-tubing/jobs/${job.id}` },
    { label: t('jobs.monitor') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('jobs.monitor')} - {job.job_number}
        </h1>
        <p className="text-muted-foreground">{job.job_type}</p>
      </div>

      <CtRealtimeDashboard jobId={job.id} />
    </div>
  );
}
