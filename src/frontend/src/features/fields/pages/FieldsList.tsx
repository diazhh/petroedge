import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFields } from '@/features/geology/api/fields.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Search } from 'lucide-react';
import { FieldStatus } from '@/types/geology.types';

export function FieldsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useFields({ page, per_page: 20 });

  const getFieldStatusLabel = (status: FieldStatus) => {
    const labels = {
      [FieldStatus.PRODUCING]: 'Producción',
      [FieldStatus.DEVELOPING]: 'Desarrollo',
      [FieldStatus.ABANDONED]: 'Abandonado',
      [FieldStatus.EXPLORATION]: 'Exploración',
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
        <div className="text-destructive">Error al cargar campos</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Campos</h1>
        </div>
        <Button onClick={() => navigate('/fields/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Campo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Campos</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay campos registrados
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenca</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Área (km²)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data
                    .filter((field) =>
                      search
                        ? field.fieldName.toLowerCase().includes(search.toLowerCase()) ||
                          field.operator?.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((field) => (
                      <TableRow
                        key={field.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/fields/${field.id}`)}
                      >
                        <TableCell className="font-medium">{field.fieldName}</TableCell>
                        <TableCell>{field.basin?.name || '-'}</TableCell>
                        <TableCell>
                          {field.status ? (
                            <Badge variant="outline">{getFieldStatusLabel(field.status as FieldStatus)}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{field.operator || '-'}</TableCell>
                        <TableCell>{field.areaAcres ? parseFloat(field.areaAcres).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {data?.meta && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {data.data.length} de {data.meta.total} campos
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
