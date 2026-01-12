import type { NodeDefinition, NodeCategory } from '../types';
import { NODE_TYPES, NODE_CATEGORIES } from '../types';

export const DEFAULT_NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: NODE_TYPES.INPUT.KAFKA_INPUT,
    category: 'input',
    name: 'Kafka Input',
    description: 'Recibe mensajes desde un topic de Kafka',
    icon: 'inbox',
    configSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic de Kafka' },
        groupId: { type: 'string', description: 'Consumer Group ID' },
      },
      required: ['topic'],
    },
    inputs: 0,
    outputs: 1,
  },
  {
    type: NODE_TYPES.FILTER.SCRIPT_FILTER,
    category: 'filter',
    name: 'Script Filter',
    description: 'Filtra mensajes usando un script JavaScript',
    icon: 'code',
    configSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'Script JavaScript que retorna true/false' },
        timeout: { type: 'number', description: 'Timeout en ms', default: 5000 },
      },
      required: ['script'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.FILTER.THRESHOLD_FILTER,
    category: 'filter',
    name: 'Threshold Filter',
    description: 'Filtra mensajes basado en umbrales',
    icon: 'gauge',
    configSchema: {
      type: 'object',
      properties: {
        field: { type: 'string', description: 'Campo a evaluar' },
        operator: { type: 'string', enum: ['>', '>=', '<', '<=', '==', '!='] },
        value: { type: 'number', description: 'Valor umbral' },
      },
      required: ['field', 'operator', 'value'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.ENRICHMENT.FETCH_ASSET_ATTRIBUTES,
    category: 'enrichment',
    name: 'Fetch Asset Attributes',
    description: 'Obtiene atributos de un asset desde Ditto',
    icon: 'database',
    configSchema: {
      type: 'object',
      properties: {
        assetId: { type: 'string', description: 'ID del asset' },
        attributes: { type: 'array', items: { type: 'string' } },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.TRANSFORM.SCRIPT_TRANSFORM,
    category: 'transform',
    name: 'Script Transform',
    description: 'Transforma mensajes usando JavaScript',
    icon: 'wand',
    configSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'Script de transformación' },
      },
      required: ['script'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.TRANSFORM.MATH,
    category: 'transform',
    name: 'Math Operation',
    description: 'Realiza operaciones matemáticas',
    icon: 'calculator',
    configSchema: {
      type: 'object',
      properties: {
        operation: { 
          type: 'string', 
          enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'abs', 'round'] 
        },
        field1: { type: 'string' },
        field2: { type: 'string' },
        value: { type: 'number' },
        resultField: { type: 'string' },
      },
      required: ['operation', 'field1', 'resultField'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.LOG,
    category: 'action',
    name: 'Log',
    description: 'Registra mensajes en los logs',
    icon: 'file-text',
    configSchema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        message: { type: 'string' },
      },
      required: ['level', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.CREATE_ALARM,
    category: 'action',
    name: 'Create Alarm',
    description: 'Crea una alarma en el sistema',
    icon: 'bell',
    configSchema: {
      type: 'object',
      properties: {
        alarmType: { type: 'string' },
        severity: { type: 'string', enum: ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING'] },
        message: { type: 'string' },
        propagate: { type: 'boolean', default: false },
      },
      required: ['alarmType', 'severity', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.SEND_EMAIL,
    category: 'action',
    name: 'Send Email',
    description: 'Envía un correo electrónico',
    icon: 'mail',
    configSchema: {
      type: 'object',
      properties: {
        to: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        template: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.SAVE_TIMESERIES,
    category: 'action',
    name: 'Save Timeseries',
    description: 'Guarda datos de series temporales',
    icon: 'trending-up',
    configSchema: {
      type: 'object',
      properties: {
        assetId: { type: 'string' },
        useMessageAssetId: { type: 'boolean', default: true },
        keys: { type: 'array', items: { type: 'string' } },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.MQTT_PUBLISH,
    category: 'external',
    name: 'MQTT Publish',
    description: 'Publica mensajes a un broker MQTT',
    icon: 'send',
    configSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        qos: { type: 'string', enum: ['0', '1', '2'], default: '0' },
        retain: { type: 'boolean', default: false },
      },
      required: ['topic'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.REST_API_CALL,
    category: 'external',
    name: 'REST API Call',
    description: 'Realiza llamadas a APIs REST externas',
    icon: 'globe',
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        headers: { type: 'object' },
        body: { type: 'string' },
        timeout: { type: 'number', default: 5000 },
      },
      required: ['url', 'method'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.FLOW.RULE_CHAIN,
    category: 'flow',
    name: 'Rule Chain',
    description: 'Ejecuta otra cadena de reglas',
    icon: 'git-branch',
    configSchema: {
      type: 'object',
      properties: {
        ruleChainId: { type: 'string' },
      },
      required: ['ruleChainId'],
    },
    inputs: 1,
    outputs: 1,
  },
  // ============ FILTER NODES (adicionales) ============
  {
    type: NODE_TYPES.FILTER.MESSAGE_TYPE_SWITCH,
    category: 'filter',
    name: 'Message Type Switch',
    description: 'Enruta mensajes según su tipo',
    icon: 'split',
    configSchema: {
      type: 'object',
      properties: {
        messageTypes: { type: 'array', items: { type: 'string' } },
      },
    },
    inputs: 1,
    outputs: 3,
  },
  {
    type: NODE_TYPES.FILTER.CHECK_RELATION,
    category: 'filter',
    name: 'Check Relation',
    description: 'Verifica relaciones entre entidades',
    icon: 'link',
    configSchema: {
      type: 'object',
      properties: {
        relationType: { type: 'string' },
        direction: { type: 'string', enum: ['from', 'to'] },
      },
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.FILTER.GEOFENCING,
    category: 'filter',
    name: 'Geofencing Filter',
    description: 'Filtra por geocerca GPS',
    icon: 'map-pin',
    configSchema: {
      type: 'object',
      properties: {
        latField: { type: 'string' },
        lonField: { type: 'string' },
        polygons: { type: 'array' },
      },
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.FILTER.RATE_LIMIT,
    category: 'filter',
    name: 'Rate Limit',
    description: 'Limita la tasa de mensajes',
    icon: 'timer',
    configSchema: {
      type: 'object',
      properties: {
        maxMessages: { type: 'number' },
        windowSeconds: { type: 'number' },
      },
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.FILTER.DEBOUNCE,
    category: 'filter',
    name: 'Debounce',
    description: 'Elimina mensajes duplicados en ventana de tiempo',
    icon: 'filter',
    configSchema: {
      type: 'object',
      properties: {
        windowMs: { type: 'number' },
        keyField: { type: 'string' },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  // ============ ENRICHMENT NODES (adicionales) ============
  {
    type: NODE_TYPES.ENRICHMENT.FETCH_ASSET_TELEMETRY,
    category: 'enrichment',
    name: 'Fetch Asset Telemetry',
    description: 'Obtiene telemetría de un asset',
    icon: 'activity',
    configSchema: {
      type: 'object',
      properties: {
        assetId: { type: 'string' },
        telemetryKeys: { type: 'array', items: { type: 'string' } },
        fromCache: { type: 'boolean', default: true },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ENRICHMENT.FETCH_RELATED_ASSETS,
    category: 'enrichment',
    name: 'Fetch Related Assets',
    description: 'Obtiene assets relacionados',
    icon: 'git-branch',
    configSchema: {
      type: 'object',
      properties: {
        relationType: { type: 'string' },
        direction: { type: 'string', enum: ['from', 'to'] },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ENRICHMENT.ORIGINATOR_ATTRIBUTES,
    category: 'enrichment',
    name: 'Originator Attributes',
    description: 'Enriquece con atributos del originador',
    icon: 'user',
    configSchema: {
      type: 'object',
      properties: {
        attributeKeys: { type: 'array', items: { type: 'string' } },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ENRICHMENT.TENANT_ATTRIBUTES,
    category: 'enrichment',
    name: 'Tenant Attributes',
    description: 'Enriquece con atributos del tenant',
    icon: 'building',
    configSchema: {
      type: 'object',
      properties: {
        attributeKeys: { type: 'array', items: { type: 'string' } },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  // ============ TRANSFORM NODES (adicionales) ============
  {
    type: NODE_TYPES.TRANSFORM.FORMULA,
    category: 'transform',
    name: 'Formula',
    description: 'Evalúa fórmulas matemáticas complejas',
    icon: 'function-square',
    configSchema: {
      type: 'object',
      properties: {
        formula: { type: 'string' },
        variables: { type: 'object' },
        resultField: { type: 'string' },
      },
      required: ['formula', 'resultField'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.TRANSFORM.UNIT_CONVERSION,
    category: 'transform',
    name: 'Unit Conversion',
    description: 'Convierte unidades de medida',
    icon: 'repeat',
    configSchema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        fromUnit: { type: 'string' },
        toUnit: { type: 'string' },
        resultField: { type: 'string' },
      },
      required: ['field', 'fromUnit', 'toUnit'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.TRANSFORM.CHANGE_ORIGINATOR,
    category: 'transform',
    name: 'Change Originator',
    description: 'Cambia el originador del mensaje',
    icon: 'user-check',
    configSchema: {
      type: 'object',
      properties: {
        originatorSource: { type: 'string' },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  // ============ ACTION NODES (adicionales) ============
  {
    type: NODE_TYPES.ACTION.CLEAR_ALARM,
    category: 'action',
    name: 'Clear Alarm',
    description: 'Limpia una alarma existente',
    icon: 'bell-off',
    configSchema: {
      type: 'object',
      properties: {
        alarmType: { type: 'string' },
      },
      required: ['alarmType'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.SAVE_ATTRIBUTES,
    category: 'action',
    name: 'Save Attributes',
    description: 'Guarda atributos de un asset',
    icon: 'save',
    configSchema: {
      type: 'object',
      properties: {
        attributes: { type: 'object' },
      },
      required: ['attributes'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.UPDATE_DITTO_FEATURE,
    category: 'action',
    name: 'Update Ditto Feature',
    description: 'Actualiza una feature en Ditto',
    icon: 'refresh-cw',
    configSchema: {
      type: 'object',
      properties: {
        featureId: { type: 'string' },
        propertyPath: { type: 'string' },
        valueExpr: { type: 'string' },
      },
      required: ['featureId', 'propertyPath'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.RPC_CALL,
    category: 'action',
    name: 'RPC Call',
    description: 'Realiza llamada RPC a dispositivo',
    icon: 'phone',
    configSchema: {
      type: 'object',
      properties: {
        method: { type: 'string' },
        params: { type: 'object' },
        timeout: { type: 'number', default: 5000 },
      },
      required: ['method'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.ACTION.GENERATOR,
    category: 'action',
    name: 'Generator',
    description: 'Genera mensajes periódicos',
    icon: 'repeat',
    configSchema: {
      type: 'object',
      properties: {
        periodSeconds: { type: 'number' },
        messageTemplate: { type: 'object' },
      },
      required: ['periodSeconds'],
    },
    inputs: 0,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.AGGREGATE,
    category: 'action',
    name: 'Aggregate',
    description: 'Agrega datos en ventanas de tiempo',
    icon: 'bar-chart',
    configSchema: {
      type: 'object',
      properties: {
        windowSize: { type: 'number' },
        windowType: { type: 'string', enum: ['tumbling', 'sliding'] },
        aggregations: { type: 'array' },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.ACTION.CALCULATE_DELTA,
    category: 'action',
    name: 'Calculate Delta',
    description: 'Calcula diferencia entre valores consecutivos',
    icon: 'trending-up',
    configSchema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        resultField: { type: 'string' },
        absolute: { type: 'boolean', default: false },
      },
      required: ['field', 'resultField'],
    },
    inputs: 1,
    outputs: 1,
  },
  // ============ EXTERNAL NODES (adicionales) ============
  {
    type: NODE_TYPES.EXTERNAL.KAFKA_PUBLISH,
    category: 'external',
    name: 'Kafka Publish',
    description: 'Publica mensaje a Kafka',
    icon: 'send',
    configSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        key: { type: 'string' },
        partition: { type: 'number' },
      },
      required: ['topic'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.SLACK,
    category: 'external',
    name: 'Slack Notification',
    description: 'Envía notificación a Slack',
    icon: 'message-square',
    configSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
        message: { type: 'string' },
        mentionUsers: { type: 'array', items: { type: 'string' } },
      },
      required: ['channel', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.AWS_SNS,
    category: 'external',
    name: 'AWS SNS',
    description: 'Publica a AWS SNS',
    icon: 'cloud',
    configSchema: {
      type: 'object',
      properties: {
        topicArn: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['topicArn', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.AWS_SQS,
    category: 'external',
    name: 'AWS SQS',
    description: 'Envía mensaje a AWS SQS',
    icon: 'cloud',
    configSchema: {
      type: 'object',
      properties: {
        queueUrl: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['queueUrl', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.WEBHOOK,
    category: 'external',
    name: 'Webhook',
    description: 'Envía webhook HTTP',
    icon: 'webhook',
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string', enum: ['POST', 'PUT'], default: 'POST' },
        secret: { type: 'string' },
      },
      required: ['url'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.EXTERNAL.TWILIO_SMS,
    category: 'external',
    name: 'Twilio SMS',
    description: 'Envía SMS via Twilio',
    icon: 'smartphone',
    configSchema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['to', 'message'],
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.EXTERNAL.MODBUS_WRITE,
    category: 'external',
    name: 'Modbus Write',
    description: 'Escribe a dispositivo Modbus',
    icon: 'cpu',
    configSchema: {
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'number', default: 502 },
        unitId: { type: 'number' },
        address: { type: 'number' },
        value: { type: 'number' },
      },
      required: ['host', 'unitId', 'address', 'value'],
    },
    inputs: 1,
    outputs: 2,
  },
  {
    type: NODE_TYPES.EXTERNAL.OPCUA_WRITE,
    category: 'external',
    name: 'OPC-UA Write',
    description: 'Escribe a servidor OPC-UA',
    icon: 'server',
    configSchema: {
      type: 'object',
      properties: {
        endpoint: { type: 'string' },
        nodeId: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['endpoint', 'nodeId', 'value'],
    },
    inputs: 1,
    outputs: 2,
  },
  // ============ FLOW NODES (adicionales) ============
  {
    type: NODE_TYPES.FLOW.MERGE,
    category: 'flow',
    name: 'Merge',
    description: 'Combina múltiples flujos',
    icon: 'git-merge',
    configSchema: {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: ['first', 'all', 'latest'] },
      },
    },
    inputs: 3,
    outputs: 1,
  },
  {
    type: NODE_TYPES.FLOW.SPLIT,
    category: 'flow',
    name: 'Split',
    description: 'Divide el flujo en múltiples salidas',
    icon: 'git-branch',
    configSchema: {
      type: 'object',
      properties: {
        outputs: { type: 'number', minimum: 2, maximum: 10 },
      },
    },
    inputs: 1,
    outputs: 3,
  },
  {
    type: NODE_TYPES.FLOW.CHECKPOINT,
    category: 'flow',
    name: 'Checkpoint',
    description: 'Punto de control en el flujo',
    icon: 'flag',
    configSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        saveState: { type: 'boolean', default: false },
      },
    },
    inputs: 1,
    outputs: 1,
  },
  {
    type: NODE_TYPES.FLOW.BATCH,
    category: 'flow',
    name: 'Batch',
    description: 'Agrupa mensajes en lotes',
    icon: 'package',
    configSchema: {
      type: 'object',
      properties: {
        batchSize: { type: 'number', minimum: 1 },
        timeoutMs: { type: 'number' },
      },
    },
    inputs: 1,
    outputs: 1,
  },
];

export function getNodeColor(category: NodeCategory): string {
  const colors: Record<NodeCategory, string> = {
    input: '#3b82f6',
    filter: '#f59e0b',
    enrichment: '#8b5cf6',
    transform: '#10b981',
    action: '#ef4444',
    external: '#06b6d4',
    flow: '#6366f1',
  };
  return colors[category] || '#6b7280';
}

export function getNodeIcon(type: string): string {
  const node = DEFAULT_NODE_DEFINITIONS.find((n) => n.type === type);
  return node?.icon || 'box';
}

export function getCategoryLabel(category: NodeCategory): string {
  return NODE_CATEGORIES[category]?.label || category;
}

export function getCategoryDescription(category: NodeCategory): string {
  return NODE_CATEGORIES[category]?.description || '';
}
