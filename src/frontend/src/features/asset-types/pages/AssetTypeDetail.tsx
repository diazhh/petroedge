import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssetType, useDeleteAssetType } from '../api/asset-types.api';
import { useToast } from '@/hooks/use-toast';

export function AssetTypeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: assetType, isLoading } = useAssetType(id!);
  const deleteAssetType = useDeleteAssetType();

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este tipo de activo?')) return;

    try {
      await deleteAssetType.mutateAsync(id!);
      toast({
        title: 'Tipo de activo eliminado',
        description: 'El tipo de activo ha sido eliminado correctamente',
      });
      navigate('/asset-types');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al eliminar el tipo de activo',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Cargando...</div>;
  }

  if (!assetType) {
    return <div className="container mx-auto py-6">Tipo de activo no encontrado</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/asset-types')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{assetType.name}</h1>
            <Badge variant={assetType.isActive ? 'default' : 'secondary'}>
              {assetType.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {assetType.isSystem && (
              <Badge variant="outline">Sistema</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Código: {assetType.code}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/asset-types/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {!assetType.isSystem && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="schema">Esquemas</TabsTrigger>
          <TabsTrigger value="hierarchy">Jerarquía</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código</p>
                  <p className="font-mono">{assetType.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p>{assetType.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                  <p>{assetType.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activos asociados</p>
                  <p className="text-2xl font-bold">{assetType.assetsCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipos hijos</p>
                  <p className="text-2xl font-bold">{assetType.childTypes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixed Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(assetType.fixedSchema, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attribute Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(assetType.attributeSchema, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Telemetry Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(assetType.telemetrySchema, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          {assetType.parentType && (
            <Card>
              <CardHeader>
                <CardTitle>Tipo Padre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assetType.parentType.name}</p>
                    <p className="text-sm text-muted-foreground">{assetType.parentType.code}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/asset-types/${assetType.parentType!.id}`)}
                  >
                    Ver detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {assetType.childTypes && assetType.childTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tipos Hijos ({assetType.childTypes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assetType.childTypes.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-muted-foreground">{child.code}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/asset-types/${child.id}`)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
