import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Check if we're in development mode
  if (process.env.NODE_ENV !== "development") {
    console.log("⚠️ Skipping seed data in production environment");
    return;
  }

  // Create a sample organization (development only)
  const organization = await prisma.organization.upsert({
    where: { id: "sample-org-id" },
    update: {},
    create: {
      id: "sample-org-id",
      name: "Demo Medical Spa",
      type: "medspa",
    },
  });

  console.log(`✅ Created organization: ${organization.name}`);

  // Create organization settings
  const settings = await prisma.settings.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      expirationWarningDays: 7, // Only items expiring within 7 days are "expiring_soon"
      lowStockThreshold: 5,
      currency: "USD",
      timezone: "UTC",
    },
  });

  console.log(`✅ Created settings for organization`);

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Injectables"
        }
      },
      update: {},
      create: {
        name: "Injectables",
        organizationId: organization.id,
      },
    }),
    prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Skincare"
        }
      },
      update: {},
      create: {
        name: "Skincare",
        organizationId: organization.id,
      },
    }),
    prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Consumables"
        }
      },
      update: {},
      create: {
        name: "Consumables",
        organizationId: organization.id,
      },
    }),
    prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Equipment"
        }
      },
      update: {},
      create: {
        name: "Equipment",
        organizationId: organization.id,
      },
    }),
    prisma.category.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "Other"
        }
      },
      update: {},
      create: {
        name: "Other",
        organizationId: organization.id,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create subscription for organization
  const subscription = await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      plan: "trial",
      itemLimit: 5,
      isActive: true,
      status: "active",
    },
  });

  console.log(`✅ Created subscription for organization`);

  // Create a sample user (you can replace this Clerk ID with your actual one)
  const user = await prisma.user.upsert({
    where: { clerkId: "sample-clerk-id" },
    update: {},
    create: {
      clerkId: "sample-clerk-id",
      email: "demo@supplr.com",
      firstName: "Demo",
      lastName: "User",
      organizationId: organization.id,
    },
  });

  console.log(`✅ Created sample user: ${user.email}`);

  // Create sample inventory items
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  const nextSixMonths = new Date();
  nextSixMonths.setMonth(today.getMonth() + 6);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const nextThreeDays = new Date();
  nextThreeDays.setDate(today.getDate() + 3);
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const items = await Promise.all([
    // Injectables
    prisma.item.create({
      data: {
        name: "Botox 100 Units",
        sku: "BTX-100",
        categoryId: categories[0].id,
        organizationId: organization.id,
        quantity: 12,
        unitCost: 450.00,
        expirationDate: nextSixMonths, // Good status - plenty of stock and time
        reorderThreshold: 5,
      },
    }),
    prisma.item.create({
      data: {
        name: "Juvederm Ultra XC",
        sku: "JUV-UXC",
        categoryId: categories[0].id,
        organizationId: organization.id,
        quantity: 3,
        unitCost: 320.00,
        expirationDate: nextThreeDays, // Expiring soon (within 7 days)
        reorderThreshold: 5,
      },
    }),
    prisma.item.create({
      data: {
        name: "Restylane Lyft",
        sku: "RST-LYFT",
        categoryId: categories[0].id,
        organizationId: organization.id,
        quantity: 2,
        unitCost: 380.00,
        expirationDate: lastMonth, // Expired
        reorderThreshold: 5,
      },
    }),
    // Skincare
    prisma.item.create({
      data: {
        name: "HydraFacial Solution",
        categoryId: categories[1].id,
        organizationId: organization.id,
        quantity: 8,
        unitCost: 75.00,
        expirationDate: nextSixMonths, // Low stock but not expiring
        reorderThreshold: 10,
      },
    }),
    prisma.item.create({
      data: {
        name: "Vitamin C Serum",
        sku: "VC-SER-30",
        categoryId: categories[1].id,
        organizationId: organization.id,
        quantity: 15,
        unitCost: 65.00,
        expirationDate: nextSixMonths, // Low stock but not expiring
        reorderThreshold: 20,
      },
    }),
    // Consumables
    prisma.item.create({
      data: {
        name: "Disposable Syringes 1ml",
        sku: "SYR-1ML",
        categoryId: categories[2].id,
        organizationId: organization.id,
        quantity: 4, // Low stock
        unitCost: 1.50,
        expirationDate: nextSixMonths, // Low stock but not expiring
        reorderThreshold: 50,
      },
    }),
    prisma.item.create({
      data: {
        name: "Sterile Gauze Pads",
        categoryId: categories[2].id,
        organizationId: organization.id,
        quantity: 25,
        unitCost: 12.00,
        expirationDate: nextSixMonths, // Good stock
        reorderThreshold: 10,
      },
    }),
  ]);

  console.log(`✅ Created ${items.length} sample inventory items`);

  console.log("🎉 Database seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });