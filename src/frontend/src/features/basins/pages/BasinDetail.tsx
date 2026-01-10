import { useNavigate, useParams } from 'react-router-dom';
import { useBasin, useDeleteBasin } from '@/features/geology/api/basins.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Mountain } from 'lucide-react';
import { BasinType } from '@/types/geology.types';
import { toast } from 'sonner';

export function BasinDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useBasin(id!);
  const deleteMutation = useDeleteBasin();

  const getBasinTypeLabel = (type: BasinType) => {
    const labels: Record<BasinType, string> = {
      [BasinType.FORELAND]: 'Antepaís',
      [BasinType.RIFT]: 'Rift',
      [BasinType.PASSIVE_MARGIN]: 'Margen Pasivo',
      [BasinType.INTRACRATONIC]: 'Intracratónico',
      [BasinType.FOREARC]: 'Antearco',
    };
    return labels[type];
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar esta cuenca?')) return;

    try {
      await deleteMutation.mutateAsync(id!);
      toast.success('Cuenca eliminada exitosamente');
      navigate('/basins');
    } catch (err) {
      toast.error('Error al eliminar la cuenca');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-destructive">Error al cargar la cuenca</div>
      </div>
    );
  }

  const basin = data.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/basins')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Cuencas
        </Button>
        <span>/</span>
        <span>{basin.name}</span>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Mountain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{basin.name}</h1>
            <p className="text-muted-foreground">{basin.country}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/basins/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <div className="mt-1">
                {basin.basinType ? (
                  <Badge variant="outline">{getBasinTypeLabel(basin.basinType)}</Badge>
                ) : (
                  <p className="text-lg">-</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">País</label>
              <p className="text-lg">{basin.country || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Región</label>
              <p className="text-lg">{basin.region || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Área (km²)</label>
              <p className="text-lg">{basin.areaKm2 ? parseFloat(basin.areaKm2).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Edad Geológica</label>
              <p className="text-lg">{basin.age || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contexto Tectónico</label>
              <p className="text-lg">{basin.tectonicSetting || '-'}</p>
            </div>
          </div>

          {basin.description && (
            <>
              <hr className="my-4" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-lg mt-1">{basin.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
