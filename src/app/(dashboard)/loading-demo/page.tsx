"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, LoadingScreen, InlineLoading } from "@/components/ui/loading-spinner";
import Link from "next/link";

export default function LoadingDemoPage() {
  const [isLoading, setIsLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loading Spinner Demo</h1>
        <p className="text-muted-foreground">
          Showcase of the chaotic orbit loading spinner in different contexts
        </p>
      </div>

      {/* Navigation Loading Test */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Loading Test</CardTitle>
          <CardDescription>
            Test the loading spinner during page navigation. Click these links to see the loading bar at the top.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline">Inventory</Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline">Reports</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline">Billing</Button>
            </Link>
            <Link href="/slow-page">
              <Button variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                Slow Page (2s delay)
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 Look for the loading bar at the very top of the page and the spinner in the top-right corner during navigation.
            <br />
            ⚡ The "Slow Page" button demonstrates longer loading with Suspense boundaries.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Spinners */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Spinners</CardTitle>
            <CardDescription>Different sizes of the loading spinner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Small:</div>
              <LoadingSpinner size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Medium:</div>
              <LoadingSpinner size="md" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Large:</div>
              <LoadingSpinner size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Extra Large:</div>
              <LoadingSpinner size="xl" />
            </div>
          </CardContent>
        </Card>

        {/* Colored Spinners */}
        <Card>
          <CardHeader>
            <CardTitle>Colored Spinners</CardTitle>
            <CardDescription>Spinners with custom colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Blue:</div>
              <LoadingSpinner size="md" color="#3b82f6" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Green:</div>
              <LoadingSpinner size="md" color="#10b981" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Red:</div>
              <LoadingSpinner size="md" color="#ef4444" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium w-16">Purple:</div>
              <LoadingSpinner size="md" color="#8b5cf6" />
            </div>
          </CardContent>
        </Card>

        {/* Button Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Button Loading States</CardTitle>
            <CardDescription>Inline loading in buttons and interactive elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={simulateLoading} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <InlineLoading size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Start Loading Demo"
              )}
            </Button>

            <Button variant="outline" disabled className="w-full">
              <InlineLoading size="sm" className="mr-2" />
              Saving Changes...
            </Button>

            <Button variant="secondary" disabled className="w-full">
              <InlineLoading size="sm" className="mr-2" />
              Uploading Files...
            </Button>
          </CardContent>
        </Card>

        {/* Full Screen Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Full Screen Loading</CardTitle>
            <CardDescription>Loading screen component for page-level loading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <LoadingScreen
                message="Loading your data..."
                size="lg"
                className="min-h-[200px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dark Mode Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Dark Mode Compatibility</CardTitle>
          <CardDescription>How the spinner looks in dark contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <div className="flex items-center justify-center">
                <LoadingSpinner size="lg" color="black" />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">Light Theme</p>
            </div>
            <div className="p-4 bg-gray-900 border rounded-lg">
              <div className="flex items-center justify-center">
                <LoadingSpinner size="lg" color="white" />
              </div>
              <p className="text-center text-sm text-gray-300 mt-2">Dark Theme</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>Common patterns for using the loading spinner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">1. Page Loading</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              {`<LoadingScreen message="Loading inventory..." size="xl" />`}
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Button Loading</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              {`<Button disabled={loading}>
  {loading ? <InlineLoading className="mr-2" /> : null}
  {loading ? "Saving..." : "Save"}
</Button>`}
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Custom Sized Spinner</h4>
            <code className="text-sm bg-muted p-2 rounded block">
              {`<LoadingSpinner size="lg" color="#3b82f6" className="my-4" />`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}