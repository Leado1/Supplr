import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserOrganization } from "@/lib/auth-helpers";
import { sendInventoryNotifications } from "@/lib/notifications";

// API route for testing notifications manually
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get notification settings from request body
    const body = await request.json();
    const { notificationEmail, smsEnabled, phone, carrier } = body || {};

    // Get user's organization
    const { error: authError, organization } = await getUserOrganization();
    if (authError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Import notification functions
    const { getInventoryAlerts, sendEmailAlert, sendSMSAlert } =
      await import("@/lib/notifications");

    // Get alerts for this organization
    const alerts = await getInventoryAlerts(organization.id);

    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No inventory alerts to send - your inventory is all good!",
        details: { emailsSent: 0, smsSent: 0, errors: [] },
      });
    }

    let emailsSent = 0;
    let smsSent = 0;
    const errors: string[] = [];

    // Send email notification
    try {
      // Use custom email if provided, otherwise fall back to user's Clerk email
      const targetEmail =
        notificationEmail && notificationEmail.trim()
          ? notificationEmail.trim()
          : organization.users[0]?.email;

      if (targetEmail) {
        const emailSuccess = await sendEmailAlert(
          targetEmail,
          alerts,
          organization.name
        );
        if (emailSuccess) emailsSent++;
      } else {
        errors.push("No email address available");
      }
    } catch (error) {
      errors.push(`Email failed: ${error}`);
    }

    // Send SMS notification if enabled
    if (smsEnabled && phone && carrier) {
      try {
        const smsSuccess = await sendSMSAlert(
          phone,
          alerts,
          organization.name,
          carrier
        );
        if (smsSuccess) smsSent++;
      } catch (error) {
        errors.push(`SMS failed: ${error}`);
      }
    }

    const result = { success: true, emailsSent, smsSent, errors };

    return NextResponse.json({
      success: result.success,
      message: `Notifications sent! Emails: ${result.emailsSent}, SMS: ${result.smsSent}`,
      details: result,
    });
  } catch (error) {
    console.error("Error testing notifications:", error);
    return NextResponse.json(
      { error: "Failed to send test notifications" },
      { status: 500 }
    );
  }
}

// API route for getting current alerts without sending notifications
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { error: authError, organization } = await getUserOrganization();
    if (authError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Import here to avoid build-time issues
    const { getInventoryAlerts } = await import("@/lib/notifications");
    const alerts = await getInventoryAlerts(organization.id);

    const alertSummary = {
      totalAlerts: alerts.length,
      totalItems: alerts.reduce((sum, alert) => sum + alert.items.length, 0),
      expiredItems: alerts.find((a) => a.type === "expired")?.items.length || 0,
      expiringItems:
        alerts.find((a) => a.type === "expiring")?.items.length || 0,
      lowStockItems:
        alerts.find((a) => a.type === "low_stock")?.items.length || 0,
    };

    return NextResponse.json({
      success: true,
      summary: alertSummary,
      alerts: alerts,
    });
  } catch (error) {
    console.error("Error getting alerts:", error);
    return NextResponse.json(
      { error: "Failed to get alerts" },
      { status: 500 }
    );
  }
}
