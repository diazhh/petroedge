import { useMemo } from 'react';
import { z } from 'zod';

export function useNodeValidation(nodeType: string, config: Record<string, any>) {
  const schema = useMemo(() => {
    switch (nodeType) {
      case 'script_filter':
        return z.object({
          script: z.string().min(1, 'El script es requerido'),
        });

      case 'threshold_filter':
        return z.object({
          field: z.string().min(1, 'El campo es requerido'),
          operator: z.enum(['>', '>=', '<', '<=', '==', '!=']),
          value: z.number(),
        });

      case 'message_type_switch':
        return z.object({
          routes: z.array(z.object({
            messageType: z.string(),
            outputLabel: z.string(),
          })).min(1, 'Debe haber al menos una ruta'),
        });

      case 'fetch_asset_attributes':
        return z.object({
          assetType: z.string().optional(),
          attributes: z.array(z.string()).min(1, 'Debe especificar al menos un atributo'),
          scope: z.enum(['SERVER_SCOPE', 'SHARED_SCOPE', 'CLIENT_SCOPE']).optional(),
        });

      case 'fetch_asset_telemetry':
        return z.object({
          keys: z.array(z.string()).min(1, 'Debe especificar al menos una clave'),
          startTs: z.number().optional(),
          endTs: z.number().optional(),
          limit: z.number().min(1).max(1000).optional(),
        });

      case 'script_transform':
        return z.object({
          script: z.string().min(1, 'El script es requerido'),
        });

      case 'math':
        return z.object({
          operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt', 'abs']),
          operand1: z.string().min(1, 'Operando 1 es requerido'),
          operand2: z.string().optional(),
          outputKey: z.string().min(1, 'Clave de salida es requerida'),
        });

      case 'formula':
        return z.object({
          formula: z.string().min(1, 'La fórmula es requerida'),
          outputKey: z.string().min(1, 'Clave de salida es requerida'),
        });

      case 'save_timeseries':
        return z.object({
          keys: z.array(z.string()).optional(),
          ttl: z.number().min(0).optional(),
        });

      case 'update_ditto_feature':
        return z.object({
          thingId: z.string().min(1, 'Thing ID es requerido'),
          featureId: z.string().min(1, 'Feature ID es requerido'),
          properties: z.record(z.string(), z.any()).optional(),
        });

      case 'create_alarm':
        return z.object({
          alarmType: z.string().min(1, 'Tipo de alarma es requerido'),
          severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INDETERMINATE'] as const),
          message: z.string().min(1, 'Mensaje es requerido'),
          propagate: z.boolean().optional(),
        });

      case 'log':
        return z.object({
          level: z.enum(['debug', 'info', 'warn', 'error']),
          message: z.string().min(1, 'Mensaje es requerido'),
        });

      case 'kafka_publish':
        return z.object({
          topic: z.string().min(1, 'Topic es requerido'),
          key: z.string().optional(),
          partition: z.number().optional(),
        });

      case 'rule_chain':
        return z.object({
          ruleChainId: z.string().min(1, 'Rule Chain ID es requerido'),
        });

      default:
        return z.object({});
    }
  }, [nodeType]);

  const validate = () => {
    try {
      schema.parse(config);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return { isValid: false, errors: [{ field: 'unknown', message: 'Error de validación' }] };
    }
  };

  return { validate, schema };
}
