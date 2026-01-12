import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useCtJob, useCreateCtJob, useUpdateCtJob } from '../api';
import { ctJobSchema } from '../schemas';
import { CT_JOB_STATUS_OPTIONS, CT_JOB_TYPE_OPTIONS } from '../constants';
import type { CtJobFormData } from '../types';
import { toast } from 'sonner';

export function CtJobForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const isEdit = id !== 'new';

  const { data: job, isLoading } = useCtJob(isEdit ? id! : '');
  const createJob = useCreateCtJob();
  const updateJob = useUpdateCtJob();

  const form = useForm<CtJobFormData>({
    resolver: zodResolver(ctJobSchema),
    defaultValues: {
      job_number: '',
      job_type: 'cleanout',
      status: 'planned',
      objectives: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (job) {
      form.reset({
        job_number: job.job_number,
        job_type: job.job_type,
        status: job.status,
        well_id: job.well_id,
        field_id: job.field_id,
        unit_id: job.unit_id,
        reel_id: job.reel_id,
        planned_start_date: job.planned_start_date,
        planned_end_date: job.planned_end_date,
        target_depth_ft: job.target_depth_ft,
        objectives: job.objectives || '',
        notes: job.notes || '',
      });
    }
  }, [job, form]);

  const onSubmit = async (data: CtJobFormData) => {
    try {
      if (isEdit) {
        await updateJob.mutateAsync({ id: id!, data });
        toast.success(t('jobs.update_success'));
      } else {
        await createJob.mutateAsync(data);
        toast.success(t('jobs.create_success'));
      }
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

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('jobs.title'), href: '/coiled-tubing/jobs' },
    { label: isEdit ? t('jobs.edit_title') : t('jobs.create_title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? t('jobs.edit_title') : t('jobs.create_title')}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('jobs.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="job_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.job_number')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.job_type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CT_JOB_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`jobs.type_${option.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CT_JOB_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`jobs.status_${option.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_depth_ft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.target_depth')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="planned_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.planned_start')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="planned_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('jobs.planned_end')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('jobs.objectives')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('jobs.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/coiled-tubing/jobs')}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={createJob.isPending || updateJob.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
