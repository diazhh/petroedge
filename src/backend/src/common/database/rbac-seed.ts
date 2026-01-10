import { db } from './index.js';
import { tenants, roles, permissions, rolePermissions } from './schema.js';
import { eq } from 'drizzle-orm';

interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

interface PermissionDefinition {
  code: string;
  module: string;
  resource?: string;
  action?: string;
  field?: string;
  description: string;
}

const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Auth & Users
  { code: 'auth:login', module: 'auth', action: 'login', description: 'Login to system' },
  { code: 'users:read', module: 'users', action: 'read', description: 'View users' },
  { code: 'users:create', module: 'users', action: 'create', description: 'Create users' },
  { code: 'users:update', module: 'users', action: 'update', description: 'Update users' },
  { code: 'users:delete', module: 'users', action: 'delete', description: 'Delete users' },
  { code: 'users:manage', module: 'users', action: 'manage', description: 'Full user management' },
  
  // Roles & Permissions
  { code: 'roles:read', module: 'roles', action: 'read', description: 'View roles' },
  { code: 'roles:create', module: 'roles', action: 'create', description: 'Create roles' },
  { code: 'roles:update', module: 'roles', action: 'update', description: 'Update roles' },
  { code: 'roles:delete', module: 'roles', action: 'delete', description: 'Delete roles' },
  { code: 'permissions:read', module: 'permissions', action: 'read', description: 'View permissions' },
  { code: 'permissions:assign', module: 'permissions', action: 'assign', description: 'Assign permissions' },
  
  // Assets
  { code: 'assets:read', module: 'assets', action: 'read', description: 'View assets' },
  { code: 'assets:create', module: 'assets', action: 'create', description: 'Create assets' },
  { code: 'assets:update', module: 'assets', action: 'update', description: 'Update assets' },
  { code: 'assets:delete', module: 'assets', action: 'delete', description: 'Delete assets' },
  
  // Wells
  { code: 'wells:read', module: 'wells', action: 'read', description: 'View wells' },
  { code: 'wells:create', module: 'wells', action: 'create', description: 'Create wells' },
  { code: 'wells:update', module: 'wells', action: 'update', description: 'Update wells' },
  { code: 'wells:update:status', module: 'wells', action: 'update', field: 'status', description: 'Update well status' },
  { code: 'wells:delete', module: 'wells', action: 'delete', description: 'Delete wells' },
  
  // Well Testing
  { code: 'well-testing:read', module: 'well-testing', action: 'read', description: 'View well tests' },
  { code: 'well-testing:create', module: 'well-testing', action: 'create', description: 'Create well tests' },
  { code: 'well-testing:update', module: 'well-testing', action: 'update', description: 'Update well tests' },
  { code: 'well-testing:delete', module: 'well-testing', action: 'delete', description: 'Delete well tests' },
  { code: 'well-testing:approve', module: 'well-testing', action: 'approve', description: 'Approve well tests' },
  { code: 'well-testing:read:payroll', module: 'well-testing', action: 'read', field: 'payroll', description: 'View payroll data' },
  
  // Drilling
  { code: 'drilling:read', module: 'drilling', action: 'read', description: 'View drilling operations' },
  { code: 'drilling:create', module: 'drilling', action: 'create', description: 'Create drilling plans' },
  { code: 'drilling:update', module: 'drilling', action: 'update', description: 'Update drilling plans' },
  { code: 'drilling:execute', module: 'drilling', action: 'execute', description: 'Execute drilling operations' },
  { code: 'drilling:execute:kill-sheet', module: 'drilling', action: 'execute', resource: 'kill-sheet', description: 'Execute kill sheet' },
  
  // Alarms
  { code: 'alarms:read', module: 'alarms', action: 'read', description: 'View alarms' },
  { code: 'alarms:acknowledge', module: 'alarms', action: 'acknowledge', description: 'Acknowledge alarms' },
  { code: 'alarms:resolve', module: 'alarms', action: 'resolve', description: 'Resolve alarms' },
  
  // Rules
  { code: 'rules:read', module: 'rules', action: 'read', description: 'View rules' },
  { code: 'rules:create', module: 'rules', action: 'create', description: 'Create rules' },
  { code: 'rules:update', module: 'rules', action: 'update', description: 'Update rules' },
  { code: 'rules:delete', module: 'rules', action: 'delete', description: 'Delete rules' },
  { code: 'rules:execute', module: 'rules', action: 'execute', description: 'Execute rules' },
  
  // Telemetry
  { code: 'telemetry:read', module: 'telemetry', action: 'read', description: 'View telemetry data' },
  { code: 'telemetry:export', module: 'telemetry', action: 'export', description: 'Export telemetry data' },
  
  // Reports
  { code: 'reports:read', module: 'reports', action: 'read', description: 'View reports' },
  { code: 'reports:create', module: 'reports', action: 'create', description: 'Create reports' },
  { code: 'reports:export', module: 'reports', action: 'export', description: 'Export reports' },
  
  // Inventory
  { code: 'inventory:read', module: 'inventory', action: 'read', description: 'View inventory' },
  { code: 'inventory:create', module: 'inventory', action: 'create', description: 'Create inventory items' },
  { code: 'inventory:update', module: 'inventory', action: 'update', description: 'Update inventory' },
  { code: 'inventory:delete', module: 'inventory', action: 'delete', description: 'Delete inventory items' },
  
  // Finance
  { code: 'finance:read', module: 'finance', action: 'read', description: 'View financial data' },
  { code: 'finance:create', module: 'finance', action: 'create', description: 'Create financial records' },
  { code: 'finance:update', module: 'finance', action: 'update', description: 'Update financial records' },
  { code: 'finance:approve', module: 'finance', action: 'approve', description: 'Approve financial transactions' },
  
  // HR
  { code: 'hr:read', module: 'hr', action: 'read', description: 'View HR data' },
  { code: 'hr:create', module: 'hr', action: 'create', description: 'Create HR records' },
  { code: 'hr:update', module: 'hr', action: 'update', description: 'Update HR records' },
  { code: 'hr:delete', module: 'hr', action: 'delete', description: 'Delete HR records' },
  
  // Maintenance
  { code: 'maintenance:read', module: 'maintenance', action: 'read', description: 'View maintenance records' },
  { code: 'maintenance:create', module: 'maintenance', action: 'create', description: 'Create maintenance tasks' },
  { code: 'maintenance:update', module: 'maintenance', action: 'update', description: 'Update maintenance tasks' },
  { code: 'maintenance:execute', module: 'maintenance', action: 'execute', description: 'Execute maintenance' },
];

