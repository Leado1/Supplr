import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCategorySchema } from "@/lib/validations";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

// GET /api/categories - Get all categories for the organization
export async function GET() {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.VIEW_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to view categories" },
        { status: 403 }
      );
    }

    // Fetch all categories for the organization
    const categories = await prisma.category.findMany({
      where: {
        organizationId: organization!.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to create categories" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the input
    const validationResult = createCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: {
        organizationId_name: {
          organizationId: organization!.id,
          name: validationResult.data.name,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category already exists" },
        { status: 409 }
      );
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: validationResult.data.name,
        organizationId: organization!.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
