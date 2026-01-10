/**
 * Data Source Details Dialog
 * 
 * Detailed view of a data source with tabs for configuration and tags.
 */

import { useState } from 'react';
import { Pencil, Trash2, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDataSource,
  useDataSourceTags,
  useTestDataSourceConnection,
  useDeleteDataSource,
} from '../api';
import { DataSourceStatus } from '../types';
import { DataSourceFormDialog } from './DataSourceFormDialog';

interface DataSourceDetailsDialogProps {
  dataSourceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataSourceDetailsDialog({
  dataSourceId,
  open,
  onOpenChange,
}: DataSourceDetailsDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dataSource, isLoading } = useDataSource(dataSourceId || '', true);
  const { data: tagsData } = useDataSourceTags(dataSourceId || '', {
    page: 1,
    perPage: 100,
  });
  const testConnection = useTestDataSourceConnection();
  const deleteDataSource = useDeleteDataSource();

  if (!dataSourceId) return null;

  const handleTestConnection = async () => {
    try {
      const result = await testConnection.mutateAsync(dataSourceId);
      alert(result.success ? 'Conexión exitosa' : `Error: ${result.message}`);
    } catch (error) {
      alert('Error al probar la conexión');
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Está seguro de eliminar esta fuente de datos?')) {
      await deleteDataSource.mutateAsync(dataSourceId);
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: DataSourceStatus) => {
    const variants: Record<DataSourceStatus, 'default' | 'secondary' | 'destructive'> = {
      CONNECTED: 'default',
      DISCONNECTED: 'secondary',
      ERROR: 'destructive',
      CONNECTING: 'secondary',
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading || !dataSource) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            Cargando...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{dataSource.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(dataSource.status)}
                  <Badge variant="outline">{dataSource.protocol}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Probar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteDataSource.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="config">Configuración</TabsTrigger>
              <TabsTrigger value="tags">
                Tags ({tagsData?.data.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{dataSource.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protocolo</p>
                      <p className="font-medium">{dataSource.protocol}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Host</p>
                      <p className="font-medium">
                        {dataSource.connectionConfig.host}:{dataSource.connectionConfig.port}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium">{dataSource.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Habilitado</p>
                      <p className="font-medium">
                        {dataSource.enabled ? 'Sí' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <p className="font-medium">{tagsData?.data.length || 0}</p>
                    </div>
                  </div>
                  {dataSource.description && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Descripción</p>
                      <p className="font-medium">{dataSource.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {dataSource.lastError && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-700">Último Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600">{dataSource.lastError}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Conexión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Host</p>
                        <p className="font-medium font-mono">
                          {dataSource.connectionConfig.host}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Puerto</p>
                        <p className="font-medium font-mono">
                          {dataSource.connectionConfig.port}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Intervalo: {dataSource.scanRate}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timeout</p>
                        <p className="font-medium">
                          {dataSource.timeout || 5000} ms
                        </p>
                      </div>
                    </div>

                    {dataSource.connectionConfig.config && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Configuración del Protocolo
                        </p>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(
                            dataSource.connectionConfig.config,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              {tagsData && tagsData.data.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Escala</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tagsData.data.map((tag) => (
                          <TableRow key={tag.id}>
                            <TableCell className="font-medium">
                              {tag.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {tag.address}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tag.dataType}</Badge>
                            </TableCell>
                            <TableCell>
                              {tag.scaleFactor !== 1 || tag.offset !== 0 && (
                                <span className="text-sm">
                                  ×{tag.scaleFactor} +{tag.offset || 0}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={tag.enabled ? 'default' : 'secondary'}
                              >
                                {tag.enabled ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No hay tags configurados para esta fuente de datos
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {isEditDialogOpen && (
        <DataSourceFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          dataSource={dataSource}
        />
      )}
    </>
  );
}
