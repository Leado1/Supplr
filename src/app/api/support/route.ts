import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";

// Validation schema for support form
const supportFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  organization: z.string().optional(),
  category: z.enum([
    "general",
    "technical",
    "billing",
    "feature",
    "bug",
    "training",
  ]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

// Create transporter using SMTP (works with any email provider)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", // You can change this to any SMTP server
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email address
      pass: process.env.SMTP_PASS, // Your email password or app password
    },
    // Fix for ProtonMail Bridge self-signed certificate
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates (for ProtonMail Bridge)
      servername: process.env.SMTP_HOST || "smtp.gmail.com", // Specify server name
    },
  });
};

// Format urgency for display
const formatUrgency = (urgency: string) => {
  const urgencyMap = {
    low: "🟢 Low",
    normal: "🟡 Normal",
    high: "🟠 High",
    urgent: "🔴 URGENT",
  };
  return urgencyMap[urgency as keyof typeof urgencyMap] || urgency;
};

// Format category for display
const formatCategory = (category: string) => {
  const categoryMap = {
    general: "General Question",
    technical: "Technical Issue",
    billing: "Billing & Subscriptions",
    feature: "Feature Request",
    bug: "Bug Report",
    training: "Training & Onboarding",
  };
  return categoryMap[category as keyof typeof categoryMap] || category;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Convert FormData to regular object
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      organization: (formData.get("organization") as string) || "",
      category: formData.get("category") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      urgency: (formData.get("urgency") as string) || "normal",
    };

    // Validate the form data
    const validationResult = supportFormSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Invalid form data",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, organization, category, subject, message, urgency } =
      validationResult.data;

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP credentials not configured");
      return NextResponse.json(
        {
          message:
            "Email service not configured. Please contact support directly at support@supplr.net",
        },
        { status: 500 }
      );
    }

    // Debug logging
    console.log("SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      // Don't log the actual password for security
      hasPassword: !!process.env.SMTP_PASS,
    });

    // Create email transporter
    const transporter = createTransporter();

    // Email content for support team
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">🆘 New Support Request</h2>
          <p style="color: #666; margin: 5px 0 0 0;">Received on ${new Date().toLocaleString()}</p>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333; width: 120px;">Priority:</td>
              <td style="padding: 8px 0; color: #666;">${formatUrgency(urgency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Category:</td>
              <td style="padding: 8px 0; color: #666;">${formatCategory(category)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Name:</td>
              <td style="padding: 8px 0; color: #666;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 8px 0; color: #666;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${
              organization
                ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Organization:</td>
              <td style="padding: 8px 0; color: #666;">${organization}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Subject:</td>
              <td style="padding: 8px 0; color: #666;">${subject}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Message:</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
          <p style="margin: 0; color: #1976d2; font-size: 14px;">
            💡 <strong>Quick Response Tip:</strong> Reply directly to this email to respond to ${name}
          </p>
        </div>
      </div>
    `;

    try {
      // Test the connection first
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully");

      // Send email to support
      console.log("📧 Sending support email...");
      await transporter.sendMail({
        from: `"Supplr Support System" <${process.env.SMTP_USER}>`,
        to: "support@supplr.net",
        subject: `[${formatUrgency(urgency)}] [${formatCategory(category)}] ${subject}`,
        html: emailHtml,
        replyTo: email,
      });
      console.log("✅ Support email sent successfully");

      // Send confirmation email to user
      console.log("📧 Sending confirmation email...");
    } catch (emailError) {
      console.error("❌ Detailed email error:", emailError);
      throw emailError; // Re-throw to be caught by outer catch
    }

    // Send confirmation email to user
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✅ Support Request Received</h2>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${name},</p>

          <p>Thank you for contacting Supplr support. We've received your message and will get back to you soon.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Your Request Summary:</h4>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${formatCategory(category)}</p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> ${formatUrgency(urgency)}</p>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>📧 Response Time:</strong> We typically respond within 24 hours for normal priority requests.
              ${urgency === "urgent" ? " Since this is marked as urgent, we'll prioritize your request." : ""}
            </p>
          </div>

          <p>If you need to add more information to your request, simply reply to this email.</p>

          <p style="margin-bottom: 0;">
            Best regards,<br>
            <strong>The Supplr Support Team</strong><br>
            <em>"Ensuring your practice never runs out of what matters most."</em>
          </p>
        </div>
      </div>
    `;

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: `"Supplr Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "✅ Your Supplr support request has been received",
        html: confirmationHtml,
      });
      console.log("✅ Confirmation email sent successfully");
    } catch (confirmError) {
      console.error("❌ Error sending confirmation email:", confirmError);
      // Don't fail the whole request if confirmation email fails
    }

    // Redirect back to support page with success message
    return NextResponse.redirect(new URL("/support?success=true", request.url));
  } catch (error) {
    console.error("Error sending support email:", error);

    // Redirect back with error
    return NextResponse.redirect(new URL("/support?error=true", request.url));
  }
}
