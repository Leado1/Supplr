import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simulate slow component loading
async function SlowContent() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow Loading Content</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content took 2 seconds to load, demonstrating the loading spinner in action!</p>
        <p className="mt-4 text-muted-foreground">
          Navigate away and back to this page to see the loading effects.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SlowPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Slow Loading Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates loading states with artificial delays
        </p>
      </div>

      <Suspense fallback={<LoadingScreen message="Loading content..." size="lg" />}>
        <SlowContent />
      </Suspense>
    </div>
  );
}