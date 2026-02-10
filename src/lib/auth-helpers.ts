import 'server-only';

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import {
  hasPermission,
  requirePermission,
  Permission,
  type OrganizationRole,
} from "@/lib/permissions";

const demoFallbackEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_DEMO_FALLBACK === "true";

/**
 * Get the authenticated user's organization with proper security checks and role information
 * Returns the organization, user, and role information or an error response if unauthorized/not found
 */
export async function getUserOrganization() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      organization: null,
      user: null,
    };
  }

  // Get user with their organization - include status check for active users
  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
      // Only allow active users to access the system
      status: "ACTIVE",
    },
    include: {
      organization: {
        include: {
          users: {
            where: { status: "ACTIVE" }, // Only include active team members
          },
          settings: true,
          subscription: true,
        },
      },
    },
  });

  // TEMPORARY: If user doesn't exist, try finding demo user directly (dev only)
  if (!user) {
    if (!demoFallbackEnabled()) {
      return {
        error: NextResponse.json({ message: "User not found" }, { status: 404 }),
        organization: null,
        user: null,
      };
    }

    console.log(
      "No user found with Clerk authentication, trying demo fallback..."
    );

    // Try to find demo user directly (for demo purposes)
    const demoUser = await prisma.user.findFirst({
      where: {
        email: "demo@supplr.net",
        status: "ACTIVE",
      },
      include: {
        organization: {
          include: {
            users: {
              where: { status: "ACTIVE" },
            },
            settings: true,
            subscription: true,
          },
        },
      },
    });

    if (demoUser && demoUser.organization) {
      console.log("Demo user found, using demo organization");
      return {
        error: null,
        organization: demoUser.organization,
        user: demoUser,
      };
    }

    return {
      error: NextResponse.json({ message: "User not found" }, { status: 404 }),
      organization: null,
      user: null,
    };
  }

  if (!user.organization) {
    return {
      error: NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      ),
      organization: null,
    };
  }

  return {
    error: null,
    organization: user.organization,
    user,
  };
}

/**
 * Verify that an item belongs to the user's organization
 */
export async function verifyItemOwnership(
  itemId: string,
  organizationId: string
) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { organization: true },
  });

  if (!item) {
    return {
      error: NextResponse.json({ message: "Item not found" }, { status: 404 }),
      item: null,
    };
  }

  if (item.organizationId !== organizationId) {
    return {
      error: NextResponse.json(
        {
          message: "Access denied - item does not belong to your organization",
        },
        { status: 403 }
      ),
      item: null,
    };
  }

  return {
    error: null,
    item,
  };
}

/**
 * Verify that a category belongs to the user's organization
 */
export async function verifyCategoryOwnership(
  categoryId: string,
  organizationId: string
) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      organization: true,
      _count: {
        select: { items: true },
      },
    },
  });

  if (!category) {
    return {
      error: NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      ),
      category: null,
    };
  }

  if (category.organizationId !== organizationId) {
    return {
      error: NextResponse.json(
        {
          message:
            "Access denied - category does not belong to your organization",
        },
        { status: 403 }
      ),
      category: null,
    };
  }

  return {
    error: null,
    category,
  };
}

/**
 * Get the authenticated user with role information
 * Simplified version that returns user and organization with role context
 */
export async function getUserWithRole() {
  const { userId } = await auth();

  if (!userId) {
    // Try demo fallback for development
    if (demoFallbackEnabled()) {
      const demoUser = await prisma.user.findFirst({
        where: {
          email: "demo@supplr.net",
          status: "ACTIVE",
        },
        include: {
          organization: {
            include: { settings: true, subscription: true },
          },
        },
      });

      if (demoUser && demoUser.organization) {
        return {
          error: null,
          user: demoUser,
          organization: demoUser.organization,
        };
      }
    }

    return { error: 401, user: null, organization: null };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId, status: "ACTIVE" },
    include: {
      organization: {
        include: { settings: true, subscription: true },
      },
    },
  });

  if (!user) {
    // Try demo fallback if Clerk user doesn't match database (dev only)
    if (demoFallbackEnabled()) {
      const demoUser = await prisma.user.findFirst({
        where: {
          email: "demo@supplr.net",
          status: "ACTIVE",
        },
        include: {
          organization: {
            include: { settings: true, subscription: true },
          },
        },
      });

      if (demoUser && demoUser.organization) {
        console.log("Using demo user fallback for Clerk ID:", userId);
        return {
          error: null,
          user: demoUser,
          organization: demoUser.organization,
        };
      }
    }

    return { error: 404, user: null, organization: null };
  }

  return { error: null, user, organization: user.organization };
}

/**
 * Check if the current user has a specific permission
 */
export async function checkUserPermission(requiredPermission: Permission) {
  const { error, user } = await getUserWithRole();

  if (error || !user) {
    return false;
  }

  return hasPermission(user.role as OrganizationRole, requiredPermission);
}

/**
 * Require a specific permission or throw an error
 * Use this in API routes to enforce permission checks
 */
export async function requireUserPermission(requiredPermission: Permission) {
  const { error, user } = await getUserWithRole();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  requirePermission(user.role as OrganizationRole, requiredPermission);

  return { user, organization: user.organization };
}

/**
 * Get all team members for the current user's organization
 * Only accessible to users with MANAGE_TEAM permission
 */
export async function getTeamMembers() {
  const { user, organization } = await requireUserPermission(
    Permission.MANAGE_TEAM
  );

  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      joinedAt: true,
      lastActiveAt: true,
    },
    orderBy: { joinedAt: "asc" },
  });

  return teamMembers;
}
