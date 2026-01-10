import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Database, Droplets, Wrench, Package, Cpu, Radio, Zap, Box } from 'lucide-react';
import type { DittoThing, ThingType } from '../types/digital-twins.types';

interface ThingCardProps {
  thing: DittoThing;
  onClick?: () => void;
}

const getTypeIcon = (type: string) => {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'BASIN':
      return <Layers className={iconClass} />;
    case 'FIELD':
      return <Database className={iconClass} />;
    case 'RESERVOIR':
      return <Database className={iconClass} />;
    case 'WELL':
      return <Droplets className={iconClass} />;
    case 'EQUIPMENT':
      return <Wrench className={iconClass} />;
    case 'TOOL':
      return <Package className={iconClass} />;
    case 'DEVICE':
      return <Cpu className={iconClass} />;
    case 'SENSOR':
      return <Radio className={iconClass} />;
    case 'ACTUATOR':
      return <Zap className={iconClass} />;
    default:
      return <Box className={iconClass} />;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'BASIN':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'FIELD':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'RESERVOIR':
      return 'bg-cyan-100 text-cyan-700 border-cyan-300';
    case 'WELL':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'EQUIPMENT':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'TOOL':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'DEVICE':
      return 'bg-indigo-100 text-indigo-700 border-indigo-300';
    case 'SENSOR':
      return 'bg-pink-100 text-pink-700 border-pink-300';
    case 'ACTUATOR':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export function ThingCard({ thing, onClick }: ThingCardProps) {
  const type = (thing.attributes?.type || 'CUSTOM') as ThingType;
  
  const getName = () => {
    if (thing.attributes?.name) return thing.attributes.name;
    if (thing.attributes?.wellCode) return thing.attributes.wellCode;
    if (thing.attributes?.reservoirCode) return thing.attributes.reservoirCode;
    if (thing.attributes?.fieldCode) return thing.attributes.fieldCode;
    if (thing.attributes?.basinCode) return thing.attributes.basinCode;
    if (thing.attributes?.code) return thing.attributes.code;
    if (thing.attributes?.apiNumber) return thing.attributes.apiNumber;
    return thing.thingId.split(':')[1] || thing.thingId;
  };
  
  const name = getName();
  const featureCount = Object.keys(thing.features || {}).length;
  const attributeCount = Object.keys(thing.attributes || {}).length;
  
  return (
    <Card className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
              {getTypeIcon(type)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              <CardDescription className="font-mono text-xs truncate">
                {thing.thingId}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {thing.attributes?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {thing.attributes.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{attributeCount} atributos</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>{featureCount} features</span>
            </div>
          </div>
          
          {thing._modified && (
            <div className="text-xs text-muted-foreground">
              Actualizado: {new Date(thing._modified).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
