import type { CtUnitStatus, CtReelStatus, CtJobStatus, CtJobType, BhaComponentType } from '../types';

// Status Options
export const CT_UNIT_STATUS_OPTIONS: { value: CtUnitStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'standby', label: 'Standby' },
  { value: 'out_of_service', label: 'Out of Service' },
];

export const CT_REEL_STATUS_OPTIONS: { value: CtReelStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

export const CT_JOB_STATUS_OPTIONS: { value: CtJobStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CT_JOB_TYPE_OPTIONS: { value: CtJobType; label: string }[] = [
  { value: 'cleanout', label: 'Cleanout' },
  { value: 'drilling', label: 'Drilling' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'logging', label: 'Logging' },
  { value: 'stimulation', label: 'Stimulation' },
  { value: 'other', label: 'Other' },
];

export const BHA_COMPONENT_TYPE_OPTIONS: { value: BhaComponentType; label: string }[] = [
  { value: 'motor', label: 'Motor' },
  { value: 'bit', label: 'Bit' },
  { value: 'jar', label: 'Jar' },
  { value: 'sub', label: 'Sub' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
];

// Status Colors
export const CT_UNIT_STATUS_COLORS: Record<CtUnitStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  standby: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  out_of_service: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export const CT_REEL_STATUS_COLORS: Record<CtReelStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  in_use: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const CT_JOB_STATUS_COLORS: Record<CtJobStatus, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Fatigue Thresholds
export const FATIGUE_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  CRITICAL: 90,
};

export const FATIGUE_COLORS = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

// API Endpoints
export const CT_API_ENDPOINTS = {
  UNITS: '/api/v1/coiled-tubing/units',
  REELS: '/api/v1/coiled-tubing/reels',
  JOBS: '/api/v1/coiled-tubing/jobs',
  BHA_COMPONENTS: '/api/v1/coiled-tubing/bha-components',
  JOB_FLUIDS: '/api/v1/coiled-tubing/job-fluids',
  JOB_OPERATIONS: '/api/v1/coiled-tubing/job-operations',
  JOB_CALCULATIONS: '/api/v1/coiled-tubing/job-calculations',
  REEL_SECTIONS: '/api/v1/coiled-tubing/reel-sections',
};

// Permissions
export const CT_PERMISSIONS = {
  UNITS_READ: 'coiled-tubing:units:read',
  UNITS_CREATE: 'coiled-tubing:units:create',
  UNITS_UPDATE: 'coiled-tubing:units:update',
  UNITS_DELETE: 'coiled-tubing:units:delete',
  REELS_READ: 'coiled-tubing:reels:read',
  REELS_CREATE: 'coiled-tubing:reels:create',
  REELS_UPDATE: 'coiled-tubing:reels:update',
  REELS_DELETE: 'coiled-tubing:reels:delete',
  JOBS_READ: 'coiled-tubing:jobs:read',
  JOBS_CREATE: 'coiled-tubing:jobs:create',
  JOBS_UPDATE: 'coiled-tubing:jobs:update',
  JOBS_DELETE: 'coiled-tubing:jobs:delete',
  CALCULATIONS_RUN: 'coiled-tubing:calculations:run',
  OPERATIONS_MONITOR: 'coiled-tubing:operations:monitor',
  REPORTS_VIEW: 'coiled-tubing:reports:view',
};
