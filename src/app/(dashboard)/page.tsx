import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to Supplr Dashboard</h1>
        <p className="text-muted-foreground">
          Your inventory management dashboard is being set up.
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <h2 className="mb-4 text-xl font-semibold">Dashboard Coming Soon</h2>
        <p className="text-muted-foreground">
          We're building your inventory management dashboard. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
          <li>• Summary cards showing total items, expiring items, and low stock</li>
          <li>• Visual inventory table with status badges</li>
          <li>• Filter and search functionality</li>
          <li>• Add, edit, and delete inventory items</li>
        </ul>
      </div>
    </div>
  );
}