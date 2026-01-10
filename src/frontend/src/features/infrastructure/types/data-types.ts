/**
 * Data Types - Frontend
 * Mirrors backend data types for consistency
 */

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  JSON = 'json',
  ENUM = 'enum',
}

export interface FieldDefinition {
  key: string;
  name: string;
  type: DataType;
  unit?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  enumValues?: string[];
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  sampleRate?: string;
  quality?: string[];
}

export interface TelemetryDefinition extends FieldDefinition {
  sampleRate: string;
  quality?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface ComputedFieldDefinition extends FieldDefinition {
  formula: string;
  recalculateOn: string[];
}

export interface SchemaDefinition {
  [key: string]: FieldDefinition;
}

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  [DataType.STRING]: 'Texto',
  [DataType.NUMBER]: 'Número',
  [DataType.BOOLEAN]: 'Booleano',
  [DataType.DATE]: 'Fecha',
  [DataType.DATETIME]: 'Fecha y Hora',
  [DataType.JSON]: 'JSON',
  [DataType.ENUM]: 'Enumeración',
};

export const DATA_TYPE_COLORS: Record<DataType, string> = {
  [DataType.STRING]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [DataType.NUMBER]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [DataType.BOOLEAN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [DataType.DATE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  [DataType.DATETIME]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  [DataType.JSON]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  [DataType.ENUM]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};
