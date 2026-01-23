import 'server-only';

import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import { addDays, format, isAfter, isBefore } from "date-fns";
import { PredictionEngine } from "@/lib/ai";
import { getSubscriptionFeatures } from "@/lib/subscription-helpers";

// Email transporter using existing configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: parseInt(process.env.SMTP_PORT || "1025"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      servername: process.env.SMTP_HOST || "smtp.gmail.com",
    },
  });
};

// Types for notifications
export interface InventoryAlert {
  type:
    | "expiring"
    | "expired"
    | "low_stock"
    | "ai_waste_risk"
    | "ai_reorder_soon"
    | "ai_threshold_optimization";
  items: Array<{
    id: string;
    name: string;
    sku?: string;
    category: string;
    quantity: number;
    expirationDate: Date;
    reorderThreshold: number;
    daysUntilExpiration?: number;
    updatedAt?: Date;
    aiPrediction?: {
      type: string;
      priority: "low" | "medium" | "high";
      confidence: number;
      recommendation: string;
      potentialSavings?: number;
    };
  }>;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  email?: string;
  phone?: string;
  expirationWarningDays: number;
  lowStockEnabled: boolean;
  expirationEnabled: boolean;
  notificationFrequency: "daily" | "weekly" | "immediate";
}

// Get enhanced inventory alerts with AI predictions for an organization
export async function getAIEnhancedInventoryAlerts(
  organizationId: string
): Promise<InventoryAlert[]> {
  try {
    // Get organization settings and subscription
    const [settings, organization] = await Promise.all([
      prisma.settings.findUnique({ where: { organizationId } }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        include: { subscription: true, users: true },
      }),
    ]);

    if (!organization) {
      return [];
    }

    const features = getSubscriptionFeatures(organization.subscription, {
      users: organization.users
        ? organization.users.map((u: { email: string }) => ({ email: u.email }))
        : [],
    });
    const warningDays = settings?.expirationWarningDays || 30;
    const lowStockThreshold = settings?.lowStockThreshold || 5;

    const today = new Date();
    const warningDate = addDays(today, warningDays);

    // Get all items for the organization
    const items = await prisma.item.findMany({
      where: { organizationId },
      include: { category: true },
    });

    const alerts: InventoryAlert[] = [];

    // Traditional alert groups
    const expiringItems: InventoryAlert["items"] = [];
    const expiredItems: InventoryAlert["items"] = [];
    const lowStockItems: InventoryAlert["items"] = [];

    // AI alert groups (only for subscribers with AI features)
    const aiWasteRiskItems: InventoryAlert["items"] = [];
    const aiReorderSoonItems: InventoryAlert["items"] = [];
    const aiThresholdOptimizationItems: InventoryAlert["items"] = [];

    // Process each item
    for (const item of items) {
      const daysUntilExpiration = Math.floor(
        (item.expirationDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const baseItemData = {
        id: item.id,
        name: item.name,
        sku: item.sku || undefined,
        category: item.category.name,
        quantity: item.quantity,
        expirationDate: item.expirationDate,
        reorderThreshold: item.reorderThreshold,
        daysUntilExpiration,
        updatedAt: item.updatedAt,
      };

      // Traditional alerts
      if (isBefore(item.expirationDate, today)) {
        expiredItems.push(baseItemData);
      } else if (
        isAfter(item.expirationDate, today) &&
        isBefore(item.expirationDate, warningDate)
      ) {
        expiringItems.push(baseItemData);
      }

      if (item.quantity <= item.reorderThreshold) {
        lowStockItems.push(baseItemData);
      }

      // AI predictions (for Starter+ plans)
      try {
        // Waste risk predictions
        const wasteRiskPrediction =
          await PredictionEngine.generateWasteRiskPrediction(item);
        if (
          wasteRiskPrediction.value.riskLevel === "high" &&
          wasteRiskPrediction.confidenceScore > 0.6
        ) {
          aiWasteRiskItems.push({
            ...baseItemData,
            aiPrediction: {
              type: "waste_risk",
              priority: wasteRiskPrediction.value.riskLevel,
              confidence: Math.round(wasteRiskPrediction.confidenceScore * 100),
              recommendation: wasteRiskPrediction.value.recommendation,
              potentialSavings: wasteRiskPrediction.value.estimatedWasteValue,
            },
          });
        }

        // Reorder predictions (for Professional+ plans)
        if (features.advancedAnalytics) {
          const reorderPrediction =
            await PredictionEngine.generateReorderPrediction(item);
          if (
            reorderPrediction.value.daysUntilReorder !== null &&
            reorderPrediction.value.daysUntilReorder <= 14 &&
            reorderPrediction.value.priority !== "low"
          ) {
            aiReorderSoonItems.push({
              ...baseItemData,
              aiPrediction: {
                type: "reorder",
                priority: reorderPrediction.value.priority,
                confidence: Math.round(reorderPrediction.confidenceScore * 100),
                recommendation: `Reorder ${reorderPrediction.value.recommendedQuantity} units in ${reorderPrediction.value.daysUntilReorder} days`,
                potentialSavings:
                  reorderPrediction.value.priority === "high"
                    ? reorderPrediction.value.recommendedQuantity *
                      Number(item.unitCost) *
                      0.15
                    : 0, // Emergency order markup savings
              },
            });
          }

          // Threshold optimization suggestions
          const thresholdPrediction =
            await PredictionEngine.generateThresholdOptimization(item);
          if (
            thresholdPrediction.confidenceScore > 0.7 &&
            Math.abs(
              thresholdPrediction.value.recommendedThreshold -
                thresholdPrediction.value.currentThreshold
            ) >= 5
          ) {
            aiThresholdOptimizationItems.push({
              ...baseItemData,
              aiPrediction: {
                type: "threshold_optimization",
                priority:
                  thresholdPrediction.value.potentialSavings > 50
                    ? "high"
                    : "medium",
                confidence: Math.round(
                  thresholdPrediction.confidenceScore * 100
                ),
                recommendation: thresholdPrediction.reasoning,
                potentialSavings: thresholdPrediction.value.potentialSavings,
              },
            });
          }
        }
      } catch (error) {
        // Log error but don't fail the whole alert process
        console.error(`AI prediction error for item ${item.id}:`, error);
      }
    }

    // Create alerts for each type (prioritize AI alerts first)
    if (aiWasteRiskItems.length > 0) {
      alerts.push({ type: "ai_waste_risk", items: aiWasteRiskItems });
    }
    if (aiReorderSoonItems.length > 0) {
      alerts.push({ type: "ai_reorder_soon", items: aiReorderSoonItems });
    }
    if (aiThresholdOptimizationItems.length > 0) {
      alerts.push({
        type: "ai_threshold_optimization",
        items: aiThresholdOptimizationItems,
      });
    }

    // Traditional alerts
    if (expiredItems.length > 0) {
      alerts.push({ type: "expired", items: expiredItems });
    }
    if (expiringItems.length > 0) {
      alerts.push({ type: "expiring", items: expiringItems });
    }
    if (lowStockItems.length > 0) {
      alerts.push({ type: "low_stock", items: lowStockItems });
    }

    return alerts;
  } catch (error) {
    console.error("Error getting AI enhanced inventory alerts:", error);
    return getInventoryAlerts(organizationId); // Fallback to basic alerts
  }
}

// Get inventory alerts for an organization (basic version for compatibility)
export async function getInventoryAlerts(
  organizationId: string
): Promise<InventoryAlert[]> {
  try {
    // Get organization settings
    const settings = await prisma.settings.findUnique({
      where: { organizationId },
    });

    const warningDays = settings?.expirationWarningDays || 30;
    const lowStockThreshold = settings?.lowStockThreshold || 5;

    const today = new Date();
    const warningDate = addDays(today, warningDays);

    // Get all items for the organization
    const items = await prisma.item.findMany({
      where: { organizationId },
      include: { category: true },
    });

    const alerts: InventoryAlert[] = [];

    // Group items by alert type
    const expiringItems: InventoryAlert["items"] = [];
    const expiredItems: InventoryAlert["items"] = [];
    const lowStockItems: InventoryAlert["items"] = [];

    for (const item of items) {
      const daysUntilExpiration = Math.floor(
        (item.expirationDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Check if expired
      if (isBefore(item.expirationDate, today)) {
        expiredItems.push({
          id: item.id,
          name: item.name,
          sku: item.sku || undefined,
          category: item.category.name,
          quantity: item.quantity,
          expirationDate: item.expirationDate,
          reorderThreshold: item.reorderThreshold,
          daysUntilExpiration,
          updatedAt: item.updatedAt,
        });
      }
      // Check if expiring soon
      else if (
        isAfter(item.expirationDate, today) &&
        isBefore(item.expirationDate, warningDate)
      ) {
        expiringItems.push({
          id: item.id,
          name: item.name,
          sku: item.sku || undefined,
          category: item.category.name,
          quantity: item.quantity,
          expirationDate: item.expirationDate,
          reorderThreshold: item.reorderThreshold,
          daysUntilExpiration,
          updatedAt: item.updatedAt,
        });
      }

      // Check if low stock
      if (item.quantity <= item.reorderThreshold) {
        lowStockItems.push({
          id: item.id,
          name: item.name,
          sku: item.sku || undefined,
          category: item.category.name,
          quantity: item.quantity,
          expirationDate: item.expirationDate,
          reorderThreshold: item.reorderThreshold,
          daysUntilExpiration,
          updatedAt: item.updatedAt,
        });
      }
    }

    // Create alerts for each type
    if (expiredItems.length > 0) {
      alerts.push({ type: "expired", items: expiredItems });
    }
    if (expiringItems.length > 0) {
      alerts.push({ type: "expiring", items: expiringItems });
    }
    if (lowStockItems.length > 0) {
      alerts.push({ type: "low_stock", items: lowStockItems });
    }

    return alerts;
  } catch (error) {
    console.error("Error getting inventory alerts:", error);
    return [];
  }
}

// Generate email HTML for alerts
function generateEmailHTML(
  alerts: InventoryAlert[],
  organizationName: string
): string {
  const alertSections = alerts
    .map((alert) => {
      const alertTitle = {
        expired: "🚨 Expired Items",
        expiring: "⚠️ Items Expiring Soon",
        low_stock: "📦 Low Stock Items",
        ai_waste_risk: "🤖 AI Waste Risk Alert",
        ai_reorder_soon: "🤖 AI Reorder Recommendations",
        ai_threshold_optimization: "🤖 AI Threshold Optimization",
      };

      const itemRows = alert.items
        .map((item) => {
          const expirationInfo =
            alert.type === "expired"
              ? `<span style="color: #dc2626; font-weight: bold;">Expired ${Math.abs(
                  item.daysUntilExpiration || 0
                )} days ago</span>`
              : alert.type === "expiring"
                ? `<span style="color: #f59e0b;">Expires in ${item.daysUntilExpiration} days</span>`
                : `<span style="color: #6b7280;">Expires ${format(item.expirationDate, "MMM dd, yyyy")}</span>`;

          return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: 500;">${item.name}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${item.sku || "N/A"}</td>
          <td style="padding: 12px 8px; color: #6b7280;">${item.category}</td>
          <td style="padding: 12px 8px; text-align: center;">
            ${
              alert.type === "low_stock"
                ? `<span style="color: #dc2626; font-weight: bold;">${item.quantity}</span>`
                : item.quantity
            }
          </td>
          <td style="padding: 12px 8px;">${expirationInfo}</td>
        </tr>
      `;
        })
        .join("");

      return `
      <div style="margin-bottom: 32px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 16px;">
          ${alertTitle[alert.type]} (${alert.items.length} items)
        </h2>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Item Name</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">SKU</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Category</th>
              <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151;">Quantity</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Expiration</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inventory Alert - ${organizationName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            📋 Inventory Alert
          </h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">
            ${organizationName}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; margin-bottom: 24px;">
            Hello! We've detected some inventory items that need your attention:
          </p>

          ${alertSections}

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inventory"
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              View Inventory Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from your Supplr inventory management system.</p>
            <p>You can manage your notification preferences in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #3b82f6;">settings</a>.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate SMS text for alerts
function generateSMSText(
  alerts: InventoryAlert[],
  organizationName: string
): string {
  let message = `🏥 ${organizationName} Inventory Alert\n\n`;

  for (const alert of alerts) {
    const alertEmoji = {
      expired: "🚨",
      expiring: "⚠️",
      low_stock: "📦",
      ai_waste_risk: "🤖",
      ai_reorder_soon: "🤖",
      ai_threshold_optimization: "🤖",
    };

    const alertTitle = {
      expired: "EXPIRED",
      expiring: "EXPIRING SOON",
      low_stock: "LOW STOCK",
      ai_waste_risk: "AI WASTE RISK",
      ai_reorder_soon: "AI REORDER",
      ai_threshold_optimization: "AI OPTIMIZE",
    };

    message += `${alertEmoji[alert.type]} ${alertTitle[alert.type]} (${alert.items.length} items)\n`;

    // Show first 3 items for SMS brevity
    const itemsToShow = alert.items.slice(0, 3);
    for (const item of itemsToShow) {
      if (alert.type === "expired") {
        message += `• ${item.name} - EXPIRED\n`;
      } else if (alert.type === "expiring") {
        message += `• ${item.name} - ${item.daysUntilExpiration}d left\n`;
      } else if (alert.type === "low_stock") {
        message += `• ${item.name} - ${item.quantity} left\n`;
      } else if (alert.type.startsWith("ai_")) {
        // AI-powered alerts
        const aiInfo = item.aiPrediction;
        if (aiInfo) {
          message += `• ${item.name} - ${aiInfo.recommendation}\n`;
        } else {
          message += `• ${item.name} - AI Alert\n`;
        }
      } else {
        message += `• ${item.name} - ${item.quantity} left\n`;
      }
    }

    if (alert.items.length > 3) {
      message += `• ...and ${alert.items.length - 3} more items\n`;
    }
    message += "\n";
  }

  message += `View details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/inventory`;
  return message;
}

// Send email notification
export async function sendEmailAlert(
  email: string,
  alerts: InventoryAlert[],
  organizationName: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const alertCount = alerts.reduce(
      (sum, alert) => sum + alert.items.length,
      0
    );

    const subject = `🚨 Inventory Alert - ${alertCount} items need attention`;
    const html = generateEmailHTML(alerts, organizationName);

    await transporter.sendMail({
      from: `"Supplr Alerts" <noreply@supplr.net>`,
      to: email,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending email alert:", error);
    return false;
  }
}

// Send SMS notification via email-to-SMS gateway
export async function sendSMSAlert(
  phone: string,
  alerts: InventoryAlert[],
  organizationName: string,
  carrier: string = "att" // Default to AT&T
): Promise<boolean> {
  try {
    // SMS gateways for major carriers
    const smsGateways: Record<string, string> = {
      att: "@txt.att.net",
      verizon: "@vtext.com",
      tmobile: "@tmomail.net",
      sprint: "@messaging.sprintpcs.com",
      uscellular: "@email.uscc.net",
      boost: "@smsmyboostmobile.com",
      cricket: "@sms.cricketwireless.net",
    };

    const gateway = smsGateways[carrier.toLowerCase()] || smsGateways.att;
    const smsEmail = `${phone.replace(/\D/g, "")}${gateway}`;

    const transporter = createTransporter();
    const message = generateSMSText(alerts, organizationName);

    await transporter.sendMail({
      from: "noreply@supplr.net",
      to: smsEmail,
      subject: "", // SMS doesn't need subject
      text: message,
    });

    return true;
  } catch (error) {
    console.error("Error sending SMS alert:", error);
    return false;
  }
}

// Send notifications to organization users
export async function sendInventoryNotifications(
  organizationId: string
): Promise<{
  success: boolean;
  emailsSent: number;
  smsSent: number;
  errors: string[];
}> {
  try {
    const alerts = await getInventoryAlerts(organizationId);

    if (alerts.length === 0) {
      return { success: true, emailsSent: 0, smsSent: 0, errors: [] };
    }

    // Get organization and users
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: true,
        settings: true,
      },
    });

    if (!organization) {
      return {
        success: false,
        emailsSent: 0,
        smsSent: 0,
        errors: ["Organization not found"],
      };
    }

    let emailsSent = 0;
    const smsSent = 0;
    const errors: string[] = [];

    // Send notifications to each user
    for (const user of organization.users) {
      // For now, send to all users' clerk email
      // In a full implementation, you'd have user notification preferences
      try {
        const emailSuccess = await sendEmailAlert(
          user.email,
          alerts,
          organization.name
        );
        if (emailSuccess) emailsSent++;
      } catch (error) {
        errors.push(`Email failed for ${user.email}: ${error}`);
      }
    }

    return { success: true, emailsSent, smsSent, errors };
  } catch (error) {
    console.error("Error sending inventory notifications:", error);
    return {
      success: false,
      emailsSent: 0,
      smsSent: 0,
      errors: [String(error)],
    };
  }
}

// Team invitation email functionality
export interface InvitationEmailData {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteeEmail: string;
  role: string;
  invitationToken: string;
  expiresAt: Date;
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.invitationToken}`;

    const emailHtml = generateInvitationEmailHTML(data, invitationUrl);

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || "noreply@supplr.com",
      to: data.inviteeEmail,
      subject: `You're invited to join ${data.organizationName} on Supplr`,
      html: emailHtml,
      text: generateInvitationEmailText(data, invitationUrl),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Invitation email sent to ${data.inviteeEmail}:`,
      result.messageId
    );
    return true;
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return false;
  }
}

/**
 * Generate HTML email template for invitations
 */
function generateInvitationEmailHTML(
  data: InvitationEmailData,
  invitationUrl: string
): string {
  const roleDescription = getRoleDescription(data.role);
  const expiresFormatted = format(data.expiresAt, "MMMM do, yyyy 'at' h:mm a");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${data.organizationName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            🎉 You're Invited!
          </h1>
          <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 16px;">
            Join ${data.organizationName} on Supplr
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; margin-bottom: 24px;">
            Hello!
          </p>

          <p style="font-size: 16px; margin-bottom: 24px;">
            <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join their organization
            <strong>${data.organizationName}</strong> on Supplr as a <strong>${data.role}</strong>.
          </p>

          <!-- Role Information -->
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937;">Your Role: ${data.role}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              ${roleDescription}
            </p>
          </div>

          <p style="font-size: 16px; margin-bottom: 32px;">
            Supplr is a medical practice inventory management system that helps teams track supplies,
            monitor expiration dates, and maintain optimal stock levels.
          </p>

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}"
               style="display: inline-block; background: #10b981; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <!-- Expiration Notice -->
          <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⏰ <strong>This invitation expires on ${expiresFormatted}</strong>
            </p>
          </div>

          <!-- Alternative Link -->
          <p style="font-size: 14px; color: #6b7280; margin: 24px 0;">
            If the button above doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #3b82f6; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
            ${invitationUrl}
          </p>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
              This email was sent by Supplr. © 2026 Supplr. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for invitations
 */
function generateInvitationEmailText(
  data: InvitationEmailData,
  invitationUrl: string
): string {
  const roleDescription = getRoleDescription(data.role);
  const expiresFormatted = format(data.expiresAt, "MMMM do, yyyy 'at' h:mm a");

  return `
You're invited to join ${data.organizationName} on Supplr!

Hello!

${data.inviterName} (${data.inviterEmail}) has invited you to join their organization "${data.organizationName}" on Supplr as a ${data.role}.

Your Role: ${data.role}
${roleDescription}

Supplr is a medical practice inventory management system that helps teams track supplies, monitor expiration dates, and maintain optimal stock levels.

To accept this invitation, click the link below or copy and paste it into your browser:
${invitationUrl}

Important: This invitation expires on ${expiresFormatted}

If you didn't expect this invitation, you can safely ignore this email.

---
This email was sent by Supplr.
© 2026 Supplr. All rights reserved.
  `.trim();
}

/**
 * Get role description for emails
 */
function getRoleDescription(role: string): string {
  switch (role.toUpperCase()) {
    case "OWNER":
      return "Full access to all organization features including team management, billing, and system settings.";
    case "ADMIN":
      return "Can invite team members, manage inventory, view reports, and access most organization features.";
    case "MANAGER":
      return "Can manage inventory, update stock levels, view reports, and oversee daily operations.";
    case "MEMBER":
      return "Can view inventory, update stock levels, and assist with inventory management tasks.";
    default:
      return "Basic access to organization features.";
  }
}
