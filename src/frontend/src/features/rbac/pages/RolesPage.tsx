/**
 * Roles Management Page
 * 
 * Página para gestionar roles del sistema RBAC
 */

import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import { useRoles, useDeleteRole } from '@/hooks/useRbac';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/PermissionGate';
import { useToast } from '@/hooks/use-toast';
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

export function RolesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error } = useRoles({
    page,
    perPage: 20,
    search: search || undefined,
  });

  const deleteRoleMutation = useDeleteRole();

  const handleDelete = async () => {
    if (!deleteRoleId) return;

    try {
      await deleteRoleMutation.mutateAsync(deleteRoleId);
      toast({
        title: 'Rol eliminado',
        description: 'El rol ha sido eliminado exitosamente',
      });
      setDeleteRoleId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'No se pudo eliminar el rol',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Gestiona los roles y sus permisos asociados
          </p>
        </div>
        <PermissionGate permission="roles:create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Rol
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Roles</CardTitle>
          <CardDescription>
            Roles disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Cargando roles...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Error al cargar roles
            </div>
          )}

          {data && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Nombre de Visualización</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No se encontraron roles
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell>{role.displayName}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {role.description || '-'}
                          </TableCell>
                          <TableCell>
                            {role.isSystem ? (
                              <Badge variant="secondary">Sistema</Badge>
                            ) : (
                              <Badge variant="outline">Personalizado</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <PermissionGate permission="roles:update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={role.isSystem}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate permission="roles:delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={role.isSystem}
                                  onClick={() => setDeleteRoleId(role.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {data.data.length} de {data.meta.total} roles
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === data.meta.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El rol será eliminado permanentemente.
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
