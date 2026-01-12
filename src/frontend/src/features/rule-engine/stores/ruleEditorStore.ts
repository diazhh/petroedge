import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { RuleNode, RuleEdge } from '../types';

interface RuleEditorState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedNode: Node | null;
  isDirty: boolean;
  isValidating: boolean;
  validationErrors: string[];
  history: {
    past: Array<{ nodes: Node[]; edges: Edge[] }>;
    future: Array<{ nodes: Node[]; edges: Edge[] }>;
  };
  
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Partial<Node['data']>) => void;
  deleteNode: (nodeId: string) => void;
  
  selectNode: (nodeId: string | null) => void;
  
  setDirty: (dirty: boolean) => void;
  setValidating: (validating: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
  
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  validateFlow: () => { isValid: boolean; errors: string[] };
  
  saveToHistory: () => void;
  
  loadRule: (nodes: RuleNode[], edges: RuleEdge[]) => void;
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNode: null,
  isDirty: false,
  isValidating: false,
  validationErrors: [],
  history: {
    past: [],
    future: [],
  },
};

export const useRuleEditorStore = create<RuleEditorState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setNodes: (nodes) => set({ nodes, isDirty: true }),
      
      setEdges: (edges) => set({ edges, isDirty: true }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
          isDirty: true,
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
          isDirty: true,
        });
      },

      onConnect: (connection) => {
        set({
          edges: addEdge(connection, get().edges),
          isDirty: true,
        });
      },

      addNode: (node) => {
        get().saveToHistory();
        set({
          nodes: [...get().nodes, node],
          isDirty: true,
        });
      },

      updateNode: (nodeId, data) => {
        get().saveToHistory();
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          isDirty: true,
        });
      },

      deleteNode: (nodeId) => {
        get().saveToHistory();
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
          isDirty: true,
        });
      },

      selectNode: (nodeId) => {
        const selectedNode = nodeId ? get().nodes.find(n => n.id === nodeId) || null : null;
        set({ selectedNodeId: nodeId, selectedNode });
      },

      setDirty: (dirty) => set({ isDirty: dirty }),
      
      setValidating: (validating) => set({ isValidating: validating }),
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      saveToHistory: () => {
        const { nodes, edges, history } = get();
        set({
          history: {
            past: [...history.past, { nodes, edges }],
            future: [],
          },
        });
      },

      undo: () => {
        const { history, nodes, edges } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
          nodes: previous.nodes,
          edges: previous.edges,
          history: {
            past: newPast,
            future: [{ nodes, edges }, ...history.future],
          },
          isDirty: true,
        });
      },

      redo: () => {
        const { history, nodes, edges } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
          nodes: next.nodes,
          edges: next.edges,
          history: {
            past: [...history.past, { nodes, edges }],
            future: newFuture,
          },
          isDirty: true,
        });
      },

      canUndo: () => get().history.past.length > 0,
      
      canRedo: () => get().history.future.length > 0,

      validateFlow: () => {
        const { nodes, edges } = get();
        const errors: string[] = [];

        if (nodes.length === 0) {
          errors.push('El flujo debe tener al menos un nodo');
        }

        const nodeIds = new Set(nodes.map(n => n.id));
        edges.forEach(edge => {
          if (!nodeIds.has(edge.source)) {
            errors.push(`Edge con source inválido: ${edge.source}`);
          }
          if (!nodeIds.has(edge.target)) {
            errors.push(`Edge con target inválido: ${edge.target}`);
          }
        });

        const orphanNodes = nodes.filter(node => {
          const hasIncoming = edges.some(e => e.target === node.id);
          const hasOutgoing = edges.some(e => e.source === node.id);
          return !hasIncoming && !hasOutgoing && nodes.length > 1;
        });

        if (orphanNodes.length > 0) {
          errors.push(`${orphanNodes.length} nodo(s) sin conexiones`);
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      loadRule: (ruleNodes, ruleEdges) => {
        const nodes: Node[] = ruleNodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        }));

        const edges: Edge[] = ruleEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          label: edge.label,
        }));

        set({
          nodes,
          edges,
          isDirty: false,
          selectedNodeId: null,
          history: {
            past: [],
            future: [],
          },
        });
      },

      reset: () => set(initialState),
    }),
    { name: 'RuleEditorStore' }
  )
);
