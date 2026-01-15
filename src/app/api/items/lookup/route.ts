import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    // Get barcode from query parameters
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { message: "Barcode parameter is required" },
        { status: 400 }
      );
    }

    // Clean the barcode (remove any whitespace)
    const cleanBarcode = barcode.trim();

    if (cleanBarcode.length < 4) {
      return NextResponse.json(
        { message: "Barcode must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // Look up item by SKU or name (many products use SKU as barcode)
    // We'll search for exact SKU match first, then partial name match
    const item = await prisma.item.findFirst({
      where: {
        organizationId: organization!.id,
        OR: [
          {
            sku: {
              equals: cleanBarcode,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: cleanBarcode,
              mode: 'insensitive'
            }
          },
          // Some barcodes might be stored as part of the name or description
          {
            name: {
              contains: cleanBarcode.replace(/\D/g, ''), // Remove non-digits for partial matching
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        // Prefer exact SKU matches
        {
          sku: 'asc'
        },
        {
          createdAt: 'desc'
        }
      ]
    });

    if (!item) {
      return NextResponse.json(
        {
          message: `No item found with barcode "${cleanBarcode}"`,
          suggestions: [
            "Check if the barcode is readable",
            "Verify the product is in your inventory",
            "Try scanning again or enter manually",
            "Add as new product if this is a new item"
          ]
        },
        { status: 404 }
      );
    }

    // Return the found item with serialized data
    const serializedItem = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toISOString(),
      reorderThreshold: item.reorderThreshold,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      category: {
        id: item.category.id,
        name: item.category.name,
      },
    };

    return NextResponse.json(serializedItem);
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint for updating scanned item quantities
export async function POST(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization } = await getUserOrganization();
    if (orgError) return orgError;

    const body = await request.json();
    const { barcode, operation = "increment", quantity = 1 } = body;

    if (!barcode) {
      return NextResponse.json(
        { message: "Barcode is required" },
        { status: 400 }
      );
    }

    // Find the item first
    const item = await prisma.item.findFirst({
      where: {
        organizationId: organization!.id,
        sku: {
          equals: barcode.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (!item) {
      return NextResponse.json(
        { message: "Item not found" },
        { status: 404 }
      );
    }

    // Update quantity based on operation
    let newQuantity: number;
    switch (operation) {
      case "increment":
        newQuantity = item.quantity + Math.abs(quantity);
        break;
      case "decrement":
        newQuantity = Math.max(0, item.quantity - Math.abs(quantity));
        break;
      case "set":
        newQuantity = Math.max(0, quantity);
        break;
      default:
        return NextResponse.json(
          { message: "Invalid operation. Use 'increment', 'decrement', or 'set'" },
          { status: 400 }
        );
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: item.id },
      data: { quantity: newQuantity },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Return updated item
    const serializedItem = {
      id: updatedItem.id,
      name: updatedItem.name,
      sku: updatedItem.sku,
      quantity: updatedItem.quantity,
      unitCost: updatedItem.unitCost.toString(),
      expirationDate: updatedItem.expirationDate.toISOString(),
      reorderThreshold: updatedItem.reorderThreshold,
      category: {
        id: updatedItem.category.id,
        name: updatedItem.category.name,
      },
      previousQuantity: item.quantity,
      operation,
      quantityChanged: Math.abs(quantity)
    };

    return NextResponse.json(serializedItem);
  } catch (error) {
    console.error("Barcode update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}