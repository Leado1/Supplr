import { prisma } from "../src/lib/db";

async function seedDemoLocations() {
  try {
    // Find the demo user's organization
    const demoUser = await prisma.user.findFirst({
      where: {
        email: "demo@supplr.net",
        status: "ACTIVE",
      },
      include: {
        organization: true,
      },
    });

    if (!demoUser || !demoUser.organization) {
      console.error(
        "Demo user or organization not found. Please ensure the demo user exists."
      );
      return;
    }

    console.log(`Found demo organization: ${demoUser.organization.name}`);

    // Check if locations already exist
    const existingLocations = await prisma.location.findMany({
      where: {
        organizationId: demoUser.organization.id,
      },
    });

    if (existingLocations.length > 0) {
      console.log(
        `Found ${existingLocations.length} existing locations. Skipping seed.`
      );
      return;
    }

    // Create demo locations
    const locations = [
      {
        name: "Main Clinic",
        address: "123 Medical Center Dr\nDowntown, NY 10001",
        phone: "(555) 123-4567",
        email: "main@democlinic.com",
        timezone: "America/New_York",
        currency: "USD",
        isActive: true,
        organizationId: demoUser.organization.id,
      },
      {
        name: "Uptown Branch",
        address: "456 Park Avenue\nUptown, NY 10002",
        phone: "(555) 234-5678",
        email: "uptown@democlinic.com",
        timezone: "America/New_York",
        currency: "USD",
        isActive: true,
        organizationId: demoUser.organization.id,
      },
      {
        name: "West Side Location",
        address: "789 Broadway\nWest Side, NY 10003",
        phone: "(555) 345-6789",
        email: "westside@democlinic.com",
        timezone: "America/New_York",
        currency: "USD",
        isActive: true,
        organizationId: demoUser.organization.id,
      },
      {
        name: "Satellite Office",
        address: "321 Oak Street\nSuburbs, NY 10004",
        phone: "(555) 456-7890",
        email: "satellite@democlinic.com",
        timezone: "America/New_York",
        currency: "USD",
        isActive: false, // Inactive for testing
        organizationId: demoUser.organization.id,
      },
    ];

    // Create all locations
    const createdLocations = await prisma.location.createMany({
      data: locations,
    });

    console.log(
      `Successfully created ${createdLocations.count} demo locations`
    );

    // List created locations
    const allLocations = await prisma.location.findMany({
      where: {
        organizationId: demoUser.organization.id,
      },
    });

    console.log("\nCreated locations:");
    allLocations.forEach((loc, i) => {
      console.log(
        `${i + 1}. ${loc.name} (${loc.isActive ? "Active" : "Inactive"})`
      );
      console.log(`   Address: ${loc.address || "N/A"}`);
      console.log(`   Phone: ${loc.phone || "N/A"}`);
      console.log(`   Email: ${loc.email || "N/A"}`);
      console.log(`   Timezone: ${loc.timezone}, Currency: ${loc.currency}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error seeding demo locations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoLocations();
