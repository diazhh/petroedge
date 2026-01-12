import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useDeviceBinding, useCreateDeviceBinding, useUpdateDeviceBinding } from '../api/device-bindings.api';

const formSchema = z.object({
  dataSourceId: z.string().min(1, 'Data Source es requerido'),
  connectivityProfileId: z.string().min(1, 'Connectivity Profile es requerido'),
  digitalTwinId: z.string().min(1, 'Digital Twin es requerido'),
  customMappings: z.record(z.string(), z.any()).optional(),
  customRuleChainId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DeviceBindingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(0);

  const { data: bindingData, isLoading: isLoadingBinding } = useDeviceBinding(id!);
  const createMutation = useCreateDeviceBinding();
  const updateMutation = useUpdateDeviceBinding();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataSourceId: '',
      connectivityProfileId: '',
      digitalTwinId: '',
      customMappings: {},
      customRuleChainId: '',
      metadata: {},
      tags: [],
    },
  });

  useEffect(() => {
    if (isEdit && bindingData?.data) {
      const binding = bindingData.data;
      form.reset({
        dataSourceId: binding.dataSourceId,
        connectivityProfileId: binding.connectivityProfileId,
        digitalTwinId: binding.digitalTwinId,
        customMappings: binding.customMappings || {},
        customRuleChainId: binding.customRuleChainId || '',
        metadata: binding.metadata || {},
        tags: binding.tags || [],
      });
    }
  }, [bindingData, isEdit, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: values,
        });
        toast({
          title: 'Device Binding actualizado',
          description: 'El binding ha sido actualizado exitosamente.',
        });
      } else {
        await createMutation.mutateAsync(values);
        toast({
          title: 'Device Binding creado',
          description: 'El binding ha sido creado exitosamente.',
        });
      }
      navigate('/device-bindings');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el Device Binding',
        variant: 'destructive',
      });
    }
  };

  if (isEdit && isLoadingBinding) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const steps = [
    {
      title: 'Data Source',
      description: 'Seleccionar origen de datos',
    },
    {
      title: 'Connectivity Profile',
      description: 'Seleccionar perfil de conectividad',
    },
    {
      title: 'Digital Twin',
      description: 'Seleccionar gemelo digital',
    },
    {
      title: 'Configuración',
      description: 'Configuración adicional',
    },
  ];

  const handleNext = async () => {
    const fieldsToValidate: (keyof FormValues)[] = [];
    
    if (currentStep === 0) {
      fieldsToValidate.push('dataSourceId');
    } else if (currentStep === 1) {
      fieldsToValidate.push('connectivityProfileId');
    } else if (currentStep === 2) {
      fieldsToValidate.push('digitalTwinId');
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/device-bindings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Device Binding' : 'Nuevo Device Binding'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modificar binding existente' : 'Crear nueva vinculación de dispositivo'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted'
                }`}
              >
                {index + 1}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Data Source</CardTitle>
                <CardDescription>
                  Seleccione el origen de datos que desea vincular
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataSourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del data source" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ingrese el ID del data source configurado en el Edge Gateway
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Connectivity Profile</CardTitle>
                <CardDescription>
                  Seleccione el perfil de conectividad que define el mapeo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="connectivityProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connectivity Profile ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del connectivity profile" {...field} />
                      </FormControl>
                      <FormDescription>
                        El perfil debe ser compatible con el Device Profile del Data Source
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Digital Twin</CardTitle>
                <CardDescription>
                  Seleccione el gemelo digital destino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="digitalTwinId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digital Twin ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del digital twin" {...field} />
                      </FormControl>
                      <FormDescription>
                        El Digital Twin debe ser compatible con el Asset Template del Connectivity Profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración Adicional</CardTitle>
                <CardDescription>
                  Configuración opcional del binding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customRuleChainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Rule Chain (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID de rule chain personalizado" {...field} />
                      </FormControl>
                      <FormDescription>
                        Sobrescribe el rule chain por defecto del Connectivity Profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/device-bindings')}
              >
                Cancelar
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
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
                    <>{isEdit ? 'Actualizar' : 'Crear'} Binding</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
