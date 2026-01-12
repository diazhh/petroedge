import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, Power, PowerOff, Layers, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAssetTemplate, useDeleteAssetTemplate, useUpdateAssetTemplate } from '../api/asset-templates.api';
import { useToast } from '@/hooks/use-toast';

export function AssetTemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useAssetTemplate(id!);
  const deleteMutation = useDeleteAssetTemplate();
  const updateMutation = useUpdateAssetTemplate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center text-red-500 p-8">
        Error al cargar Asset Template: {error?.message || 'No encontrado'}
      </div>
    );
  }

  const template = data.data;

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este Asset Template?')) return;

    try {
      await deleteMutation.mutateAsync(template.id);
      toast({
        title: 'Asset Template eliminado',
        description: `${template.name} ha sido eliminado exitosamente.`,
      });
      navigate('/asset-templates');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el Asset Template',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: { isActive: !template.isActive },
      });
      toast({
        title: template.isActive ? 'Asset Template desactivado' : 'Asset Template activado',
        description: `${template.name} ha sido ${template.isActive ? 'desactivado' : 'activado'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/asset-templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{template.code}</p>
          </div>
          <Badge variant={template.isActive ? 'default' : 'secondary'}>
            {template.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {template.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activar
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/asset-templates/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="relationships">Relaciones</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código</label>
                  <p className="font-mono">{template.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p>{template.name}</p>
                </div>
                {template.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p>{template.description}</p>
                  </div>
                )}
                {template.rootAssetType && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Activo Raíz</label>
                    <p>{template.rootAssetType.name}</p>
                  </div>
                )}
                {template.instancesCount !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Instancias Creadas</label>
                    <p>{template.instancesCount}</p>
                  </div>
                )}
              </div>
              {template.tags && template.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Componentes ({template.components?.length || 0})
              </CardTitle>
              <CardDescription>
                Componentes que forman parte de este template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!template.components || template.components.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay componentes definidos
                </p>
              ) : (
                <div className="space-y-3">
                  {template.components.map((component, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{component.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{component.code}</p>
                        </div>
                        <Badge variant={component.required ? 'default' : 'secondary'}>
                          {component.required ? 'Requerido' : 'Opcional'}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Tipo: </span>
                        <span className="font-mono">{component.assetTypeCode}</span>
                      </div>
                      {component.description && (
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Relaciones ({template.relationships?.length || 0})
              </CardTitle>
              <CardDescription>
                Relaciones entre componentes del template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!template.relationships || template.relationships.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay relaciones definidas
                </p>
              ) : (
                <div className="space-y-3">
                  {template.relationships.map((rel, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm">{rel.from}</p>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline">{rel.type}</Badge>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-mono text-sm">{rel.to}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              {!template.metadata || Object.keys(template.metadata).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay metadata definida
                </p>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(template.metadata, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
