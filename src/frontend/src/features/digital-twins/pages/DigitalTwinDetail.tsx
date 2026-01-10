import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Edit, Trash2, Activity, Database, Link, Info, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThing, useDeleteThing } from '../api/digital-twins.api';
import { AttributesEditor } from '../components/AttributesEditor';
import { FeaturesEditor } from '../components/FeaturesEditor';
import { TelemetryViewer } from '../components/TelemetryViewer';
import { RelationshipsManager } from '../components/RelationshipsManager';
import { toast } from 'sonner';

export function DigitalTwinDetail() {
  const { thingId } = useParams<{ thingId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'overview';
  
  const { data: thing, isLoading, error } = useThing(thingId);
  const deleteMutation = useDeleteThing();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleDelete = async () => {
    if (!thingId || !confirm('¿Estás seguro de eliminar este Digital Twin?')) return;
    
    try {
      await deleteMutation.mutateAsync(thingId);
      toast.success('Digital Twin eliminado exitosamente');
      navigate('/digital-twins');
    } catch (error) {
      toast.error('No se pudo eliminar el Digital Twin');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !thing) {
    return (
      <div className="text-center text-red-500 p-8">
        Error al cargar Digital Twin
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/digital-twins')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{thing.attributes?.name || thing.thingId}</h1>
            <p className="text-muted-foreground font-mono text-sm">{thing.thingId}</p>
          </div>
          <Badge variant="outline">{thing.attributes?.type}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/digital-twins/${thingId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="attributes">
            <Database className="h-4 w-4 mr-2" />
            Atributos
          </TabsTrigger>
          <TabsTrigger value="features">
            <Activity className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="telemetry">
            <Radio className="h-4 w-4 mr-2" />
            Telemetría
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <Link className="h-4 w-4 mr-2" />
            Relaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thing ID</p>
                  <p className="text-sm font-mono">{thing.thingId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="text-sm">{thing.attributes?.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                  <p className="text-sm">{thing.attributes?.description || 'Sin descripción'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Policy ID</p>
                  <p className="text-sm font-mono">{thing.policyId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revisión</p>
                  <p className="text-sm">{thing._revision || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creado</p>
                  <p className="text-sm">
                    {thing._created ? new Date(thing._created).toLocaleString('es-ES') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última modificación</p>
                  <p className="text-sm">
                    {thing._modified ? new Date(thing._modified).toLocaleString('es-ES') : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{Object.keys(thing.attributes || {}).length}</p>
                  <p className="text-sm text-muted-foreground">Atributos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(thing.features || {}).length}</p>
                  <p className="text-sm text-muted-foreground">Features</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Relaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
          <AttributesEditor thingId={thingId!} attributes={thing.attributes || {}} />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeaturesEditor thingId={thingId!} features={thing.features} />
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-4">
          <TelemetryViewer assetId={thing.attributes?.assetId || thingId!} />
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          <RelationshipsManager thingId={thingId!} thing={thing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
