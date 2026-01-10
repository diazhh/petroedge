/**
 * Permissions Management Page
 * 
 * Página para gestionar permisos del sistema RBAC
 */

import { useState } from 'react';
import { Search, Shield, Filter } from 'lucide-react';
import { usePermissions } from '@/hooks/useRbac';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState<string>('');

  const { data, isLoading, error } = usePermissions({
    page,
    perPage: 50,
    search: search || undefined,
    module: moduleFilter || undefined,
  });

  const modules = data
    ? Array.from(new Set(data.data.map((p) => p.module))).sort()
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permisos</h1>
          <p className="text-muted-foreground">
            Permisos disponibles en el sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Permisos</CardTitle>
          <CardDescription>
            Permisos granulares del sistema RBAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar permisos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los módulos</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Cargando permisos...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Error al cargar permisos
            </div>
          )}

          {data && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permiso</TableHead>
                      <TableHead>Nombre de Visualización</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron permisos
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              {permission.name}
                            </div>
                          </TableCell>
                          <TableCell>{permission.displayName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{permission.module}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{permission.action}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {permission.resource || '-'}
                          </TableCell>
                          <TableCell>
                            {permission.isSystem ? (
                              <Badge variant="secondary">Sistema</Badge>
                            ) : (
                              <Badge variant="outline">Personalizado</Badge>
                            )}
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
                    Mostrando {data.data.length} de {data.meta.total} permisos
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
    </div>
  );
}
