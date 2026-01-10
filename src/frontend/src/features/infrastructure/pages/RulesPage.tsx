import { useState } from 'react';
import { useRules, useActivateRule, useDeactivateRule } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function RulesPage() {
  const [page, setPage] = useState(1);
  const { data: rulesData, isLoading } = useRules(page, 20);
  const activateRule = useActivateRule();
  const deactivateRule = useDeactivateRule();

  const rules = rulesData?.data || [];
  const meta = rulesData?.meta;

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateRule.mutateAsync(ruleId);
        toast.success('Regla desactivada correctamente');
      } else {
        await activateRule.mutateAsync(ruleId);
        toast.success('Regla activada correctamente');
      }
    } catch (error) {
      toast.error('Error al cambiar estado de la regla');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Motor de Reglas Visual</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de reglas de negocio visuales
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas Activas</CardTitle>
          <CardDescription>
            {meta ? `${meta.total} reglas configuradas` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">📋 No hay reglas configuradas</p>
              <p className="text-sm">
                Las reglas se pueden crear mediante la API REST
              </p>
              <p className="text-sm mt-4">
                Endpoint: <code className="bg-muted px-2 py-1 rounded">/api/v1/infrastructure/rules</code>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Badge variant="outline">
                          Prioridad: {rule.priority}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>🔗 {rule.nodes.length} nodos</span>
                        <span>📊 {rule.executionCount} ejecuciones</span>
                        {rule.lastExecutedAt && (
                          <span>
                            ⏱️ Última: {new Date(rule.lastExecutedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {rule.lastError && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          Error: {rule.lastError}
                        </div>
                      )}
                    </div>
                    <Button
                      variant={rule.isActive ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleRule(rule.id, rule.isActive)}
                      disabled={activateRule.isPending || deactivateRule.isPending}
                    >
                      {rule.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consumers Kafka Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>✅ Telemetry Consumer</li>
              <li>✅ Computed Fields Consumer</li>
              <li>✅ Rule Trigger Consumer</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Nodos Soportados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              15+ tipos de nodos: Triggers, Conditions, Transforms, Actions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
