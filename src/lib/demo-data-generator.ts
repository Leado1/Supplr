/**
 * Demo Data Generator - Creates realistic medical inventory data for AI showcasing
 * Generates items with usage patterns that will trigger AI predictions
 */

import 'server-only';

import { prisma } from "@/lib/db";
import type { Item, Category, Location, InventoryChange, Organization } from "@prisma/client";

// Medical supply categories with realistic items
const MEDICAL_CATEGORIES = {
  "Pharmaceuticals": [
    { name: "Amoxicillin 500mg", avgCost: 12.50, shelfLife: 730 },
    { name: "Ibuprofen 200mg", avgCost: 8.99, shelfLife: 1095 },
    { name: "Acetaminophen 325mg", avgCost: 6.75, shelfLife: 1460 },
    { name: "Aspirin 81mg", avgCost: 4.50, shelfLife: 1095 },
    { name: "Metformin 500mg", avgCost: 15.25, shelfLife: 730 },
    { name: "Lisinopril 10mg", avgCost: 18.99, shelfLife: 730 },
    { name: "Simvastatin 20mg", avgCost: 22.50, shelfLife: 730 }
  ],
  "PPE & Safety": [
    { name: "N95 Respirator Masks", avgCost: 45.00, shelfLife: 1825 },
    { name: "Surgical Masks (Box of 50)", avgCost: 12.99, shelfLife: 1095 },
    { name: "Nitrile Gloves (Box of 100)", avgCost: 28.50, shelfLife: 1460 },
    { name: "Face Shields", avgCost: 35.75, shelfLife: 1825 },
    { name: "Isolation Gowns", avgCost: 125.00, shelfLife: 1095 },
    { name: "Safety Glasses", avgCost: 18.25, shelfLife: 1825 }
  ],
  "Medical Devices": [
    { name: "Digital Thermometers", avgCost: 65.99, shelfLife: 1825 },
    { name: "Blood Pressure Monitors", avgCost: 185.50, shelfLife: 1825 },
    { name: "Pulse Oximeters", avgCost: 95.75, shelfLife: 1825 },
    { name: "Stethoscopes", avgCost: 145.00, shelfLife: 3650 },
    { name: "Otoscopes", avgCost: 225.99, shelfLife: 3650 }
  ],
  "Surgical Supplies": [
    { name: "Sterile Gauze Pads", avgCost: 24.99, shelfLife: 1095 },
    { name: "Medical Tape", avgCost: 8.50, shelfLife: 730 },
    { name: "Surgical Scissors", avgCost: 45.25, shelfLife: 1825 },
    { name: "Disposable Syringes", avgCost: 35.00, shelfLife: 1460 },
    { name: "IV Catheters", avgCost: 125.50, shelfLife: 1095 },
    { name: "Surgical Sutures", avgCost: 85.75, shelfLife: 1095 }
  ],
  "Diagnostic Supplies": [
    { name: "Rapid COVID-19 Tests", avgCost: 165.00, shelfLife: 365 },
    { name: "Blood Glucose Test Strips", avgCost: 45.99, shelfLife: 730 },
    { name: "Urine Test Strips", avgCost: 28.75, shelfLife: 730 },
    { name: "Pregnancy Tests", avgCost: 125.00, shelfLife: 730 },
    { name: "Strep Test Kits", avgCost: 89.50, shelfLife: 365 }
  ],
  "First Aid": [
    { name: "Adhesive Bandages", avgCost: 12.99, shelfLife: 1460 },
    { name: "Antiseptic Wipes", avgCost: 15.50, shelfLife: 730 },
    { name: "Instant Ice Packs", avgCost: 22.75, shelfLife: 1095 },
    { name: "Burn Gel", avgCost: 18.99, shelfLife: 1095 },
    { name: "Emergency Blankets", avgCost: 35.25, shelfLife: 1825 }
  ]
};

// Realistic usage patterns for different item types
const USAGE_PATTERNS = {
  high_turnover: { dailyUsage: [3, 8], pattern: "consistent" },      // 3-8 items per day
  medium_turnover: { dailyUsage: [1, 4], pattern: "variable" },     // 1-4 items per day
  low_turnover: { dailyUsage: [0.2, 1], pattern: "sporadic" },      // 1 item every 1-5 days
  seasonal: { dailyUsage: [0.5, 3], pattern: "seasonal" },          // Varies by season
  emergency: { dailyUsage: [0, 0.3], pattern: "emergency" }         // Very occasional use
};

