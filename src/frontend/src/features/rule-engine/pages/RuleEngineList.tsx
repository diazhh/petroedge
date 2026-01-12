import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRules, useActivateRule, useDeactivateRule, useDeleteRule } from '../api';
import { RuleCard } from '../components/shared';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function RuleEngineList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const { data: rulesData, isLoading } = useRules({
    page,
    perPage: 12,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: search || undefined,
  });

  const activateMutation = useActivateRule();
  const deactivateMutation = useDeactivateRule();
  const deleteMutation = useDeleteRule();

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
      toast.success('Regla activada correctamente');
    } catch (error) {
      toast.error('Error al activar la regla');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success('Regla desactivada correctamente');
    } catch (error) {
      toast.error('Error al desactivar la regla');
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(ruleToDelete);
      toast.success('Regla eliminada correctamente');
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar la regla');
    }
  };

  const handleDuplicate = async (_id: string) => {
    toast.info('Función de duplicar en desarrollo');
  };

  const rules = rulesData?.data || [];
  const meta = rulesData?.meta;

  const stats = {
    total: meta?.total || 0,
    active: rules.filter(r => r.status === 'active').length,
    inactive: rules.filter(r => r.status === 'inactive').length,
    errors: rules.filter(r => r.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Motor de Reglas</h1>
          <p className="text-muted-foreground">
            Gestiona reglas de procesamiento de datos en tiempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Upload className="w-4 h-4" />
          </Button>
          <Button asChild>
            <Link to="/rule-engine/new">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Regla
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Reglas</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactivas</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con Errores</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.errors}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar reglas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
                <SelectItem value="error">Con errores</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="telemetry">Telemetría</SelectItem>
                <SelectItem value="alarms">Alarmas</SelectItem>
                <SelectItem value="notifications">Notificaciones</SelectItem>
                <SelectItem value="calculations">Cálculos</SelectItem>
                <SelectItem value="integrations">Integraciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando reglas...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No se encontraron reglas</p>
              <Button asChild>
                <Link to="/rule-engine/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera regla
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  onDelete={(id) => {
                    setRuleToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}

          {meta && meta.total > meta.perPage && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {Math.ceil(meta.total / meta.perPage)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(meta.total / meta.perPage)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La regla será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
