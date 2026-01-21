import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { PredictionEngine, RecommendationEngine } from "@/lib/ai";
import { SupplierIntegration } from "@/lib/ai/supplier-integration";
import { hasPermission, Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get user's organization with subscription
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has access to advanced analytics (Professional+ feature)
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    if (!features.advancedAnalytics) {
      return NextResponse.json(
        {
          error:
            "Reorder predictions require Professional or Enterprise subscription",
        },
        { status: 403 }
      );
    }

    // Check if user has permission to view inventory
    if (!hasPermission(user.role, Permission.VIEW_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to view inventory predictions" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");

    // Get items that might need reordering
    const whereClause: any = {
      organizationId: organization.id,
      quantity: {
        gt: 0, // Has some stock
      },
    };

    // Filter by location if specified and user has multi-location access
    if (locationId && features.multiLocation) {
      whereClause.locationId = locationId;
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: true,
        location: true,
      },
    });

    // Generate reorder predictions for each item
    const predictions = await Promise.all(
      items.map(async (item) => {
        try {
          const prediction =
            await PredictionEngine.generateReorderPrediction(item);

          // Only include items that need attention (reorder within 30 days)
          if (
            prediction.value.daysUntilReorder !== null &&
            prediction.value.daysUntilReorder <= 30
          ) {
            // Cache the prediction
            const existingPrediction = await prisma.aIPrediction.findFirst({
              where: {
                organizationId: organization.id,
                itemId: item.id,
                predictionType: "reorder",
                actioned: false,
              },
            });

            if (existingPrediction) {
              await prisma.aIPrediction.update({
                where: { id: existingPrediction.id },
                data: {
                  predictionValue: prediction.value,
                  confidenceScore: prediction.confidenceScore,
                  expiresAt: prediction.expiresAt,
                  updatedAt: new Date(),
                },
              });
            } else {
              await prisma.aIPrediction.create({
                data: {
                  organizationId: organization.id,
                  itemId: item.id,
                  predictionType: "reorder",
                  predictionValue: prediction.value,
                  confidenceScore: prediction.confidenceScore,
                  expiresAt: prediction.expiresAt,
                },
              });
            }

            // Get ordering options from suppliers
            const orderingOptions = await SupplierIntegration.getOrderingOptions(
              item,
              prediction.value.recommendedQuantity,
              organization.id
            );

            return {
              item: {
                id: item.id,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                reorderThreshold: item.reorderThreshold,
                unitCost: item.unitCost.toString(),
                expirationDate: item.expirationDate.toISOString(),
                category: item.category.name,
                location: item.location?.name,
              },
              reorderPrediction: prediction.value,
              confidence: Math.round(prediction.confidenceScore * 100),
              reasoning: prediction.reasoning,
              orderingOptions: orderingOptions.slice(0, 3), // Show top 3 suppliers
            };
          }

          return null;
        } catch (error) {
          console.error(
            `Error generating reorder prediction for item ${item.id}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out null predictions and sort by urgency
    const validPredictions = predictions
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority =
          priorityOrder[
            a.reorderPrediction.priority as keyof typeof priorityOrder
          ] || 0;
        const bPriority =
          priorityOrder[
            b.reorderPrediction.priority as keyof typeof priorityOrder
          ] || 0;

        if (aPriority !== bPriority) return bPriority - aPriority;

        // Secondary sort by days until reorder
        return (
          a.reorderPrediction.daysUntilReorder -
          b.reorderPrediction.daysUntilReorder
        );
      });

    // Calculate summary statistics
    const totalItems = validPredictions.length;
    const urgentItems = validPredictions.filter(
      (p) => p.reorderPrediction.priority === "high"
    ).length;
    const mediumPriorityItems = validPredictions.filter(
      (p) => p.reorderPrediction.priority === "medium"
    ).length;
    const totalRecommendedOrderValue = validPredictions.reduce(
      (sum, p) =>
        sum +
        p.reorderPrediction.recommendedQuantity * parseFloat(p.item.unitCost),
      0
    );

    // Track AI feature usage
    const monthYear = new Date().toISOString().slice(0, 7);
    await prisma.aIFeatureUsage.upsert({
      where: {
        organizationId_featureType_monthYear: {
          organizationId: organization.id,
          featureType: "reorder_prediction",
          monthYear,
        },
      },
      update: {
        usageCount: {
          increment: 1,
        },
      },
      create: {
        organizationId: organization.id,
        featureType: "reorder_prediction",
        monthYear,
        usageCount: 1,
      },
    });

    return NextResponse.json({
      predictions: validPredictions,
      summary: {
        totalItems,
        urgentItems,
        mediumPriorityItems,
        lowPriorityItems: totalItems - urgentItems - mediumPriorityItems,
        totalRecommendedOrderValue:
          Math.round(totalRecommendedOrderValue * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error generating reorder predictions:", error);
    return NextResponse.json(
      { error: "Failed to generate reorder predictions" },
      { status: 500 }
    );
  }
}

// Get comprehensive AI recommendations
export async function POST(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    if (!features.advancedAnalytics) {
      return NextResponse.json(
        {
          error:
            "AI recommendations require Professional or Enterprise subscription",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { locationId } = body;

    // Generate comprehensive recommendations
    const result = await RecommendationEngine.getPersonalizedRecommendations(
      organization.id,
      user.id,
      locationId
    );

    return NextResponse.json({
      recommendations: result,
    });
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate AI recommendations" },
      { status: 500 }
    );
  }
}

// Mark a prediction as acted upon
export async function PATCH(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (!hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { error: "Insufficient permissions to act on reorder predictions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId, action, feedback, quantity } = body;

    if (!itemId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, action" },
        { status: 400 }
      );
    }

    // Find the reorder prediction for this item
    const prediction = await prisma.aIPrediction.findFirst({
      where: {
        organizationId: organization.id,
        itemId,
        predictionType: "reorder",
        actioned: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (prediction) {
      // Mark prediction as acted upon
      await prisma.aIPrediction.update({
        where: { id: prediction.id },
        data: {
          actioned: true,
          feedbackScore:
            feedback === "helpful" ? 1 : feedback === "not_helpful" ? -1 : 0,
        },
      });
    }

    // Record the inventory change based on the action taken
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let changeType: string;
    let quantityAfter = item.quantity;
    let changeReason = `AI reorder prediction: ${action}`;

    switch (action) {
      case "reorder_placed":
        changeType = "restock";
        quantityAfter = item.quantity + (quantity || 0);
        changeReason = `Reorder placed based on AI prediction (${quantity || 0} units)`;
        break;
      case "threshold_adjusted":
        changeType = "adjustment";
        changeReason = "Reorder threshold adjusted based on AI recommendation";
        // Update the reorder threshold if provided
        if (quantity) {
          await prisma.item.update({
            where: { id: itemId },
            data: { reorderThreshold: quantity },
          });
        }
        break;
      case "marked_for_ordering":
        changeType = "adjustment";
        changeReason = "Marked for ordering based on AI suggestion";
        break;
      default:
        changeType = "adjustment";
    }

    // Record the inventory change for AI learning
    await prisma.inventoryChange.create({
      data: {
        itemId,
        organizationId: organization.id,
        quantityBefore: item.quantity,
        quantityAfter,
        changeType,
        changeReason,
        changedBy: user.id,
        locationId: item.locationId,
      },
    });

    // Update item quantity if it changed
    if (quantityAfter !== item.quantity) {
      await prisma.item.update({
        where: { id: itemId },
        data: { quantity: quantityAfter },
      });
    }

    return NextResponse.json({
      message: "Action recorded successfully",
      newQuantity: quantityAfter,
    });
  } catch (error) {
    console.error("Error recording reorder prediction action:", error);
    return NextResponse.json(
      { error: "Failed to record action" },
      { status: 500 }
    );
  }
}
