import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsset, useAssetType, useUpdateAssetAttributes } from '../api';
import { useUpdateAssetInfo } from '../api/assets.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pencil } from 'lucide-react';
import { AttributeEditor } from '../components/AttributeEditor';
import { TelemetryManager } from '../components/TelemetryManager';
import { ComputedFieldsManager } from '../components/ComputedFieldsManager';
import { AssetInfoEditor } from '../components/AssetInfoEditor';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [editingInfo, setEditingInfo] = useState(false);

  const { data: assetData, isLoading: loadingAsset } = useAsset(id!);
  const asset = assetData?.data;

  const { data: assetTypeData, isLoading: loadingType } = useAssetType(asset?.assetTypeId || '');
  const assetType = assetTypeData?.data;

  const updateAttributes = useUpdateAssetAttributes();
  const updateInfo = useUpdateAssetInfo();

  const handleSaveAttributes = async (attributes: Record<string, any>, reason?: string) => {
    await updateAttributes.mutateAsync({ id: id!, attributes, reason });
  };

  const handleSaveInfo = async (data: any) => {
    await updateInfo.mutateAsync({ id: id!, data });
    setEditingInfo(false);
  };

  if (loadingAsset || loadingType) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Asset no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/infrastructure/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{asset.name}</h1>
            <Badge variant="outline">{asset.code}</Badge>
            <Badge
              variant={
                asset.status === 'ACTIVE'
                  ? 'default'
                  : asset.status === 'MAINTENANCE'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {asset.status}
            </Badge>
          </div>
          {asset.description && (
            <p className="text-muted-foreground mt-2">{asset.description}</p>
          )}
          {assetType && (
            <p className="text-sm text-muted-foreground mt-1">
              Tipo: <span className="font-medium">{assetType.name}</span>
            </p>
          )}
        </div>
        <Button onClick={() => setEditingInfo(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar Asset
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="attributes">Atributos</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetría</TabsTrigger>
          <TabsTrigger value="computed">Campos Calculados</TabsTrigger>
        </TabsList>

        {/* Tab: Información General */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">ID:</span>
                  <p className="text-sm text-muted-foreground font-mono">{asset.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Código:</span>
                  <p className="text-sm text-muted-foreground">{asset.code}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Estado:</span>
                  <p className="text-sm text-muted-foreground">{asset.status}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Tipo de Asset:</span>
                  <p className="text-sm text-muted-foreground">
                    {assetType?.name || asset.assetTypeId}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {asset.latitude && asset.longitude ? (
                  <>
                    <div>
                      <span className="text-sm font-medium">Latitud:</span>
                      <p className="text-sm text-muted-foreground">{asset.latitude}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Longitud:</span>
                      <p className="text-sm text-muted-foreground">{asset.longitude}</p>
                    </div>
                    {asset.elevationFt && (
                      <div>
                        <span className="text-sm font-medium">Elevación:</span>
                        <p className="text-sm text-muted-foreground">{asset.elevationFt} ft</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ubicación geográfica</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Creado:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(asset.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Actualizado:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(asset.updatedAt).toLocaleString()}
                  </p>
                </div>
                {asset.tags && asset.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {asset.parentAssetId && (
              <Card>
                <CardHeader>
                  <CardTitle>Jerarquía</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <span className="text-sm font-medium">Asset Padre:</span>
                    <p className="text-sm text-muted-foreground font-mono">
                      {asset.parentAssetId}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Propiedades Fijas */}
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Fijas</CardTitle>
              <CardDescription>
                Propiedades definidas en el schema del tipo de asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(asset.properties || {}).length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(asset.properties).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <span className="text-sm font-medium">{key}:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin propiedades definidas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Atributos Dinámicos */}
        <TabsContent value="attributes" className="space-y-4">
          <AttributeEditor
            attributes={asset.attributes || {}}
            onSave={handleSaveAttributes}
            isLoading={updateAttributes.isPending}
          />
        </TabsContent>

        {/* Tab: Telemetría */}
        <TabsContent value="telemetry" className="space-y-4">
          <TelemetryManager assetId={id!} assetTypeId={asset.assetTypeId} />
        </TabsContent>

        {/* Tab: Campos Calculados */}
        <TabsContent value="computed" className="space-y-4">
          <ComputedFieldsManager assetId={id!} assetTypeId={asset.assetTypeId} />
        </TabsContent>
      </Tabs>

      {/* Asset Info Editor Dialog */}
      <AssetInfoEditor
        open={editingInfo}
        onOpenChange={setEditingInfo}
        asset={asset}
        onSave={handleSaveInfo}
        isLoading={updateInfo.isPending}
      />
    </div>
  );
}
