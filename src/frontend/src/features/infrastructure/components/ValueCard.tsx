/**
 * ValueCard Component
 * Displays a value with its metadata (type, unit, quality, timestamp)
 */

import { Card, CardContent } from '@/components/ui/card';
import { DataType } from '../types/data-types';
import { DataTypeBadge } from './DataTypeBadge';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ValueCardProps {
  label: string;
  value: any;
  type: DataType;
  unit?: string;
  quality?: string;
  timestamp?: Date;
  description?: string;
  onClick?: () => void;
}

export function ValueCard({ 
  label, 
  value, 
  type, 
  unit, 
  quality, 
  timestamp, 
  description,
  onClick 
}: ValueCardProps) {
  const formatValue = (val: any, dataType: DataType): string => {
    if (val === null || val === undefined) return 'N/A';

    switch (dataType) {
      case DataType.NUMBER:
        return typeof val === 'number' ? val.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : String(val);
      case DataType.BOOLEAN:
        return val ? 'Sí' : 'No';
      case DataType.DATE:
        return new Date(val).toLocaleDateString('es-ES');
      case DataType.DATETIME:
        return new Date(val).toLocaleString('es-ES');
      case DataType.JSON:
        return JSON.stringify(val, null, 2);
      default:
        return String(val);
    }
  };

  const getQualityColor = (q?: string) => {
    switch (q?.toUpperCase()) {
      case 'GOOD':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'BAD':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'UNCERTAIN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card 
      className={onClick ? 'cursor-pointer hover:bg-accent transition-colors' : ''}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{label}</h4>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <DataTypeBadge type={type} />
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatValue(value, type)}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {quality && (
              <Badge variant="outline" className={getQualityColor(quality)}>
                {quality}
              </Badge>
            )}
            {timestamp && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(timestamp).toLocaleString('es-ES')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
