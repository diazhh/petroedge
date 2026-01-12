import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Database, 
  Zap, 
  Send, 
  Globe, 
  GitBranch,
  Settings
} from 'lucide-react';
import type { NodeCategory } from '../../types';

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  input: 'border-gray-500 bg-gray-50',
  filter: 'border-blue-500 bg-blue-50',
  enrichment: 'border-cyan-500 bg-cyan-50',
  transform: 'border-purple-500 bg-purple-50',
  action: 'border-green-500 bg-green-50',
  external: 'border-orange-500 bg-orange-50',
  flow: 'border-indigo-500 bg-indigo-50',
};

const CATEGORY_ICONS: Record<NodeCategory, React.ReactNode> = {
  input: <Database className="w-4 h-4" />,
  filter: <Filter className="w-4 h-4" />,
  enrichment: <Database className="w-4 h-4" />,
  transform: <Zap className="w-4 h-4" />,
  action: <Send className="w-4 h-4" />,
  external: <Globe className="w-4 h-4" />,
  flow: <GitBranch className="w-4 h-4" />,
};

export const CustomNode = memo(({ data, selected }: NodeProps<any>) => {
  const category = (data?.category as NodeCategory) || 'filter';
  const colorClass = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <Card 
      className={`
        min-w-[150px] border-2 transition-all
        ${colorClass}
        ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow'}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {data?.label || data?.nodeType || 'Node'}
            </p>
          </div>
          {data?.config && typeof data.config === 'object' && Object.keys(data.config).length > 0 && (
            <Settings className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        
        <Badge variant="outline" className="text-xs">
          {data?.nodeType || 'unknown'}
        </Badge>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';
