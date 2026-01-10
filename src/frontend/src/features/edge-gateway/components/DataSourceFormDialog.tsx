/**
 * Data Source Form Dialog
 * 
 * Multi-step wizard for creating/editing data sources.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateDataSource, useUpdateDataSource } from '../api';
import { DataSourceProtocol, type DataSource } from '../types';

const dataSourceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  protocol: z.nativeEnum(DataSourceProtocol),
  edgeGatewayId: z.string().uuid('ID de gateway inválido'),
  connectionConfig: z.object({
    host: z.string().min(1, 'El host es requerido'),
    port: z.number().min(1).max(65535),
  }).passthrough(),
  scanRate: z.number().min(100).optional(),
  timeout: z.number().min(100).optional(),
  enabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

type DataSourceFormData = z.infer<typeof dataSourceSchema>;

interface DataSourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataSource?: DataSource;
  gatewayId?: string;
}

export function DataSourceFormDialog({
  open,
  onOpenChange,
  dataSource,
  gatewayId,
}: DataSourceFormDialogProps) {
  const [step, setStep] = useState<'basic' | 'protocol' | 'advanced'>('basic');
  const isEdit = !!dataSource;

  const createDataSource = useCreateDataSource();
  const updateDataSource = useUpdateDataSource();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DataSourceFormData>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: dataSource
      ? {
          name: dataSource.name,
          description: dataSource.description || '',
          protocol: dataSource.protocol,
          edgeGatewayId: dataSource.edgeGatewayId,
          connectionConfig: dataSource.connectionConfig,
          scanRate: dataSource.scanRate,
          timeout: dataSource.timeout,
          enabled: dataSource.enabled,
          metadata: dataSource.metadata || {},
        }
      : {
          name: '',
          protocol: DataSourceProtocol.MODBUS_TCP,
          edgeGatewayId: gatewayId || '',
          connectionConfig: {
            host: '',
            port: 502,
          },
          scanRate: 1000,
          timeout: 5000,
          enabled: true,
        },
  });

  const selectedProtocol = watch('protocol');

  const onSubmit = async (data: DataSourceFormData) => {
    try {
      if (isEdit && dataSource) {
        await updateDataSource.mutateAsync({
          id: dataSource.id,
          data,
        });
      } else {
        await createDataSource.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving data source:', error);
    }
  };

  const renderProtocolConfig = () => {
    switch (selectedProtocol) {
      case DataSourceProtocol.MODBUS_TCP:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="unitId">Unit ID</Label>
              <Input
                id="unitId"
                type="number"
                defaultValue={1}
                onChange={(e) =>
                  setValue('connectionConfig.unitId', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        );

      case DataSourceProtocol.ETHERNET_IP:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="slot">Slot</Label>
              <Input
                id="slot"
                type="number"
                defaultValue={0}
                onChange={(e) =>
                  setValue('connectionConfig.slot', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        );

      case DataSourceProtocol.S7:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rack">Rack</Label>
              <Input
                id="rack"
                type="number"
                defaultValue={0}
                onChange={(e) =>
                  setValue('connectionConfig.rack', parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="slot">Slot</Label>
              <Input
                id="slot"
                type="number"
                defaultValue={1}
                onChange={(e) =>
                  setValue('connectionConfig.slot', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        );

      case DataSourceProtocol.OPCUA:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                placeholder="opc.tcp://localhost:4840"
                onChange={(e) => setValue('connectionConfig.endpoint', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="securityMode">Security Mode</Label>
              <Select
                onValueChange={(value) =>
                  setValue('connectionConfig.securityMode', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Sign">Sign</SelectItem>
                  <SelectItem value="SignAndEncrypt">Sign and Encrypt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case DataSourceProtocol.FINS:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="da1">DA1 (Destination Network)</Label>
              <Input
                id="da1"
                type="number"
                defaultValue={0}
                onChange={(e) =>
                  setValue('connectionConfig.da1', parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="da2">DA2 (Destination Node)</Label>
              <Input
                id="da2"
                type="number"
                defaultValue={0}
                onChange={(e) =>
                  setValue('connectionConfig.da2', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Fuente de Datos' : 'Nueva Fuente de Datos'}
          </DialogTitle>
          <DialogDescription>
            Configure la conexión a un PLC o dispositivo industrial
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={step} onValueChange={(v) => setStep(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="protocol">Protocolo</TabsTrigger>
              <TabsTrigger value="advanced">Avanzado</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="PLC Principal"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Descripción opcional"
                />
              </div>

              <div>
                <Label htmlFor="protocol">Protocolo *</Label>
                <Select
                  value={selectedProtocol}
                  onValueChange={(value) =>
                    setValue('protocol', value as DataSourceProtocol)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DataSourceProtocol.MODBUS_TCP}>
                      Modbus TCP
                    </SelectItem>
                    <SelectItem value={DataSourceProtocol.ETHERNET_IP}>
                      EtherNet/IP (Allen-Bradley)
                    </SelectItem>
                    <SelectItem value={DataSourceProtocol.S7}>
                      S7 (Siemens)
                    </SelectItem>
                    <SelectItem value={DataSourceProtocol.OPCUA}>
                      OPC-UA
                    </SelectItem>
                    <SelectItem value={DataSourceProtocol.FINS}>
                      FINS (Omron)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.protocol && (
                  <p className="text-sm text-red-500">{errors.protocol.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">Host/IP *</Label>
                  <Input
                    id="host"
                    {...register('connectionConfig.host')}
                    placeholder="192.168.1.100"
                  />
                  {errors.connectionConfig?.host && (
                    <p className="text-sm text-red-500">{errors.connectionConfig.host.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="port">Puerto *</Label>
                  <Input
                    id="port"
                    type="number"
                    {...register('connectionConfig.port', { valueAsNumber: true })}
                  />
                  {errors.connectionConfig?.port && (
                    <p className="text-sm text-red-500">{errors.connectionConfig.port.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="protocol" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Configuración específica del protocolo {selectedProtocol}
              </div>
              {renderProtocolConfig()}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scanRate">
                    Intervalo de Polling (ms)
                  </Label>
                  <Input
                    id="scanRate"
                    type="number"
                    {...register('scanRate', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    {...register('timeout', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  {...register('enabled')}
                  className="h-4 w-4"
                />
                <Label htmlFor="enabled">Habilitado</Label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
