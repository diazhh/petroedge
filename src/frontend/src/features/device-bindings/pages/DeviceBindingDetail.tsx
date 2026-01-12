import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, Power, PowerOff, Link, Database, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceBinding, useDeleteDeviceBinding, useUpdateDeviceBinding } from '../api/device-bindings.api';
import { useToast } from '@/hooks/use-toast';

export function DeviceBindingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useDeviceBinding(id!);
  const deleteMutation = useDeleteDeviceBinding();
  const updateMutation = useUpdateDeviceBinding();

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
        Error al cargar Device Binding: {error?.message || 'No encontrado'}
      </div>
    );
  }

  const binding = data.data;

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este Device Binding?')) return;

    try {
      await deleteMutation.mutateAsync(binding.id);
      toast({
        title: 'Device Binding eliminado',
        description: 'El binding ha sido eliminado exitosamente.',
      });
      navigate('/device-bindings');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el Device Binding',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: binding.id,
        data: { isActive: !binding.isActive },
      });
      toast({
        title: binding.isActive ? 'Device Binding desactivado' : 'Device Binding activado',
        description: `El binding ha sido ${binding.isActive ? 'desactivado' : 'activado'}.`,
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/device-bindings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Device Binding</h1>
            <p className="text-muted-foreground font-mono text-sm">{binding.id}</p>
          </div>
          <Badge variant={binding.isActive ? 'default' : 'secondary'}>
            {binding.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {binding.isActive ? (
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
          <Button variant="outline" onClick={() => navigate(`/device-bindings/${id}/edit`)}>
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
          <TabsTrigger value="mappings">Mapeos Personalizados</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5" />
                  Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                {binding.dataSource ? (
                  <div className="space-y-2">
                    <p className="font-medium">{binding.dataSource.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Protocolo: {binding.dataSource.protocol}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No configurado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Link className="h-5 w-5" />
                  Connectivity Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {binding.connectivityProfile ? (
                  <div className="space-y-2">
                    <p className="font-medium">{binding.connectivityProfile.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {binding.connectivityProfile.code}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No configurado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-5 w-5" />
                  Digital Twin
                </CardTitle>
              </CardHeader>
              <CardContent>
                {binding.digitalTwinInstance ? (
                  <div className="space-y-2">
                    <p className="font-medium">{binding.digitalTwinInstance.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {binding.digitalTwinInstance.thingId}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No configurado</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="font-mono text-sm">{binding.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p>{binding.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="text-sm">{new Date(binding.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actualizado</label>
                  <p className="text-sm">{new Date(binding.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              {binding.tags && binding.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {binding.tags.map((tag) => (
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

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapeos Personalizados</CardTitle>
              <CardDescription>
                Sobrescrituras específicas de mapeo para este binding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!binding.customMappings || Object.keys(binding.customMappings).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay mapeos personalizados definidos
                </p>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(binding.customMappings, null, 2)}
                </pre>
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
              {!binding.metadata || Object.keys(binding.metadata).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay metadata definida
                </p>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(binding.metadata, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
