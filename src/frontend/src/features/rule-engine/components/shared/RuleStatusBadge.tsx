import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Pause, Edit, XCircle, AlertCircle } from 'lucide-react';
import type { RuleStatus } from '../../types';

interface RuleStatusBadgeProps {
  status: RuleStatus;
  className?: string;
}

export function RuleStatusBadge({ status, className }: RuleStatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <Badge className={`bg-green-500 ${className}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Activa
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="secondary" className={className}>
          <Pause className="w-3 h-3 mr-1" />
          Inactiva
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className={className}>
          <Edit className="w-3 h-3 mr-1" />
          Borrador
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={className}>
          <AlertCircle className="w-3 h-3 mr-1" />
          Desconocido
        </Badge>
      );
  }
}
