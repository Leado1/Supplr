import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PurchaseOrderStatus } from "@prisma/client";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { SupplierIntegration } from "@/lib/ai/supplier-integration";

const OPEN_DRAFT_STATUSES: PurchaseOrderStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
];

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export async function GET(request: NextRequest) {
  try {
    const { error, organization } = await getUserOrganization();

    if (error || !organization) {
      return error ?? NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemIdsParam = searchParams.get("itemIds") ?? "";
    const itemIds = itemIdsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (itemIds.length === 0) {
      return NextResponse.json({ drafts: [] });
    }

    const draftItems = await prisma.purchaseOrderItem.findMany({
      where: {
        itemId: { in: itemIds },
        purchaseOrder: {
          organizationId: organization.id,
          status: { in: OPEN_DRAFT_STATUSES },
        },
      },
      include: {
        purchaseOrder: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const draftsByItemId = new Map<string, typeof draftItems[number]>();
    for (const draftItem of draftItems) {
      if (!draftsByItemId.has(draftItem.itemId)) {
        draftsByItemId.set(draftItem.itemId, draftItem);
      }
    }

    const drafts = Array.from(draftsByItemId.values()).map((draftItem) => ({
      itemId: draftItem.itemId,
      purchaseOrderId: draftItem.purchaseOrderId,
      status: draftItem.purchaseOrder.status,
      totalEstimatedCost: draftItem.purchaseOrder.totalEstimatedCost
        ? Number(draftItem.purchaseOrder.totalEstimatedCost)
        : null,
      createdAt: draftItem.purchaseOrder.createdAt.toISOString(),
    }));

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Error fetching draft purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to load draft purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization) {
      return error ?? NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to create draft orders" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const itemId = typeof body.itemId === "string" ? body.itemId : null;

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing required field: itemId" },
        { status: 400 }
      );
    }

    const existingDraft = await prisma.purchaseOrderItem.findFirst({
      where: {
        itemId,
        purchaseOrder: {
          organizationId: organization.id,
          status: { in: OPEN_DRAFT_STATUSES },
        },
      },
      include: {
        purchaseOrder: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingDraft) {
      return NextResponse.json({
        draft: {
          id: existingDraft.purchaseOrderId,
          status: existingDraft.purchaseOrder.status,
          totalEstimatedCost: existingDraft.purchaseOrder.totalEstimatedCost
            ? Number(existingDraft.purchaseOrder.totalEstimatedCost)
            : null,
          createdAt: existingDraft.purchaseOrder.createdAt.toISOString(),
        },
        existing: true,
      });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item || item.organizationId !== organization.id) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    let quantity = toNumber(body.quantity) ?? null;
    let predictionId: string | null = null;

    if (!quantity || quantity <= 0) {
      const prediction = await prisma.aIPrediction.findFirst({
        where: {
          organizationId: organization.id,
          itemId,
          predictionType: "reorder",
          actioned: false,
        },
        orderBy: { createdAt: "desc" },
      });

      predictionId = prediction?.id ?? null;
      const predictionValue = prediction?.predictionValue as
        | { recommendedQuantity?: number }
        | undefined;

      quantity =
        predictionValue?.recommendedQuantity && predictionValue.recommendedQuantity > 0
          ? predictionValue.recommendedQuantity
          : item.reorderThreshold;
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Unable to determine recommended quantity" },
        { status: 400 }
      );
    }

    const orderingOptions = await SupplierIntegration.getOrderingOptions(
      item,
      quantity,
      organization.id
    );
    const primaryOption = orderingOptions[0];

    const unitCost = Number(item.unitCost);
    const estimatedCost = primaryOption?.estimatedCost ?? unitCost * quantity;
    const status = organization.settings?.aiRequireApproval
      ? "PENDING_APPROVAL"
      : "DRAFT";

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        organizationId: organization.id,
        locationId: item.locationId,
        createdBy: user.id,
        status,
        source: typeof body.source === "string" ? body.source : "ai_insights",
        totalEstimatedCost: estimatedCost,
        items: {
          create: {
            itemId: item.id,
            quantity,
            unitCost,
            estimatedCost,
            supplierId: primaryOption?.supplier.id,
            supplierName: primaryOption?.supplier.name,
            orderingUrl: primaryOption?.orderingUrl,
            aiPredictionId: predictionId,
          },
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      draft: {
        id: purchaseOrder.id,
        status: purchaseOrder.status,
        totalEstimatedCost: purchaseOrder.totalEstimatedCost
          ? Number(purchaseOrder.totalEstimatedCost)
          : null,
        createdAt: purchaseOrder.createdAt.toISOString(),
      },
      existing: false,
    });
  } catch (error) {
    console.error("Error creating draft purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create draft purchase order" },
      { status: 500 }
    );
  }
}
