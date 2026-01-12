import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUnits, useDeleteUnit } from '../api/units.api';
import { useMagnitudes } from '@/features/magnitudes/api/magnitudes.api';
import * as LucideIcons from 'lucide-react';
import { UnitConverter } from '../components/UnitConverter';

export function UnitList() {
  const [search, setSearch] = useState('');
  const [magnitudeId, setMagnitudeId] = useState<string>('');
  const [showConverter, setShowConverter] = useState(false);
  const { toast } = useToast();
  const { data, isLoading } = useUnits({ search, magnitudeId: magnitudeId || undefined });
  const { data: magnitudes } = useMagnitudes({ isActive: true });
  const deleteUnit = useDeleteUnit();

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteUnit.mutateAsync(id);
      toast({
        title: 'Unidad eliminada',
        description: `La unidad "${name}" ha sido eliminada correctamente`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al eliminar la unidad',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Unidades de Medida</h1>
          <p className="text-muted-foreground">
            Gestiona las unidades de medida del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConverter(!showConverter)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Convertidor
          </Button>
          <Link to="/units/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Unidad
            </Button>
          </Link>
        </div>
      </div>

      {showConverter && (
        <div className="mb-6">
          <UnitConverter />
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={magnitudeId} onValueChange={setMagnitudeId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Todas las magnitudes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las magnitudes</SelectItem>
            {magnitudes?.data?.map((magnitude: any) => (
              <SelectItem key={magnitude.id} value={magnitude.id}>
                {magnitude.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Magnitud</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Símbolo</TableHead>
              <TableHead>Factor Conv.</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron unidades
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((unit: any) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {unit.magnitude?.category?.icon && (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded"
                          style={{ backgroundColor: unit.magnitude?.category?.color || '#3b82f6' }}
                        >
                          <div className="text-white">
                            {getIcon(unit.magnitude.category.icon)}
                          </div>
                        </div>
                      )}
                      <span className="text-sm">{unit.magnitude?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{unit.code}</TableCell>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell className="font-mono text-lg">{unit.symbol}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {unit.conversionFactor ? parseFloat(unit.conversionFactor).toExponential(2) : '-'}
                  </TableCell>
                  <TableCell>
                    {unit.isSiUnit ? (
                      <Badge variant="default">SI</Badge>
                    ) : (
                      <Badge variant="outline">Derivada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.isActive ? 'default' : 'secondary'}>
                      {unit.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/units/${unit.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará la unidad "{unit.name}" permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(unit.id, unit.name)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
