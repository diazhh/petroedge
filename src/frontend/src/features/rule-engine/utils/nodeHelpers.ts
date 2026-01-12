import type { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateEdgeId(source: string, target: string): string {
  return `edge_${source}_${target}_${Date.now()}`;
}

export function createNode(
  type: string,
  label: string,
  position: { x: number; y: number },
  config: Record<string, any> = {}
): Node {
  return {
    id: generateNodeId(),
    type,
    position,
    data: {
      label,
      config,
    },
  };
}

export function createEdge(source: string, target: string, label?: string): Edge {
  return {
    id: generateEdgeId(source, target),
    source,
    target,
    label,
  };
}

export function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40,
      },
    };
  });
}

export function findConnectedNodes(nodeId: string, edges: Edge[]): {
  incoming: string[];
  outgoing: string[];
} {
  const incoming = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => edge.source);

  const outgoing = edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);

  return { incoming, outgoing };
}

export function getNodeDepth(nodeId: string, _nodes: Node[], edges: Edge[]): number {
  const visited = new Set<string>();
  
  function dfs(currentId: string, depth: number): number {
    if (visited.has(currentId)) return depth;
    visited.add(currentId);

    const { incoming } = findConnectedNodes(currentId, edges);
    if (incoming.length === 0) return depth;

    return Math.max(...incoming.map((id) => dfs(id, depth + 1)));
  }

  return dfs(nodeId, 0);
}

export function exportFlow(nodes: Node[], edges: Edge[]): string {
  const flow = {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
    })),
  };

  return JSON.stringify(flow, null, 2);
}

export function importFlow(flowJson: string): { nodes: Node[]; edges: Edge[] } {
  try {
    const flow = JSON.parse(flowJson);
    return {
      nodes: flow.nodes || [],
      edges: flow.edges || [],
    };
  } catch (error) {
    throw new Error('Invalid flow JSON');
  }
}

export function duplicateNode(node: Node, offsetX = 50, offsetY = 50): Node {
  return {
    ...node,
    id: generateNodeId(),
    position: {
      x: node.position.x + offsetX,
      y: node.position.y + offsetY,
    },
    data: {
      ...node.data,
      label: `${node.data.label} (copy)`,
    },
  };
}

export function getNodesByCategory(nodes: Node[]): Record<string, Node[]> {
  return nodes.reduce((acc, node) => {
    const category = node.type?.split('_')[0] || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(node);
    return acc;
  }, {} as Record<string, Node[]>);
}
