import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useAssetTypes, useDeleteAsset } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function AssetsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>();
  
  const { data: assetTypesData, isLoading: loadingTypes } = useAssetTypes();
  const { data: assetsData, isLoading: loadingAssets } = useAssets(page, 20, selectedTypeId);
  const deleteAsset = useDeleteAsset();

  const assetTypes = assetTypesData?.data || [];
  const assets = assetsData?.data || [];
  const meta = assetsData?.meta;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el asset "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await deleteAsset.mutateAsync(id);
      toast.success('Asset eliminado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el asset');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gemelos Digitales - Assets</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de activos digitales y tipos de activos
          </p>
        </div>
        <Button onClick={() => navigate('/infrastructure/assets/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Asset
        </Button>
      </div>

      {/* Asset Types Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Activos</CardTitle>
          <CardDescription>Filtrar por tipo de activo</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTypes ? (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedTypeId ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTypeId(undefined)}
              >
                Todos
              </Button>
              {assetTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedTypeId === type.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTypeId(type.id)}
                >
                  {type.name} ({type.code})
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            {meta ? `${meta.total} assets encontrados` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAssets ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron assets
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{asset.name}</h3>
                        <Badge variant="outline">{asset.code}</Badge>
                        <Badge
                          variant={
                            asset.status === 'ACTIVE'
                              ? 'default'
                              : asset.status === 'MAINTENANCE'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {asset.status}
                        </Badge>
                      </div>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground">
                          {asset.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {asset.latitude && asset.longitude && (
                          <span>
                            📍 {typeof asset.latitude === 'number' ? asset.latitude.toFixed(4) : asset.latitude}, {typeof asset.longitude === 'number' ? asset.longitude.toFixed(4) : asset.longitude}
                          </span>
                        )}
                        {asset.tags && asset.tags.length > 0 && (
                          <span>🏷️ {asset.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/infrastructure/assets/${asset.id}`)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/infrastructure/assets/${asset.id}/edit`)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(asset.id, asset.name)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total > meta.perPage && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {Math.ceil(meta.total / meta.perPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(meta.total / meta.perPage)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
