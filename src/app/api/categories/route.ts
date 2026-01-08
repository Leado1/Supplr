import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCategorySchema } from "@/lib/validations";

// GET /api/categories - Get all categories for the organization
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the first organization (for MVP, we'll use the seeded one)
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      return NextResponse.json({ message: "No organization found" }, { status: 404 });
    }

    // Fetch all categories for the organization
    const categories = await prisma.category.findMany({
      where: {
        organizationId: organization.id,
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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the input
    const validationResult = createCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get the first organization (for MVP)
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      return NextResponse.json({ message: "No organization found" }, { status: 404 });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: {
        organizationId_name: {
          organizationId: organization.id,
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
        organizationId: organization.id,
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