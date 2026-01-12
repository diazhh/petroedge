import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Play, Pause, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useRule, 
  useRuleVersions,
  useActivateRule,
  useDeactivateRule,
  useDeleteRule
} from '../api';
import { RuleStatusBadge } from '../components/shared';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function RuleEngineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: ruleData, isLoading } = useRule(id!);
  // const { data: metricsData } = useRuleMetrics(id!);
  const { data: versionsData } = useRuleVersions(id!);
  
  const activateMutation = useActivateRule();
  const deactivateMutation = useDeactivateRule();
  const deleteMutation = useDeleteRule();

  const rule = ruleData?.data;
  // const metrics = metricsData?.data;
  const versions = versionsData?.data || [];

  const handleActivate = async () => {
    if (!id) return;
    try {
      await activateMutation.mutateAsync(id);
      toast.success('Regla activada correctamente');
    } catch (error) {
      toast.error('Error al activar la regla');
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success('Regla desactivada correctamente');
    } catch (error) {
      toast.error('Error al desactivar la regla');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Regla eliminada correctamente');
      navigate('/rule-engine');
    } catch (error) {
      toast.error('Error al eliminar la regla');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando regla...</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Regla no encontrada</p>
          <Button asChild>
            <Link to="/rule-engine">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/rule-engine">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{rule.name}</h1>
            <RuleStatusBadge status={rule.status} />
          </div>
          <p className="text-muted-foreground">
            {rule.description || 'Sin descripción'}
          </p>
        </div>
        <div className="flex gap-2">
          {rule.status === 'active' ? (
            <Button variant="outline" onClick={handleDeactivate}>
              <Pause className="w-4 h-4 mr-2" />
              Desactivar
            </Button>
          ) : (
            <Button onClick={handleActivate}>
              <Play className="w-4 h-4 mr-2" />
              Activar
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={`/rule-engine/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <Badge variant="outline">{rule.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <RuleStatusBadge status={rule.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Versión</p>
                  <p className="font-medium">v{rule.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado por</p>
                  <p className="font-medium">{rule.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(rule.createdAt), { 
                      addSuffix: true,
                      locale: es 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última modificación</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(rule.updatedAt), { 
                      addSuffix: true,
                      locale: es 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Ejecuciones totales</p>
                  <p className="text-2xl font-bold">
                    {rule.metadata.executionCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de éxito</p>
                  <p className="text-2xl font-bold text-green-600">
                    {rule.metadata.successRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duración promedio</p>
                  <p className="text-2xl font-bold">
                    {rule.metadata.avgDuration.toFixed(0)}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errores</p>
                  <p className="text-2xl font-bold text-red-600">
                    {rule.metadata.errorCount.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flujo de Regla</CardTitle>
              <CardDescription>
                {rule.nodes.length} nodos, {rule.edges.length} conexiones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Vista previa del flujo (React Flow se implementará en la siguiente fase)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de trigger</p>
                <Badge>{rule.config.trigger.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Configuración</p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(rule.config.trigger.config, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Timeout</p>
                <p className="font-medium">{rule.config.timeout || 'No configurado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reintentos máximos</p>
                <p className="font-medium">{rule.config.maxRetries || 'No configurado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dead Letter Queue</p>
                <p className="font-medium">
                  {rule.config.dlqEnabled ? 'Habilitado' : 'Deshabilitado'}
                </p>
              </div>
              {rule.config.dlqEnabled && rule.config.dlqTopic && (
                <div>
                  <p className="text-sm text-muted-foreground">DLQ Topic</p>
                  <p className="font-medium">{rule.config.dlqTopic}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ejecuciones</CardTitle>
              <CardDescription>
                Últimas ejecuciones de la regla
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Historial de ejecuciones (se implementará con el backend)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Rendimiento</CardTitle>
              <CardDescription>
                Análisis de rendimiento y estadísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Gráficos de métricas (se implementará con Recharts)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Versiones</CardTitle>
              <CardDescription>
                {versions.length} versiones disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay versiones disponibles
                </p>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div 
                      key={version.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Versión {version.version}</p>
                        <p className="text-sm text-muted-foreground">
                          {version.comment || 'Sin comentarios'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(version.createdAt), { 
                            addSuffix: true,
                            locale: es 
                          })} por {version.createdBy}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Ver Diff
                        </Button>
                        <Button variant="outline" size="sm">
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
