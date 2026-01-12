import { useNavigate, useParams } from 'react-router-dom';
import { useField, useDeleteField } from '@/features/geology/api/fields.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, MapPin } from 'lucide-react';
import { FieldStatus } from '@/types/geology.types';
import { toast } from 'sonner';

export function FieldDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useField(id!);
  const deleteMutation = useDeleteField();

  const getFieldStatusLabel = (status: FieldStatus) => {
    const labels: Record<FieldStatus, string> = {
      [FieldStatus.PRODUCING]: 'Producción',
      [FieldStatus.DEVELOPING]: 'Desarrollando',
      [FieldStatus.ABANDONED]: 'Abandonado',
      [FieldStatus.EXPLORATION]: 'Exploración',
      [FieldStatus.DEVELOPMENT]: 'Desarrollo',
      [FieldStatus.PRODUCTION]: 'Producción',
      [FieldStatus.MATURE]: 'Maduro',
      [FieldStatus.DEPLETED]: 'Agotado'
    };
    return labels[status] || status;
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar este campo?')) return;

    try {
      await deleteMutation.mutateAsync(id!);
      toast.success('Campo eliminado exitosamente');
      navigate('/fields');
    } catch (err) {
      toast.error('Error al eliminar el campo');
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
        <div className="text-destructive">Error al cargar el campo</div>
      </div>
    );
  }

  const field = data.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fields')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Campos
        </Button>
        <span>/</span>
        <span>{field.fieldName}</span>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{field.fieldName}</h1>
            <p className="text-muted-foreground">{field.fieldCode || '-'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/fields/${id}/edit`)}>
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
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                {field.status ? (
                  <Badge variant="outline">{getFieldStatusLabel(field.status as FieldStatus)}</Badge>
                ) : (
                  <p className="text-lg">-</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Operador</label>
              <p className="text-lg">{field.operator || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo de Campo</label>
              <p className="text-lg">{field.fieldType || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Área (acres)</label>
              <p className="text-lg">{field.areaAcres ? parseFloat(field.areaAcres).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Descubrimiento</label>
              <p className="text-lg">{field.discoveryDate || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Primera Producción</label>
              <p className="text-lg">{field.firstProductionDate || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total de Pozos</label>
              <p className="text-lg">{field.totalWells || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pozos Activos</label>
              <p className="text-lg">{field.activeWells || '-'}</p>
            </div>
          </div>

          {field.description && (
            <>
              <hr className="my-4" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="text-lg mt-1">{field.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {field.centerLatitude && field.centerLongitude && (
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Latitud</label>
                <p className="text-lg">{parseFloat(field.centerLatitude).toFixed(6)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Longitud</label>
                <p className="text-lg">{parseFloat(field.centerLongitude).toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
