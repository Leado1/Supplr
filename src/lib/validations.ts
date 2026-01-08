import { z } from "zod";

// Base validation schemas
export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  sku: z.string().max(50, "SKU too long").optional(),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  unitCost: z.number().min(0, "Unit cost must be non-negative"),
  expirationDate: z.date().min(new Date(), "Expiration date must be in the future"),
  reorderThreshold: z.number().int().min(0, "Reorder threshold must be non-negative"),
});

export const updateItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  sku: z.string().max(50, "SKU too long").optional().nullable(),
  categoryId: z.string().min(1, "Category is required").optional(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").optional(),
  unitCost: z.number().min(0, "Unit cost must be non-negative").optional(),
  expirationDate: z.date().optional(),
  reorderThreshold: z.number().int().min(0, "Reorder threshold must be non-negative").optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

export const updateCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

export const updateOrganizationSettingsSchema = z.object({
  expirationWarningDays: z.number().int().min(1, "Must be at least 1 day").max(365, "Must be less than 1 year").optional(),
  lowStockThreshold: z.number().int().min(1, "Must be at least 1").max(1000, "Must be reasonable").optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).optional(),
  timezone: z.string().optional(),
});

export const inventoryFiltersSchema = z.object({
  status: z.enum(["all", "ok", "expiring_soon", "expired", "low_stock"]).optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});

// User and organization schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name too long"),
  type: z.enum(["clinic", "medspa", "practice", "hospital", "other"]).default("clinic"),
});

export const createUserSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().max(50, "First name too long").optional(),
  lastName: z.string().max(50, "Last name too long").optional(),
  organizationId: z.string().min(1, "Organization ID is required"),
});

// Type inference helpers
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateOrganizationSettingsInput = z.infer<typeof updateOrganizationSettingsSchema>;
export type InventoryFiltersInput = z.infer<typeof inventoryFiltersSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;