import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Search, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssetTemplates } from '../api/asset-templates.api';

export function AssetTemplatesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter] = useState<boolean | undefined>(true);

  const { data, isLoading, error } = useAssetTemplates({
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
        Error al cargar Asset Templates: {error.message}
      </div>
    );
  }

  const templates = data?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Templates</h1>
          <p className="text-muted-foreground">
            Plantillas de jerarquías de activos con componentes y relaciones
          </p>
        </div>
        <Button onClick={() => navigate('/asset-templates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Asset Template
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

      {templates.length === 0 ? (
        <div className="text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
          No se encontraron Asset Templates
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/asset-templates/${template.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {template.code}
                    </CardDescription>
                  </div>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>{template.components?.length || 0} componentes</span>
                  </div>
                  {template.instancesCount !== undefined && (
                    <div>
                      <span>{template.instancesCount} instancias</span>
                    </div>
                  )}
                </div>
                {template.rootAssetType && (
                  <div className="text-xs text-muted-foreground">
                    Tipo raíz: <span className="font-medium">{template.rootAssetType.name}</span>
                  </div>
                )}
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
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
