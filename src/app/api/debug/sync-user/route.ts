import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createUserWithOrganization } from "@/lib/organization-setup";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        error: "No authenticated user"
      }, { status: 401 });
    }

    // Get user info from Clerk
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    // Create user with organization
    await createUserWithOrganization({
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "User and organization synced successfully",
      userDetails: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      }
    });

  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}