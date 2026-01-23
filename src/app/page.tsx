import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { HomepageContent } from "./homepage-content";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return <HomepageContent />;
}
