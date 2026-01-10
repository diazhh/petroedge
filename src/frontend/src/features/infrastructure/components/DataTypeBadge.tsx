/**
 * DataTypeBadge Component
 * Displays a badge showing the data type with appropriate styling
 */

import { Badge } from '@/components/ui/badge';
import { DataType, DATA_TYPE_LABELS, DATA_TYPE_COLORS } from '../types/data-types';

interface DataTypeBadgeProps {
  type: DataType;
  className?: string;
}

export function DataTypeBadge({ type, className }: DataTypeBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${DATA_TYPE_COLORS[type]} ${className || ''}`}
    >
      {DATA_TYPE_LABELS[type]}
    </Badge>
  );
}