// Item category to usage pattern mapping
const CATEGORY_USAGE_PATTERNS: { [key: string]: keyof typeof USAGE_PATTERNS } = {
  "Pharmaceuticals": "high_turnover",
  "PPE & Safety": "high_turnover",
  "Medical Devices": "low_turnover",
  "Surgical Supplies": "medium_turnover",
  "Diagnostic Supplies": "medium_turnover",
  "First Aid": "medium_turnover"
};

export interface DemoDataOptions {
  organizationId: string;
  itemsPerCategory?: number;
  generateUsageHistory?: boolean;
  historicalDays?: number;
  createExpiredItems?: boolean;
  createLowStockItems?: boolean;
  wasteRiskPercentage?: number;
}

export class DemoDataGenerator {
  /**
   * Generate comprehensive demo data for AI showcase
   */
  static async generateDemoData(options: DemoDataOptions): Promise<{
    categoriesCreated: number;
    itemsCreated: number;
    usageRecordsCreated: number;
    summary: {
      expiredItems: number;
      lowStockItems: number;
      wasteRiskItems: number;
      totalValue: number;
    };
  }> {
    const {
      organizationId,
      itemsPerCategory = 3,
      generateUsageHistory = true,
      historicalDays = 90,
      createExpiredItems = true,
      createLowStockItems = true,
      wasteRiskPercentage = 0.15
    } = options;

    console.log(`🚀 Generating demo data for organization ${organizationId}...`);

    // Check if organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!org) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    let categoriesCreated = 0;
    let itemsCreated = 0;
    let usageRecordsCreated = 0;
    let expiredItems = 0;
    let lowStockItems = 0;
    let wasteRiskItems = 0;
    let totalValue = 0;

    // Create default location if it doesn't exist
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
    for (const [categoryName, items] of Object.entries(MEDICAL_CATEGORIES)) {
      // Create category
      let category = await prisma.category.findFirst({
        where: {
          name: categoryName,
          organizationId
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            organizationId
          }
        });
        categoriesCreated++;
      }

      // Create items for this category
      const selectedItems = items.slice(0, itemsPerCategory);

      for (const itemTemplate of selectedItems) {
        const usagePattern = USAGE_PATTERNS[CATEGORY_USAGE_PATTERNS[categoryName]];

        // Calculate quantities and dates strategically for AI demos
        const baseQuantity = this.randomBetween(50, 200);
        let quantity = baseQuantity;

        // Create some low stock items
        if (createLowStockItems && Math.random() < 0.2) {
          quantity = this.randomBetween(1, 8);
          lowStockItems++;
        }

        // Create expiration dates - some expired, some expiring soon
        let expirationDate = new Date();
        if (createExpiredItems && Math.random() < 0.1) {
          // 10% expired items
          expirationDate = new Date(Date.now() - this.randomBetween(1, 30) * 24 * 60 * 60 * 1000);
          expiredItems++;
        } else if (Math.random() < wasteRiskPercentage) {
          // Items expiring soon with high quantity (waste risk)
          expirationDate = new Date(Date.now() + this.randomBetween(10, 45) * 24 * 60 * 60 * 1000);
          quantity = Math.max(quantity, this.randomBetween(80, 150)); // Higher quantity for waste risk
          wasteRiskItems++;
        } else {
          // Normal expiration dates
          expirationDate = new Date(Date.now() + this.randomBetween(30, itemTemplate.shelfLife) * 24 * 60 * 60 * 1000);
        }

        // Calculate reorder threshold based on usage pattern
        const avgDailyUsage = (usagePattern.dailyUsage[0] + usagePattern.dailyUsage[1]) / 2;
        const reorderThreshold = Math.max(5, Math.round(avgDailyUsage * 14)); // 2 weeks safety stock

        // Create item
        const item = await prisma.item.create({
          data: {
            name: itemTemplate.name,
            sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
            quantity,
            unitCost: itemTemplate.avgCost + (Math.random() - 0.5) * itemTemplate.avgCost * 0.3, // ±30% variation
            reorderThreshold,
            expirationDate,
            categoryId: category.id,
            locationId: defaultLocation.id,
            organizationId
          }
        });

        itemsCreated++;
        totalValue += item.quantity * Number(item.unitCost);

        // Generate historical usage data if requested
        if (generateUsageHistory) {
          const usageRecords = await this.generateUsageHistory(
            item,
            historicalDays,
            usagePattern
          );
          usageRecordsCreated += usageRecords;
        }

        console.log(`📦 Created item: ${item.name} (Qty: ${item.quantity}, Expires: ${expirationDate.toDateString()})`);
      }
    }

