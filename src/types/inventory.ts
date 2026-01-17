import type {
  User,
  Organization,
  Category,
  Item,
  Settings,
} from "@prisma/client";

// Extended types with relationships
export type UserWithOrganization = User & {
  organization: Organization;
};

export type OrganizationWithRelations = Organization & {
  users: User[];
  categories: Category[];
  items: Item[];
  settings: Settings | null;
};

export type ItemWithRelations = Item & {
  category: Category;
  organization: Organization;
};

export type CategoryWithItems = Category & {
  items: Item[];
};

// Inventory status types
export type InventoryStatus = "ok" | "expiring_soon" | "expired" | "low_stock";

export type ItemWithStatus = ItemWithRelations & {
  status: InventoryStatus;
};

// Dashboard summary types
export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  expiringSoon: number;
  expired: number;
  lowStock: number;
}

// Filter and search types
export interface InventoryFilters {
  status?: InventoryStatus | "all";
  categoryId?: string | "all";
  search?: string;
}

// Form data types for creating/editing
export interface CreateItemData {
  name: string;
  sku?: string;
  categoryId: string;
  quantity: number;
  unitCost: number;
  expirationDate: Date;
  reorderThreshold: number;
}

export interface UpdateItemData extends Partial<CreateItemData> {
  id: string;
}

export interface CreateCategoryData {
  name: string;
}

export interface UpdateOrganizationSettingsData {
  expirationWarningDays?: number;
  lowStockThreshold?: number;
  currency?: string;
  timezone?: string;
}
