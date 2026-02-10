import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth-helpers";
import { hasPermission, Permission } from "@/lib/permissions";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" })
  : null;

export async function DELETE() {
  try {
    // Get user's organization with security checks and user info
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(user.role, Permission.MANAGE_BILLING)) {
      return NextResponse.json(
        { message: "Insufficient permissions to delete account" },
        { status: 403 }
      );
    }

    const subscription = organization!.subscription;

    try {
      // Cancel Stripe subscription if exists
      if (stripe && subscription?.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // Delete Stripe customer if exists
      if (stripe && subscription?.stripeCustomerId) {
        await stripe.customers.del(subscription.stripeCustomerId);
      }
    } catch (stripeError) {
      console.error("Error canceling Stripe resources:", stripeError);
      // Continue with deletion even if Stripe operations fail
    }

    // Delete all organization data (cascade will handle related records)
    await prisma.organization.delete({
      where: { id: organization!.id },
    });

    // Delete user from Clerk
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(user!.clerkId);
    } catch (clerkError) {
      console.error("Error deleting user from Clerk:", clerkError);
      // Continue even if Clerk deletion fails
    }

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
