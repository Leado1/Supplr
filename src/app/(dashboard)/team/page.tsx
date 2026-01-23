import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserWithRole, requireUserPermission } from "@/lib/auth-helpers";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TeamManagement } from "@/components/team/team-management";

export default async function TeamPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has permission to manage team and get user data
  const { user, organization } = await requireUserPermission(
    Permission.MANAGE_TEAM
  );
  if (!user || !organization) {
    redirect("/dashboard");
  }

  // Get team members
  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: organization.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      joinedAt: true,
      invitedBy: true,
    },
    orderBy: [
      { role: "asc" }, // OWNER first, then ADMIN, etc.
      { joinedAt: "asc" },
    ],
  });

  // Get pending invitations
  const pendingInvitations = await prisma.userInvitation.findMany({
    where: {
      organizationId: organization.id,
      acceptedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
      inviter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-muted-foreground mt-2">
            Manage your organization's team members and send invitations to new
            users.
          </p>
        </div>

        <TeamManagement
          currentUser={user}
          teamMembers={teamMembers}
          pendingInvitations={pendingInvitations}
        />
      </div>
    </div>
  );
}
