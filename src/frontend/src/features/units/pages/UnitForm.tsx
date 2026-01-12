import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  useUnit,
  useCreateUnit,
  useUpdateUnit,
} from '../api/units.api';
import { useMagnitudes } from '@/features/magnitudes/api/magnitudes.api';

const formSchema = z.object({
  magnitudeId: z.string().min(1, 'La magnitud es requerida'),
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  symbol: z.string().min(1, 'El símbolo es requerido').max(20),
  description: z.string().optional(),
  isSiUnit: z.boolean(),
  conversionFactor: z.string().optional(),
  conversionOffset: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function UnitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: unit } = useUnit(id!);
  const { data: magnitudes } = useMagnitudes({ isActive: true });
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      magnitudeId: '',
      code: '',
      name: '',
      symbol: '',
      description: '',
      isSiUnit: false,
      conversionFactor: '1',
      conversionOffset: '0',
    },
  });

  const isSiUnit = form.watch('isSiUnit');

  useEffect(() => {
    if (unit) {
      form.reset({
        magnitudeId: unit.magnitudeId,
        code: unit.code,
        name: unit.name,
        symbol: unit.symbol,
        description: unit.description || '',
        isSiUnit: unit.isSiUnit,
        conversionFactor: unit.conversionFactor || '1',
        conversionOffset: unit.conversionOffset || '0',
      });
    }
  }, [unit, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateUnit.mutateAsync({ id: id!, data });
        toast({
          title: 'Unidad actualizada',
          description: 'La unidad ha sido actualizada correctamente',
        });
      } else {
        await createUnit.mutateAsync(data);
        toast({
          title: 'Unidad creada',
          description: 'La unidad ha sido creada correctamente',
        });
      }

      navigate('/units');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Error al guardar la unidad',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/units')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Editar Unidad' : 'Nueva Unidad'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifica los datos de la unidad' : 'Crea una nueva unidad de medida'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="magnitudeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Magnitud *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una magnitud" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {magnitudes?.data?.map((magnitude: any) => (
                      <SelectItem key={magnitude.id} value={magnitude.id}>
                        {magnitude.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Magnitud física a la que pertenece esta unidad
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
                  <Input placeholder="PSI, BAR, CELSIUS..." {...field} />
                </FormControl>
                <FormDescription>
                  Código único de la unidad (mayúsculas, sin espacios)
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
                  <Input placeholder="Libras por pulgada cuadrada, Bar, Celsius..." {...field} />
                </FormControl>
                <FormDescription>Nombre descriptivo de la unidad</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Símbolo *</FormLabel>
                <FormControl>
                  <Input placeholder="psi, bar, °C..." {...field} />
                </FormControl>
                <FormDescription>Símbolo de la unidad</FormDescription>
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
                    placeholder="Descripción de la unidad..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>Información adicional sobre la unidad</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isSiUnit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Unidad del Sistema Internacional (SI)
                  </FormLabel>
                  <FormDescription>
                    Marca esta opción si es la unidad base del SI para esta magnitud
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!isSiUnit && (
            <>
              <FormField
                control={form.control}
                name="conversionFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factor de Conversión</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="1.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Factor para convertir a la unidad SI (valor_SI = valor * factor + offset)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversionOffset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offset de Conversión</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Offset para conversiones (ej: 273.15 para Celsius a Kelvin)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={createUnit.isPending || updateUnit.isPending}>
              {isEdit ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/units')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
