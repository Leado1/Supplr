export enum Permission {
  // User Management
  MANAGE_TEAM = 'MANAGE_TEAM',
  INVITE_USERS = 'INVITE_USERS',

  // Inventory Management
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  VIEW_INVENTORY = 'VIEW_INVENTORY',
  UPDATE_STOCK = 'UPDATE_STOCK',

  // System Management
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_BILLING = 'MANAGE_BILLING'
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    Permission.MANAGE_TEAM,
    Permission.INVITE_USERS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_STOCK,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_BILLING,
  ],
  ADMIN: [
    Permission.INVITE_USERS,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_STOCK,
    Permission.VIEW_REPORTS,
  ],
  MANAGER: [
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_STOCK,
    Permission.VIEW_REPORTS,
  ],
  MEMBER: [
    Permission.VIEW_INVENTORY,
    Permission.UPDATE_STOCK,
  ],
};

export type OrganizationRole = keyof typeof ROLE_PERMISSIONS;

export function hasPermission(userRole: OrganizationRole, requiredPermission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(requiredPermission);
}

export function requirePermission(userRole: OrganizationRole, requiredPermission: Permission) {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermission}, User role: ${userRole}`);
  }
}

export function getPermissions(userRole: OrganizationRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}