import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateItemSchema } from "@/lib/validations";
import { z } from "zod";
import { getUserOrganization, verifyItemOwnership } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

// Schema for partial updates (like quantity)
const partialUpdateSchema = z.object({
  quantity: z.number().int().min(0).optional(),
});

// PUT /api/items/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to update items" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id: itemId } = await params;

    // Verify item ownership - CRITICAL SECURITY CHECK
    const { error: itemError, item: existingItem } = await verifyItemOwnership(
      itemId,
      organization!.id
    );
    if (itemError) return itemError;

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
        { message: "Invalid data", errors: validationResult.error.issues },
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

// PATCH /api/items/[id] - Partial update (for quick quantity changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.UPDATE_STOCK)) {
      return NextResponse.json(
        { message: "Insufficient permissions to update stock" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id: itemId } = await params;

    // Validate the partial update data
    const validationResult = partialUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Verify item ownership - CRITICAL SECURITY CHECK
    const { error: itemError, item: existingItem } = await verifyItemOwnership(
      itemId,
      organization!.id
    );
    if (itemError) return itemError;

    // Update only the provided fields
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: validationResult.data,
      include: {
        category: true,
        organization: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item quantity:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to delete items" },
        { status: 403 }
      );
    }

    const { id: itemId } = await params;

    // Verify item ownership - CRITICAL SECURITY CHECK
    const { error: itemError, item: existingItem } = await verifyItemOwnership(
      itemId,
      organization!.id
    );
    if (itemError) return itemError;

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
