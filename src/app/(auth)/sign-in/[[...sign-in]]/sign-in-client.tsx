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
import * as SignIn from "@clerk/elements/sign-in";

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

export default function SignInClient() {
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
            Welcome back to Supplr
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your clinic inventory
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignIn.Root routing="path" path="/sign-in">
              <SignIn.Step name="start" className="space-y-6">
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
                  <Clerk.Field name="identifier">
                    <Clerk.Label asChild>
                      <Label>Email or username</Label>
                    </Clerk.Label>
                    <Clerk.Input asChild type="text" autoComplete="username">
                      <Input placeholder="you@clinic.com or username" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>

                  <Clerk.Field name="password">
                    <div className="flex items-center justify-between">
                      <Clerk.Label asChild>
                        <Label>Password</Label>
                      </Clerk.Label>
                      <SignIn.Action navigate="forgot-password" asChild>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                        >
                          Forgot password?
                        </Button>
                      </SignIn.Action>
                    </div>
                    <Clerk.Input
                      asChild
                      type="password"
                      autoComplete="current-password"
                    >
                      <Input placeholder="Enter your password" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>
                </div>

                <Clerk.Loading scope="submit">
                  {(isLoading) => (
                    <SignIn.Action submit asChild>
                      <Button className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                      </Button>
                    </SignIn.Action>
                  )}
                </Clerk.Loading>

                <div className="text-center text-sm text-muted-foreground">
                  <span>New to Supplr? </span>
                  <Clerk.Link navigate="sign-up">
                    {({ url }) => (
                      <Link
                        href={url}
                        className="font-medium text-foreground hover:underline"
                      >
                        Create an account
                      </Link>
                    )}
                  </Clerk.Link>
                </div>
              </SignIn.Step>

              <SignIn.Step name="choose-strategy" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">
                    Choose a sign-in method
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pick how you want to verify your account.
                  </p>
                </div>

                <div className="grid gap-2">
                  <SignIn.SupportedStrategy name="password" asChild>
                    <Button variant="outline" className="w-full">
                      Use password
                    </Button>
                  </SignIn.SupportedStrategy>
                  <SignIn.SupportedStrategy name="email_code" asChild>
                    <Button variant="outline" className="w-full">
                      Email a one-time code
                    </Button>
                  </SignIn.SupportedStrategy>
                  <SignIn.SupportedStrategy name="phone_code" asChild>
                    <Button variant="outline" className="w-full">
                      Text a one-time code
                    </Button>
                  </SignIn.SupportedStrategy>
                </div>

                <SignIn.Action navigate="start" asChild>
                  <Button variant="ghost" className="w-full">
                    Back to sign in
                  </Button>
                </SignIn.Action>
              </SignIn.Step>

              <SignIn.Step name="verifications" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">Verify your sign-in</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the code sent to <SignIn.SafeIdentifier />.
                  </p>
                </div>

                <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" />

                <SignIn.Strategy name="email_code">
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
                        <SignIn.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </SignIn.Action>
                      )}
                    </Clerk.Loading>
                    <SignIn.Action
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
                    </SignIn.Action>
                  </div>
                </SignIn.Strategy>

                <SignIn.Strategy name="phone_code">
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
                        <SignIn.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </SignIn.Action>
                      )}
                    </Clerk.Loading>
                    <SignIn.Action
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
                    </SignIn.Action>
                  </div>
                </SignIn.Strategy>

                <SignIn.Strategy name="totp">
                  <div className="space-y-4">
                    <Clerk.Field name="code">
                      <Clerk.Label asChild>
                        <Label>Authenticator code</Label>
                      </Clerk.Label>
                      <Clerk.Input asChild type="otp" inputMode="numeric">
                        <Input placeholder="Enter the code" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                    <Clerk.Loading scope="submit">
                      {(isLoading) => (
                        <SignIn.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </SignIn.Action>
                      )}
                    </Clerk.Loading>
                  </div>
                </SignIn.Strategy>

                <SignIn.Strategy name="backup_code">
                  <div className="space-y-4">
                    <Clerk.Field name="code">
                      <Clerk.Label asChild>
                        <Label>Backup code</Label>
                      </Clerk.Label>
                      <Clerk.Input asChild type="text" autoComplete="one-time-code">
                        <Input placeholder="Enter the backup code" />
                      </Clerk.Input>
                      <Clerk.FieldError className="text-xs text-destructive" />
                    </Clerk.Field>
                    <Clerk.Loading scope="submit">
                      {(isLoading) => (
                        <SignIn.Action submit asChild>
                          <Button className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify"}
                          </Button>
                        </SignIn.Action>
                      )}
                    </Clerk.Loading>
                  </div>
                </SignIn.Strategy>

                <SignIn.Action navigate="choose-strategy" asChild>
                  <Button variant="link" size="sm" className="w-full">
                    Use another method
                  </Button>
                </SignIn.Action>
              </SignIn.Step>

              <SignIn.Step name="forgot-password" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">Reset your password</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your email to receive a reset code.
                  </p>
                </div>

                <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" />

                <Clerk.Field name="identifier">
                  <Clerk.Label asChild>
                    <Label>Email</Label>
                  </Clerk.Label>
                  <Clerk.Input asChild type="email" autoComplete="email">
                    <Input placeholder="you@clinic.com" />
                  </Clerk.Input>
                  <Clerk.FieldError className="text-xs text-destructive" />
                </Clerk.Field>

                <Clerk.Loading scope="submit">
                  {(isLoading) => (
                    <SignIn.Action submit asChild>
                      <Button className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send reset code"}
                      </Button>
                    </SignIn.Action>
                  )}
                </Clerk.Loading>

                <SignIn.Action navigate="start" asChild>
                  <Button variant="ghost" className="w-full">
                    Back to sign in
                  </Button>
                </SignIn.Action>
              </SignIn.Step>

              <SignIn.Step name="reset-password" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold">Set a new password</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the reset code and your new password.
                  </p>
                </div>

                <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" />

                <div className="space-y-4">
                  <Clerk.Field name="code">
                    <Clerk.Label asChild>
                      <Label>Reset code</Label>
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

                  <Clerk.Field name="password">
                    <Clerk.Label asChild>
                      <Label>New password</Label>
                    </Clerk.Label>
                    <Clerk.Input asChild type="password" autoComplete="new-password">
                      <Input placeholder="Create a new password" />
                    </Clerk.Input>
                    <Clerk.FieldError className="text-xs text-destructive" />
                  </Clerk.Field>
                </div>

                <Clerk.Loading scope="submit">
                  {(isLoading) => (
                    <SignIn.Action submit asChild>
                      <Button className="w-full" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update password"}
                      </Button>
                    </SignIn.Action>
                  )}
                </Clerk.Loading>

                <SignIn.Action navigate="start" asChild>
                  <Button variant="ghost" className="w-full">
                    Back to sign in
                  </Button>
                </SignIn.Action>
              </SignIn.Step>
            </SignIn.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
