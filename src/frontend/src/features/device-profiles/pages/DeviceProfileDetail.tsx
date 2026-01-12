import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceProfile, useDeleteDeviceProfile, useUpdateDeviceProfile } from '../api/device-profiles.api';
import { useToast } from '@/hooks/use-toast';

export function DeviceProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, isLoading, error } = useDeviceProfile(id!);
  const deleteMutation = useDeleteDeviceProfile();
  const updateMutation = useUpdateDeviceProfile();

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
        Error al cargar Device Profile: {error?.message || 'No encontrado'}
      </div>
    );
  }

  const profile = data.data;

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar este Device Profile?')) return;

    try {
      await deleteMutation.mutateAsync(profile.id);
      toast({
        title: 'Device Profile eliminado',
        description: `${profile.name} ha sido eliminado exitosamente.`,
      });
      navigate('/device-profiles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el Device Profile',
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
        title: profile.isActive ? 'Device Profile desactivado' : 'Device Profile activado',
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/device-profiles')}>
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
          <Button variant="outline" onClick={() => navigate(`/device-profiles/${id}/edit`)}>
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
          <TabsTrigger value="telemetry">Telemetría</TabsTrigger>
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tipo de Transporte
                  </label>
                  <p>
                    <Badge variant="outline">{profile.transportType}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p>
                    <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                      {profile.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </p>
                </div>
              </div>
              {profile.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="text-sm">{profile.description}</p>
                </div>
              )}
              {profile.tags && profile.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {profile.defaultRuleChain && (
            <Card>
              <CardHeader>
                <CardTitle>Rule Chain por Defecto</CardTitle>
                <CardDescription>
                  Rule Chain que se ejecuta automáticamente para este tipo de dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{profile.defaultRuleChain.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {profile.defaultRuleChainId}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/rule-engine/${profile.defaultRuleChainId}`)}
                  >
                    Ver Rule Chain
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema de Telemetría</CardTitle>
              <CardDescription>
                Definición de las telemetrías que este tipo de dispositivo puede enviar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(profile.telemetrySchema || {}).length === 0 ? (
                <p className="text-muted-foreground">No hay telemetrías definidas</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(profile.telemetrySchema).map(([key, def]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium font-mono">{key}</h4>
                          {def.description && (
                            <p className="text-sm text-muted-foreground">{def.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">{def.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {def.unit && (
                          <div>
                            <span className="text-muted-foreground">Unidad:</span> {def.unit}
                          </div>
                        )}
                        {def.min !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Mínimo:</span> {def.min}
                          </div>
                        )}
                        {def.max !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Máximo:</span> {def.max}
                          </div>
                        )}
                        {def.precision !== undefined && (
                          <div>
                            <span className="text-muted-foreground">Precisión:</span>{' '}
                            {def.precision}
                          </div>
                        )}
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
              {!profile.metadata || Object.keys(profile.metadata).length === 0 ? (
                <p className="text-muted-foreground">No hay metadata adicional</p>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
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
