import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const categoryId = params.id;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    // Check if category has items
    if (existingCategory._count.items > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category "${existingCategory.name}" because it contains ${existingCategory._count.items} item(s). Please move or delete those items first.`
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