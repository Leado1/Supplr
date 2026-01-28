import "server-only";

import { z } from "zod";
import type { Organization, Settings, Subscription, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addStatusToItems, calculateInventorySummary } from "@/lib/inventory-status";
import { isSubscriptionActive } from "@/lib/subscription-helpers";
import { hasPermission, Permission, type OrganizationRole } from "@/lib/permissions";
import { createItemSchema, updateItemSchema } from "@/lib/validations";

const dateSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date().optional());

const searchProductsSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
});

const getProductSchema = z.object({
  productId: z.string().min(1),
});

const addProductSchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().max(50).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  parLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  quantityOnHand: z.number().int().min(0),
  cost: z.number().min(0).optional(),
  expirationDate: dateSchema,
  location: z.string().optional().nullable(),
});

const updateProductSchema = z.object({
  productId: z.string().min(1),
  patch: z.object({
    name: z.string().min(1).max(100).optional(),
    sku: z.string().max(50).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    unit: z.string().max(50).optional().nullable(),
    vendor: z.string().max(100).optional().nullable(),
    parLevel: z.number().int().min(0).optional(),
    reorderPoint: z.number().int().min(0).optional(),
    quantityOnHand: z.number().int().min(0).optional(),
    cost: z.number().min(0).optional(),
    expirationDate: dateSchema,
    location: z.string().optional().nullable(),
  }),
});

const removeProductSchema = z.object({
  productId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

const adjustStockSchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().max(200).optional(),
});

const getLowStockSchema = z.object({
  threshold: z.number().int().min(0).max(10000).optional(),
});

const getExpiringSchema = z.object({
  days: z.union([z.literal(30), z.literal(60), z.literal(90)]).optional(),
});

export type AssistantToolName =
  | "inventory_searchProducts"
  | "inventory_getProduct"
  | "inventory_addProduct"
  | "inventory_updateProduct"
  | "inventory_removeProduct"
  | "inventory_adjustStock"
  | "inventory_getLowStock"
  | "inventory_getExpiring"
  | "inventory_getSummaryKPIs";

