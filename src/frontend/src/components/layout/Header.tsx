/**
 * Header Component
 * 
 * Barra superior con información del usuario y notificaciones
 */

import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RealtimeStatus } from '@/components/RealtimeStatus';

export function Header() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold">
          {getPageTitle(window.location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Estado en Tiempo Real */}
        <RealtimeStatus />

        {/* Notificaciones */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            3
          </span>
        </Button>

        {/* Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/basins': 'Cuencas',
    '/fields': 'Campos',
    '/reservoirs': 'Reservorios',
    '/wells': 'Pozos',
    '/well-tests': 'Well Testing',
    '/drilling': 'Drilling',
    '/edge/data-sources': 'Fuentes de Datos',
    '/edge/gateways': 'Edge Gateways',
    '/assets': 'Digital Twins',
    '/rules': 'Motor de Reglas',
    '/alarms': 'Alarmas',
    '/settings': 'Configuración',
    '/users': 'Usuarios',
  };

  return titles[pathname] || 'SCADA+ERP';
}
