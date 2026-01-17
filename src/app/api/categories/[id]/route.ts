import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getUserOrganization,
  verifyCategoryOwnership,
} from "@/lib/auth-helpers";

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    const { id: categoryId } = await params;

    // Verify category ownership - CRITICAL SECURITY CHECK
    const { error: categoryError, category: existingCategory } =
      await verifyCategoryOwnership(categoryId, organization!.id);
    if (categoryError) return categoryError;

    // Check if category has items
    if (existingCategory._count.items > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category "${existingCategory.name}" because it contains ${existingCategory._count.items} item(s). Please move or delete those items first.`,
        },
        { status: 409 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
