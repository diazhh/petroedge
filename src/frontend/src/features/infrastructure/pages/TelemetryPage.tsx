import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TelemetryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Telemetría en Tiempo Real</h1>
        <p className="text-muted-foreground mt-2">
          Monitoreo de datos de sensores y activos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telemetría</CardTitle>
          <CardDescription>
            Visualización de datos de telemetría en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">🚧 Módulo en Desarrollo</p>
            <p className="text-sm">
              La interfaz de telemetría estará disponible próximamente.
            </p>
            <p className="text-sm mt-4">
              Backend API activo en: <code className="bg-muted px-2 py-1 rounded">/api/v1/infrastructure/telemetry</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingesta de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sistema de ingesta automática desde Kafka activo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cache Redis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Caché de telemetría actual con TTL de 5 minutos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">TimescaleDB</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Almacenamiento histórico con retención de 1 año
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
