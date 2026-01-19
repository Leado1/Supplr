"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, User, Calendar, Clock, Loader2, CheckCircle } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  token: string;
  organization: {
    name: string;
    id: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

interface CurrentUser {
  id: string;
  email: string;
}

interface InvitationAcceptanceProps {
  invitation: InvitationData;
  currentUser: CurrentUser | null;
}

export function InvitationAcceptance({ invitation, currentUser }: InvitationAcceptanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-500";
      case "ADMIN":
        return "bg-blue-500";
      case "MANAGER":
        return "bg-green-500";
      case "MEMBER":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Full access to all organization features and settings";
      case "ADMIN":
        return "Can invite users, manage inventory, and view reports";
      case "MANAGER":
        return "Can manage inventory and view reports";
      case "MEMBER":
        return "Can view and update inventory";
      default:
        return "Basic access to organization features";
    }
  };

  const handleAcceptInvitation = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/invitations/${invitation.token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${invitation.organization.name}.`,
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";

    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Failed to accept invitation",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    // Redirect to sign up with pre-filled email
    const signUpUrl = `/sign-up?email=${encodeURIComponent(invitation.email)}&redirect_url=${encodeURIComponent(window.location.href)}`;
    window.location.href = signUpUrl;
  };

  const handleSignIn = () => {
    // Redirect to sign in with redirect back to this page
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
    window.location.href = signInUrl;
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">You're Invited!</CardTitle>
        <CardDescription>
          You've been invited to join an organization on Supplr
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Organization Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{invitation.organization.name}</p>
              <p className="text-sm text-muted-foreground">Organization</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{invitation.inviter.name}</p>
              <p className="text-sm text-muted-foreground">{invitation.inviter.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">Invited email</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Role Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Role:</span>
            <Badge className={`${getRoleColor(invitation.role)} text-white`}>
              {invitation.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {getRoleDescription(invitation.role)}
          </p>
        </div>

        <Separator />

        {/* Invitation Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Invited on:</span>
            </div>
            <span>{formatDate(invitation.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Expires on:</span>
            </div>
            <span>{formatDate(invitation.expiresAt)}</span>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentUser ? (
            // User is signed in
            <Button
              onClick={handleAcceptInvitation}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          ) : (
            // User is not signed in
            <div className="space-y-3">
              <Button onClick={handleSignUp} className="w-full">
                Create Account & Accept
              </Button>
              <Button onClick={handleSignIn} variant="outline" className="w-full">
                Sign In to Accept
              </Button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By accepting this invitation, you agree to join {invitation.organization.name} and
            will have access to their inventory management system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}