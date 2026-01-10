import { useNavigate, useParams } from 'react-router-dom';
import { useWell, useDeleteWell } from '@/features/geology/api/wells.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Droplet } from 'lucide-react';
import { WellType, WellStatus, LiftMethod } from '@/types/geology.types';
import { toast } from 'sonner';

export function WellDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useWell(id!);
  const deleteMutation = useDeleteWell();

  const getWellTypeLabel = (type: WellType) => {
    const labels: Record<WellType, string> = {
      [WellType.PRODUCER]: 'Productor',
      [WellType.INJECTOR]: 'Inyector',
      [WellType.OBSERVATION]: 'Observación',
      [WellType.DISPOSAL]: 'Disposición',
    };
    return labels[type];
  };

  const getWellStatusLabel = (status: WellStatus) => {
    const labels: Record<WellStatus, string> = {
      [WellStatus.PRODUCING]: 'Produciendo',
      [WellStatus.INJECTING]: 'Inyectando',
      [WellStatus.SHUT_IN]: 'Cerrado',
      [WellStatus.SUSPENDED]: 'Suspendido',
      [WellStatus.ABANDONED]: 'Abandonado',
      [WellStatus.DRILLING]: 'Perforando',
    };
    return labels[status];
  };

  const getLiftMethodLabel = (method?: LiftMethod) => {
    if (!method) return '-';
    const labels: Record<LiftMethod, string> = {
      [LiftMethod.FLOWING]: 'Flujo Natural',
      [LiftMethod.ESP]: 'Bomba Electrosumergible',
      [LiftMethod.GAS_LIFT]: 'Gas Lift',
      [LiftMethod.SUCKER_ROD]: 'Bombeo Mecánico',
      [LiftMethod.PCP]: 'Bomba de Cavidad Progresiva',
      [LiftMethod.PLUNGER_LIFT]: 'Plunger Lift',
      [LiftMethod.HYDRAULIC_PUMP]: 'Bomba Hidráulica',
    };
    return labels[method];
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar este pozo?')) return;

    try {
      await deleteMutation.mutateAsync(id!);
      toast.success('Pozo eliminado exitosamente');
      navigate('/wells');
    } catch (err) {
      toast.error('Error al eliminar el pozo');
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
        <div className="text-destructive">Error al cargar el pozo</div>
      </div>
    );
  }

  const well = data.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/wells')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Pozos
        </Button>
        <span>/</span>
        <span>{well.wellName}</span>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Droplet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{well.wellName}</h1>
            <p className="text-muted-foreground">{well.apiNumber || well.wellCode || '-'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/wells/${id}/edit`)}>
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
                <Badge variant="info">{getWellTypeLabel(well.wellType)}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <div className="mt-1">
                <Badge variant="outline">{getWellStatusLabel(well.status)}</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Método de Levantamiento</label>
              <p className="text-lg">{getLiftMethodLabel(well.liftMethod)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">API Number</label>
              <p className="text-lg">{well.apiNumber || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Perforación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profundidad MD (ft)</label>
              <p className="text-lg">{well.totalDepthMdFt ? parseFloat(well.totalDepthMdFt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profundidad TVD (ft)</label>
              <p className="text-lg">{well.totalDepthTvdFt ? parseFloat(well.totalDepthTvdFt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
              <p className="text-lg">{well.spudDate || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Completación</label>
              <p className="text-lg">{well.completionDate || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Primera Producción</label>
              <p className="text-lg">{well.firstProductionDate || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tamaño de Tubería</label>
              <p className="text-lg">{well.tubingSize || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(well.currentOilRateBopd || well.currentGasRateMscfd || well.currentWaterRateBwpd) && (
        <Card>
          <CardHeader>
            <CardTitle>Producción Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Petróleo (BOPD)</label>
                <p className="text-lg">{well.currentOilRateBopd ? parseFloat(well.currentOilRateBopd).toLocaleString() : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gas (MSCFD)</label>
                <p className="text-lg">{well.currentGasRateMscfd ? parseFloat(well.currentGasRateMscfd).toLocaleString() : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Agua (BWPD)</label>
                <p className="text-lg">{well.currentWaterRateBwpd ? parseFloat(well.currentWaterRateBwpd).toLocaleString() : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(well.cumulativeOilMbbl || well.cumulativeGasMmscf || well.cumulativeWaterMbbl) && (
        <Card>
          <CardHeader>
            <CardTitle>Producción Acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Petróleo (MBBL)</label>
                <p className="text-lg">{well.cumulativeOilMbbl ? parseFloat(well.cumulativeOilMbbl).toLocaleString() : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gas (MMSCF)</label>
                <p className="text-lg">{well.cumulativeGasMmscf ? parseFloat(well.cumulativeGasMmscf).toLocaleString() : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Agua (MBBL)</label>
                <p className="text-lg">{well.cumulativeWaterMbbl ? parseFloat(well.cumulativeWaterMbbl).toLocaleString() : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {well.surfaceLatitude && well.surfaceLongitude && (
        <Card>
          <CardHeader>
            <CardTitle>Ubicación Superficial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Latitud</label>
                <p className="text-lg">{parseFloat(well.surfaceLatitude).toFixed(6)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Longitud</label>
                <p className="text-lg">{parseFloat(well.surfaceLongitude).toFixed(6)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Elevación (ft)</label>
                <p className="text-lg">{well.surfaceElevationFt ? parseFloat(well.surfaceElevationFt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
