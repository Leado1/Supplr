/**
 * Supplier Integration Engine - Direct ordering and supplier management
 * Handles integration with major medical supply distributors
 */

import 'server-only';

import { prisma } from "@/lib/db";
import type { Item, Organization } from "@prisma/client";

export interface SupplierInfo {
  id: string;
  name: string;
  type: "major_distributor" | "specialty" | "manufacturer";
  apiEnabled: boolean;
  orderingUrl?: string;
  logoUrl?: string;
  deliveryTime: number; // days
  minimumOrder?: number;
  shippingCost?: number;
  discountTiers?: {
    threshold: number;
    discount: number;
  }[];
}

export interface ProductMatch {
  supplierProductId: string;
  sku: string;
  name: string;
  unitPrice: number;
  availability: "in_stock" | "limited" | "backordered" | "discontinued";
  estimatedDelivery: string;
  minimumQuantity?: number;
  packageSize: number;
}

export interface OrderingOption {
  supplier: SupplierInfo;
  product: ProductMatch;
  recommendedQuantity: number;
  estimatedCost: number;
  savings?: number;
  orderingUrl: string;
  priority: "best_price" | "fastest_delivery" | "preferred_supplier" | "best_value";
  reasoning: string;
}

export class SupplierIntegration {
  // Major supplier configurations
  private static readonly SUPPLIERS: SupplierInfo[] = [
    {
      id: "mckesson",
      name: "McKesson Corporation",
      type: "major_distributor",
      apiEnabled: false, // Would need partnership
      orderingUrl: "https://connect.mckesson.com",
      deliveryTime: 1,
      minimumOrder: 50,
    },
    {
      id: "cardinal",
      name: "Cardinal Health",
      type: "major_distributor",
      apiEnabled: false,
      orderingUrl: "https://www.cardinalhealth.com",
      deliveryTime: 1,
      minimumOrder: 75,
    },
    {
      id: "henry_schein",
      name: "Henry Schein",
      type: "major_distributor",
      apiEnabled: false,
      orderingUrl: "https://www.henryschein.com",
      deliveryTime: 2,
      minimumOrder: 100,
    },
    {
      id: "medline",
      name: "Medline Industries",
      type: "major_distributor",
      apiEnabled: false,
      orderingUrl: "https://www.medline.com",
      deliveryTime: 2,
      minimumOrder: 50,
    },
    {
      id: "amazon_business",
      name: "Amazon Business",
      type: "specialty",
      apiEnabled: true, // Amazon has APIs
      orderingUrl: "https://business.amazon.com",
      deliveryTime: 1,
      minimumOrder: 25,
    },
  ];

  /**
   * Get ordering options for a specific item
   */
  static async getOrderingOptions(
    item: Item,
    recommendedQuantity: number,
    organizationId: string
  ): Promise<OrderingOption[]> {
    // Get organization's preferred suppliers
    const orgPreferences = await this.getOrganizationSupplierPreferences(organizationId);

    const options: OrderingOption[] = [];

    for (const supplier of this.SUPPLIERS) {
      try {
        // For now, generate estimated options
        // In production, this would make API calls to suppliers
        const productMatch = await this.findProductMatch(item, supplier);

        if (productMatch) {
          const estimatedCost = productMatch.unitPrice * recommendedQuantity;
          const orderingUrl = this.generateOrderingUrl(supplier, item, recommendedQuantity);

          let priority: OrderingOption["priority"] = "best_value";
          let reasoning = `Standard supplier option`;
          let savings: number | undefined;

          // Determine priority based on various factors
          if (orgPreferences?.preferredSuppliers.includes(supplier.id)) {
            priority = "preferred_supplier";
            reasoning = "Your preferred supplier";
          } else if (supplier.deliveryTime === 1) {
            priority = "fastest_delivery";
            reasoning = "Next-day delivery available";
          } else if (productMatch.unitPrice < Number(item.unitCost)) {
            priority = "best_price";
            savings = (Number(item.unitCost) - productMatch.unitPrice) * recommendedQuantity;
            reasoning = `Save $${savings.toFixed(2)} vs current cost`;
          }

          options.push({
            supplier,
            product: productMatch,
            recommendedQuantity,
            estimatedCost,
            savings,
            orderingUrl,
            priority,
            reasoning,
          });
        }
      } catch (error) {
        console.error(`Error getting options from ${supplier.name}:`, error);
      }
    }

    // Sort by priority and value
    return this.prioritizeOrderingOptions(options);
  }

  /**
   * Generate direct ordering URL with pre-filled information
   */
  private static generateOrderingUrl(
    supplier: SupplierInfo,
    item: Item,
    quantity: number
  ): string {
    const baseUrl = supplier.orderingUrl;

    if (!baseUrl) {
      return `https://www.google.com/search?q=${encodeURIComponent(supplier.name + " " + item.name)}`;
    }

    // Generate deep links based on supplier
    switch (supplier.id) {
      case "amazon_business":
        return `${baseUrl}/search?k=${encodeURIComponent(item.name)}&ref=nb_sb_noss`;

      case "mckesson":
        // Would require partnership for actual deep linking
        return `${baseUrl}?search=${encodeURIComponent(item.name)}`;

      default:
        return `${baseUrl}?search=${encodeURIComponent(item.name)}`;
    }
  }

