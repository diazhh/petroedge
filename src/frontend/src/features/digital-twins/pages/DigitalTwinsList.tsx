import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThings } from '../api/digital-twins.api';
import { ThingCard } from '../components/ThingCard';
import type { ThingType } from '../types/digital-twins.types';

export function DigitalTwinsList() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<ThingType | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useThings({
    type: typeFilter,
    search: searchTerm,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error al cargar Digital Twins: {error.message}
      </div>
    );
  }

  const things = data?.items || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Twins</h1>
          <p className="text-muted-foreground">Gemelos Digitales gestionados por Eclipse Ditto</p>
        </div>
        <Button onClick={() => navigate('/digital-twins/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Thing
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ThingType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASIN">Cuencas</SelectItem>
            <SelectItem value="FIELD">Campos</SelectItem>
            <SelectItem value="RESERVOIR">Yacimientos</SelectItem>
            <SelectItem value="WELL">Pozos</SelectItem>
            <SelectItem value="EQUIPMENT">Equipos</SelectItem>
            <SelectItem value="TOOL">Herramientas</SelectItem>
            <SelectItem value="DEVICE">Dispositivos</SelectItem>
            <SelectItem value="SENSOR">Sensores</SelectItem>
            <SelectItem value="ACTUATOR">Actuadores</SelectItem>
            <SelectItem value="CUSTOM">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {things.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          No se encontraron Digital Twins
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {things.map((thing) => (
            <ThingCard
              key={thing.thingId}
              thing={thing}
              onClick={() => navigate(`/digital-twins/${encodeURIComponent(thing.thingId)}`)}
            />
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Total: {things.length} Digital Twins
      </div>
    </div>
  );
}
