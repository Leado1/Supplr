import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";
import { PredictionEngine } from "@/lib/ai";
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

    // Check if user has access to waste prevention AI (Starter+ feature)
    const features = getSubscriptionFeatures(
      organization.subscription,
      organization
    );

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");

    // Get items expiring in the next 60 days
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const whereClause: any = {
      organizationId: organization.id,
      expirationDate: {
        gte: new Date(), // Not already expired
        lte: sixtyDaysFromNow,
      },
      quantity: {
        gt: 0, // Has stock
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
      orderBy: {
        expirationDate: "asc",
      },
    });

    const usageWindowDays = 30;
    const usageWindowStart = new Date();
    usageWindowStart.setDate(usageWindowStart.getDate() - usageWindowDays);

    const itemIds = items.map((item) => item.id);
    const usageTotalsByItem = new Map<string, number>();

    if (itemIds.length > 0) {
      const usageChanges = await prisma.inventoryChange.findMany({
        where: {
          organizationId: organization.id,
          itemId: { in: itemIds },
          changeType: "usage",
          createdAt: {
            gte: usageWindowStart,
          },
        },
      });

      usageChanges.forEach((change) => {
        const usage = Math.max(0, change.quantityBefore - change.quantityAfter);
        usageTotalsByItem.set(
          change.itemId,
          (usageTotalsByItem.get(change.itemId) || 0) + usage
        );
      });
    }

    // Generate waste risk predictions for each item
    const predictions = await Promise.all(
      items.map(async (item) => {
        try {
          const prediction =
            await PredictionEngine.generateWasteRiskPrediction(item);
          const totalUsage = usageTotalsByItem.get(item.id) || 0;
          const averageDailyUsage =
            Math.round((totalUsage / usageWindowDays) * 100) / 100;

          // Cache the prediction
          const existingPrediction = await prisma.aIPrediction.findFirst({
            where: {
              organizationId: organization.id,
              itemId: item.id,
              predictionType: "waste_risk",
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
                predictionType: "waste_risk",
                predictionValue: prediction.value,
                confidenceScore: prediction.confidenceScore,
                expiresAt: prediction.expiresAt,
              },
            });
          }

          return {
            item: {
              id: item.id,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitCost: item.unitCost.toString(),
              expirationDate: item.expirationDate.toISOString(),
              category: item.category.name,
              location: item.location?.name,
            },
            wasteRisk: prediction.value,
            confidence: Math.round(prediction.confidenceScore * 100),
            reasoning: prediction.reasoning,
            usage: {
              averageDailyUsage,
              totalUsage30Days: totalUsage,
            },
          };
        } catch (error) {
          console.error(
            `Error generating waste prediction for item ${item.id}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out failed predictions and sort by risk level
    const validPredictions = predictions
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        const aRisk =
          riskOrder[a.wasteRisk.riskLevel as keyof typeof riskOrder] || 0;
        const bRisk =
          riskOrder[b.wasteRisk.riskLevel as keyof typeof riskOrder] || 0;

        if (aRisk !== bRisk) return bRisk - aRisk;

        // Secondary sort by days until expiration
        return (
          a.wasteRisk.daysUntilExpiration - b.wasteRisk.daysUntilExpiration
        );
      });

    // Calculate summary statistics
    const totalItems = validPredictions.length;
    const highRiskItems = validPredictions.filter(
      (p) => p.wasteRisk.riskLevel === "high"
    ).length;
    const mediumRiskItems = validPredictions.filter(
      (p) => p.wasteRisk.riskLevel === "medium"
    ).length;
    const totalPotentialWaste = validPredictions.reduce(
      (sum, p) => sum + (p.wasteRisk.estimatedWasteValue || 0),
      0
    );

    // Track AI feature usage
    const monthYear = new Date().toISOString().slice(0, 7);
    await prisma.aIFeatureUsage.upsert({
      where: {
        organizationId_featureType_monthYear: {
          organizationId: organization.id,
          featureType: "waste_prevention",
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
        featureType: "waste_prevention",
        monthYear,
        usageCount: 1,
      },
    });

    return NextResponse.json({
      predictions: validPredictions,
      summary: {
        totalItems,
        highRiskItems,
        mediumRiskItems,
        lowRiskItems: totalItems - highRiskItems - mediumRiskItems,
        totalPotentialWaste: Math.round(totalPotentialWaste * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error generating waste prevention predictions:", error);
    return NextResponse.json(
      { error: "Failed to generate waste prevention predictions" },
      { status: 500 }
    );
  }
}

// Mark an item as acted upon (used for AI learning)
export async function POST(request: NextRequest) {
  try {
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { itemId, action, feedback } = body;

    // Validate required fields
    if (!itemId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, action" },
        { status: 400 }
      );
    }

    // Find the waste risk prediction for this item
    const prediction = await prisma.aIPrediction.findFirst({
      where: {
        organizationId: organization.id,
        itemId,
        predictionType: "waste_risk",
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
    let changeReason = `AI waste prevention: ${action}`;

    switch (action) {
      case "used_immediately":
        changeType = "usage";
        quantityAfter = Math.max(0, item.quantity - Math.min(item.quantity, 1));
        changeReason = "Used immediately to prevent waste (AI suggestion)";
        break;
      case "marked_priority":
        changeType = "adjustment";
        changeReason =
          "Marked for priority use to prevent waste (AI suggestion)";
        break;
      case "transferred":
        changeType = "transfer";
        changeReason = "Transferred to prevent waste (AI suggestion)";
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
    console.error("Error recording waste prevention action:", error);
    return NextResponse.json(
      { error: "Failed to record action" },
      { status: 500 }
    );
  }
}
