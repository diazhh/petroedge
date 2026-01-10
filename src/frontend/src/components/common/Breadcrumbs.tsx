/**
 * Componente Breadcrumbs (Migas de Pan)
 * 
 * Muestra la ruta de navegación actual con enlaces a las páginas anteriores.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** Texto a mostrar */
  label: string;
  /** URL de destino (opcional - si no tiene, es la página actual) */
  href?: string;
  /** Icono opcional */
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  /** Lista de items del breadcrumb */
  items: BreadcrumbItem[];
  /** Clase CSS adicional */
  className?: string;
  /** Mostrar icono de home en el primer item */
  showHomeIcon?: boolean;
}

/**
 * Componente de Breadcrumbs para navegación jerárquica
 * 
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Dashboard', href: '/dashboard' },
 *   { label: 'Pozos', href: '/wells' },
 *   { label: 'Pozo A-001' },
 * ]} />
 */
export function Breadcrumbs({ 
  items, 
  className,
  showHomeIcon = true,
}: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center text-sm text-muted-foreground', className)}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          const Icon = item.icon || (isFirst && showHomeIcon ? Home : undefined);

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 hover:text-foreground transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span 
                  className={cn(
                    'flex items-center gap-1.5',
                    isLast && 'text-foreground font-medium'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Header de página con breadcrumbs, título y acciones
 */
interface PageHeaderProps {
  /** Items del breadcrumb */
  breadcrumbs?: BreadcrumbItem[];
  /** Título de la página */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Acciones a mostrar en el header (botones) */
  actions?: React.ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default Breadcrumbs;
