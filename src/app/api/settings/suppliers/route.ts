import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserWithRole } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, organization } = await getUserWithRole();
    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get supplier preferences for this organization
    const supplierPreferences = await prisma.supplierPreference.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
        supplierId: true,
        preferenceLevel: true,
        accountNumber: true,
      },
    });

    return NextResponse.json({
      preferences: supplierPreferences.map(pref => ({
        supplierId: pref.supplierId,
        preferenceLevel: pref.preferenceLevel,
        accountNumber: pref.accountNumber,
      })),
    });
  } catch (error) {
    console.error("Error fetching supplier preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error, organization } = await getUserWithRole();
    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: "Invalid preferences format" }, { status: 400 });
    }

    // Define supplier names for the database
    const supplierNames: Record<string, string> = {
      mckesson: "McKesson Corporation",
      cardinal: "Cardinal Health",
      henry_schein: "Henry Schein",
      medline: "Medline Industries",
      amazon_business: "Amazon Business",
    };

    // Delete existing preferences for this organization
    await prisma.supplierPreference.deleteMany({
      where: {
        organizationId: organization.id,
      },
    });

    // Create new preferences
    if (preferences.length > 0) {
      await prisma.supplierPreference.createMany({
        data: preferences.map((pref: any) => ({
          organizationId: organization.id,
          supplierId: pref.supplierId,
          supplierName: supplierNames[pref.supplierId] || pref.supplierId,
          preferenceLevel: pref.preferenceLevel,
          accountNumber: pref.accountNumber || null,
          contractTerms: {}, // Empty JSON object for now
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving supplier preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}