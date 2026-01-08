import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUserWithOrganization } from "@/lib/organization-setup";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to your environment variables");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook events
  try {
    switch (evt.type) {
      case "user.created":
        console.log("👤 New user created:", evt.data.id);

        // Create user in database with organization
        await createUserWithOrganization({
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || "",
          firstName: evt.data.first_name || undefined,
          lastName: evt.data.last_name || undefined,
        });

        console.log("✅ User and organization created successfully");
        break;

      case "user.updated":
        console.log("👤 User updated:", evt.data.id);

        // Update user information in database
        await prisma.user.update({
          where: { clerkId: evt.data.id },
          data: {
            email: evt.data.email_addresses[0]?.email_address || "",
            firstName: evt.data.first_name || undefined,
            lastName: evt.data.last_name || undefined,
          },
        });

        console.log("✅ User updated successfully");
        break;

      case "user.deleted":
        console.log("👤 User deleted:", evt.data.id);

        // Note: In production, you might want to soft delete or archive the data
        // For now, we'll keep the user data but mark them as deleted
        // The CASCADE delete will handle related data if we actually delete

        // Optional: Delete user and let CASCADE handle related data
        // await prisma.user.delete({
        //   where: { clerkId: evt.data.id || "" }
        // });

        console.log("✅ User deletion handled");
        break;

      default:
        console.log("🔄 Unhandled webhook event:", evt.type);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}