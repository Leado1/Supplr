import { Suspense } from "react";
import SignInClient from "./sign-in-client";

export default function SignInPage() {
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
