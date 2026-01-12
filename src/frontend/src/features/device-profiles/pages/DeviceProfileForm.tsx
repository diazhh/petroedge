import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useDeviceProfile, useCreateDeviceProfile, useUpdateDeviceProfile } from '../api/device-profiles.api';
import { TransportType } from '../types/device-profile.types';

const telemetryDefSchema = z.object({
  type: z.enum(['number', 'string', 'boolean']),
  unit: z.string().optional(),
  description: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  precision: z.number().optional(),
});

const formSchema = z.object({
  code: z.string().min(1, 'Código es requerido').max(50),
  name: z.string().min(1, 'Nombre es requerido').max(200),
  description: z.string().optional(),
  transportType: z.nativeEnum(TransportType),
  telemetrySchema: z.record(z.string(), telemetryDefSchema),
  defaultRuleChainId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DeviceProfileForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: profileData, isLoading: isLoadingProfile } = useDeviceProfile(id!);
  const createMutation = useCreateDeviceProfile();
  const updateMutation = useUpdateDeviceProfile();

  const [telemetryKeys, setTelemetryKeys] = useState<string[]>([]);
  const [newTelemetryKey, setNewTelemetryKey] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      transportType: TransportType.MODBUS_TCP,
      telemetrySchema: {},
      tags: [],
    },
  });

  useEffect(() => {
    if (isEdit && profileData?.data) {
      const profile = profileData.data;
      form.reset({
        code: profile.code,
        name: profile.name,
        description: profile.description || '',
        transportType: profile.transportType,
        telemetrySchema: profile.telemetrySchema,
        defaultRuleChainId: profile.defaultRuleChainId || undefined,
        tags: profile.tags || [],
      });
      setTelemetryKeys(Object.keys(profile.telemetrySchema || {}));
    }
  }, [profileData, isEdit, form]);

  const handleAddTelemetry = () => {
    if (!newTelemetryKey || telemetryKeys.includes(newTelemetryKey)) return;

    const currentSchema = form.getValues('telemetrySchema') || {};
    form.setValue('telemetrySchema', {
      ...currentSchema,
      [newTelemetryKey]: {
        type: 'number',
        unit: '',
        description: '',
      },
    });
    setTelemetryKeys([...telemetryKeys, newTelemetryKey]);
    setNewTelemetryKey('');
  };

  const handleRemoveTelemetry = (key: string) => {
    const currentSchema = form.getValues('telemetrySchema') || {};
    const { [key]: _, ...rest } = currentSchema;
    form.setValue('telemetrySchema', rest);
    setTelemetryKeys(telemetryKeys.filter((k) => k !== key));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: values as any,
        });
        toast({
          title: 'Device Profile actualizado',
          description: `${values.name} ha sido actualizado exitosamente.`,
        });
      } else {
        await createMutation.mutateAsync(values as any);
        toast({
          title: 'Device Profile creado',
          description: `${values.name} ha sido creado exitosamente.`,
        });
      }
      navigate('/device-profiles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el Device Profile',
        variant: 'destructive',
      });
    }
  };

  if (isEdit && isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/device-profiles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Device Profile' : 'Nuevo Device Profile'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifica los datos del perfil de dispositivo' : 'Crea un nuevo perfil de dispositivo'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CT_PLC_UNITRONICS" />
                      </FormControl>
                      <FormDescription>Código único del perfil</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PLC Unitronics CT" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción del perfil de dispositivo" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transporte *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el protocolo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransportType.MODBUS_TCP}>Modbus TCP</SelectItem>
                        <SelectItem value={TransportType.MODBUS_RTU}>Modbus RTU</SelectItem>
                        <SelectItem value={TransportType.ETHERNET_IP}>EtherNet/IP</SelectItem>
                        <SelectItem value={TransportType.S7}>Siemens S7</SelectItem>
                        <SelectItem value={TransportType.OPCUA}>OPC-UA</SelectItem>
                        <SelectItem value={TransportType.FINS}>FINS</SelectItem>
                        <SelectItem value={TransportType.MQTT}>MQTT</SelectItem>
                        <SelectItem value={TransportType.HTTP}>HTTP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schema de Telemetría</CardTitle>
              <CardDescription>
                Define las telemetrías que este tipo de dispositivo puede enviar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre de telemetría (ej: pressure)"
                  value={newTelemetryKey}
                  onChange={(e) => setNewTelemetryKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTelemetry();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTelemetry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {telemetryKeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay telemetrías definidas. Agrega al menos una.
                </p>
              ) : (
                <div className="space-y-4">
                  {telemetryKeys.map((key) => (
                    <div key={key} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium font-mono">{key}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTelemetry(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`telemetrySchema.${key}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`telemetrySchema.${key}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidad</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="PSI, °C, RPM" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`telemetrySchema.${key}.precision`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precisión</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`telemetrySchema.${key}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Descripción de la telemetría" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch(`telemetrySchema.${key}.type`) === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`telemetrySchema.${key}.min`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor Mínimo</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`telemetrySchema.${key}.max`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor Máximo</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/device-profiles')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEdit ? 'Actualizar' : 'Crear'} Device Profile
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
