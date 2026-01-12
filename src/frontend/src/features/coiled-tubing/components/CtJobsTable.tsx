import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { CtJob } from '../types';
import { CT_JOB_STATUS_COLORS } from '../constants';
import { CanDo } from '@/components/common/PermissionGate';
import { format } from 'date-fns';

interface CtJobsTableProps {
  jobs: CtJob[];
  onEdit?: (job: CtJob) => void;
  onDelete?: (job: CtJob) => void;
}

export function CtJobsTable({ jobs, onEdit, onDelete }: CtJobsTableProps) {
  const { t } = useTranslation('coiled-tubing');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('jobs.job_number')}</TableHead>
            <TableHead>{t('jobs.job_type')}</TableHead>
            <TableHead>{t('jobs.status')}</TableHead>
            <TableHead>{t('jobs.well')}</TableHead>
            <TableHead>{t('jobs.unit')}</TableHead>
            <TableHead>{t('jobs.planned_start')}</TableHead>
            <TableHead className="text-right">{t('actions.view')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {t('common.no_data')}
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <Link
                    to={`/coiled-tubing/jobs/${job.id}`}
                    className="hover:underline"
                  >
                    {job.job_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {t(`jobs.type_${job.job_type}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={CT_JOB_STATUS_COLORS[job.status]}>
                    {t(`jobs.status_${job.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{job.well_id || '-'}</TableCell>
                <TableCell>
                  {job.unit ? (
                    <Link
                      to={`/coiled-tubing/units/${job.unit.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {job.unit.unit_number}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {job.planned_start_date
                    ? format(new Date(job.planned_start_date), 'MMM dd, yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/coiled-tubing/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <CanDo permission="coiled-tubing:jobs:update">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(job)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CanDo>
                    <CanDo permission="coiled-tubing:jobs:delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(job)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CanDo>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
