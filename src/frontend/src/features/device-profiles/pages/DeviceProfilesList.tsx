import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceProfiles } from '../api/device-profiles.api';
import { TransportType } from '../types/device-profile.types';

export function DeviceProfilesList() {
  const navigate = useNavigate();
  const [transportFilter, setTransportFilter] = useState<TransportType | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);

  const { data, isLoading, error } = useDeviceProfiles({
    transportType: transportFilter,
    search: searchTerm,
    isActive: activeFilter,
    page: 1,
    perPage: 50,
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
        Error al cargar Device Profiles: {error.message}
      </div>
    );
  }

  const profiles = data?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Profiles</h1>
          <p className="text-muted-foreground">
            Plantillas de configuración para tipos de dispositivos
          </p>
        </div>
        <Button onClick={() => navigate('/device-profiles/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Device Profile
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={transportFilter}
          onValueChange={(value) => setTransportFilter(value as TransportType)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de transporte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TransportType.MODBUS_TCP}>Modbus TCP</SelectItem>
            <SelectItem value={TransportType.MODBUS_RTU}>Modbus RTU</SelectItem>
            <SelectItem value={TransportType.ETHERNET_IP}>EtherNet/IP</SelectItem>
            <SelectItem value={TransportType.S7}>Siemens S7</SelectItem>
            <SelectItem value={TransportType.OPCUA}>OPC-UA</SelectItem>
            <SelectItem value={TransportType.FINS}>FINS</SelectItem>
            <SelectItem value={TransportType.MQTT}>MQTT</SelectItem>
            <SelectItem value={TransportType.HTTP}>HTTP</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
          onValueChange={(value) =>
            setActiveFilter(value === 'all' ? undefined : value === 'active')
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          No se encontraron Device Profiles
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/device-profiles/${profile.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {profile.code}
                    </CardDescription>
                  </div>
                  <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                    {profile.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transporte:</span>
                  <Badge variant="outline">{profile.transportType}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Telemetrías:</span>
                  <span className="font-medium">
                    {Object.keys(profile.telemetrySchema || {}).length}
                  </span>
                </div>
                {profile.dataSourcesCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Sources:</span>
                    <span className="font-medium">{profile.dataSourcesCount}</span>
                  </div>
                )}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {profile.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Total: {data?.meta.total || 0} Device Profiles
      </div>
    </div>
  );
}
