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
import { useCtUnit, useCreateCtUnit, useUpdateCtUnit } from '../api';
import { ctUnitSchema } from '../schemas';
import { CT_UNIT_STATUS_OPTIONS } from '../constants';
import type { CtUnitFormData } from '../types';
import { toast } from 'sonner';

export function CtUnitForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('coiled-tubing');
  const navigate = useNavigate();
  const isEdit = id !== 'new';

  const { data: unit, isLoading } = useCtUnit(isEdit ? id! : '');
  const createUnit = useCreateCtUnit();
  const updateUnit = useUpdateCtUnit();

  const form = useForm<CtUnitFormData>({
    resolver: zodResolver(ctUnitSchema),
    defaultValues: {
      unit_number: '',
      manufacturer: '',
      model: '',
      year: new Date().getFullYear(),
      status: 'active',
      max_pressure_psi: 0,
      max_flow_rate_bpm: 0,
      power_rating_hp: 0,
      injector_capacity_lbs: 0,
      current_location: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        unit_number: unit.unit_number,
        manufacturer: unit.manufacturer,
        model: unit.model,
        year: unit.year,
        status: unit.status,
        max_pressure_psi: unit.max_pressure_psi,
        max_flow_rate_bpm: unit.max_flow_rate_bpm,
        power_rating_hp: unit.power_rating_hp,
        injector_capacity_lbs: unit.injector_capacity_lbs,
        current_location: unit.current_location || '',
        last_maintenance_date: unit.last_maintenance_date,
        next_maintenance_date: unit.next_maintenance_date,
        notes: unit.notes || '',
      });
    }
  }, [unit, form]);

  const onSubmit = async (data: CtUnitFormData) => {
    try {
      if (isEdit) {
        await updateUnit.mutateAsync({ id: id!, data });
        toast.success(t('units.update_success'));
      } else {
        await createUnit.mutateAsync(data);
        toast.success(t('units.create_success'));
      }
      navigate('/coiled-tubing/units');
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
    { label: t('units.title'), href: '/coiled-tubing/units' },
    { label: isEdit ? t('units.edit_title') : t('units.create_title') },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? t('units.edit_title') : t('units.create_title')}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('units.tabs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unit_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.unit_number')}</FormLabel>
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
                      <FormLabel>{t('units.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CT_UNIT_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`units.status_${option.value}`)}
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
                      <FormLabel>{t('units.manufacturer')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.model')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.year')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="current_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.current_location')}</FormLabel>
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
              <CardTitle>{t('units.tabs.specs')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="max_pressure_psi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.max_pressure')}</FormLabel>
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
                  name="max_flow_rate_bpm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.max_flow_rate')}</FormLabel>
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
                  name="power_rating_hp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.power_rating')}</FormLabel>
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
                  name="injector_capacity_lbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.injector_capacity')}</FormLabel>
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
              <CardTitle>{t('units.tabs.maintenance')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="last_maintenance_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.last_maintenance')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_maintenance_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('units.next_maintenance')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                    <FormLabel>{t('units.notes')}</FormLabel>
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
              onClick={() => navigate('/coiled-tubing/units')}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={createUnit.isPending || updateUnit.isPending}>
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
