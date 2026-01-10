import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user's organization with proper security checks
 * Returns the organization or an error response if unauthorized/not found
 */
export async function getUserOrganization() {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      organization: null,
    };
  }

  // Get user with their organization
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: {
          users: true,
          settings: true,
          subscription: true,
        },
      },
    },
  });

  // TEMPORARY: If user doesn't exist, use the sample organization for demo
  // In production, this should be handled by the Clerk webhook
  if (!user) {
    const sampleOrg = await prisma.organization.findFirst({
      include: {
        users: true,
        settings: true,
        subscription: true,
      },
    });

    if (sampleOrg) {
      return {
        error: null,
        organization: sampleOrg,
        user: null, // No specific user for demo
      };
    }

    return {
      error: NextResponse.json({ message: "No organization found. Please run database seed." }, { status: 404 }),
      organization: null,
    };
  }

  if (!user.organization) {
    return {
      error: NextResponse.json({ message: "Organization not found" }, { status: 404 }),
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
export async function verifyItemOwnership(itemId: string, organizationId: string) {
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
      error: NextResponse.json({ message: "Access denied - item does not belong to your organization" }, { status: 403 }),
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
export async function verifyCategoryOwnership(categoryId: string, organizationId: string) {
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
      error: NextResponse.json({ message: "Category not found" }, { status: 404 }),
      category: null,
    };
  }

  if (category.organizationId !== organizationId) {
    return {
      error: NextResponse.json({ message: "Access denied - category does not belong to your organization" }, { status: 403 }),
      category: null,
    };
  }

  return {
    error: null,
    category,
  };
}
