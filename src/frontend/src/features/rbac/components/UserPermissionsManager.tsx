/**
 * User Permissions Manager Component
 * 
 * Componente para gestionar roles y permisos de un usuario
 */

import { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';
import {
  useUserRoles,
  useUserPermissions,
  useRoles,
  usePermissions,
  useAssignUserRole,
  useRemoveUserRole,
  useAssignUserPermission,
  useRemoveUserPermission,
} from '@/hooks/useRbac';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate } from '@/components/common/PermissionGate';

interface UserPermissionsManagerProps {
  userId: string;
}

export function UserPermissionsManager({ userId }: UserPermissionsManagerProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');

  const { data: userRoles, isLoading: loadingRoles } = useUserRoles(userId);
  const { data: userPermissions, isLoading: loadingPermissions } = useUserPermissions(userId);
  const { data: allRoles } = useRoles({ perPage: 100 });
  const { data: allPermissions } = usePermissions({ perPage: 200 });

  const assignRoleMutation = useAssignUserRole();
  const removeRoleMutation = useRemoveUserRole();
  const assignPermissionMutation = useAssignUserPermission();
  const removePermissionMutation = useRemoveUserPermission();

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    await assignRoleMutation.mutateAsync({
      userId,
      data: { roleId: selectedRole },
    });
    setSelectedRole('');
  };

  const handleRemoveRole = async (roleId: string) => {
    await removeRoleMutation.mutateAsync({ userId, roleId });
  };

  const handleAssignPermission = async () => {
    if (!selectedPermission) return;
    await assignPermissionMutation.mutateAsync({
      userId,
      data: { permissionId: selectedPermission },
    });
    setSelectedPermission('');
  };

  const handleRemovePermission = async (permissionId: string) => {
    await removePermissionMutation.mutateAsync({ userId, permissionId });
  };

  const availableRoles = allRoles?.data.filter(
    (role) => !userRoles?.some((ur) => ur.id === role.id)
  ) || [];

  const availablePermissions = allPermissions?.data.filter(
    (perm) => !userPermissions?.some((up) => up.id === perm.id)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Roles Asignados</CardTitle>
          <CardDescription>
            Roles que determinan los permisos base del usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingRoles ? (
            <p className="text-sm text-muted-foreground">Cargando roles...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {userRoles && userRoles.length > 0 ? (
                  userRoles.map((role) => (
                    <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {role.displayName}
                      <PermissionGate permission="users:update">
                        <button
                          onClick={() => handleRemoveRole(role.id)}
                          className="ml-1 hover:text-destructive"
                          disabled={role.isSystem}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </PermissionGate>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tiene roles asignados</p>
                )}
              </div>

              <PermissionGate permission="users:update">
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar rol..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignRole}
                    disabled={!selectedRole || assignRoleMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar
                  </Button>
                </div>
              </PermissionGate>
            </>
          )}
        </CardContent>
      </Card>

      {/* Permissions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos Adicionales</CardTitle>
          <CardDescription>
            Permisos específicos asignados directamente al usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPermissions ? (
            <p className="text-sm text-muted-foreground">Cargando permisos...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {userPermissions && userPermissions.length > 0 ? (
                  userPermissions.map((permission) => (
                    <Badge key={permission.id} variant="outline" className="flex items-center gap-1">
                      {permission.name}
                      <PermissionGate permission="users:update">
                        <button
                          onClick={() => handleRemovePermission(permission.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </PermissionGate>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tiene permisos adicionales
                  </p>
                )}
              </div>

              <PermissionGate permission="users:update">
                <div className="flex gap-2">
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar permiso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissions.map((permission) => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.displayName} ({permission.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignPermission}
                    disabled={!selectedPermission || assignPermissionMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar
                  </Button>
                </div>
              </PermissionGate>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
