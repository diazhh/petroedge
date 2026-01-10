/**
 * Edge Gateways Page
 * 
 * Main page for monitoring and managing Edge Gateways.
 */

import { useState } from 'react';
import { Plus, Search, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEdgeGateways, useEdgeGatewayStats } from '../api';
import { EdgeGatewayStatus } from '../types';

export function EdgeGatewaysPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter] = useState<EdgeGatewayStatus | ''>('');

  const { data: gatewaysData, isLoading, refetch } = useEdgeGateways({
    search,
    status: statusFilter || undefined,
    page,
    perPage: 20,
    includeSources: true,
  });

  const { data: stats } = useEdgeGatewayStats();

  const getStatusIcon = (status: EdgeGatewayStatus) => {
    switch (status) {
      case EdgeGatewayStatus.ONLINE:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case EdgeGatewayStatus.OFFLINE:
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case EdgeGatewayStatus.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case EdgeGatewayStatus.MAINTENANCE:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: EdgeGatewayStatus) => {
    const variants: Record<EdgeGatewayStatus, string> = {
      [EdgeGatewayStatus.ONLINE]: 'bg-green-100 text-green-800',
      [EdgeGatewayStatus.OFFLINE]: 'bg-gray-100 text-gray-800',
      [EdgeGatewayStatus.ERROR]: 'bg-red-100 text-red-800',
      [EdgeGatewayStatus.MAINTENANCE]: 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const formatLastSeen = (date: string) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edge Gateways</h1>
          <p className="text-muted-foreground">
            Monitoreo y gestión de gateways en campo
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gateway
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
              <CardDescription>En Línea</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.online}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fuera de Línea</CardDescription>
              <CardTitle className="text-3xl text-gray-600">
                {stats.offline}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Con Error</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {stats.error}
              </CardTitle>
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
                  placeholder="Buscar gateways..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <Activity className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gateways Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              Cargando...
            </div>
          ) : gatewaysData && gatewaysData.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Fuentes de Datos</TableHead>
                  <TableHead>Última Conexión</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gatewaysData.data.map((gateway) => (
                  <TableRow key={gateway.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(gateway.status)}
                        {getStatusBadge(gateway.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {gateway.name}
                    </TableCell>
                    <TableCell>{gateway.location || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        0 fuentes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {gateway.lastHeartbeat
                        ? formatLastSeen(gateway.lastHeartbeat)
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        -
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to gateway details
                          }}
                        >
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 opacity-20" />
              <p>No se encontraron gateways</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {gatewaysData && gatewaysData.meta.total > gatewaysData.meta.perPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * gatewaysData.meta.perPage + 1} -{' '}
            {Math.min(page * gatewaysData.meta.perPage, gatewaysData.meta.total)}{' '}
            de {gatewaysData.meta.total} gateways
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(gatewaysData.meta.total / gatewaysData.meta.perPage)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
