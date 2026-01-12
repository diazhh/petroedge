import { 
  Save, 
  Play, 
  TestTube, 
  Undo2, 
  Redo2, 
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useReactFlow } from '@xyflow/react';

interface EditorToolbarProps {
  onSave: () => void;
  onSaveAndActivate: () => void;
  onTest: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onValidate: () => void;
}

export function EditorToolbar({
  onSave,
  onSaveAndActivate,
  onTest,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onValidate,
}: EditorToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export flow');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import flow');
  };

  return (
    <div className="border-b bg-background p-2 flex items-center gap-2">
      {/* Save Actions */}
      <div className="flex items-center gap-1">
        <Button onClick={onSave} variant="outline" size="sm">
          <Save className="w-4 h-4 mr-2" />
          Guardar
        </Button>
        <Button onClick={onSaveAndActivate} size="sm">
          <Play className="w-4 h-4 mr-2" />
          Guardar y Activar
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Test & Validate */}
      <div className="flex items-center gap-1">
        <Button onClick={onTest} variant="outline" size="sm">
          <TestTube className="w-4 h-4 mr-2" />
          Probar
        </Button>
        <Button onClick={onValidate} variant="outline" size="sm">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Validar
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button 
          onClick={onUndo} 
          variant="ghost" 
          size="sm"
          disabled={!canUndo}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button 
          onClick={onRedo} 
          variant="ghost" 
          size="sm"
          disabled={!canRedo}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button onClick={() => zoomIn()} variant="ghost" size="sm">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button onClick={() => zoomOut()} variant="ghost" size="sm">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button onClick={() => fitView()} variant="ghost" size="sm">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Import/Export */}
      <div className="flex items-center gap-1">
        <Button onClick={handleExport} variant="ghost" size="sm">
          <Download className="w-4 h-4" />
        </Button>
        <Button onClick={handleImport} variant="ghost" size="sm">
          <Upload className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
