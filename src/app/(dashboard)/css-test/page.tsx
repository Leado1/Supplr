"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChaoticSpinner } from "@/components/ui/chaotic-spinner";
import { WorkingChaoticSpinner } from "@/components/ui/working-chaotic-spinner";

export default function CSSTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">CSS Loading Spinner Test</h1>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">
            Current LoadingSpinner (Tailwind fallback):
          </h3>
          <LoadingSpinner size="lg" />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">
            ChaoticSpinner Test (Global CSS):
          </h3>
          <ChaoticSpinner size="lg" />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">
            WorkingChaoticSpinner (Inline CSS):
          </h3>
          <WorkingChaoticSpinner size="lg" />
          <p className="text-xs text-muted-foreground mt-2">
            This should definitely work - uses inline CSS with styled-jsx
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Manual CSS Test:</h3>
          <div
            className="chaotic-orbit"
            style={
              {
                "--uib-size": "32px",
                "--uib-speed": "1.5s",
                "--uib-color": "black",
              } as React.CSSProperties
            }
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">CSS Classes Check:</h3>
          <div className="space-y-2">
            <p>Check browser dev tools to see if these classes exist:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• .chaotic-orbit - Main spinner container</li>
              <li>• .chaotic-orbit::before - First orbiting element</li>
              <li>• .chaotic-orbit::after - Second orbiting element</li>
              <li>• @keyframes rotate936 - Container rotation animation</li>
              <li>• @keyframes orbit - Orbiting animation</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">
            Alternative Fallback Spinner:
          </h3>
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">
            This should always work (CSS spinner)
          </p>
        </div>
      </div>
    </div>
  );
}
