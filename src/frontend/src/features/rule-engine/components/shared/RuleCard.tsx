import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  Activity,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import type { RuleListItem } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RuleCardProps {
  rule: RuleListItem;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function RuleCard({ 
  rule, 
  onActivate, 
  onDeactivate, 
  onDelete,
  onDuplicate 
}: RuleCardProps) {
  const getStatusBadge = () => {
    switch (rule.status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Activa</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Inactiva</Badge>;
      case 'draft':
        return <Badge variant="outline"><Edit className="w-3 h-3 mr-1" />Borrador</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">
                <Link 
                  to={`/rule-engine/${rule.id}`}
                  className="hover:underline"
                >
                  {rule.name}
                </Link>
              </CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="line-clamp-2">
              {rule.description || 'Sin descripción'}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/rule-engine/${rule.id}`}>
                  <Activity className="w-4 h-4 mr-2" />
                  Ver Detalle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/rule-engine/${rule.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {rule.status === 'active' ? (
                <DropdownMenuItem onClick={() => onDeactivate?.(rule.id)}>
                  <Pause className="w-4 h-4 mr-2" />
                  Desactivar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onActivate?.(rule.id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Activar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate?.(rule.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(rule.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="font-normal">
                {rule.category}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(rule.updatedAt), { 
                addSuffix: true,
                locale: es 
              })}
            </div>
          </div>

          {rule.metadata && (
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {rule.metadata.executionCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Ejecuciones</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSuccessRateColor(rule.metadata.successRate)}`}>
                  {rule.metadata.successRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Éxito</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {rule.metadata.avgDuration.toFixed(0)}ms
                </div>
                <div className="text-xs text-muted-foreground">Promedio</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
