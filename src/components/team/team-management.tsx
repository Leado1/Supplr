"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Mail,
  Clock,
  Shield,
  User,
  Crown,
  Settings,
  Trash2,
} from "lucide-react";
import { InviteUserModal } from "./invite-user-modal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  joinedAt: Date | null;
  invitedBy: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  inviter: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface TeamManagementProps {
  currentUser: User;
  teamMembers: User[];
  pendingInvitations: Invitation[];
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MANAGER: Settings,
  MEMBER: User,
};

const roleColors = {
  OWNER: "bg-yellow-500",
  ADMIN: "bg-blue-500",
  MANAGER: "bg-green-500",
  MEMBER: "bg-gray-500",
};

export function TeamManagement({
  currentUser,
  teamMembers,
  pendingInvitations,
}: TeamManagementProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canInviteUsers =
    currentUser.role === "OWNER" || currentUser.role === "ADMIN";
  const canManageRoles = currentUser.role === "OWNER";

  const handleCancelInvitation = async (invitationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/organization/invitations?id=${invitationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel invitation");
      }

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been successfully cancelled.",
      });

      // Refresh the page to update the lists
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organization/team/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove team member");
      }

      toast({
        title: "Team member removed",
        description: "The team member has been successfully removed.",
      });

      // Refresh the page to update the lists
      window.location.reload();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon className="w-4 h-4" />;
  };

  const getRoleBadge = (role: string) => {
    const color = roleColors[role as keyof typeof roleColors] || "bg-gray-500";
    return (
      <Badge variant="secondary" className={`${color} text-white`}>
        {getRoleIcon(role)}
        <span className="ml-1">{role}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {canInviteUsers && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {teamMembers.length} Team Member
              {teamMembers.length !== 1 ? "s" : ""}
            </Badge>
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {pendingInvitations.length} Pending Invitation
                {pendingInvitations.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Team Members</CardTitle>
              <CardDescription>
                All active members of your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {(
                          member.firstName?.[0] || member.email[0]
                        ).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                        {member.joinedAt && (
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getRoleBadge(member.role)}
                      {canManageRoles &&
                        member.id !== currentUser.id &&
                        member.role !== "OWNER" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Team Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  {member.firstName && member.lastName
                                    ? `${member.firstName} ${member.lastName}`
                                    : member.email}{" "}
                                  from your organization? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveTeamMember(member.id)
                                  }
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No pending invitations
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited by{" "}
                            {invitation.inviter.firstName &&
                            invitation.inviter.lastName
                              ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
                              : invitation.inviter.email}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              Expires {formatDate(invitation.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRoleBadge(invitation.role)}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancel Invitation
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel the invitation
                                to {invitation.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Keep Invitation
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleCancelInvitation(invitation.id)
                                }
                              >
                                Cancel Invitation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
