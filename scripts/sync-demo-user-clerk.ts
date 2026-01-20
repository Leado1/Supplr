import { prisma } from "../src/lib/db";
import { auth } from "@clerk/nextjs/server";

async function syncDemoUserClerk() {
  try {
    // Get current Clerk user ID
    const { userId } = await auth();

    if (!userId) {
      console.log("No current user session found");
      return;
    }

    console.log("Current Clerk User ID:", userId);

    // Update demo user with current Clerk ID
    const updatedUser = await prisma.user.update({
      where: {
        email: "demo@supplr.net"
      },
      data: {
        clerkId: userId
      }
    });

    console.log("✅ Updated demo user Clerk ID");
    console.log("Email:", updatedUser.email);
    console.log("Clerk ID:", updatedUser.clerkId);
    console.log("Role:", updatedUser.role);

  } catch (error) {
    console.error("Error syncing Clerk ID:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncDemoUserClerk();