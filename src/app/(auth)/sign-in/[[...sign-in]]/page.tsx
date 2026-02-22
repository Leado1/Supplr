import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignInClient from "./sign-in-client";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <div className="text-sm text-muted-foreground">Loading sign in...</div>
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
