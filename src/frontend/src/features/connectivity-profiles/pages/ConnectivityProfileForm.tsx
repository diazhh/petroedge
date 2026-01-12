import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useConnectivityProfile, useCreateConnectivityProfile, useUpdateConnectivityProfile } from '../api/connectivity-profiles.api';

const transformSchema = z.object({
  type: z.enum(['scale', 'offset', 'formula', 'lookup']),
  params: z.record(z.string(), z.any()),
});

const validationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  allowedValues: z.array(z.any()).optional(),
  required: z.boolean().optional(),
});

const telemetryMappingSchema = z.object({
  deviceKey: z.string().min(1, 'Device key es requerido'),
  assetComponentCode: z.string().min(1, 'Código de componente es requerido'),
  assetPropertyKey: z.string().min(1, 'Clave de propiedad es requerida'),
  transform: transformSchema.optional(),
  validation: validationSchema.optional(),
});

const formSchema = z.object({
  code: z.string().min(1, 'Código es requerido').max(50),
  name: z.string().min(1, 'Nombre es requerido').max(200),
  description: z.string().optional(),
  deviceProfileId: z.string().min(1, 'Device Profile es requerido'),
  assetTemplateId: z.string().min(1, 'Asset Template es requerido'),
  telemetryMappings: z.array(telemetryMappingSchema),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ConnectivityProfileForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: profileData, isLoading: isLoadingProfile } = useConnectivityProfile(id!);
  const createMutation = useCreateConnectivityProfile();
  const updateMutation = useUpdateConnectivityProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      deviceProfileId: '',
      assetTemplateId: '',
      telemetryMappings: [],
      metadata: {},
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
        deviceProfileId: profile.deviceProfileId,
        assetTemplateId: profile.assetTemplateId,
        telemetryMappings: profile.telemetryMappings || [],
        metadata: profile.metadata || {},
        tags: profile.tags || [],
      });
    }
  }, [profileData, isEdit, form]);

  const handleAddMapping = () => {
    const currentMappings = form.getValues('telemetryMappings') || [];
    form.setValue('telemetryMappings', [
      ...currentMappings,
      {
        deviceKey: '',
        assetComponentCode: '',
        assetPropertyKey: '',
      },
    ]);
  };

  const handleRemoveMapping = (index: number) => {
    const currentMappings = form.getValues('telemetryMappings') || [];
    form.setValue(
      'telemetryMappings',
      currentMappings.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: values,
        });
        toast({
          title: 'Connectivity Profile actualizado',
          description: `${values.name} ha sido actualizado exitosamente.`,
        });
      } else {
        await createMutation.mutateAsync(values);
        toast({
          title: 'Connectivity Profile creado',
          description: `${values.name} ha sido creado exitosamente.`,
        });
      }
      navigate('/connectivity-profiles');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el Connectivity Profile',
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

  const mappings = form.watch('telemetryMappings') || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/connectivity-profiles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Connectivity Profile' : 'Nuevo Connectivity Profile'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modificar profile existente' : 'Crear nuevo mapeo de conectividad'}
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
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="MODBUS_WELL_MAPPING" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Mapeo Modbus a Pozo" {...field} />
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
                      <Textarea
                        placeholder="Descripción del connectivity profile..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Profile</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del device profile" {...field} />
                      </FormControl>
                      <FormDescription>
                        Seleccionar device profile origen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assetTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Template</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del asset template" {...field} />
                      </FormControl>
                      <FormDescription>
                        Seleccionar asset template destino
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mapeos de Telemetría</CardTitle>
                  <CardDescription>
                    Define el mapeo entre claves de telemetría del dispositivo y propiedades del activo
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={handleAddMapping}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Mapeo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mappings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay mapeos definidos
                </p>
              ) : (
                mappings.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Mapeo {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMapping(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-[1fr,auto,1fr,auto,1fr] gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`telemetryMappings.${index}.deviceKey`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device Key</FormLabel>
                            <FormControl>
                              <Input placeholder="pressure" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <ArrowRight className="h-4 w-4 text-muted-foreground mb-3" />
                      <FormField
                        control={form.control}
                        name={`telemetryMappings.${index}.assetComponentCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Component</FormLabel>
                            <FormControl>
                              <Input placeholder="WELLHEAD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <ArrowRight className="h-4 w-4 text-muted-foreground mb-3" />
                      <FormField
                        control={form.control}
                        name={`telemetryMappings.${index}.assetPropertyKey`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Property</FormLabel>
                            <FormControl>
                              <Input placeholder="pressure_psi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h5 className="text-sm font-medium">Transformación (Opcional)</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`telemetryMappings.${index}.transform.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Transformación</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="scale">Scale</SelectItem>
                                  <SelectItem value="offset">Offset</SelectItem>
                                  <SelectItem value="formula">Formula</SelectItem>
                                  <SelectItem value="lookup">Lookup</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h5 className="text-sm font-medium">Validación (Opcional)</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`telemetryMappings.${index}.validation.min`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mínimo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`telemetryMappings.${index}.validation.max`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Máximo</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`telemetryMappings.${index}.validation.required`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0 pt-8">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Requerido</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/connectivity-profiles')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>{isEdit ? 'Actualizar' : 'Crear'} Profile</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
