import { useState } from 'react';
import { Link, Plus, Trash2, Search, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useThings } from '../api/digital-twins.api';
import type { DittoThing } from '../types/digital-twins.types';

interface RelationshipsManagerProps {
  thingId: string;
  thing: DittoThing;
}

interface Relationship {
  id: string;
  type: 'parent' | 'child' | 'related';
  relationshipType: string;
  targetThingId: string;
  targetName: string;
  targetType: string;
}

const RELATIONSHIP_TYPES = [
  { value: 'contains', label: 'Contiene', description: 'Este asset contiene al otro' },
  { value: 'partOf', label: 'Parte de', description: 'Este asset es parte del otro' },
  { value: 'connectedTo', label: 'Conectado a', description: 'Conexión física o lógica' },
  { value: 'dependsOn', label: 'Depende de', description: 'Dependencia funcional' },
  { value: 'monitors', label: 'Monitorea', description: 'Este asset monitorea al otro' },
  { value: 'controls', label: 'Controla', description: 'Este asset controla al otro' },
  { value: 'supplies', label: 'Suministra a', description: 'Suministro de recursos' },
  { value: 'custom', label: 'Personalizado', description: 'Relación personalizada' },
];

export function RelationshipsManager({ thingId, thing }: RelationshipsManagerProps) {
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('contains');
  const [selectedThing, setSelectedThing] = useState<DittoThing | null>(null);

  // Mock relationships - En producción esto vendría de Ditto attributes o una tabla separada
  const [relationships, setRelationships] = useState<Relationship[]>([
    // Ejemplo de relaciones que podrían existir
  ]);

  const { data: thingsData } = useThings({ search: searchTerm });
  const availableThings = thingsData?.items.filter((t) => t.thingId !== thingId) || [];

  const addRelationship = () => {
    if (!selectedThing) {
      toast.error('Selecciona un Digital Twin');
      return;
    }

    const newRelation: Relationship = {
      id: `rel-${Date.now()}`,
      type: 'related',
      relationshipType: selectedType,
      targetThingId: selectedThing.thingId,
      targetName: selectedThing.attributes?.name || selectedThing.thingId,
      targetType: selectedThing.attributes?.type || 'UNKNOWN',
    };

    setRelationships([...relationships, newRelation]);
    toast.success('Relación agregada exitosamente');
    setIsAddingRelation(false);
    setSelectedThing(null);
    setSearchTerm('');
  };

  const removeRelationship = (relationId: string) => {
    setRelationships(relationships.filter((r) => r.id !== relationId));
    toast.success('Relación eliminada');
  };

  const getRelationshipLabel = (type: string) => {
    return RELATIONSHIP_TYPES.find((rt) => rt.value === type)?.label || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Relaciones
            </CardTitle>
            <CardDescription>
              Conexiones con otros Digital Twins (jerarquías, dependencias, etc.)
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddingRelation(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Relación
          </Button>
          <Dialog open={isAddingRelation} onOpenChange={setIsAddingRelation}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Relación</DialogTitle>
                <DialogDescription>
                  Conecta este Digital Twin con otro para establecer jerarquías o dependencias
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Relación</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Buscar Digital Twin</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {searchTerm && (
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {availableThings.length > 0 ? (
                      availableThings.map((thing) => (
                        <Card
                          key={thing.thingId}
                          className={`cursor-pointer transition-all ${
                            selectedThing?.thingId === thing.thingId
                              ? 'ring-2 ring-blue-500'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedThing(thing)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {thing.attributes?.name || thing.thingId}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {thing.thingId}
                                </p>
                              </div>
                              <Badge variant="outline">{thing.attributes?.type}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No se encontraron Digital Twins
                      </p>
                    )}
                  </div>
                )}

                {selectedThing && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{thing.attributes?.name || thingId}</p>
                          <Badge variant="outline" className="mt-1">
                            {thing.attributes?.type}
                          </Badge>
                        </div>
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedThing.attributes?.name || selectedThing.thingId}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {selectedThing.attributes?.type}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {getRelationshipLabel(selectedType)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingRelation(false)}>
                  Cancelar
                </Button>
                <Button onClick={addRelationship} disabled={!selectedThing}>
                  Agregar Relación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {relationships.length > 0 ? (
          <div className="space-y-3">
            {relationships.map((relation) => (
              <Card key={relation.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {thing.attributes?.name || thingId}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {thing.attributes?.type}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {getRelationshipLabel(relation.relationshipType)}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{relation.targetName}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {relation.targetType}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRelationship(relation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-12">
            <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay relaciones definidas</p>
            <p className="text-sm mt-2">
              Las relaciones permiten conectar Digital Twins entre sí
            </p>
            <p className="text-xs mt-4 text-muted-foreground">
              Ejemplo: Pozo → Campo → Cuenca
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
