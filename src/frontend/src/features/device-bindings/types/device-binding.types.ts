/**
 * Device Bindings - Frontend Types
 */

export interface DeviceBinding {
  id: string;
  tenantId: string;
  dataSourceId: string;
  connectivityProfileId: string;
  digitalTwinId: string;
  customMappings?: Record<string, any>;
  customRuleChainId?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface DeviceBindingWithRelations extends DeviceBinding {
  dataSource?: {
    id: string;
    name: string;
    protocol: string;
  };
  connectivityProfile?: {
    id: string;
    code: string;
    name: string;
  };
  digitalTwinInstance?: {
    id: string;
    thingId: string;
    name: string;
  };
}

export interface CreateDeviceBindingDTO {
  dataSourceId: string;
  connectivityProfileId: string;
  digitalTwinId: string;
  customMappings?: Record<string, any>;
  customRuleChainId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateDeviceBindingDTO {
  dataSourceId?: string;
  connectivityProfileId?: string;
  digitalTwinId?: string;
  customMappings?: Record<string, any>;
  customRuleChainId?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DeviceBindingFilters {
  isActive?: boolean;
  dataSourceId?: string;
  connectivityProfileId?: string;
  digitalTwinId?: string;
  search?: string;
  tags?: string[];
  page?: number;
  perPage?: number;
}

export interface DeviceBindingStats {
  total: number;
  active: number;
  inactive: number;
  byConnectivityProfile: Record<string, number>;
  byDataSource: Record<string, number>;
}
