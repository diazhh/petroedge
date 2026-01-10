import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWells } from '@/features/geology/api/wells.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Droplet, Plus, Search } from 'lucide-react';
import { WellType, WellStatus, type WellWithRelations } from '@/types/geology.types';

export function WellsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useWells({ page, per_page: 20 });

  const getWellTypeLabel = (type: WellType) => {
    const labels = {
      [WellType.PRODUCER]: 'Productor',
      [WellType.INJECTOR]: 'Inyector',
      [WellType.OBSERVATION]: 'Observación',
      [WellType.DISPOSAL]: 'Disposición',
    };
    return labels[type] || type;
  };

  const getWellStatusLabel = (status: WellStatus) => {
    const labels = {
      [WellStatus.PRODUCING]: 'Produciendo',
      [WellStatus.INJECTING]: 'Inyectando',
      [WellStatus.SHUT_IN]: 'Cerrado',
      [WellStatus.SUSPENDED]: 'Suspendido',
      [WellStatus.ABANDONED]: 'Abandonado',
      [WellStatus.DRILLING]: 'Perforando',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Error al cargar pozos</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Droplet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Pozos</h1>
        </div>
        <Button onClick={() => navigate('/wells/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pozo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pozos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pozos</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay pozos registrados
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Yacimiento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>API</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data
                    .filter((wellData: WellWithRelations) =>
                      search
                        ? wellData.well.wellName.toLowerCase().includes(search.toLowerCase()) ||
                          wellData.well.apiNumber?.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((wellData: WellWithRelations) => (
                      <TableRow
                        key={wellData.well.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/wells/${wellData.well.id}`)}
                      >
                        <TableCell className="font-medium">{wellData.well.wellName}</TableCell>
                        <TableCell>{wellData.reservoir?.reservoirName || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="info">{getWellTypeLabel(wellData.well.wellType)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getWellStatusLabel(wellData.well.status)}</Badge>
                        </TableCell>
                        <TableCell>{wellData.well.apiNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {data?.meta && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {data.data.length} de {data.meta.total} pozos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.meta.total_pages}
                    >
                      Siguiente
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
