import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateItemSchema } from "@/lib/validations";

// PUT /api/items/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const itemId = params.id;

    // Check if item exists and get organization
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: { organization: true },
    });

    if (!existingItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      id: itemId,
      ...body,
    };

    if (body.expirationDate) {
      updateData.expirationDate = new Date(body.expirationDate);
    }

    // Validate the input
    const validationResult = updateItemSchema.safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Remove the id from the data (it's not needed for the update)
    const { id, ...dataToUpdate } = validationResult.data;

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: dataToUpdate,
      include: {
        category: true,
        organization: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Delete the item
    await prisma.item.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}