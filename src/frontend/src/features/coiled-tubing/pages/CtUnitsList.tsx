import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CanDo } from '@/components/common/PermissionGate';
import { CtUnitsTable } from '../components/CtUnitsTable';
import { useCtUnits, useDeleteCtUnit } from '../api';
import { CT_UNIT_STATUS_OPTIONS } from '../constants';
import type { CtUnitsFilters } from '../types';
import { toast } from 'sonner';

export function CtUnitsList() {
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CtUnitsFilters>({});

  const { data, isLoading } = useCtUnits(filters, page, 10);
  const deleteUnit = useDeleteCtUnit();

  const handleFilterChange = (key: keyof CtUnitsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm(t('units.delete_confirm'))) return;

    try {
      await deleteUnit.mutateAsync(unitId);
      toast.success(t('units.delete_success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('units.title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('units.list_title')}</h1>
          <p className="text-muted-foreground">{t('units.title')}</p>
        </div>
        <CanDo permission="coiled-tubing:units:create">
          <Button onClick={() => navigate('/coiled-tubing/units/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        </CanDo>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filters.title', 'Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder={t('filters.search')}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {CT_UNIT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`units.status_${option.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('filters.manufacturer')}
              value={filters.manufacturer || ''}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <CtUnitsTable
              units={data?.data || []}
              onEdit={(unit) => navigate(`/coiled-tubing/units/${unit.id}/edit`)}
              onDelete={(unit) => handleDelete(unit.id)}
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
