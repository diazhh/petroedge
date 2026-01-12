-- ============================================================================
-- ROOT_TELEMETRY_PROCESSING Rule Chain Template
-- ============================================================================
-- 
-- This is the default Rule Chain for processing telemetry from Data Sources
-- (PLCs, RTUs, sensors) and mapping them to Digital Twins in Eclipse Ditto.
--
-- Flow:
-- 1. data_source_input → Entry point from Kafka topic 'telemetry.raw'
-- 2. resolve_binding → Resolves Device Binding + Connectivity Profile + Device Profile
-- 3. apply_mapping → Applies telemetry mappings with optional transforms
-- 4. route_to_components → Fan-out to multiple Digital Twin components
-- 5. save_to_digital_twin → Writes to Ditto + TimescaleDB + Redis + WebSocket
--
-- This template should be created once per tenant during initial setup.
-- ============================================================================

-- Insert ROOT_TELEMETRY_PROCESSING Rule Chain
-- Note: Replace 'TENANT_ID_HERE' with actual tenant ID when seeding
INSERT INTO rules (
  id,
  tenant_id,
  name,
  description,
  applies_to_asset_types,
  applies_to_assets,
  nodes,
  connections,
  status,
  priority,
  config,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TENANT_ID_HERE', -- Replace with actual tenant ID
  'ROOT_TELEMETRY_PROCESSING',
  'Default Rule Chain for processing telemetry from Data Sources and mapping to Digital Twins. This chain handles the complete flow: input → resolve binding → apply mapping → route to components → save to Ditto.',
  ARRAY['DATA_SOURCE'], -- Applies to all Data Sources
  NULL, -- Applies to all assets of type DATA_SOURCE
  -- Nodes definition (React Flow format)
  '[
    {
      "id": "node_1",
      "type": "data_source_input",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Data Source Input",
        "config": {
          "kafkaTopic": "telemetry.raw",
          "enrichWithGatewayInfo": true
        }
      }
    },
    {
      "id": "node_2",
      "type": "resolve_binding",
      "position": { "x": 350, "y": 200 },
      "data": {
        "label": "Resolve Binding",
        "config": {
          "cacheTtl": 300,
          "failOnMissingBinding": true
        }
      }
    },
    {
      "id": "node_3",
      "type": "apply_mapping",
      "position": { "x": 600, "y": 200 },
      "data": {
        "label": "Apply Mapping",
        "config": {
          "applyTransforms": true
        }
      }
    },
    {
      "id": "node_4",
      "type": "route_to_components",
      "position": { "x": 850, "y": 200 },
      "data": {
        "label": "Route to Components",
        "config": {
          "groupByThing": true
        }
      }
    },
    {
      "id": "node_5",
      "type": "save_to_digital_twin",
      "position": { "x": 1100, "y": 200 },
      "data": {
        "label": "Save to Digital Twin",
        "config": {
          "writeToDitto": true,
          "writeToTimescaleDB": true,
          "cacheInRedis": true,
          "broadcastViaWebSocket": true,
          "batchSize": 100
        }
      }
    },
    {
      "id": "node_error",
      "type": "log",
      "position": { "x": 600, "y": 400 },
      "data": {
        "label": "Error Handler",
        "config": {
          "level": "error",
          "includeStackTrace": true
        }
      }
    }
  ]'::jsonb,
  -- Connections definition (React Flow edges)
  '[
    {
      "id": "edge_1_2",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": "success",
      "targetHandle": null,
      "label": "Success"
    },
    {
      "id": "edge_2_3",
      "source": "node_2",
      "target": "node_3",
      "sourceHandle": "success",
      "targetHandle": null,
      "label": "Binding Resolved"
    },
    {
      "id": "edge_3_4",
      "source": "node_3",
      "target": "node_4",
      "sourceHandle": "success",
      "targetHandle": null,
      "label": "Mapping Applied"
    },
    {
      "id": "edge_4_5",
      "source": "node_4",
      "target": "node_5",
      "sourceHandle": "success",
      "targetHandle": null,
      "label": "Routed"
    },
    {
      "id": "edge_1_error",
      "source": "node_1",
      "target": "node_error",
      "sourceHandle": "failure",
      "targetHandle": null,
      "label": "Error"
    },
    {
      "id": "edge_2_error",
      "source": "node_2",
      "target": "node_error",
      "sourceHandle": "failure",
      "targetHandle": null,
      "label": "Error"
    },
    {
      "id": "edge_3_error",
      "source": "node_3",
      "target": "node_error",
      "sourceHandle": "failure",
      "targetHandle": null,
      "label": "Error"
    },
    {
      "id": "edge_4_error",
      "source": "node_4",
      "target": "node_error",
      "sourceHandle": "failure",
      "targetHandle": null,
      "label": "Error"
    },
    {
      "id": "edge_5_error",
      "source": "node_5",
      "target": "node_error",
      "sourceHandle": "failure",
      "targetHandle": null,
      "label": "Error"
    }
  ]'::jsonb,
  'ACTIVE', -- Status: ACTIVE (ready to use)
  100, -- Priority: High (100)
  '{
    "executeOnStartup": false,
    "debounceMs": 0,
    "maxExecutionsPerMinute": 10000,
    "timeoutMs": 30000
  }'::jsonb,
  NULL, -- created_by (system template)
  NOW(),
  NOW()
);

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
--
-- 1. This template should be seeded once per tenant during initial setup
-- 2. Replace 'TENANT_ID_HERE' with the actual tenant UUID
-- 3. The Rule Chain ID can be referenced in:
--    - Device Profiles (defaultRuleChainId)
--    - Connectivity Profiles (ruleChainId)
--    - Device Bindings (customRuleChainId)
--
-- 4. To get the created Rule Chain ID:
--    SELECT id FROM rules WHERE name = 'ROOT_TELEMETRY_PROCESSING' AND tenant_id = 'YOUR_TENANT_ID';
--
-- 5. Example: Set as default for a Device Profile:
--    UPDATE device_profiles 
--    SET default_rule_chain_id = (
--      SELECT id FROM rules WHERE name = 'ROOT_TELEMETRY_PROCESSING' AND tenant_id = 'YOUR_TENANT_ID'
--    )
--    WHERE code = 'CT_PLC_UNITRONICS';
--
-- ============================================================================
