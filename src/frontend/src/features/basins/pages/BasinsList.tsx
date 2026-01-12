import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasins } from '@/features/geology/api/basins.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mountain, Plus, Search } from 'lucide-react';
import { Basin, BasinType } from '@/types/geology.types';

export function BasinsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useBasins({ page, per_page: 20 });

  const getBasinTypeLabel = (type: BasinType) => {
    const labels: Record<BasinType, string> = {
      [BasinType.FORELAND]: 'Antepaís',
      [BasinType.RIFT]: 'Rift',
      [BasinType.PASSIVE_MARGIN]: 'Margen Pasivo',
      [BasinType.INTRACRATONIC]: 'Intracratónico',
      [BasinType.FOREARC]: 'Antearco',
      [BasinType.SEDIMENTARY]: 'Sedimentaria',
      [BasinType.STRUCTURAL]: 'Estructural'
    };
    return labels[type] || type;
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
        <div className="text-destructive">Error al cargar cuencas</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Mountain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cuencas</h1>
        </div>
        <Button onClick={() => navigate('/basins/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cuenca
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cuencas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cuencas</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay cuencas registradas
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Región</TableHead>
                    <TableHead>Área (km²)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data
                    .filter((basin: Basin) =>
                      search
                        ? basin.name.toLowerCase().includes(search.toLowerCase()) ||
                          basin.country?.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((basin: Basin) => (
                      <TableRow
                        key={basin.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/basins/${basin.id}`)}
                      >
                        <TableCell className="font-medium">{basin.name}</TableCell>
                        <TableCell>
                          {basin.basinType ? (
                            <Badge variant="outline">{getBasinTypeLabel(basin.basinType)}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{basin.country || '-'}</TableCell>
                        <TableCell>{basin.region || '-'}</TableCell>
                        <TableCell>{basin.areaKm2 ? parseFloat(basin.areaKm2).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {data?.meta && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {data.data.length} de {data.meta.total} cuencas
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
