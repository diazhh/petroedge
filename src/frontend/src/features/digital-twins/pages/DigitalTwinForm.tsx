import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateThing, useUpdateThing, useThing } from '../api/digital-twins.api';
import type { ThingType } from '../types/digital-twins.types';

const thingSchema = z.object({
  thingId: z.string().min(1, 'Thing ID es requerido').regex(/^[a-zA-Z0-9._:-]+$/, 'Solo letras, números, puntos, guiones y dos puntos'),
  namespace: z.string().min(1, 'Namespace es requerido'),
  name: z.string().min(1, 'Nombre es requerido'),
  type: z.enum(['BASIN', 'FIELD', 'RESERVOIR', 'WELL', 'EQUIPMENT', 'TOOL', 'DEVICE', 'SENSOR', 'ACTUATOR', 'CUSTOM']),
  description: z.string().optional(),
});

type ThingFormData = z.infer<typeof thingSchema>;

interface AttributeField {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

interface FeatureField {
  id: string;
  properties: AttributeField[];
}

export function DigitalTwinForm() {
  const navigate = useNavigate();
  const { thingId } = useParams<{ thingId: string }>();
  const isEditing = !!thingId;

  const decodedThingId = thingId ? decodeURIComponent(thingId) : undefined;
  const { data: existingThing, isLoading: loadingThing } = useThing(decodedThingId);
  const createMutation = useCreateThing();
  const updateMutation = useUpdateThing(decodedThingId || '');

  const [attributes, setAttributes] = useState<AttributeField[]>([]);
  const [features, setFeatures] = useState<FeatureField[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ThingFormData>({
    resolver: zodResolver(thingSchema),
    defaultValues: {
      namespace: 'com.petroedge',
      type: 'CUSTOM',
    },
  });

  const watchedNamespace = watch('namespace');
  const watchedName = watch('name');

  useEffect(() => {
    if (existingThing) {
      const [namespace, localId] = existingThing.thingId.split(':');
      setValue('thingId', existingThing.thingId);
      setValue('namespace', namespace);
      setValue('name', existingThing.attributes?.name || localId);
      setValue('type', existingThing.attributes?.type || 'CUSTOM');
      setValue('description', existingThing.attributes?.description || '');

      if (existingThing.attributes) {
        const attrs = Object.entries(existingThing.attributes)
          .filter(([key]) => !['name', 'type', 'description'].includes(key))
          .map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            type: typeof value === 'object' ? 'json' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
          }));
        setAttributes(attrs as AttributeField[]);
      }

      if (existingThing.features) {
        const feats = Object.entries(existingThing.features).map(([id, feature]) => ({
          id,
          properties: Object.entries(feature.properties || {}).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            type: typeof value === 'object' ? 'json' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
          })),
        }));
        setFeatures(feats as FeatureField[]);
      }
    }
  }, [existingThing, setValue]);

  useEffect(() => {
    if (!isEditing && watchedNamespace && watchedName) {
      const sanitizedName = watchedName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      setValue('thingId', `${watchedNamespace}:${sanitizedName}`);
    }
  }, [watchedNamespace, watchedName, isEditing, setValue]);

  const addAttribute = () => {
    setAttributes([...attributes, { key: '', value: '', type: 'string' }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof AttributeField, value: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    setAttributes(updated);
  };

  const addFeature = () => {
    setFeatures([...features, { id: '', properties: [] }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeatureId = (index: number, id: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], id };
    setFeatures(updated);
  };

  const addFeatureProperty = (featureIndex: number) => {
    const updated = [...features];
    updated[featureIndex].properties.push({ key: '', value: '', type: 'string' });
    setFeatures(updated);
  };

  const removeFeatureProperty = (featureIndex: number, propIndex: number) => {
    const updated = [...features];
    updated[featureIndex].properties = updated[featureIndex].properties.filter((_, i) => i !== propIndex);
    setFeatures(updated);
  };

  const updateFeatureProperty = (featureIndex: number, propIndex: number, field: keyof AttributeField, value: string) => {
    const updated = [...features];
    updated[featureIndex].properties[propIndex] = {
      ...updated[featureIndex].properties[propIndex],
      [field]: value,
    };
    setFeatures(updated);
  };

  const parseValue = (value: string, type: AttributeField['type']): any => {
    if (!value) return null;
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  const onSubmit = async (data: ThingFormData) => {
    try {
      const attributesObj: Record<string, any> = {
        name: data.name,
        type: data.type,
      };

      if (data.description) {
        attributesObj.description = data.description;
      }

      attributes.forEach((attr) => {
        if (attr.key) {
          attributesObj[attr.key] = parseValue(attr.value, attr.type);
        }
      });

      const featuresObj: Record<string, { properties: Record<string, any> }> = {};
      features.forEach((feature) => {
        if (feature.id) {
          const props: Record<string, any> = {};
          feature.properties.forEach((prop) => {
            if (prop.key) {
              props[prop.key] = parseValue(prop.value, prop.type);
            }
          });
          featuresObj[feature.id] = { properties: props };
        }
      });

      if (isEditing) {
        await updateMutation.mutateAsync({
          attributes: attributesObj,
          features: Object.keys(featuresObj).length > 0 ? featuresObj : undefined,
        });
        toast.success('Digital Twin actualizado exitosamente');
      } else {
        await createMutation.mutateAsync({
          thingId: data.thingId,
          attributes: attributesObj,
          features: Object.keys(featuresObj).length > 0 ? featuresObj : undefined,
        });
        toast.success('Digital Twin creado exitosamente');
      }

      navigate('/digital-twins');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar Digital Twin');
    }
  };

  if (loadingThing) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/digital-twins')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Digital Twins
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Editar Digital Twin' : 'Crear Digital Twin'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Actualiza la información del gemelo digital' : 'Crea un nuevo gemelo digital en Eclipse Ditto'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del Digital Twin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namespace">Namespace</Label>
                <Input
                  id="namespace"
                  {...register('namespace')}
                  disabled={isEditing}
                  placeholder="com.petroedge"
                />
                {errors.namespace && (
                  <p className="text-sm text-red-500">{errors.namespace.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Mi Asset"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thingId">Thing ID</Label>
              <Input
                id="thingId"
                {...register('thingId')}
                disabled={isEditing}
                placeholder="com.petroedge:my-asset"
              />
              {errors.thingId && (
                <p className="text-sm text-red-500">{errors.thingId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formato: namespace:local-id (se genera automáticamente)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as ThingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIN">Cuenca</SelectItem>
                  <SelectItem value="FIELD">Campo</SelectItem>
                  <SelectItem value="RESERVOIR">Yacimiento</SelectItem>
                  <SelectItem value="WELL">Pozo</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipo</SelectItem>
                  <SelectItem value="TOOL">Herramienta</SelectItem>
                  <SelectItem value="DEVICE">Dispositivo</SelectItem>
                  <SelectItem value="SENSOR">Sensor</SelectItem>
                  <SelectItem value="ACTUATOR">Actuador</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Descripción opcional"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="attributes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attributes">Atributos</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="attributes">
            <Card>
              <CardHeader>
                <CardTitle>Atributos Personalizados</CardTitle>
                <CardDescription>
                  Propiedades estáticas del Digital Twin (metadatos, configuración)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Clave"
                      value={attr.key}
                      onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={attr.type}
                      onValueChange={(value) => updateAttribute(index, 'type', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Valor"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAttribute} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Atributo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  Capacidades del Digital Twin con propiedades dinámicas (telemetría, estado)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {features.map((feature, featureIndex) => (
                  <Card key={featureIndex}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Feature ID"
                          value={feature.id}
                          onChange={(e) => updateFeatureId(featureIndex, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(featureIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {feature.properties.map((prop, propIndex) => (
                        <div key={propIndex} className="flex gap-2 items-start">
                          <Input
                            placeholder="Propiedad"
                            value={prop.key}
                            onChange={(e) =>
                              updateFeatureProperty(featureIndex, propIndex, 'key', e.target.value)
                            }
                            className="flex-1"
                          />
                          <Select
                            value={prop.type}
                            onValueChange={(value) =>
                              updateFeatureProperty(featureIndex, propIndex, 'type', value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Valor"
                            value={prop.value}
                            onChange={(e) =>
                              updateFeatureProperty(featureIndex, propIndex, 'value', e.target.value)
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFeatureProperty(featureIndex, propIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFeatureProperty(featureIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Propiedad
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addFeature} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Feature
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Actualizar' : 'Crear'} Digital Twin
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/digital-twins')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
