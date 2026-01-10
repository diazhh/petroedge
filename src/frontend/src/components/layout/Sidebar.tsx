/**
 * Sidebar Component
 * 
 * Navegación principal del sistema con menú colapsable
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Droplets,
  TestTube,
  Hammer,
  Database,
  Wifi,
  Settings,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  GitBranch,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Yacimientos',
    href: '/yacimientos',
    icon: Layers,
    children: [
      { title: 'Cuencas', href: '/basins', icon: Database },
      { title: 'Campos', href: '/fields', icon: Database },
      { title: 'Reservorios', href: '/reservoirs', icon: Database },
      { title: 'Pozos', href: '/wells', icon: Droplets },
    ],
  },
  {
    title: 'Well Testing',
    href: '/well-tests',
    icon: TestTube,
  },
  {
    title: 'Drilling',
    href: '/drilling',
    icon: Hammer,
  },
  {
    title: 'Edge Gateway',
    href: '/edge',
    icon: Wifi,
    children: [
      { title: 'Fuentes de Datos', href: '/edge/data-sources', icon: Database },
      { title: 'Edge Gateways', href: '/edge/gateways', icon: Wifi },
    ],
  },
  {
    title: 'Digital Twins',
    href: '/digital-twins',
    icon: Activity,
  },
  {
    title: 'Motor de Reglas',
    href: '/rules',
    icon: GitBranch,
  },
  {
    title: 'Alarmas',
    href: '/alarms',
    icon: Bell,
    badge: '3',
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Usuarios',
    href: '/users',
    icon: Users,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg">SCADA+ERP</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-gray-100',
                    isActive(item.href) && 'bg-blue-50 text-blue-600'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expandedItems.includes(item.title) && 'rotate-90'
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && expandedItems.includes(item.title) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          'hover:bg-gray-100',
                          isActive(child.href)
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-gray-700'
                        )}
                      >
                        <child.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-gray-100',
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@acme-petroleum.com</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
