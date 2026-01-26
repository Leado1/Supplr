import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

const ALLOWED_STATUSES = ["APPROVED", "CANCELLED", "ORDERED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization) {
      return error ?? NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to update draft orders" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const draftId = resolvedParams.draftId;
    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const nextStatus =
      typeof body.status === "string" ? body.status : "APPROVED";

    if (!ALLOWED_STATUSES.includes(nextStatus as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid status update" },
        { status: 400 }
      );
    }

    const existingDraft = await prisma.purchaseOrder.findUnique({
      where: { id: draftId },
    });

    if (!existingDraft || existingDraft.organizationId !== organization.id) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    const updatedDraft = await prisma.purchaseOrder.update({
      where: { id: draftId },
      data: {
        status: nextStatus,
        approvedBy: nextStatus === "APPROVED" ? user.id : undefined,
      },
    });

    return NextResponse.json({
      draft: {
        id: updatedDraft.id,
        status: updatedDraft.status,
        totalEstimatedCost: updatedDraft.totalEstimatedCost
          ? Number(updatedDraft.totalEstimatedCost)
          : null,
        updatedAt: updatedDraft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating draft purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update draft purchase order" },
      { status: 500 }
    );
  }
}
