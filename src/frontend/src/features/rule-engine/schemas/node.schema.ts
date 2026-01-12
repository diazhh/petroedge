import { z } from 'zod';

export const nodeDefinitionSchema = z.object({
  type: z.string(),
  category: z.enum(['input', 'filter', 'enrichment', 'transform', 'action', 'external', 'flow']),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  configSchema: z.record(z.string(), z.any()),
  inputs: z.number(),
  outputs: z.number(),
  documentation: z.string().optional(),
  examples: z.array(z.any()).optional(),
});

export const scriptFilterConfigSchema = z.object({
  script: z.string().min(1, 'El script es requerido'),
  timeout: z.number().min(100).max(30000).optional(),
});

export const thresholdFilterConfigSchema = z.object({
  field: z.string().min(1, 'El campo es requerido'),
  operator: z.enum(['>', '>=', '<', '<=', '==', '!=']),
  value: z.number(),
});

export const sendEmailConfigSchema = z.object({
  to: z.array(z.string().email()).min(1, 'Debe especificar al menos un destinatario'),
  subject: z.string().min(1, 'El asunto es requerido'),
  body: z.string().min(1, 'El cuerpo es requerido'),
  template: z.string().optional(),
});

export const createAlarmConfigSchema = z.object({
  alarmType: z.string().min(1, 'El tipo de alarma es requerido'),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INDETERMINATE']),
  message: z.string().min(1, 'El mensaje es requerido'),
  propagate: z.boolean().optional(),
});

export const saveTimeseriesConfigSchema = z.object({
  assetId: z.string().optional(),
  useMessageAssetId: z.boolean().optional(),
  keys: z.array(z.string()).optional(),
});

export const mathConfigSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'abs', 'round', 'floor', 'ceil']),
  field1: z.string().min(1, 'El campo 1 es requerido'),
  field2: z.string().optional(),
  value: z.number().optional(),
  resultField: z.string().min(1, 'El campo de resultado es requerido'),
});

export const formulaConfigSchema = z.object({
  formula: z.string().min(1, 'La fórmula es requerida'),
  resultField: z.string().min(1, 'El campo de resultado es requerido'),
  variables: z.record(z.string(), z.string()).optional(),
});

export const mqttPublishConfigSchema = z.object({
  topic: z.string().min(1, 'El topic es requerido'),
  qos: z.enum(['0', '1', '2']).optional(),
  retain: z.boolean().optional(),
  payload: z.string().optional(),
});

export const restApiCallConfigSchema = z.object({
  url: z.string().url('URL inválida'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().min(100).max(60000).optional(),
});

export const nodeConfigSchemas = {
  script_filter: scriptFilterConfigSchema,
  threshold_filter: thresholdFilterConfigSchema,
  send_email: sendEmailConfigSchema,
  create_alarm: createAlarmConfigSchema,
  save_timeseries: saveTimeseriesConfigSchema,
  math: mathConfigSchema,
  formula: formulaConfigSchema,
  mqtt_publish: mqttPublishConfigSchema,
  rest_api_call: restApiCallConfigSchema,
};

export type ScriptFilterConfig = z.infer<typeof scriptFilterConfigSchema>;
export type ThresholdFilterConfig = z.infer<typeof thresholdFilterConfigSchema>;
export type SendEmailConfig = z.infer<typeof sendEmailConfigSchema>;
export type CreateAlarmConfig = z.infer<typeof createAlarmConfigSchema>;
export type SaveTimeseriesConfig = z.infer<typeof saveTimeseriesConfigSchema>;
export type MathConfig = z.infer<typeof mathConfigSchema>;
export type FormulaConfig = z.infer<typeof formulaConfigSchema>;
export type MqttPublishConfig = z.infer<typeof mqttPublishConfigSchema>;
export type RestApiCallConfig = z.infer<typeof restApiCallConfigSchema>;
