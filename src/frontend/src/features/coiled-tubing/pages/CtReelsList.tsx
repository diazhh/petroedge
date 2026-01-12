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
import { CtReelsTable } from '../components/CtReelsTable';
import { useCtReels, useDeleteCtReel } from '../api';
import { CT_REEL_STATUS_OPTIONS } from '../constants';
import type { CtReelsFilters } from '../types';
import { toast } from 'sonner';

export function CtReelsList() {
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CtReelsFilters>({});

  const { data, isLoading } = useCtReels(filters, page, 10);
  const deleteReel = useDeleteCtReel();

  const handleFilterChange = (key: keyof CtReelsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleDelete = async (reelId: string) => {
    if (!confirm(t('reels.delete_confirm'))) return;

    try {
      await deleteReel.mutateAsync(reelId);
      toast.success(t('reels.delete_success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('reels.title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('reels.list_title')}</h1>
          <p className="text-muted-foreground">{t('reels.title')}</p>
        </div>
        <CanDo permission="coiled-tubing:reels:create">
          <Button onClick={() => navigate('/coiled-tubing/reels/new')}>
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
          <div className="grid gap-4 md:grid-cols-4">
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
                {CT_REEL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`reels.status_${option.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t('filters.manufacturer')}
              value={filters.manufacturer || ''}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Fatigue %"
                value={filters.min_fatigue || ''}
                onChange={(e) => handleFilterChange('min_fatigue', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max Fatigue %"
                value={filters.max_fatigue || ''}
                onChange={(e) => handleFilterChange('max_fatigue', e.target.value)}
              />
            </div>
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
            <CtReelsTable
              reels={data?.data || []}
              onEdit={(reel) => navigate(`/coiled-tubing/reels/${reel.id}/edit`)}
              onDelete={(reel) => handleDelete(reel.id)}
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
