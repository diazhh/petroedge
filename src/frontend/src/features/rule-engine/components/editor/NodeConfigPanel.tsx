import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRuleEditorStore } from '../../stores';
import {
  ScriptFilterConfig,
  ThresholdFilterConfig,
  MessageTypeSwitchConfig,
  FetchAssetAttributesConfig,
  FetchAssetTelemetryConfig,
  ScriptTransformConfig,
  MathConfig,
  FormulaConfig,
  SaveTimeseriesConfig,
  UpdateDittoFeatureConfig,
  CreateAlarmConfig,
  LogConfig,
  KafkaPublishConfig,
  RuleChainConfig,
} from '../config';

export function NodeConfigPanel() {
  const { selectedNode, selectNode, updateNode, deleteNode } = useRuleEditorStore();

  if (!selectedNode) return null;

  const handleLabelChange = (label: string) => {
    updateNode(selectedNode.id, { label });
  };

  const handleDeleteNode = () => {
    if (confirm('¿Estás seguro de eliminar este nodo?')) {
      deleteNode(selectedNode.id);
      selectNode(null);
    }
  };

  const renderNodeConfig = () => {
    const nodeType = selectedNode.data.nodeType;

    switch (nodeType) {
      case 'script_filter':
        return <ScriptFilterConfig nodeId={selectedNode.id} />;
      case 'threshold_filter':
        return <ThresholdFilterConfig nodeId={selectedNode.id} />;
      case 'message_type_switch':
        return <MessageTypeSwitchConfig nodeId={selectedNode.id} />;
      case 'fetch_asset_attributes':
        return <FetchAssetAttributesConfig nodeId={selectedNode.id} />;
      case 'fetch_asset_telemetry':
        return <FetchAssetTelemetryConfig nodeId={selectedNode.id} />;
      case 'script_transform':
        return <ScriptTransformConfig nodeId={selectedNode.id} />;
      case 'math':
        return <MathConfig nodeId={selectedNode.id} />;
      case 'formula':
        return <FormulaConfig nodeId={selectedNode.id} />;
      case 'save_timeseries':
        return <SaveTimeseriesConfig nodeId={selectedNode.id} />;
      case 'update_ditto_feature':
        return <UpdateDittoFeatureConfig nodeId={selectedNode.id} />;
      case 'create_alarm':
        return <CreateAlarmConfig nodeId={selectedNode.id} />;
      case 'log':
        return <LogConfig nodeId={selectedNode.id} />;
      case 'kafka_publish':
        return <KafkaPublishConfig nodeId={selectedNode.id} />;
      case 'rule_chain':
        return <RuleChainConfig nodeId={selectedNode.id} />;
      default:
        return (
          <div className="text-sm text-muted-foreground">
            <p>Configuración específica para este tipo de nodo estará disponible próximamente.</p>
            <p className="mt-2">Tipo: <code className="text-xs bg-muted px-1 py-0.5 rounded">{String(nodeType)}</code></p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configuración de Nodo</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectNode(null)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="node-label">Etiqueta</Label>
                <Input
                  id="node-label"
                  value={String(selectedNode.data?.label || '')}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Nombre del nodo"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input
                  value={String(selectedNode.data?.nodeType || selectedNode.type || '')}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={selectedNode.id}
                  disabled
                  className="bg-muted text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Node-specific Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuración</CardTitle>
              <CardDescription className="text-xs">
                Configuración específica del tipo de nodo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderNodeConfig()}
            </CardContent>
          </Card>

          {/* Position Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Posición</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    value={Math.round(selectedNode.position.x)}
                    disabled
                    className="bg-muted text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    value={Math.round(selectedNode.position.y)}
                    disabled
                    className="bg-muted text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDeleteNode}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar Nodo
        </Button>
      </div>
    </div>
  );
}
