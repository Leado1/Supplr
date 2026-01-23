import { Suspense } from "react";
import SignUpClient from "./sign-up-client";

export default function SignUpPage() {
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
