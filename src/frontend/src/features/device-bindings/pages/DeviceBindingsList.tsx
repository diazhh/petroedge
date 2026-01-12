import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceBindings } from '../api/device-bindings.api';

export function DeviceBindingsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter] = useState<boolean | undefined>(true);

  const { data, isLoading, error } = useDeviceBindings({
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
        Error al cargar Device Bindings: {error.message}
      </div>
    );
  }

  const bindings = data?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Bindings</h1>
          <p className="text-muted-foreground">
            Vinculación entre Data Sources y Digital Twins
          </p>
        </div>
        <Button onClick={() => navigate('/device-bindings/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Device Binding
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {bindings.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          No se encontraron Device Bindings
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bindings.map((binding) => (
            <Card
              key={binding.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/device-bindings/${binding.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Binding
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {binding.id.substring(0, 8)}...
                    </CardDescription>
                  </div>
                  <Badge variant={binding.isActive ? 'default' : 'secondary'}>
                    {binding.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  {binding.dataSource && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Data Source:</span>
                      <span className="font-medium">{binding.dataSource.name}</span>
                    </div>
                  )}
                  {binding.connectivityProfile && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Profile:</span>
                      <span className="font-medium">{binding.connectivityProfile.name}</span>
                    </div>
                  )}
                  {binding.digitalTwinInstance && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Digital Twin:</span>
                      <span className="font-medium">{binding.digitalTwinInstance.name}</span>
                    </div>
                  )}
                </div>
                {binding.tags && binding.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {binding.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {binding.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{binding.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