  /**
   * Find product match for an item at a specific supplier
   */
  private static async findProductMatch(
    item: Item,
    supplier: SupplierInfo
  ): Promise<ProductMatch | null> {
    // In production, this would:
    // 1. Use supplier APIs to search for products
    // 2. Match by SKU, name, or other identifiers
    // 3. Get real-time pricing and availability

    // For now, generate estimated data
    const basePrice = Number(item.unitCost);
    let estimatedPrice = basePrice;

    // Apply supplier-specific price adjustments
    switch (supplier.type) {
      case "major_distributor":
        estimatedPrice = basePrice * 0.95; // 5% wholesale discount
        break;
      case "specialty":
        estimatedPrice = basePrice * 1.1; // 10% markup for convenience
        break;
    }

    return {
      supplierProductId: `${supplier.id}-${item.sku || item.id}`,
      sku: item.sku || `SUP-${item.id.slice(0, 8)}`,
      name: item.name,
      unitPrice: Math.round(estimatedPrice * 100) / 100,
      availability: "in_stock",
      estimatedDelivery: new Date(Date.now() + supplier.deliveryTime * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      packageSize: 1,
    };
  }

  /**
   * Get organization's supplier preferences
   */
  private static async getOrganizationSupplierPreferences(
    organizationId: string
  ): Promise<{
    preferredSuppliers: string[];
    excludedSuppliers: string[];
    maxDeliveryDays: number;
    budgetConstraints?: {
      maxOrderValue: number;
      requireApproval: boolean;
    };
  } | null> {
    try {
      // Get preferences from database
      const supplierPreferences = await prisma.supplierPreference.findMany({
        where: {
          organizationId: organizationId,
        },
        select: {
          supplierId: true,
          preferenceLevel: true,
        },
      });

      const preferredSuppliers = supplierPreferences
        .filter(pref => pref.preferenceLevel === "preferred")
        .map(pref => pref.supplierId);

      const excludedSuppliers = supplierPreferences
        .filter(pref => pref.preferenceLevel === "excluded")
        .map(pref => pref.supplierId);

      return {
        preferredSuppliers: preferredSuppliers.length > 0 ? preferredSuppliers : ["mckesson", "cardinal"], // Default fallback
        excludedSuppliers,
        maxDeliveryDays: 3,
        budgetConstraints: {
          maxOrderValue: 1000,
          requireApproval: true,
        },
      };
    } catch (error) {
      console.error('Error fetching supplier preferences:', error);
      // Fallback to default preferences
      return {
        preferredSuppliers: ["mckesson", "cardinal"],
        excludedSuppliers: [],
        maxDeliveryDays: 3,
        budgetConstraints: {
          maxOrderValue: 1000,
          requireApproval: true,
        },
      };
    }
  }

  /**
   * Prioritize ordering options based on various factors
   */
  private static prioritizeOrderingOptions(
    options: OrderingOption[]
  ): OrderingOption[] {
    return options.sort((a, b) => {
      // Priority weights
      const priorityWeights = {
        preferred_supplier: 4,
        best_price: 3,
        fastest_delivery: 2,
        best_value: 1,
      };

      // Primary sort by priority
      const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort by savings
      const aSavings = a.savings || 0;
      const bSavings = b.savings || 0;
      if (bSavings !== aSavings) return bSavings - aSavings;

      // Tertiary sort by delivery time
      return a.supplier.deliveryTime - b.supplier.deliveryTime;
    });
  }

  /**
   * Track ordering action for analytics
   */
  static async trackOrderingAction(
    organizationId: string,
    itemId: string,
    supplierId: string,
    action: "clicked_link" | "placed_order" | "saved_for_later",
    estimatedValue?: number
  ): Promise<void> {
    // Track which suppliers are most popular
    // Track conversion rates from recommendations to orders
    // This data helps improve our recommendations

    console.log(`Tracking: ${action} for item ${itemId} with supplier ${supplierId}, value: ${estimatedValue}`);

    // In production, store this in analytics table
    // await prisma.supplierAnalytics.create({...});
  }

  /**
   * Get supplier statistics for organization
   */
  static async getSupplierAnalytics(
    organizationId: string
  ): Promise<{
    totalOrdersTracked: number;
    popularSuppliers: { supplier: SupplierInfo; orderCount: number }[];
    averageSavings: number;
    conversionRate: number;
  }> {
    // This would query actual analytics data
    return {
      totalOrdersTracked: 0,
      popularSuppliers: [],
      averageSavings: 0,
      conversionRate: 0,
    };
  }

  /**
   * Generate bulk ordering recommendations
   */
  static async generateBulkOrderRecommendations(
    organizationId: string,
    items: Item[]
  ): Promise<{
    supplier: SupplierInfo;
    items: Array<{
      item: Item;
      recommendedQuantity: number;
      unitPrice: number;
    }>;
    totalValue: number;
    estimatedSavings: number;
    orderingUrl: string;
  }[]> {
    // Group items by optimal supplier
    // Calculate bulk discounts
    // Generate combined ordering URLs

    return []; // Placeholder
  }
}