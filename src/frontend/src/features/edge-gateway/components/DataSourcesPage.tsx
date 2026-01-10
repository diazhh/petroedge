/**
 * Data Sources Page
 * 
 * Main page for managing data sources with CRUD operations.
 */

import { useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataSources, useDataSourceStats, useDeleteDataSource } from '../api';
import { DataSourceProtocol, DataSourceStatus } from '../types';
import { DataSourceFormDialog } from './DataSourceFormDialog';
import { DataSourceDetailsDialog } from './DataSourceDetailsDialog';

export function DataSourcesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<DataSourceProtocol | ''>('');
  const [statusFilter, setStatusFilter] = useState<DataSourceStatus | ''>('');
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data: dataSourcesData, isLoading, refetch } = useDataSources({
    search,
    protocol: protocolFilter || undefined,
    status: statusFilter || undefined,
    page,
    perPage: 20,
    includeTags: true,
  });

  const { data: stats } = useDataSourceStats();
  const deleteDataSource = useDeleteDataSource();

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta fuente de datos?')) {
      await deleteDataSource.mutateAsync(id);
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedDataSource(id);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: DataSourceStatus) => {
    const variants: Record<DataSourceStatus, 'default' | 'secondary' | 'destructive'> = {
      CONNECTED: 'default',
      DISCONNECTED: 'secondary',
      ERROR: 'destructive',
      CONNECTING: 'secondary',
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const getProtocolBadge = (protocol: DataSourceProtocol) => {
    return <Badge variant="outline">{protocol}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuentes de Datos</h1>
          <p className="text-muted-foreground">
            Gestione las fuentes de datos de los Edge Gateways
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Fuente
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conectadas</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.connected}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Desconectadas</CardDescription>
              <CardTitle className="text-3xl text-gray-600">{stats.disconnected}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Con Error</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.error}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fuentes de datos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={protocolFilter} onValueChange={(value) => setProtocolFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Protocolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value={DataSourceProtocol.MODBUS_TCP}>Modbus TCP</SelectItem>
                <SelectItem value={DataSourceProtocol.ETHERNET_IP}>EtherNet/IP</SelectItem>
                <SelectItem value={DataSourceProtocol.S7}>Siemens S7</SelectItem>
                <SelectItem value={DataSourceProtocol.OPCUA}>OPC-UA</SelectItem>
                <SelectItem value={DataSourceProtocol.FINS}>FINS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value={DataSourceStatus.CONNECTED}>Conectado</SelectItem>
                <SelectItem value={DataSourceStatus.DISCONNECTED}>Desconectado</SelectItem>
                <SelectItem value={DataSourceStatus.ERROR}>Error</SelectItem>
                <SelectItem value={DataSourceStatus.CONNECTING}>Conectando</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Última Lectura</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSourcesData?.data.map((ds) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{ds.name}</div>
                        {ds.description && (
                          <div className="text-sm text-muted-foreground">{ds.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getProtocolBadge(ds.protocol)}</TableCell>
                    <TableCell>{getStatusBadge(ds.status)}</TableCell>
                    <TableCell className="text-sm">{ds.edgeGatewayId.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ds.tags?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ds.lastSuccessfulRead
                        ? new Date(ds.lastSuccessfulRead).toLocaleString()
                        : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(ds.id)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(ds.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {dataSourcesData && dataSourcesData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {dataSourcesData.meta.page} de {dataSourcesData.meta.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= dataSourcesData.meta.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DataSourceFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedDataSource && (
        <DataSourceDetailsDialog
          dataSourceId={selectedDataSource}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  );
}