const SYSTEM_ROLES: RoleDefinition[] = [
  {
    code: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: SYSTEM_PERMISSIONS.map(p => p.code),
  },
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Administrative access to manage users, roles, and configurations',
    permissions: [
      'auth:login',
      'users:read', 'users:create', 'users:update', 'users:delete',
      'roles:read', 'roles:create', 'roles:update',
      'permissions:read', 'permissions:assign',
      'assets:read', 'assets:create', 'assets:update', 'assets:delete',
      'wells:read', 'wells:create', 'wells:update', 'wells:delete',
      'well-testing:read', 'well-testing:approve',
      'drilling:read', 'drilling:create', 'drilling:update',
      'alarms:read', 'alarms:acknowledge', 'alarms:resolve',
      'rules:read', 'rules:create', 'rules:update', 'rules:delete',
      'telemetry:read', 'telemetry:export',
      'reports:read', 'reports:create', 'reports:export',
      'inventory:read', 'inventory:create', 'inventory:update',
      'maintenance:read', 'maintenance:create', 'maintenance:update',
    ],
  },
  {
    code: 'engineer',
    name: 'Engineer',
    description: 'Technical operations and analysis',
    permissions: [
      'auth:login',
      'users:read',
      'assets:read', 'assets:create', 'assets:update',
      'wells:read', 'wells:create', 'wells:update', 'wells:update:status',
      'well-testing:read', 'well-testing:create', 'well-testing:update', 'well-testing:approve',
      'drilling:read', 'drilling:create', 'drilling:update', 'drilling:execute',
      'alarms:read', 'alarms:acknowledge', 'alarms:resolve',
      'rules:read', 'rules:create', 'rules:update',
      'telemetry:read', 'telemetry:export',
      'reports:read', 'reports:create', 'reports:export',
      'inventory:read',
      'maintenance:read', 'maintenance:create', 'maintenance:update', 'maintenance:execute',
    ],
  },
  {
    code: 'operator',
    name: 'Operator',
    description: 'Field operations and monitoring',
    permissions: [
      'auth:login',
      'assets:read',
      'wells:read', 'wells:update:status',
      'well-testing:read', 'well-testing:create', 'well-testing:update',
      'drilling:read',
      'alarms:read', 'alarms:acknowledge',
      'telemetry:read',
      'reports:read',
      'inventory:read',
      'maintenance:read', 'maintenance:update', 'maintenance:execute',
    ],
  },
  {
    code: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to view data',
    permissions: [
      'auth:login',
      'assets:read',
      'wells:read',
      'well-testing:read',
      'drilling:read',
      'alarms:read',
      'telemetry:read',
      'reports:read',
      'inventory:read',
      'maintenance:read',
    ],
  },
  {
    code: 'accountant',
    name: 'Accountant',
    description: 'Financial and inventory management',
    permissions: [
      'auth:login',
      'users:read',
      'assets:read',
      'wells:read',
      'well-testing:read', 'well-testing:read:payroll',
      'reports:read', 'reports:create', 'reports:export',
      'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
      'finance:read', 'finance:create', 'finance:update', 'finance:approve',
    ],
  },
  {
    code: 'hr_manager',
    name: 'HR Manager',
    description: 'Human resources management',
    permissions: [
      'auth:login',
      'users:read', 'users:create', 'users:update',
      'reports:read', 'reports:create',
      'hr:read', 'hr:create', 'hr:update', 'hr:delete',
    ],
  },
];

