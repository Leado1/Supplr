import { prisma } from "../src/lib/db";

async function createDemoUser() {
  try {
    // First, check if demo user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: "demo@supplr.net" },
    });

    if (existingUser) {
      console.log("Demo user already exists!");
      return;
    }

    // Create demo organization first
    const organization = await prisma.organization.create({
      data: {
        name: "Demo Medical Spa",
        type: "medspa",
      },
    });

    console.log("Created demo organization:", organization.name);

    // Create demo user as OWNER
    const demoUser = await prisma.user.create({
      data: {
        clerkId: "demo_clerk_id_12345", // Fake clerk ID for demo
        email: "demo@supplr.net",
        firstName: "Demo",
        lastName: "User",
        organizationId: organization.id,
        role: "OWNER", // This is crucial for multi-location access
        status: "ACTIVE",
      },
    });

    console.log(
      "Created demo user:",
      demoUser.email,
      "with role:",
      demoUser.role
    );

    // Create subscription with Enterprise features
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: "enterprise",
        status: "active",
        itemLimit: 999999,
        isActive: true,
        // Enable all Enterprise features
        advancedAnalytics: true,
        customCategories: true,
        apiAccess: true,
        multiLocation: true,
        customReports: true,
      },
    });

    console.log("Created Enterprise subscription for demo organization");

    // Create default settings
    const settings = await prisma.settings.create({
      data: {
        organizationId: organization.id,
        expirationWarningDays: 30,
        lowStockThreshold: 5,
        currency: "USD",
        timezone: "America/New_York",
      },
    });

    console.log("Created default settings");

    // Create some demo categories
    const categories = [
      { name: "Injectables", organizationId: organization.id },
      { name: "Skincare", organizationId: organization.id },
      { name: "Equipment", organizationId: organization.id },
      { name: "Consumables", organizationId: organization.id },
      { name: "Other", organizationId: organization.id },
    ];

    await prisma.category.createMany({
      data: categories,
    });

    console.log("Created demo categories");

    console.log("\n🎉 Demo setup complete!");
    console.log("✅ Demo user: demo@supplr.net (OWNER role)");
    console.log("✅ Organization: Demo Medical Spa");
    console.log("✅ Plan: Enterprise (all features enabled)");
    console.log("✅ Categories: 5 demo categories created");
    console.log(
      "\nYou can now log in with demo@supplr.net to test Enterprise features!"
    );
  } catch (error) {
    console.error("Error creating demo user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
