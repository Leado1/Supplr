import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InvitationAcceptance } from "@/components/invite/invitation-acceptance";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { userId } = await auth();

  // Note: For now we'll just check if user is logged in
  // The actual email validation will happen when they try to accept the invitation

  // Find the invitation
  const invitation = await prisma.userInvitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          name: true,
          id: true,
        },
      },
      inviter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Check if invitation exists and is valid
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Invitation</h1>
            <p className="text-muted-foreground mb-6">
              This invitation link is invalid or has been removed.
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Go to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation has expired
  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Invitation Expired</h1>
            <p className="text-muted-foreground mb-6">
              This invitation has expired. Please contact {invitation.inviter.firstName && invitation.inviter.lastName
                ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
                : invitation.inviter.email} for a new invitation.
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Go to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation has already been accepted
  if (invitation.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Invitation Already Accepted</h1>
            <p className="text-muted-foreground mb-6">
              This invitation has already been accepted. If you're a member of this organization, please sign in to access your dashboard.
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Email matching will be handled by the API when accepting the invitation

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-lg mx-auto p-8">
        <InvitationAcceptance
          invitation={{
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            token: invitation.token,
            organization: {
              name: invitation.organization?.name || "Unknown Organization",
              id: invitation.organizationId,
            },
            inviter: {
              name: invitation.inviter.firstName && invitation.inviter.lastName
                ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
                : invitation.inviter.email,
              email: invitation.inviter.email,
            },
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
          }}
          currentUser={userId ? {
            id: userId,
            email: "", // Will be validated by API
          } : null}
        />
      </div>
    </div>
  );
}