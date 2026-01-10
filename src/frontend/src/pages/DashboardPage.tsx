import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth, refreshToken } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">SCADA+ERP Petrolero</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.firstName || user?.username} ({user?.role})
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenido</CardTitle>
              <CardDescription>Sistema SCADA+ERP Petrolero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Usuario:</span> {user?.username}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Rol:</span> {user?.role}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>Infraestructura operativa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Backend API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Base de Datos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Autenticación</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Módulos</CardTitle>
              <CardDescription>En desarrollo</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Well Testing</li>
                <li>• Drilling Operations</li>
                <li>• Production Management</li>
                <li>• Coiled Tubing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Gemelos Digitales (Digital Twins)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/infrastructure/assets')}>
              <CardHeader>
                <CardTitle className="text-lg">Assets & Tipos</CardTitle>
                <CardDescription>Gestión de activos digitales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar tipos de activos y gemelos digitales
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/infrastructure/telemetry')}>
              <CardHeader>
                <CardTitle className="text-lg">Telemetría</CardTitle>
                <CardDescription>Datos en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitorear telemetría de sensores y activos
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/infrastructure/rules')}>
              <CardHeader>
                <CardTitle className="text-lg">Motor de Reglas</CardTitle>
                <CardDescription>Reglas visuales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crear y gestionar reglas de negocio visuales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Edge Gateway & SCADA</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/edge/data-sources')}>
              <CardHeader>
                <CardTitle className="text-lg">Fuentes de Datos</CardTitle>
                <CardDescription>Configuración de PLCs y protocolos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestionar conexiones Modbus, OPC-UA, S7, EtherNet/IP
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/edge/gateways')}>
              <CardHeader>
                <CardTitle className="text-lg">Edge Gateways</CardTitle>
                <CardDescription>Monitoreo de gateways</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Estado y salud de gateways en campo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Módulos Operacionales</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/well-tests')}>
              <CardHeader>
                <CardTitle className="text-lg">Well Testing</CardTitle>
                <CardDescription>Pruebas de pozos y análisis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  IPR, VLP, Análisis Nodal y optimización
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Módulos de Yacimientos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/basins')}>
              <CardHeader>
                <CardTitle className="text-lg">Cuencas</CardTitle>
                <CardDescription>Gestión de cuencas petroleras</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar cuencas sedimentarias y estructurales
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/fields')}>
              <CardHeader>
                <CardTitle className="text-lg">Campos</CardTitle>
                <CardDescription>Gestión de campos petroleros</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar campos en producción y desarrollo
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/reservoirs')}>
              <CardHeader>
                <CardTitle className="text-lg">Yacimientos</CardTitle>
                <CardDescription>Gestión de yacimientos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar formaciones y propiedades petrofísicas
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/wells')}>
              <CardHeader>
                <CardTitle className="text-lg">Pozos</CardTitle>
                <CardDescription>Gestión de pozos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administrar pozos productores e inyectores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