export const assistantToolDefinitions = [
  {
    type: "function",
    function: {
      name: "inventory_searchProducts",
      description: "Search inventory products by name, SKU, or category.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query text" },
          limit: {
            type: "integer",
            description: "Max results to return (1-50)",
            minimum: 1,
            maximum: 50,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_getProduct",
      description: "Get a single product by its ID.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "Product ID" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_addProduct",
      description: "Add a new inventory product.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          sku: { type: "string" },
          category: { type: "string" },
          vendor: { type: "string" },
          unit: { type: "string" },
          parLevel: { type: "integer", minimum: 0 },
          reorderPoint: { type: "integer", minimum: 0 },
          quantityOnHand: { type: "integer", minimum: 0 },
          cost: { type: "number", minimum: 0 },
          expirationDate: { type: "string", description: "ISO date" },
          location: { type: "string" },
        },
        required: ["name", "quantityOnHand"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_updateProduct",
      description: "Update fields on an existing product.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          patch: {
            type: "object",
            properties: {
              name: { type: "string" },
              sku: { type: "string" },
              category: { type: "string" },
              vendor: { type: "string" },
              unit: { type: "string" },
              parLevel: { type: "integer", minimum: 0 },
              reorderPoint: { type: "integer", minimum: 0 },
              quantityOnHand: { type: "integer", minimum: 0 },
              cost: { type: "number", minimum: 0 },
              expirationDate: { type: "string" },
              location: { type: "string" },
            },
          },
        },
        required: ["productId", "patch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_removeProduct",
      description: "Remove a product from inventory. Requires confirmation.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          reason: { type: "string" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_adjustStock",
      description: "Adjust stock for a product by a positive or negative delta.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          delta: { type: "integer" },
          reason: { type: "string" },
        },
        required: ["productId", "delta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_getLowStock",
      description: "List products that are low on stock.",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "integer", minimum: 0, maximum: 10000 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_getExpiring",
      description: "List products expiring within the next 30, 60, or 90 days.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", enum: [30, 60, 90] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inventory_getSummaryKPIs",
      description: "Return KPI counts for the inventory.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
] as const;

export function isDestructiveTool(name: AssistantToolName) {
  return name === "inventory_removeProduct";
}

interface ToolContext {
  organization: Organization & {
    settings?: Settings | null;
    subscription?: Subscription | null;
  };
  user: User | null;
}

interface ToolExecutionResult {
  status: "success" | "error";
  result?: unknown;
  error?: string;
}

const ensurePermission = (user: User | null, permission: Permission) => {
  if (!user) return;
  if (!hasPermission(user.role as OrganizationRole, permission)) {
    throw new Error("Insufficient permissions for this action.");
  }
};

const resolveCategoryId = async (
  organizationId: string,
  categoryName?: string | null
) => {
  if (categoryName) {
    const existing = await prisma.category.findFirst({
      where: {
        organizationId,
        name: { equals: categoryName, mode: "insensitive" },
      },
    });
    if (existing) return existing.id;
    const created = await prisma.category.create({
      data: {
        organizationId,
        name: categoryName,
      },
    });
    return created.id;
  }

  const fallback = await prisma.category.findFirst({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  if (fallback) return fallback.id;

  const created = await prisma.category.create({
    data: {
      organizationId,
      name: "General",
    },
  });

  return created.id;
};

const resolveLocationId = async (
  organizationId: string,
  locationValue?: string | null
) => {
  if (!locationValue) return null;

  const byId = await prisma.location.findFirst({
    where: {
      id: locationValue,
      organizationId,
    },
  });

  if (byId) return byId.id;

  const byName = await prisma.location.findFirst({
    where: {
      organizationId,
      name: { equals: locationValue, mode: "insensitive" },
    },
  });

  return byName?.id ?? null;
};

const serializeItem = (item: {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitCost: any;
  expirationDate: Date;
  reorderThreshold: number;
  category?: { id: string; name: string } | null;
  location?: { id: string; name: string } | null;
  categoryId?: string;
  locationId?: string | null;
}) => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  quantity: item.quantity,
  unitCost: Number(item.unitCost),
  expirationDate: item.expirationDate.toISOString(),
  reorderThreshold: item.reorderThreshold,
  categoryId: item.category?.id ?? item.categoryId,
  categoryName: item.category?.name ?? null,
  locationId: item.location?.id ?? item.locationId ?? null,
  locationName: item.location?.name ?? null,
});

const ensureSubscriptionAllowsAdd = async (organizationId: string, subscription: Subscription | null) => {
  if (!subscription) {
    throw new Error("No subscription found for this workspace.");
  }

  if (!isSubscriptionActive(subscription)) {
    throw new Error("Subscription is inactive. Please update billing.");
  }

  if (subscription.plan === "trial" && subscription.trialEndsAt) {
    if (new Date() > subscription.trialEndsAt) {
      throw new Error("Trial period has expired. Please upgrade to add items.");
    }
  }

  const currentItemCount = await prisma.item.count({
    where: { organizationId },
  });

  if (subscription.itemLimit !== -1 && currentItemCount >= subscription.itemLimit) {
    throw new Error(
      `Item limit exceeded. Your ${subscription.plan} plan allows up to ${subscription.itemLimit} items.`
    );
  }
};

export async function executeAssistantTool(
  name: AssistantToolName,
  args: unknown,
  context: ToolContext
): Promise<ToolExecutionResult> {
  try {
    switch (name) {
      case "inventory_searchProducts": {
        ensurePermission(context.user, Permission.VIEW_INVENTORY);
        const { query, limit } = searchProductsSchema.parse(args);
        const items = await prisma.item.findMany({
          where: {
            organizationId: context.organization.id,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
              { category: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          include: {
            category: true,
            location: true,
          },
          orderBy: { updatedAt: "desc" },
          take: limit ?? 10,
        });

        return {
          status: "success",
          result: {
            query,
            count: items.length,
            items: items.map(serializeItem),
          },
        };
      }
      case "inventory_getProduct": {
        ensurePermission(context.user, Permission.VIEW_INVENTORY);
        const { productId } = getProductSchema.parse(args);
        const item = await prisma.item.findFirst({
          where: {
            id: productId,
            organizationId: context.organization.id,
          },
          include: { category: true, location: true },
        });

        if (!item) {
          throw new Error("Product not found in this workspace.");
        }

        return { status: "success", result: serializeItem(item) };
      }
      case "inventory_addProduct": {
        ensurePermission(context.user, Permission.MANAGE_INVENTORY);
        const payload = addProductSchema.parse(args);

        await ensureSubscriptionAllowsAdd(
          context.organization.id,
          context.organization.subscription ?? null
        );

        const categoryId = await resolveCategoryId(
          context.organization.id,
          payload.category
        );
        const locationId = await resolveLocationId(
          context.organization.id,
          payload.location
        );

        const expirationDate =
          payload.expirationDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        const reorderThreshold =
          payload.reorderPoint ??
          payload.parLevel ??
          context.organization.settings?.lowStockThreshold ??
          0;

        const createPayload = {
          name: payload.name,
          sku: payload.sku ?? null,
          categoryId,
          quantity: payload.quantityOnHand,
          unitCost: payload.cost ?? 0,
          expirationDate,
          reorderThreshold,
        };

        const createValidation = createItemSchema.safeParse(createPayload);
        if (!createValidation.success) {
          throw new Error("Invalid item data provided.");
        }

        const item = await prisma.item.create({
          data: {
            ...createValidation.data,
            organizationId: context.organization.id,
            locationId: locationId ?? undefined,
          },
          include: { category: true, location: true },
        });

        // NOTE: vendor/unit are not stored in the current Item model.
        return {
          status: "success",
          result: {
            item: serializeItem(item),
            ignoredFields: ["vendor", "unit"],
          },
        };
      }
      case "inventory_updateProduct": {
        ensurePermission(context.user, Permission.MANAGE_INVENTORY);
        const { productId, patch } = updateProductSchema.parse(args);

        const existing = await prisma.item.findFirst({
          where: {
            id: productId,
            organizationId: context.organization.id,
          },
          include: { category: true, location: true },
        });

        if (!existing) {
          throw new Error("Product not found in this workspace.");
        }

        const updateData: Record<string, unknown> = {};

        if (patch.name) updateData.name = patch.name;
        if (patch.sku !== undefined) updateData.sku = patch.sku;
        if (patch.quantityOnHand !== undefined) {
          updateData.quantity = patch.quantityOnHand;
        }
        if (patch.cost !== undefined) updateData.unitCost = patch.cost;
        if (patch.expirationDate) updateData.expirationDate = patch.expirationDate;

        if (patch.reorderPoint !== undefined || patch.parLevel !== undefined) {
          updateData.reorderThreshold =
            patch.reorderPoint ?? patch.parLevel ?? existing.reorderThreshold;
        }

        if (patch.category) {
          updateData.categoryId = await resolveCategoryId(
            context.organization.id,
            patch.category
          );
        }

        if (patch.location !== undefined) {
          updateData.locationId = await resolveLocationId(
            context.organization.id,
            patch.location
          );
        }

        const { locationId: resolvedLocationId, ...validatedFields } = updateData;
        const updatePayload = {
          id: productId,
          ...validatedFields,
        };

        const updateValidation = updateItemSchema.safeParse(updatePayload);
        if (!updateValidation.success) {
          throw new Error("Invalid update data provided.");
        }

        const { id, ...dataToUpdate } = updateValidation.data;
        const finalUpdateData = {
          ...dataToUpdate,
          ...(resolvedLocationId !== undefined
            ? { locationId: resolvedLocationId }
            : {}),
        };

        const updated = await prisma.item.update({
          where: { id: productId },
          data: finalUpdateData,
          include: { category: true, location: true },
        });

        return { status: "success", result: serializeItem(updated) };
      }
      case "inventory_removeProduct": {
        ensurePermission(context.user, Permission.MANAGE_INVENTORY);
        const { productId, reason } = removeProductSchema.parse(args);
        const item = await prisma.item.findFirst({
          where: {
            id: productId,
            organizationId: context.organization.id,
          },
        });

        if (!item) {
          throw new Error("Product not found in this workspace.");
        }

        await prisma.item.delete({ where: { id: productId } });

        return {
          status: "success",
          result: {
            deleted: true,
            id: item.id,
            name: item.name,
            reason: reason ?? null,
          },
        };
      }
      case "inventory_adjustStock": {
        ensurePermission(context.user, Permission.UPDATE_STOCK);
        const { productId, delta, reason } = adjustStockSchema.parse(args);
        const item = await prisma.item.findFirst({
          where: {
            id: productId,
            organizationId: context.organization.id,
          },
          include: { category: true, location: true },
        });

        if (!item) {
          throw new Error("Product not found in this workspace.");
        }

        const quantityBefore = item.quantity;
        const quantityAfter = Math.max(0, quantityBefore + delta);

        const updated = await prisma.item.update({
          where: { id: productId },
          data: { quantity: quantityAfter },
          include: { category: true, location: true },
        });

        await prisma.inventoryChange.create({
          data: {
            itemId: updated.id,
            organizationId: context.organization.id,
            quantityBefore,
            quantityAfter,
            changeType: "adjustment",
            changeReason: reason,
            changedBy: context.user?.id ?? null,
            locationId: updated.locationId ?? null,
          },
        });

        return {
          status: "success",
          result: {
            item: serializeItem(updated),
            quantityBefore,
            quantityAfter,
            deltaApplied: quantityAfter - quantityBefore,
          },
        };
      }
      case "inventory_getLowStock": {
        ensurePermission(context.user, Permission.VIEW_INVENTORY);
        const { threshold } = getLowStockSchema.parse(args);
        const items = await prisma.item.findMany({
          where: { organizationId: context.organization.id },
          include: { category: true, location: true, organization: true },
        });

        const settings = context.organization.settings;
        const filtered = threshold !== undefined
          ? items.filter((item) => item.quantity <= threshold)
          : addStatusToItems(items, settings!).filter(
              (item) => item.status === "low_stock"
            );

        return {
          status: "success",
          result: {
            threshold: threshold ?? settings?.lowStockThreshold ?? null,
            count: filtered.length,
            items: filtered.map(serializeItem),
          },
        };
      }
      case "inventory_getExpiring": {
        ensurePermission(context.user, Permission.VIEW_INVENTORY);
        const { days } = getExpiringSchema.parse(args);
        const windowDays = days ?? 30;
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + windowDays);

        const items = await prisma.item.findMany({
          where: {
            organizationId: context.organization.id,
            expirationDate: {
              gte: now,
              lte: cutoff,
            },
          },
          include: { category: true, location: true },
        });

        return {
          status: "success",
          result: {
            days: windowDays,
            count: items.length,
            items: items.map(serializeItem),
          },
        };
      }
      case "inventory_getSummaryKPIs": {
        ensurePermission(context.user, Permission.VIEW_INVENTORY);
        const items = await prisma.item.findMany({
          where: { organizationId: context.organization.id },
          include: { category: true, location: true, organization: true },
        });

        const settings = context.organization.settings;
        const itemsWithStatus = addStatusToItems(items, settings!);
        const summary = calculateInventorySummary(itemsWithStatus);
        const skuSet = new Set(
          items.map((item) => item.sku).filter((sku): sku is string => !!sku)
        );

        return {
          status: "success",
          result: {
            totalItems: summary.totalItems,
            totalSkus: skuSet.size,
            lowStockCount: summary.lowStock,
            expiringSoonCount: summary.expiringSoon,
            expiredCount: summary.expired,
            totalValue: summary.totalValue,
          },
        };
      }
      default:
        throw new Error("Unknown tool requested.");
    }
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Tool execution failed.",
    };
  }
}

export const assistantToolSchemas = {
  searchProductsSchema,
  getProductSchema,
  addProductSchema,
  updateProductSchema,
  removeProductSchema,
  adjustStockSchema,
  getLowStockSchema,
  getExpiringSchema,
};
