import type { Node, Edge } from '@xyflow/react';
import type { ValidationError, ValidationResult } from '../types';

export function validateFlow(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (nodes.length === 0) {
    errors.push({
      type: 'empty_flow',
      message: 'El flujo debe tener al menos un nodo',
    });
    return { valid: false, errors };
  }

  const inputNodes = nodes.filter((n) => n.type === 'kafka_input' || n.type === 'input');
  if (inputNodes.length === 0) {
    errors.push({
      type: 'missing_input',
      message: 'El flujo debe tener al menos un nodo de entrada',
    });
  }

  const connectedNodes = new Set<string>();
  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const orphanNodes = nodes.filter((n) => !connectedNodes.has(n.id) && nodes.length > 1);
  if (orphanNodes.length > 0) {
    errors.push({
      type: 'orphan_nodes',
      message: `Nodos sin conexiones: ${orphanNodes.map((n) => n.data.label || n.id).join(', ')}`,
      nodeIds: orphanNodes.map((n) => n.id),
    });
  }

  if (hasCycles(nodes, edges)) {
    errors.push({
      type: 'cycle_detected',
      message: 'El flujo contiene ciclos. Usa el nodo "checkpoint" para ciclos intencionales',
    });
  }

  const invalidConnections = validateConnections(nodes, edges);
  errors.push(...invalidConnections);

  return {
    valid: errors.length === 0,
    errors,
  };
}

function hasCycles(nodes: Node[], edges: Edge[]): boolean {
  const graph = new Map<string, string[]>();
  
  nodes.forEach((node) => {
    graph.set(node.id, []);
  });

  edges.forEach((edge) => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return true;
      }
    }
  }

  return false;
}

function validateConnections(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode) {
      errors.push({
        type: 'invalid_connection',
        message: `Nodo origen no encontrado: ${edge.source}`,
      });
    }

    if (!targetNode) {
      errors.push({
        type: 'invalid_connection',
        message: `Nodo destino no encontrado: ${edge.target}`,
      });
    }
  });

  return errors;
}

export function validateNodeConfig(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const label = node.data?.label as string | undefined;

  if (!label || (typeof label === 'string' && label.trim() === '')) {
    errors.push({
      type: 'invalid_node_config',
      message: `El nodo ${node.id} debe tener un nombre`,
      nodeIds: [node.id],
    });
  }

  return errors;
}

export function getFlowStats(nodes: Node[], edges: Edge[]) {
  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType: nodes.reduce((acc, node) => {
      const type = node.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgConnectionsPerNode: nodes.length > 0 ? edges.length / nodes.length : 0,
  };
}
