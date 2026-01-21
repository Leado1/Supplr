import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your Supplr account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start tracking your medical inventory today
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-card border border-border shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
