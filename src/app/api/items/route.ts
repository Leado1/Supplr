import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addStatusToItems } from "@/lib/inventory-status";
import { createItemSchema } from "@/lib/validations";

// GET /api/items - Get all items for the organization
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the first organization (for MVP, we'll use the seeded one)
    const organization = await prisma.organization.findFirst({
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ message: "No organization found" }, { status: 404 });
    }

    // Fetch all items for the organization
    const items = await prisma.item.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        category: true,
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add status calculations
    const itemsWithStatus = addStatusToItems(items, organization.settings!);

    return NextResponse.json(itemsWithStatus);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the input
    const validationResult = createItemSchema.safeParse({
      ...body,
      expirationDate: new Date(body.expirationDate),
    });

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

    // Create the item
    const item = await prisma.item.create({
      data: {
        ...validationResult.data,
        organizationId: organization.id,
      },
      include: {
        category: true,
        organization: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}