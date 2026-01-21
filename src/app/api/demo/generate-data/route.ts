import { NextRequest, NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";
import { DemoDataGenerator } from "@/lib/demo-data-generator";

export async function POST(request: NextRequest) {
  try {
    // Get user's organization
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has admin permissions
    if (!hasPermission(user.role, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json(
        { error: "Insufficient permissions to generate demo data" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      itemsPerCategory = 4,
      generateUsageHistory = true,
      historicalDays = 90,
      createExpiredItems = true,
      createLowStockItems = true,
      wasteRiskPercentage = 0.15,
      cleanExistingData = false
    } = body;

    // Clean existing data if requested
    if (cleanExistingData) {
      await DemoDataGenerator.cleanDemoData(organization.id);
    }

    // Generate demo data
    const result = await DemoDataGenerator.generateDemoData({
      organizationId: organization.id,
      itemsPerCategory,
      generateUsageHistory,
      historicalDays,
      createExpiredItems,
      createLowStockItems,
      wasteRiskPercentage
    });

    // Generate sample AI predictions
    const predictionsCreated = await DemoDataGenerator.generateSamplePredictions(
      organization.id
    );

    return NextResponse.json({
      success: true,
      message: "Demo data generated successfully",
      data: {
        ...result,
        predictionsCreated
      }
    });

  } catch (error) {
    console.error("Error generating demo data:", error);
    return NextResponse.json(
      { error: "Failed to generate demo data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user's organization
    const { error, organization, user } = await getUserOrganization();

    if (error || !organization || !user) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user has admin permissions
    if (!hasPermission(user.role, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json(
        { error: "Insufficient permissions to clean demo data" },
        { status: 403 }
      );
    }

    // Clean demo data
    const result = await DemoDataGenerator.cleanDemoData(organization.id);

    return NextResponse.json({
      success: true,
      message: "Demo data cleaned successfully",
      data: result
    });

  } catch (error) {
    console.error("Error cleaning demo data:", error);
    return NextResponse.json(
      { error: "Failed to clean demo data" },
      { status: 500 }
    );
  }
}