    console.log(`✅ Demo data generation completed!`);
    console.log(`📊 Summary: ${categoriesCreated} categories, ${itemsCreated} items, ${usageRecordsCreated} usage records`);

    return {
      categoriesCreated,
      itemsCreated,
      usageRecordsCreated,
      summary: {
        expiredItems,
        lowStockItems,
        wasteRiskItems,
        totalValue: Math.round(totalValue * 100) / 100
      }
    };
  }

  /**
   * Generate realistic usage history for an item
   */
  private static async generateUsageHistory(
    item: Item,
    days: number,
    usagePattern: typeof USAGE_PATTERNS[keyof typeof USAGE_PATTERNS]
  ): Promise<number> {
    let recordsCreated = 0;
    let currentQuantity = item.quantity;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Track quantity over time to create realistic usage patterns
    const restockEvents: Date[] = [];
    const usageEvents: { date: Date; usage: number }[] = [];

    // Generate usage events
    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

      // Determine daily usage based on pattern
      let dailyUsage = 0;

      switch (usagePattern.pattern) {
        case "consistent":
          dailyUsage = this.randomBetween(usagePattern.dailyUsage[0], usagePattern.dailyUsage[1]);
          break;
        case "variable":
          // More variable usage
          dailyUsage = Math.random() < 0.7 ?
            this.randomBetween(usagePattern.dailyUsage[0], usagePattern.dailyUsage[1]) : 0;
          break;
        case "sporadic":
          // Sporadic usage
          dailyUsage = Math.random() < 0.3 ?
            this.randomBetween(usagePattern.dailyUsage[0], usagePattern.dailyUsage[1]) : 0;
          break;
        case "seasonal":
          // Simulate seasonal variation (higher usage in winter months)
          const monthMultiplier = [1.2, 1.3, 1.1, 0.8, 0.6, 0.5, 0.5, 0.6, 0.8, 1.0, 1.1, 1.2][currentDate.getMonth()];
          dailyUsage = Math.round(this.randomBetween(usagePattern.dailyUsage[0], usagePattern.dailyUsage[1]) * monthMultiplier);
          break;
        case "emergency":
          // Very occasional emergency usage
          dailyUsage = Math.random() < 0.05 ? this.randomBetween(1, 3) : 0;
          break;
      }

      if (dailyUsage > 0) {
        usageEvents.push({ date: currentDate, usage: Math.round(dailyUsage) });
      }
    }

    // Simulate restocking to maintain inventory levels
    let runningQuantity = this.randomBetween(20, 50); // Starting historical quantity

    for (const event of usageEvents.reverse()) { // Process from oldest to newest
      // Check if we need to restock before this usage
      if (runningQuantity < event.usage + item.reorderThreshold) {
        const restockAmount = this.randomBetween(item.reorderThreshold * 2, item.reorderThreshold * 4);
        const restockDate = new Date(event.date.getTime() - this.randomBetween(1, 3) * 24 * 60 * 60 * 1000);

        restockEvents.push(restockDate);
        runningQuantity += restockAmount;
      }

      // Apply usage
      runningQuantity = Math.max(0, runningQuantity - event.usage);
    }

    // Create inventory change records for restocks
    for (const restockDate of restockEvents) {
      const restockAmount = this.randomBetween(item.reorderThreshold * 2, item.reorderThreshold * 4);
      const quantityBefore = this.randomBetween(5, item.reorderThreshold);
      const quantityAfter = quantityBefore + restockAmount;

      await prisma.inventoryChange.create({
        data: {
          itemId: item.id,
          organizationId: item.organizationId,
          locationId: item.locationId,
          quantityBefore,
          quantityAfter,
          changeType: "restock",
          createdAt: restockDate
        }
      });
      recordsCreated++;
    }

    // Create inventory change records for usage
    for (const event of usageEvents) {
      const quantityBefore = this.randomBetween(event.usage, event.usage + 20);
      const quantityAfter = quantityBefore - event.usage;

      await prisma.inventoryChange.create({
        data: {
          itemId: item.id,
          organizationId: item.organizationId,
          locationId: item.locationId,
          quantityBefore,
          quantityAfter,
          changeType: "usage",
          createdAt: event.date
        }
      });
      recordsCreated++;
    }

    // Add some waste records (expired items that were disposed)
    if (Math.random() < 0.1) {
      const wasteDate = new Date(Date.now() - this.randomBetween(1, 30) * 24 * 60 * 60 * 1000);
      const wasteAmount = this.randomBetween(1, 5);

      await prisma.inventoryChange.create({
        data: {
          itemId: item.id,
          organizationId: item.organizationId,
          locationId: item.locationId,
          quantityBefore: wasteAmount,
          quantityAfter: 0,
          changeType: "waste",
          createdAt: wasteDate
        }
      });
      recordsCreated++;
    }

    return recordsCreated;
  }

  /**
   * Clean existing demo data for an organization
   */
  static async cleanDemoData(organizationId: string): Promise<{
    itemsDeleted: number;
    categoriesDeleted: number;
    changesDeleted: number;
  }> {
    console.log(`🧹 Cleaning existing demo data for organization ${organizationId}...`);

    // Delete inventory changes first (foreign key constraint)
    const changesDeleted = await prisma.inventoryChange.deleteMany({
      where: { organizationId }
    });

    // Delete items
    const itemsDeleted = await prisma.item.deleteMany({
      where: { organizationId }
    });

    // Delete categories
    const categoriesDeleted = await prisma.category.deleteMany({
      where: { organizationId }
    });

    console.log(`✅ Cleanup completed: ${itemsDeleted.count} items, ${categoriesDeleted.count} categories, ${changesDeleted.count} changes deleted`);

    return {
      itemsDeleted: itemsDeleted.count,
      categoriesDeleted: categoriesDeleted.count,
      changesDeleted: changesDeleted.count
    };
  }

  /**
   * Generate random number between min and max (inclusive)
   */
  private static randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate sample AI predictions for demo purposes
   */
  static async generateSamplePredictions(organizationId: string): Promise<number> {
    console.log(`🤖 Generating sample AI predictions for organization ${organizationId}...`);

    const items = await prisma.item.findMany({
      where: { organizationId },
      take: 10 // Generate predictions for first 10 items
    });

    let predictionsCreated = 0;

    for (const item of items) {
      // Generate reorder prediction
      if (Math.random() < 0.4) {
        await prisma.aIPrediction.create({
          data: {
            organizationId,
            itemId: item.id,
            predictionType: "reorder",
            predictionValue: {
              daysUntilReorder: this.randomBetween(5, 20),
              recommendedQuantity: this.randomBetween(20, 100),
              priority: ["low", "medium", "high"][this.randomBetween(0, 2)],
              estimatedCost: this.randomBetween(100, 500)
            },
            confidenceScore: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 1 week
          }
        });
        predictionsCreated++;
      }

      // Generate waste risk prediction
      if (Math.random() < 0.3) {
        await prisma.aIPrediction.create({
          data: {
            organizationId,
            itemId: item.id,
            predictionType: "waste_risk",
            predictionValue: {
              riskLevel: ["low", "medium", "high"][this.randomBetween(0, 2)],
              estimatedWasteQuantity: this.randomBetween(5, 25),
              estimatedWasteValue: this.randomBetween(50, 300),
              daysUntilExpiration: this.randomBetween(10, 60),
              recommendation: "Consider priority usage or transfer to high-usage location"
            },
            confidenceScore: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Expires in 3 days
          }
        });
        predictionsCreated++;
      }
    }

    console.log(`✅ Generated ${predictionsCreated} sample AI predictions`);
    return predictionsCreated;
  }
}