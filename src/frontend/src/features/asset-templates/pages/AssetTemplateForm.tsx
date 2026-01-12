import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAssetTemplate, useCreateAssetTemplate, useUpdateAssetTemplate } from '../api/asset-templates.api';
import { useAssetTypes } from '@/features/asset-types';

const componentSchema = z.object({
  code: z.string().min(1, 'Código es requerido'),
  assetTypeCode: z.string().min(1, 'Tipo de activo es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  required: z.boolean(),
  description: z.string().optional(),
  defaultProperties: z.record(z.string(), z.any()).optional(),
});

const relationshipSchema = z.object({
  from: z.string().min(1, 'Origen es requerido'),
  to: z.string().min(1, 'Destino es requerido'),
  type: z.string().min(1, 'Tipo de relación es requerido'),
  metadata: z.record(z.string(), z.any()).optional(),
});

const formSchema = z.object({
  code: z.string().min(1, 'Código es requerido').max(50),
  name: z.string().min(1, 'Nombre es requerido').max(200),
  description: z.string().optional(),
  rootAssetTypeId: z.string().min(1, 'Tipo de activo raíz es requerido'),
  components: z.array(componentSchema),
  relationships: z.array(relationshipSchema),
  defaultProperties: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssetTemplateForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: templateData, isLoading: isLoadingTemplate } = useAssetTemplate(id!);
  const { data: assetTypesData } = useAssetTypes({ isActive: true });
  const createMutation = useCreateAssetTemplate();
  const updateMutation = useUpdateAssetTemplate();

  const assetTypes = assetTypesData?.data || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      rootAssetTypeId: '',
      components: [],
      relationships: [],
      defaultProperties: {},
      tags: [],
    },
  });

  useEffect(() => {
    if (isEdit && templateData?.data) {
      const template = templateData.data;
      form.reset({
        code: template.code,
        name: template.name,
        description: template.description || '',
        rootAssetTypeId: template.rootAssetTypeId,
        components: template.components || [],
        relationships: template.relationships || [],
        defaultProperties: template.defaultProperties || {},
        tags: template.tags || [],
      });
    }
  }, [templateData, isEdit, form]);

  const handleAddComponent = () => {
    const currentComponents = form.getValues('components') || [];
    form.setValue('components', [
      ...currentComponents,
      {
        code: '',
        assetTypeCode: '',
        name: '',
        required: false,
        description: '',
      },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    const currentComponents = form.getValues('components') || [];
    form.setValue(
      'components',
      currentComponents.filter((_, i) => i !== index)
    );
  };

  const handleAddRelationship = () => {
    const currentRelationships = form.getValues('relationships') || [];
    form.setValue('relationships', [
      ...currentRelationships,
      {
        from: '',
        to: '',
        type: '',
      },
    ]);
  };

  const handleRemoveRelationship = (index: number) => {
    const currentRelationships = form.getValues('relationships') || [];
    form.setValue(
      'relationships',
      currentRelationships.filter((_, i) => i !== index)
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
          title: 'Asset Template actualizado',
          description: `${values.name} ha sido actualizado exitosamente.`,
        });
      } else {
        await createMutation.mutateAsync(values);
        toast({
          title: 'Asset Template creado',
          description: `${values.name} ha sido creado exitosamente.`,
        });
      }
      navigate('/asset-templates');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el Asset Template',
        variant: 'destructive',
      });
    }
  };

  if (isEdit && isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const components = form.watch('components') || [];
  const relationships = form.watch('relationships') || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/asset-templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Asset Template' : 'Nuevo Asset Template'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modificar template existente' : 'Crear nuevo template de activos'}
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
                        <Input placeholder="WELL_TEMPLATE" {...field} />
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
                        <Input placeholder="Plantilla de Pozo Completo" {...field} />
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
                        placeholder="Descripción del template..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rootAssetTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Activo Raíz</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de activo raíz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipo de activo que será la raíz de la jerarquía
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Componentes</CardTitle>
                  <CardDescription>
                    Define los componentes que forman parte de este template
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={handleAddComponent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Componente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {components.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay componentes definidos
                </p>
              ) : (
                components.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Componente {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveComponent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`components.${index}.code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código</FormLabel>
                            <FormControl>
                              <Input placeholder="WELLHEAD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`components.${index}.assetTypeCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Activo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {assetTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.code}>
                                    {type.name} ({type.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`components.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Cabezal de Pozo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`components.${index}.required`}
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
                      <FormField
                        control={form.control}
                        name={`components.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Input placeholder="Descripción del componente..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relaciones</CardTitle>
                  <CardDescription>
                    Define las relaciones entre componentes
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={handleAddRelationship}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Relación
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {relationships.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay relaciones definidas
                </p>
              ) : (
                relationships.map((_, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Relación {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRelationship(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.from`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desde</FormLabel>
                            <FormControl>
                              <Input placeholder="WELL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <FormControl>
                              <Input placeholder="HAS_COMPONENT" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`relationships.${index}.to`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hacia</FormLabel>
                            <FormControl>
                              <Input placeholder="WELLHEAD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
              onClick={() => navigate('/asset-templates')}
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
                <>{isEdit ? 'Actualizar' : 'Crear'} Template</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
