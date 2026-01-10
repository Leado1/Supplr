import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInventoryNotifications } from "@/lib/notifications";

// This endpoint can be called by cron services like Render Cron Jobs or external services
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET_KEY || "supplr-cron-2026";

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting automated notification check...");

    // Get all organizations that need notifications
    const organizations = await prisma.organization.findMany({
      include: {
        users: true,
        settings: true,
      }
    });

    let totalEmailsSent = 0;
    let totalSmsSent = 0;
    let organizationsProcessed = 0;
    const errors: string[] = [];

    // Process each organization
    for (const org of organizations) {
      try {
        console.log(`Processing notifications for organization: ${org.name}`);

        const result = await sendInventoryNotifications(org.id);

        if (result.success) {
          totalEmailsSent += result.emailsSent;
          totalSmsSent += result.smsSent;
          organizationsProcessed++;

          if (result.emailsSent > 0 || result.smsSent > 0) {
            console.log(`Sent ${result.emailsSent} emails and ${result.smsSent} SMS to ${org.name}`);
          }
        } else {
          errors.push(`Failed to process ${org.name}: ${result.errors.join(", ")}`);
        }

        // Add delay between organizations to avoid overwhelming email servers
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing organization ${org.name}:`, error);
        errors.push(`Error processing ${org.name}: ${error}`);
      }
    }

    // Log the summary
    console.log(`Notification cron completed. Processed ${organizationsProcessed} organizations, sent ${totalEmailsSent} emails and ${totalSmsSent} SMS`);

    return NextResponse.json({
      success: true,
      summary: {
        organizationsProcessed,
        totalEmailsSent,
        totalSmsSent,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Error in notification cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notifications",
        details: String(error)
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "notification-cron",
    timestamp: new Date().toISOString()
  });
}