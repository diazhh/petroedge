import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReservoirs } from '@/features/geology/api/reservoirs.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Search } from 'lucide-react';
import { Lithology, FluidType, type Reservoir } from '@/types/geology.types';

export function ReservoirsList() {
  const { t } = useTranslation('reservoirs');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useReservoirs({ page, per_page: 20 });

  const getLithologyLabel = (lithology: Lithology) => {
    return t(`lithology.${lithology}`);
  };

  const getFluidTypeLabel = (fluidType?: FluidType) => {
    if (!fluidType) return '-';
    return t(`fluidType.${fluidType}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{t('common:loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">{t('messages.loadError')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('list.title')}</h1>
        </div>
        <Button onClick={() => navigate('/reservoirs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('list.newButton')}
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('list.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('list.emptyState')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('fields.name')}</TableHead>
                    <TableHead>{t('fields.field')}</TableHead>
                    <TableHead>{t('fields.formation')}</TableHead>
                    <TableHead>{t('fields.lithology')}</TableHead>
                    <TableHead>{t('fields.fluidType')}</TableHead>
                    <TableHead>{t('fields.depthTop')} ({t('units.feet')})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data
                    .filter((reservoir: Reservoir) =>
                      search
                        ? reservoir.reservoirName.toLowerCase().includes(search.toLowerCase()) ||
                          reservoir.formationName.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((reservoir: Reservoir) => (
                      <TableRow
                        key={reservoir.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/reservoirs/${reservoir.id}`)}
                      >
                        <TableCell className="font-medium">{reservoir.reservoirName}</TableCell>
                        <TableCell>{reservoir.field?.fieldName || '-'}</TableCell>
                        <TableCell>{reservoir.formationName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getLithologyLabel(reservoir.lithology)}</Badge>
                        </TableCell>
                        <TableCell>{getFluidTypeLabel(reservoir.fluidType)}</TableCell>
                        <TableCell>
                          {reservoir.topDepthTvdFt ? `${parseFloat(reservoir.topDepthTvdFt).toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.meta && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {t('common:pagination.showing', {
                      count: data.data.length,
                      total: data.meta.total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('common:pagination.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.meta.total_pages}
                    >
                      {t('common:pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
