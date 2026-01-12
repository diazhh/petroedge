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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useMagnitude,
  useCreateMagnitude,
  useUpdateMagnitude,
} from '../api/magnitudes.api';
import { useMagnitudeCategories } from '@/features/magnitude-categories/api/magnitude-categories.api';

const formSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  symbol: z.string().max(20).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function MagnitudeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: magnitude } = useMagnitude(id!);
  const { data: categories } = useMagnitudeCategories({ isActive: true });
  const createMagnitude = useCreateMagnitude();
  const updateMagnitude = useUpdateMagnitude();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      code: '',
      name: '',
      description: '',
      symbol: '',
    },
  });

  useEffect(() => {
    if (magnitude) {
      form.reset({
        categoryId: magnitude.categoryId,
        code: magnitude.code,
        name: magnitude.name,
        description: magnitude.description || '',
        symbol: magnitude.symbol || '',
      });
    }
  }, [magnitude, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateMagnitude.mutateAsync({ id: id!, data });
        toast({
          title: 'Magnitud actualizada',
          description: 'La magnitud ha sido actualizada correctamente',
        });
      } else {
        await createMagnitude.mutateAsync(data);
        toast({
          title: 'Magnitud creada',
          description: 'La magnitud ha sido creada correctamente',
        });
      }

      navigate('/magnitudes');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al guardar la magnitud',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/magnitudes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Magnitud' : 'Nueva Magnitud'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifica los datos de la magnitud' : 'Crea una nueva magnitud física'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.data?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categoría a la que pertenece esta magnitud
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input placeholder="PRESSURE, TEMPERATURE, LENGTH..." {...field} />
                </FormControl>
                <FormDescription>
                  Código único de la magnitud (mayúsculas, sin espacios)
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
                  <Input placeholder="Presión, Temperatura, Longitud..." {...field} />
                </FormControl>
                <FormDescription>Nombre descriptivo de la magnitud</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Símbolo</FormLabel>
                <FormControl>
                  <Input placeholder="P, T, L..." {...field} />
                </FormControl>
                <FormDescription>Símbolo físico de la magnitud</FormDescription>
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
                    placeholder="Descripción de la magnitud..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>Información adicional sobre la magnitud</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={createMagnitude.isPending || updateMagnitude.isPending}>
              {isEdit ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/magnitudes')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
