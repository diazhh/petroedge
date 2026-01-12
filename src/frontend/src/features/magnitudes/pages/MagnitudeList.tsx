import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
import { useMagnitudes, useDeleteMagnitude } from '../api/magnitudes.api';
import { useMagnitudeCategories } from '@/features/magnitude-categories/api/magnitude-categories.api';
import * as LucideIcons from 'lucide-react';

export function MagnitudeList() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const { toast } = useToast();
  const { data, isLoading } = useMagnitudes({ search, categoryId: categoryId || undefined });
  const { data: categories } = useMagnitudeCategories({ isActive: true });
  const deleteMagnitude = useDeleteMagnitude();

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteMagnitude.mutateAsync(id);
      toast({
        title: 'Magnitud eliminada',
        description: `La magnitud "${name}" ha sido eliminada correctamente`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al eliminar la magnitud',
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
          <h1 className="text-3xl font-bold">Magnitudes</h1>
          <p className="text-muted-foreground">
            Gestiona las magnitudes físicas del sistema
          </p>
        </div>
        <Link to="/magnitudes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Magnitud
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar magnitudes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {categories?.data?.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Símbolo</TableHead>
              <TableHead>Unidad SI</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No se encontraron magnitudes
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((magnitude: any) => (
                <TableRow key={magnitude.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {magnitude.category?.icon && (
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded"
                          style={{ backgroundColor: magnitude.category?.color || '#3b82f6' }}
                        >
                          <div className="text-white">
                            {getIcon(magnitude.category.icon)}
                          </div>
                        </div>
                      )}
                      <span className="text-sm">{magnitude.category?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{magnitude.code}</TableCell>
                  <TableCell className="font-medium">{magnitude.name}</TableCell>
                  <TableCell className="font-mono text-lg">{magnitude.symbol || '-'}</TableCell>
                  <TableCell>
                    {magnitude.siUnit ? (
                      <span className="font-mono">{magnitude.siUnit.symbol}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={magnitude.isActive ? 'default' : 'secondary'}>
                      {magnitude.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/magnitudes/${magnitude.id}/edit`}>
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
                              Esta acción eliminará la magnitud "{magnitude.name}" permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(magnitude.id, magnitude.name)}
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
