import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAssetTypes } from '../api/asset-types.api';
import type { AssetTypeFilters } from '@shared/types/asset-type.types';

export function AssetTypesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AssetTypeFilters>({
    page: 1,
    perPage: 20,
    isActive: true,
  });

  const { data, isLoading } = useAssetTypes(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Activos</h1>
          <p className="text-muted-foreground">
            Gestiona los tipos de activos del sistema
          </p>
        </div>
        <Button onClick={() => navigate('/asset-types/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, nombre o descripción..."
              className="pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo Padre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((assetType) => (
                  <TableRow
                    key={assetType.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/asset-types/${assetType.id}`)}
                  >
                    <TableCell className="font-mono">{assetType.code}</TableCell>
                    <TableCell className="font-medium">{assetType.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {assetType.description || '-'}
                    </TableCell>
                    <TableCell>
                      {assetType.parentTypeId ? (
                        <Badge variant="outline">Tiene padre</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assetType.isActive ? 'default' : 'secondary'}>
                        {assetType.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/asset-types/${assetType.id}/edit`);
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {data?.meta && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {data.data.length} de {data.meta.total} tipos de activos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === data.meta.totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
