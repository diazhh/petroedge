import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRule, useCreateRule, useUpdateRule } from '../api';
import { useRuleEditorStore, useNodeLibraryStore } from '../stores';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { NodePalette } from '../components/editor/NodePalette';
import { NodeConfigPanel } from '../components/editor/NodeConfigPanel';
import { CustomNode } from '../components/nodes/CustomNode';
import { DEFAULT_NODE_DEFINITIONS } from '../utils/nodeRegistry';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
};

export function RuleEngineEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [ruleName, setRuleName] = useState('Nueva Regla');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleCategory, setRuleCategory] = useState('processing');

  const { data: ruleData, isLoading } = useRule(id!);
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule(id!);
  
  const { setNodes: setNodeLibrary } = useNodeLibraryStore();

  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNode,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    // updateNode,
    // deleteNode,
    selectNode,
    undo,
    redo,
    canUndo,
    canRedo,
    validateFlow,
  } = useRuleEditorStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Load node definitions on mount
  useEffect(() => {
    setNodeLibrary(DEFAULT_NODE_DEFINITIONS);
  }, [setNodeLibrary]);

  // Sync store with React Flow state
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Load rule data in edit mode
  useEffect(() => {
    if (ruleData?.data) {
      const rule = ruleData.data;
      setRuleName(rule.name);
      setRuleDescription(rule.description || '');
      setRuleCategory(rule.category);
      setStoreNodes(rule.nodes);
      setStoreEdges(rule.edges);
    }
  }, [ruleData, setStoreNodes, setStoreEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'smoothstep',
      } as Edge;
      
      setStoreEdges(addEdge(newEdge, storeEdges));
    },
    [storeEdges, setStoreEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleSave = async (activate = false) => {
    // Solo validar si hay nodos
    if (storeNodes.length > 0) {
      const validation = validateFlow();
      if (!validation.isValid) {
        toast.error(`Flujo inválido: ${validation.errors.join(', ')}`);
        return;
      }
    }

    const ruleData = {
      name: ruleName,
      description: ruleDescription,
      category: ruleCategory,
      nodes: storeNodes,
      edges: storeEdges,
      config: {
        trigger: { type: 'manual' },
        timeout: 30000,
        maxRetries: 3,
      },
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(ruleData as any);
        toast.success(activate ? 'Regla actualizada y activada' : 'Regla actualizada');
      } else {
        const result = await createMutation.mutateAsync(ruleData as any);
        toast.success(activate ? 'Regla creada y activada' : 'Regla creada');
        navigate(`/rule-engine/${result.data.id}`);
      }
    } catch (error) {
      toast.error('Error al guardar la regla');
    }
  };

  const handleTest = () => {
    toast.info('Función de prueba en desarrollo');
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          nodeType,
          label: nodeType,
          config: {},
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Cargando regla...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4 flex items-center gap-4">
          <Link to="/rule-engine">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-0"
              placeholder="Nombre de la regla"
            />
            <input
              type="text"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              className="text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-0 mt-1"
              placeholder="Descripción"
            />
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar
        onSave={() => handleSave(false)}
        onSaveAndActivate={() => handleSave(true)}
        onTest={handleTest}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onValidate={() => {
          const validation = validateFlow();
          if (validation.isValid) {
            toast.success('Flujo válido');
          } else {
            toast.error(`Flujo inválido: ${validation.errors.join(', ')}`);
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <NodePalette />

        {/* Canvas */}
        <div className="flex-1 relative" onDrop={handleDrop} onDragOver={handleDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/5"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node: Node) => {
                const nodeType = (node.data?.nodeType as string) || '';
                if (typeof nodeType === 'string' && nodeType.includes('filter')) return '#3b82f6';
                if (typeof nodeType === 'string' && nodeType.includes('transform')) return '#8b5cf6';
                if (typeof nodeType === 'string' && nodeType.includes('action')) return '#10b981';
                if (typeof nodeType === 'string' && nodeType.includes('external')) return '#f59e0b';
                if (typeof nodeType === 'string' && nodeType.includes('flow')) return '#6366f1';
                return '#6b7280';
              }}
              className="bg-background border"
            />
          </ReactFlow>
        </div>

        {/* Config Panel */}
        {selectedNode && <NodeConfigPanel />}
      </div>
    </div>
    </ReactFlowProvider>
  );
}
