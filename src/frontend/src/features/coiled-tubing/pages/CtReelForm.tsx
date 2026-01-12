import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useCtReel, useCreateCtReel, useUpdateCtReel } from '../api';
import { ctReelSchema } from '../schemas';
import { CT_REEL_STATUS_OPTIONS } from '../constants';
import type { CtReelFormData } from '../types';
import { toast } from 'sonner';

export function CtReelForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const isEdit = id !== 'new';

  const { data: reel, isLoading } = useCtReel(isEdit ? id! : '');
  const createReel = useCreateCtReel();
  const updateReel = useUpdateCtReel();

  const form = useForm<CtReelFormData>({
    resolver: zodResolver(ctReelSchema),
    defaultValues: {
      reel_number: '',
      manufacturer: '',
      outer_diameter_in: 0,
      inner_diameter_in: 0,
      wall_thickness_in: 0,
      total_length_ft: 0,
      material_grade: '',
      yield_strength_psi: 0,
      tensile_strength_psi: 0,
      status: 'available',
      notes: '',
    },
  });

  useEffect(() => {
    if (reel) {
      form.reset({
        reel_number: reel.reel_number,
        manufacturer: reel.manufacturer,
        outer_diameter_in: reel.outer_diameter_in,
        inner_diameter_in: reel.inner_diameter_in,
        wall_thickness_in: reel.wall_thickness_in,
        total_length_ft: reel.total_length_ft,
        material_grade: reel.material_grade,
        yield_strength_psi: reel.yield_strength_psi,
        tensile_strength_psi: reel.tensile_strength_psi,
        status: reel.status,
        current_unit_id: reel.current_unit_id,
        manufacture_date: reel.manufacture_date,
        last_inspection_date: reel.last_inspection_date,
        next_inspection_date: reel.next_inspection_date,
        notes: reel.notes || '',
      });
    }
  }, [reel, form]);

  const onSubmit = async (data: CtReelFormData) => {
    try {
      if (isEdit) {
        await updateReel.mutateAsync({ id: id!, data });
        toast.success(t('reels.update_success'));
      } else {
        await createReel.mutateAsync(data);
        toast.success(t('reels.create_success'));
      }
      navigate('/coiled-tubing/reels');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: t('module_name'), href: '/coiled-tubing' },
    { label: t('reels.title'), href: '/coiled-tubing/reels' },
    { label: isEdit ? t('reels.edit_title') : t('reels.create_title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? t('reels.edit_title') : t('reels.create_title')}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reel_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.reel_number')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CT_REEL_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`reels.status_${option.value}`)}
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
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.manufacturer')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="material_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.material_grade')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reels.tabs.specs')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="outer_diameter_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.outer_diameter')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inner_diameter_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.inner_diameter')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wall_thickness_in"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.wall_thickness')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_length_ft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.total_length')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yield_strength_psi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.yield_strength')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tensile_strength_psi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.tensile_strength')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacture_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.manufacture_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_inspection_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.last_inspection')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_inspection_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reels.next_inspection')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reels.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/coiled-tubing/reels')}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={createReel.isPending || updateReel.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
