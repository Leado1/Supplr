import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignUpClient from "./sign-up-client";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <div className="text-sm text-muted-foreground">Loading sign up...</div>
        </div>
      }
    >
      <SignUpClient />
    </Suspense>
  );
}