export async function seedRBAC() {
  console.log('🔐 Starting RBAC seed...');

  try {
    const [tenant] = await db.select().from(tenants).limit(1);
    
    if (!tenant) {
      console.error('❌ No tenant found. Please run main seed first.');
      return;
    }

    console.log(`📋 Using tenant: ${tenant.name} (${tenant.id})`);

    console.log('📝 Creating system permissions...');
    const createdPermissions = new Map<string, string>();

    for (const perm of SYSTEM_PERMISSIONS) {
      const [existing] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.code, perm.code))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Permission already exists: ${perm.code}`);
        createdPermissions.set(perm.code, existing.id);
        continue;
      }

      const [created] = await db
        .insert(permissions)
        .values({
          tenantId: tenant.id,
          code: perm.code,
          module: perm.module,
          resource: perm.resource,
          action: perm.action,
          field: perm.field,
          description: perm.description,
          isSystem: true,
        })
        .returning();

      createdPermissions.set(perm.code, created.id);
      console.log(`  ✅ Created permission: ${perm.code}`);
    }

    console.log(`\n👥 Creating system roles...`);
    
    for (const roleDef of SYSTEM_ROLES) {
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.code, roleDef.code))
        .limit(1);

      let roleId: string;

      if (existingRole) {
        console.log(`  ⏭️  Role already exists: ${roleDef.code}`);
        roleId = existingRole.id;
      } else {
        const [createdRole] = await db
          .insert(roles)
          .values({
            tenantId: tenant.id,
            code: roleDef.code,
            name: roleDef.name,
            description: roleDef.description,
            isSystem: true,
            isActive: true,
          })
          .returning();

        roleId = createdRole.id;
        console.log(`  ✅ Created role: ${roleDef.code}`);
      }

      console.log(`  🔗 Assigning permissions to ${roleDef.code}...`);
      let assignedCount = 0;

      for (const permCode of roleDef.permissions) {
        const permId = createdPermissions.get(permCode);
        if (!permId) {
          console.warn(`    ⚠️  Permission not found: ${permCode}`);
          continue;
        }

        const [existing] = await db
          .select()
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId))
          .limit(1);

        if (existing) {
          continue;
        }

        await db.insert(rolePermissions).values({
          roleId,
          permissionId: permId,
          granted: true,
        });

        assignedCount++;
      }

      console.log(`    ✅ Assigned ${assignedCount} permissions to ${roleDef.code}`);
    }

    console.log('\n✅ RBAC seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Permissions created: ${createdPermissions.size}`);
    console.log(`  - Roles created: ${SYSTEM_ROLES.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  }
}

if (require.main === module) {
  seedRBAC()
    .then(() => {
      console.log('✅ RBAC seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ RBAC seed script failed:', error);
      process.exit(1);
    });
}
