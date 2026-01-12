/**
 * ROOT_TELEMETRY_PROCESSING Rule Chain Seed
 * 
 * Creates the default Rule Chain for processing telemetry from Data Sources
 * and mapping them to Digital Twins in Eclipse Ditto.
 */

import { db, rules } from '../index.js';

interface RuleChainSeedOptions {
  tenantId: string;
  createdBy?: string;
}

export async function seedRootTelemetryRuleChain(options: RuleChainSeedOptions) {
  const { tenantId, createdBy } = options;

  console.log('Creating ROOT_TELEMETRY_PROCESSING Rule Chain...');

  // Check if already exists
  const existing = await db.query.rules.findFirst({
    where: (rules, { and, eq }) => and(
      eq(rules.tenantId, tenantId),
      eq(rules.name, 'ROOT_TELEMETRY_PROCESSING')
    ),
  });

  if (existing) {
    console.log('⚠️  ROOT_TELEMETRY_PROCESSING already exists, skipping...');
    return existing;
  }

  // Define nodes (React Flow format)
  const nodes = [
    {
      id: 'node_1',
      type: 'data_source_input',
      position: { x: 100, y: 200 },
      data: {
        label: 'Data Source Input',
        config: {
          kafkaTopic: 'telemetry.raw',
          enrichWithGatewayInfo: true,
        },
      },
    },
    {
      id: 'node_2',
      type: 'resolve_binding',
      position: { x: 350, y: 200 },
      data: {
        label: 'Resolve Binding',
        config: {
          cacheTtl: 300,
          failOnMissingBinding: true,
        },
      },
    },
    {
      id: 'node_3',
      type: 'apply_mapping',
      position: { x: 600, y: 200 },
      data: {
        label: 'Apply Mapping',
        config: {
          applyTransforms: true,
        },
      },
    },
    {
      id: 'node_4',
      type: 'route_to_components',
      position: { x: 850, y: 200 },
      data: {
        label: 'Route to Components',
        config: {
          groupByThing: true,
        },
      },
    },
    {
      id: 'node_5',
      type: 'save_to_digital_twin',
      position: { x: 1100, y: 200 },
      data: {
        label: 'Save to Digital Twin',
        config: {
          writeToDitto: true,
          writeToTimescaleDB: true,
          cacheInRedis: true,
          broadcastViaWebSocket: true,
          batchSize: 100,
        },
      },
    },
    {
      id: 'node_error',
      type: 'log',
      position: { x: 600, y: 400 },
      data: {
        label: 'Error Handler',
        config: {
          level: 'error',
          includeStackTrace: true,
        },
      },
    },
  ];

  // Define connections (React Flow edges)
  const connections = [
    {
      id: 'edge_1_2',
      source: 'node_1',
      target: 'node_2',
      sourceHandle: 'success',
      targetHandle: null,
      label: 'Success',
    },
    {
      id: 'edge_2_3',
      source: 'node_2',
      target: 'node_3',
      sourceHandle: 'success',
      targetHandle: null,
      label: 'Binding Resolved',
    },
    {
      id: 'edge_3_4',
      source: 'node_3',
      target: 'node_4',
      sourceHandle: 'success',
      targetHandle: null,
      label: 'Mapping Applied',
    },
    {
      id: 'edge_4_5',
      source: 'node_4',
      target: 'node_5',
      sourceHandle: 'success',
      targetHandle: null,
      label: 'Routed',
    },
    // Error handling edges
    {
      id: 'edge_1_error',
      source: 'node_1',
      target: 'node_error',
      sourceHandle: 'failure',
      targetHandle: null,
      label: 'Error',
    },
    {
      id: 'edge_2_error',
      source: 'node_2',
      target: 'node_error',
      sourceHandle: 'failure',
      targetHandle: null,
      label: 'Error',
    },
    {
      id: 'edge_3_error',
      source: 'node_3',
      target: 'node_error',
      sourceHandle: 'failure',
      targetHandle: null,
      label: 'Error',
    },
    {
      id: 'edge_4_error',
      source: 'node_4',
      target: 'node_error',
      sourceHandle: 'failure',
      targetHandle: null,
      label: 'Error',
    },
    {
      id: 'edge_5_error',
      source: 'node_5',
      target: 'node_error',
      sourceHandle: 'failure',
      targetHandle: null,
      label: 'Error',
    },
  ];

  // Insert Rule Chain
  const [ruleChain] = await db
    .insert(rules)
    .values({
      tenantId,
      name: 'ROOT_TELEMETRY_PROCESSING',
      description: 'Default Rule Chain for processing telemetry from Data Sources and mapping to Digital Twins. This chain handles the complete flow: input → resolve binding → apply mapping → route to components → save to Ditto.',
      appliesToAssetTypes: ['DATA_SOURCE'],
      appliesToAssets: null, // Applies to all Data Sources
      nodes,
      connections,
      status: 'ACTIVE',
      priority: 100, // High priority
      config: {
        executeOnStartup: false,
        debounceMs: 0,
        maxExecutionsPerMinute: 10000,
        timeoutMs: 30000,
      },
      createdBy: createdBy || null,
    })
    .returning();

  console.log(`✅ ROOT_TELEMETRY_PROCESSING Rule Chain created: ${ruleChain.id}`);
  
  return ruleChain;
}
