"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";

type SocialProvider = ComponentProps<typeof Clerk.Connection>["name"];

const socialProviders = (
  process.env.NEXT_PUBLIC_CLERK_OAUTH_PROVIDERS ?? ""
)
  .split(",")
  .map((provider) => provider.trim())
  .filter(Boolean) as SocialProvider[];

const formatProvider = (provider: string) => {
  return provider
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function SignUpClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="flex justify-center">
            <img
              src="/images/LOGOB.png"
              alt="Supplr"
              className="h-9 w-auto sm:h-10 dark:hidden"
            />
            <img
              src="/images/LOGOW.png"
              alt="Supplr"
              className="h-9 w-auto hidden sm:h-10 dark:block"
            />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your Supplr account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your medical inventory today
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create your account in a few quick steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUp.Root routing="path" path="/sign-up">
              <SignUp.Step name="start" className="space-y-6">
                {socialProviders.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      {socialProviders.map((provider) => (
                        <Clerk.Connection
                          key={provider}
                          name={provider}
                          asChild
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center gap-2"
                          >
                            <Clerk.Icon className="h-4 w-4" />
                            Continue with {formatProvider(provider)}
                          </Button>
                        </Clerk.Connection>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Separator className="flex-1" />
                      <span>OR</span>
                      <Separator className="flex-1" />
                    </div>
                  </div>
                )}

                <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" />

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Clerk.Field name="firstName">
                      <Clerk.Label asChild>
                        <Label>First name</Label>
                      </Clerk.Label>
                      <Clerk.Input asChild type="text" autoComplete="given-name">
                        <Input placeholder="First name" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>

                    <Clerk.Field name="lastName">
                      <Clerk.Label asChild>
                        <Label>Last name</Label>
                      </Clerk.Label>
                      <Clerk.Input asChild type="text" autoComplete="family-name">
                        <Input placeholder="Last name" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                  </div>

                  <Clerk.Field name="username">
                    <Clerk.Label asChild>
                      <Label>Username</Label>
                    </Clerk.Label>
                    <Clerk.Input asChild type="text" autoComplete="username">
                      <Input placeholder="Choose a username" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="emailAddress">
                    <Clerk.Label asChild>
                      <Label>Email</Label>
                    </Clerk.Label>
                    <Clerk.Input asChild type="email" autoComplete="email">
                      <Input placeholder="you@clinic.com" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="phoneNumber">
                    <Clerk.Label asChild>
                      <Label>Phone number</Label>
                    </Clerk.Label>
                    <Clerk.Input asChild type="tel" autoComplete="tel">
                      <Input placeholder="(555) 555-5555" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="password">
                    <Clerk.Label asChild>
                      <Label>Password</Label>
                    </Clerk.Label>
                    <Clerk.Input
                      asChild
                      type="password"
                      autoComplete="new-password"
                    >
                      <Input placeholder="Create a password" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="confirmPassword">
                    <Clerk.Label asChild>
                      <Label>Confirm password</Label>
                    </Clerk.Label>
                    <Clerk.Input
                      asChild
                      type="password"
                      autoComplete="new-password"
                    >
                      <Input placeholder="Re-enter your password" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>
                </div>

                <SignUp.Captcha />

                <Clerk.Loading scope="submit">
                  {(isLoading) => (
                    <SignUp.Action submit asChild>
                      <Button className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create account"}
                      </Button>
                    </SignUp.Action>
                  )}
                </Clerk.Loading>

                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to Supplr's terms and{" "}
                  <Link
                    href="/privacy"
                    className="text-foreground underline underline-offset-2"
                  >
                    privacy policy
                  </Link>
                  .
                </p>

                <div className="text-center text-sm text-muted-foreground">
                  <span>Already have an account? </span>
                  <Clerk.Link navigate="sign-in">
                    {({ url }) => (
                      <Link
                        href={url}
                        className="font-medium text-foreground hover:underline"
                      >
                        Sign in
                      </Link>
                    )}
                  </Clerk.Link>
                </div>
              </SignUp.Step>

              <SignUp.Step name="verifications" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">Verify your account</h2>
                  <p className="text-sm text-muted-foreground">
                    Confirm your email or phone number to continue.
                  </p>
                </div>

                <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" />

                <SignUp.Strategy name="email_code">
                  <div className="space-y-4">
                    <Clerk.Field name="code">
                      <Clerk.Label asChild>
                        <Label>Email code</Label>
                      </Clerk.Label>
                      <Clerk.Input
                        asChild
                        type="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      >
                        <Input placeholder="Enter the code" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                    <Clerk.Loading scope="submit">
                      {(isLoading) => (
                        <SignUp.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify email"}
                          </Button>
                        </SignUp.Action>
                      )}
                    </Clerk.Loading>
                    <SignUp.Action
                      resend
                      asChild
                      fallback={({ resendableAfter }) => (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          disabled
                        >
                          Resend available in {resendableAfter}s
                        </Button>
                      )}
                    >
                      <Button type="button" variant="ghost" className="w-full">
                        Resend code
                      </Button>
                    </SignUp.Action>
                  </div>
                </SignUp.Strategy>

                <SignUp.Strategy name="phone_code">
                  <div className="space-y-4">
                    <Clerk.Field name="code">
                      <Clerk.Label asChild>
                        <Label>SMS code</Label>
                      </Clerk.Label>
                      <Clerk.Input
                        asChild
                        type="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      >
                        <Input placeholder="Enter the code" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                    <Clerk.Loading scope="submit">
                      {(isLoading) => (
                        <SignUp.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify phone"}
                          </Button>
                        </SignUp.Action>
                      )}
                    </Clerk.Loading>
                    <SignUp.Action
                      resend
                      asChild
                      fallback={({ resendableAfter }) => (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          disabled
                        >
                          Resend available in {resendableAfter}s
                        </Button>
                      )}
                    >
                      <Button type="button" variant="ghost" className="w-full">
                        Resend code
                      </Button>
                    </SignUp.Action>
                  </div>
                </SignUp.Strategy>

                <SignUp.Strategy name="email_link">
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Check your inbox for a verification link.
                    </p>
                    <SignUp.Action
                      resend
                      asChild
                      fallback={({ resendableAfter }) => (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          disabled
                        >
                          Resend available in {resendableAfter}s
                        </Button>
                      )}
                    >
                      <Button type="button" variant="ghost" className="w-full">
                        Resend link
                      </Button>
                    </SignUp.Action>
                  </div>
                </SignUp.Strategy>
              </SignUp.Step>

              <SignUp.Step name="restricted" className="space-y-4 text-center">
                <h2 className="text-lg font-semibold">
                  Sign-ups are currently restricted
                </h2>
                <p className="text-sm text-muted-foreground">
                  Please contact support to request access.
                </p>
                <Link
                  href="/support"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  Contact support
                </Link>
              </SignUp.Step>
            </SignUp.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
