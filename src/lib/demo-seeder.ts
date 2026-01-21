/**
 * Simple Demo Seeder - Creates minimal test data if organization has no items
 */

import 'server-only';

import { prisma } from "@/lib/db";

const DEMO_ITEMS = [
  {
    name: "N95 Respirator Masks",
    category: "PPE & Safety",
    quantity: 5, // Low stock to trigger reorder AI
    unitCost: 45.00,
    reorderThreshold: 10,
    daysToExpiration: 45, // Will expire soon to trigger waste risk AI
    shelfLifeDays: 730
  },
  {
    name: "Surgical Gloves (Box of 100)",
    category: "PPE & Safety",
    quantity: 125, // High quantity for normal item
    unitCost: 28.50,
    reorderThreshold: 20,
    daysToExpiration: 365, // Safe expiration
    shelfLifeDays: 1460
  }
];

export class DemoSeeder {
  /**
   * Create minimal demo data if organization has no items
   */
  static async seedIfEmpty(organizationId: string): Promise<boolean> {
    // Check if organization already has items
    const existingItemsCount = await prisma.item.count({
      where: { organizationId }
    });

    if (existingItemsCount > 0) {
      return false; // Already has data
    }

    console.log(`🌱 Seeding demo data for new organization ${organizationId}`);

    // Get or create default location
    let defaultLocation = await prisma.location.findFirst({
      where: { organizationId }
    });

    if (!defaultLocation) {
      defaultLocation = await prisma.location.create({
        data: {
          name: "Main Facility",
          address: "123 Medical Center Drive",
          organizationId
        }
      });
    }

    // Create categories and items
    for (const itemData of DEMO_ITEMS) {
      // Create category if it doesn't exist
      let category = await prisma.category.findFirst({
        where: {
          name: itemData.category,
          organizationId
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: itemData.category,
            organizationId
          }
        });
      }

      // Create expiration date
      const expirationDate = new Date(Date.now() + itemData.daysToExpiration * 24 * 60 * 60 * 1000);

      // Create item
      const item = await prisma.item.create({
        data: {
          name: itemData.name,
          sku: `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase(),
          quantity: itemData.quantity,
          unitCost: itemData.unitCost,
          reorderThreshold: itemData.reorderThreshold,
          expirationDate,
          categoryId: category.id,
          locationId: defaultLocation.id,
          organizationId
        }
      });

      // Create some historical usage data for the first item (to trigger AI)
      if (itemData.name.includes("N95")) {
        const usageDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

        await prisma.inventoryChange.create({
          data: {
            itemId: item.id,
            organizationId,
            locationId: defaultLocation.id,
            quantityBefore: 15,
            quantityAfter: 5,
            changeType: "usage",
            createdAt: usageDate
          }
        });

        // Create AI prediction for reorder
        await prisma.aIPrediction.create({
          data: {
            organizationId,
            itemId: item.id,
            predictionType: "reorder",
            predictionValue: {
              daysUntilReorder: 7,
              recommendedQuantity: 50,
              priority: "high",
              estimatedCost: 225.00
            },
            confidenceScore: 0.85,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      }

      // Create waste risk prediction for the second item
      if (itemData.name.includes("Surgical Gloves")) {
        await prisma.aIPrediction.create({
          data: {
            organizationId,
            itemId: item.id,
            predictionType: "waste_risk",
            predictionValue: {
              riskLevel: "medium",
              estimatedWasteQuantity: 25,
              estimatedWasteValue: 178.50,
              daysUntilExpiration: 365,
              recommendation: "Current usage suggests low waste risk, monitor quarterly"
            },
            confidenceScore: 0.72,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    console.log(`✅ Demo seeding completed: ${DEMO_ITEMS.length} items created`);
    return true; // Data was seeded
  }
}