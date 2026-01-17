import { prisma } from "@/lib/db";

/**
 * Default categories for medical practices
 */
const DEFAULT_CATEGORIES = [
  "Injectables",
  "Skincare",
  "Consumables",
  "Equipment",
  "Other",
];

/**
 * Create a new organization with default settings and categories
 */
export async function createOrganizationWithDefaults(
  organizationName: string,
  type: string = "clinic"
) {
  try {
    // Create the organization
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        type,
      },
    });

    // Create default settings
    const settings = await prisma.settings.create({
      data: {
        organizationId: organization.id,
        expirationWarningDays: 30,
        lowStockThreshold: 5,
        currency: "USD",
        timezone: "UTC",
      },
    });

    // Create default categories
    const categories = await Promise.all(
      DEFAULT_CATEGORIES.map((categoryName) =>
        prisma.category.create({
          data: {
            name: categoryName,
            organizationId: organization.id,
          },
        })
      )
    );

    // Create trial subscription
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: "trial",
        status: "trialing",
        itemLimit: 5,
        isActive: true,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    // Create 2 sample items to show how the system works
    const sampleItems = await Promise.all([
      prisma.item.create({
        data: {
          name: "Sample Product A",
          categoryId: categories[0].id, // First category (Injectables)
          organizationId: organization.id,
          quantity: 3,
          unitCost: 250.0,
          expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          reorderThreshold: 5,
        },
      }),
      prisma.item.create({
        data: {
          name: "Sample Product B",
          categoryId: categories[1].id, // Second category (Skincare)
          organizationId: organization.id,
          quantity: 8,
          unitCost: 125.0,
          expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
          reorderThreshold: 10,
        },
      }),
    ]);

    console.log(
      `✅ Created organization: ${organization.name} with ${categories.length} categories, trial subscription, and ${sampleItems.length} sample items`
    );

    return {
      organization,
      settings,
      categories,
      subscription,
      sampleItems,
    };
  } catch (error) {
    console.error("❌ Failed to create organization:", error);
    throw error;
  }
}

/**
 * Create a user and associate with organization
 * If no organization exists, create one based on the user's info
 */
export async function createUserWithOrganization(userData: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // For MVP, each user gets their own organization
    // In the future, this could support team invitations
    const organizationName = userData.firstName
      ? `${userData.firstName}'s Clinic`
      : `${userData.email.split("@")[0]}'s Clinic`;

    // Create organization with defaults
    const { organization } = await createOrganizationWithDefaults(
      organizationName,
      "clinic"
    );

    // Create the user
    const user = await prisma.user.create({
      data: {
        clerkId: userData.clerkId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationId: organization.id,
      },
      include: {
        organization: {
          include: {
            settings: true,
            categories: true,
          },
        },
      },
    });

    console.log(
      `✅ Created user: ${user.email} for organization: ${organization.name}`
    );

    return user;
  } catch (error) {
    console.error("❌ Failed to create user with organization:", error);
    throw error;
  }
}

/**
 * Get or create user from Clerk ID
 */
export async function getOrCreateUser(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        organization: {
          include: {
            settings: true,
            categories: true,
          },
        },
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user with organization
    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
    };

    return await createUserWithOrganization(userData);
  } catch (error) {
    console.error("❌ Failed to get or create user:", error);
    throw error;
  }
}
