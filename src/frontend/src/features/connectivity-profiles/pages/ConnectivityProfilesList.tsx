import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConnectivityProfiles } from '../api/connectivity-profiles.api';

export function ConnectivityProfilesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter] = useState<boolean | undefined>(true);

  const { data, isLoading, error } = useConnectivityProfiles({
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
        Error al cargar Connectivity Profiles: {error.message}
      </div>
    );
  }

  const profiles = data?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connectivity Profiles</h1>
          <p className="text-muted-foreground">
            Mapeo de telemetría entre Device Profiles y Asset Templates
          </p>
        </div>
        <Button onClick={() => navigate('/connectivity-profiles/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Connectivity Profile
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
      </div>

      {profiles.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          No se encontraron Connectivity Profiles
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/connectivity-profiles/${profile.id}`)}
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
                {profile.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  {profile.deviceProfile && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Device:</span>
                      <span className="font-medium">{profile.deviceProfile.name}</span>
                    </div>
                  )}
                  {profile.assetTemplate && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Asset:</span>
                      <span className="font-medium">{profile.assetTemplate.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Link2 className="h-4 w-4" />
                    <span>{profile.telemetryMappings?.length || 0} mapeos</span>
                  </div>
                  {profile.bindingsCount !== undefined && (
                    <div>
                      <span>{profile.bindingsCount} bindings</span>
                    </div>
                  )}
                </div>
                {profile.tags && profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {profile.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
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
    </div>
  );
}
