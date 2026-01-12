import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconPicker } from '@/components/ui/icon-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { useToast } from '@/hooks/use-toast';
import {
  useAssetType,
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
} from '../api/asset-types.api';
import { SchemaEditor, type AssetTypeSchema } from '../components/SchemaEditor';

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  parentTypeId: z.string().optional(),
  fixedSchema: z.record(z.string(), z.any()).optional(),
  attributeSchema: z.record(z.string(), z.any()).optional(),
  telemetrySchema: z.record(z.string(), z.any()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssetTypeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: assetType } = useAssetType(id!);
  const { data: parentTypesData } = useAssetTypes({ isActive: true });
  const createAssetType = useCreateAssetType();
  const updateAssetType = useUpdateAssetType();

  const [fixedSchema, setFixedSchema] = useState<AssetTypeSchema>({});
  const [attributeSchema, setAttributeSchema] = useState<AssetTypeSchema>({});
  const [telemetrySchema, setTelemetrySchema] = useState<AssetTypeSchema>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      icon: '',
      color: '',
      parentTypeId: '',
      fixedSchema: {},
      attributeSchema: {},
      telemetrySchema: {},
    },
  });

  useEffect(() => {
    if (assetType) {
      form.reset({
        code: assetType.code,
        name: assetType.name,
        description: assetType.description || '',
        icon: assetType.icon || '',
        color: assetType.color || '',
        parentTypeId: assetType.parentTypeId || '',
        fixedSchema: assetType.fixedSchema || {},
        attributeSchema: assetType.attributeSchema || {},
        telemetrySchema: assetType.telemetrySchema || {},
      });
      setFixedSchema(assetType.fixedSchema || {});
      setAttributeSchema(assetType.attributeSchema || {});
      setTelemetrySchema(assetType.telemetrySchema || {});
    }
  }, [assetType, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        parentTypeId: data.parentTypeId || undefined,
        fixedSchema,
        attributeSchema,
        telemetrySchema,
      };

      if (isEdit) {
        await updateAssetType.mutateAsync({ id: id!, data: payload });
        toast({
          title: 'Tipo de activo actualizado',
          description: 'El tipo de activo ha sido actualizado correctamente',
        });
      } else {
        await createAssetType.mutateAsync(payload);
        toast({
          title: 'Tipo de activo creado',
          description: 'El tipo de activo ha sido creado correctamente',
        });
      }

      navigate('/asset-types');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al guardar el tipo de activo',
        variant: 'destructive',
      });
    }
  };

  const parentTypes = parentTypesData?.data.filter((type) => type.id !== id) || [];

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/asset-types')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Tipo de Activo' : 'Nuevo Tipo de Activo'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifica los datos del tipo de activo' : 'Crea un nuevo tipo de activo'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input placeholder="WELL, CT_REEL, PUMP..." {...field} />
                </FormControl>
                <FormDescription>
                  Código único del tipo de activo (mayúsculas, sin espacios)
                </FormDescription>
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
                  <Input placeholder="Pozo, Carrete CT, Bomba..." {...field} />
                </FormControl>
                <FormDescription>Nombre descriptivo del tipo de activo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del tipo de activo..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Padre</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo padre (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin tipo padre</SelectItem>
                    {parentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tipo padre para heredar propiedades (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona un icono"
                    />
                  </FormControl>
                  <FormDescription>Icono para representar este tipo de activo</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona un color"
                    />
                  </FormControl>
                  <FormDescription>Color para identificar este tipo de activo</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Tabs defaultValue="fixed" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fixed">Propiedades Fijas</TabsTrigger>
              <TabsTrigger value="attributes">Atributos Dinámicos</TabsTrigger>
              <TabsTrigger value="telemetry">Telemetrías</TabsTrigger>
            </TabsList>

            <TabsContent value="fixed" className="mt-6">
              <SchemaEditor
                title="Fixed Schema"
                description="Propiedades fijas que siempre deben tener los activos de este tipo"
                schema={fixedSchema}
                onChange={setFixedSchema}
              />
            </TabsContent>

            <TabsContent value="attributes" className="mt-6">
              <SchemaEditor
                title="Attribute Schema"
                description="Atributos dinámicos configurables para los activos"
                schema={attributeSchema}
                onChange={setAttributeSchema}
              />
            </TabsContent>

            <TabsContent value="telemetry" className="mt-6">
              <SchemaEditor
                title="Telemetry Schema"
                description="Telemetrías en tiempo real que pueden enviar los activos"
                schema={telemetrySchema}
                onChange={setTelemetrySchema}
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 mt-8">
            <Button type="submit" disabled={createAssetType.isPending || updateAssetType.isPending}>
              {isEdit ? 'Actualizar' : 'Crear'} Tipo de Activo
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/asset-types')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
