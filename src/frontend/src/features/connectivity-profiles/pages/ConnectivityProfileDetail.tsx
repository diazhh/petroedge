import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, Power, PowerOff, Link2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConnectivityProfile, useDeleteConnectivityProfile, useUpdateConnectivityProfile } from '../api/connectivity-profiles.api';
import { useToast } from '@/hooks/use-toast';

export function ConnectivityProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useConnectivityProfile(id!);
  const deleteMutation = useDeleteConnectivityProfile();
  const updateMutation = useUpdateConnectivityProfile();

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
        Error al cargar Connectivity Profile: {error?.message || 'No encontrado'}
      </div>
    );
  }

  const profile = data.data;

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este Connectivity Profile?')) return;

    try {
      await deleteMutation.mutateAsync(profile.id);
      toast({
        title: 'Connectivity Profile eliminado',
        description: `${profile.name} ha sido eliminado exitosamente.`,
      });
      navigate('/connectivity-profiles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el Connectivity Profile',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        data: { isActive: !profile.isActive },
      });
      toast({
        title: profile.isActive ? 'Connectivity Profile desactivado' : 'Connectivity Profile activado',
        description: `${profile.name} ha sido ${profile.isActive ? 'desactivado' : 'activado'}.`,
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/connectivity-profiles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{profile.code}</p>
          </div>
          <Badge variant={profile.isActive ? 'default' : 'secondary'}>
            {profile.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {profile.isActive ? (
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
          <Button variant="outline" onClick={() => navigate(`/connectivity-profiles/${id}/edit`)}>
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
          <TabsTrigger value="mappings">Mapeos de Telemetría</TabsTrigger>
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
                  <p className="font-mono">{profile.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p>{profile.name}</p>
                </div>
                {profile.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                    <p>{profile.description}</p>
                  </div>
                )}
                {profile.deviceProfile && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Device Profile</label>
                    <p>{profile.deviceProfile.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{profile.deviceProfile.code}</p>
                  </div>
                )}
                {profile.assetTemplate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Asset Template</label>
                    <p>{profile.assetTemplate.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{profile.assetTemplate.code}</p>
                  </div>
                )}
                {profile.bindingsCount !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Device Bindings</label>
                    <p>{profile.bindingsCount}</p>
                  </div>
                )}
              </div>
              {profile.tags && profile.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.tags.map((tag) => (
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
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Mapeos de Telemetría ({profile.telemetryMappings?.length || 0})
              </CardTitle>
              <CardDescription>
                Mapeo entre claves de telemetría del dispositivo y propiedades del activo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!profile.telemetryMappings || profile.telemetryMappings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay mapeos de telemetría definidos
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.telemetryMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Device Key</p>
                          <p className="font-mono font-medium">{mapping.deviceKey}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Asset Component</p>
                          <p className="font-mono font-medium">{mapping.assetComponentCode}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Asset Property</p>
                          <p className="font-mono font-medium">{mapping.assetPropertyKey}</p>
                        </div>
                      </div>
                      {mapping.transform && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Transformación</p>
                          <Badge variant="outline">{mapping.transform.type}</Badge>
                          {mapping.transform.params && (
                            <pre className="text-xs mt-2 bg-muted p-2 rounded">
                              {JSON.stringify(mapping.transform.params, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                      {mapping.validation && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Validación</p>
                          <div className="flex gap-2 flex-wrap">
                            {mapping.validation.min !== undefined && (
                              <Badge variant="outline">Min: {mapping.validation.min}</Badge>
                            )}
                            {mapping.validation.max !== undefined && (
                              <Badge variant="outline">Max: {mapping.validation.max}</Badge>
                            )}
                            {mapping.validation.required && (
                              <Badge variant="outline">Requerido</Badge>
                            )}
                          </div>
                        </div>
                      )}
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
              {!profile.metadata || Object.keys(profile.metadata).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay metadata definida
                </p>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(profile.metadata, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
