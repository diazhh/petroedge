import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CT_JOB_STATUS_OPTIONS, CT_JOB_TYPE_OPTIONS } from '../constants';
import type { CtJobsFilters } from '../types';

interface CtJobFiltersProps {
  filters: CtJobsFilters;
  onFilterChange: (key: keyof CtJobsFilters, value: string) => void;
}

export function CtJobFilters({ filters, onFilterChange }: CtJobFiltersProps) {
  const { t } = useTranslation('coiled-tubing');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('filters.title', 'Filters')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder={t('filters.search')}
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              {CT_JOB_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`jobs.status_${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.job_type || 'all'}
            onValueChange={(value) => onFilterChange('job_type', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('filters.job_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              {CT_JOB_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`jobs.type_${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder={t('filters.start_date')}
              value={filters.start_date || ''}
              onChange={(e) => onFilterChange('start_date', e.target.value)}
            />
            <Input
              type="date"
              placeholder={t('filters.end_date')}
              value={filters.end_date || ''}
              onChange={(e) => onFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
