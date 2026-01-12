import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IconPicker } from '@/components/ui/icon-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { useToast } from '@/hooks/use-toast';
import {
  useMagnitudeCategory,
  useCreateMagnitudeCategory,
  useUpdateMagnitudeCategory,
} from '../api/magnitude-categories.api';

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MagnitudeCategoryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: category } = useMagnitudeCategory(id!);
  const createCategory = useCreateMagnitudeCategory();
  const updateCategory = useUpdateMagnitudeCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        code: category.code,
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3b82f6',
      });
    }
  }, [category, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: id!, data });
        toast({
          title: 'Categoría actualizada',
          description: 'La categoría ha sido actualizada correctamente',
        });
      } else {
        await createCategory.mutateAsync(data);
        toast({
          title: 'Categoría creada',
          description: 'La categoría ha sido creada correctamente',
        });
      }

      navigate('/magnitude-categories');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al guardar la categoría',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/magnitude-categories')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de magnitudes'}
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
                  <Input placeholder="LENGTH, PRESSURE, TEMPERATURE..." {...field} />
                </FormControl>
                <FormDescription>
                  Código único de la categoría (mayúsculas, sin espacios)
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
                  <Input placeholder="Longitud, Presión, Temperatura..." {...field} />
                </FormControl>
                <FormDescription>Nombre descriptivo de la categoría</FormDescription>
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
                    placeholder="Descripción detallada de la categoría..."
                    rows={3}
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
                  <FormDescription>Icono para representar la categoría</FormDescription>
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
                  <FormDescription>Color para identificar la categoría</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
              {isEdit ? 'Actualizar' : 'Crear'} Categoría
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/magnitude-categories')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
