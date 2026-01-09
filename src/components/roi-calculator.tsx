"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import Link from "next/link";

export function ROICalculator() {
  const [monthlySpend, setMonthlySpend] = useState(10000);
  const [wastePercentage] = useState(15); // Industry average

  const yearlySpend = monthlySpend * 12;
  const currentWaste = yearlySpend * (wastePercentage / 100);
  const supplrSavings = currentWaste * 0.85; // 85% waste reduction
  const supplrCost = 79 * 12; // Professional plan yearly
  const netSavings = supplrSavings - supplrCost;
  const roi = ((netSavings / supplrCost) * 100);

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-8 w-8 text-primary mr-3" />
            <h2 className="text-3xl lg:text-4xl font-bold">
              Calculate Your Potential Savings
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how much money Supplr can save your practice every year
          </p>
        </div>

        <Card className="max-w-2xl mx-auto shadow-xl border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthlySpend" className="text-base font-medium">
                    Monthly inventory spend (Botox, fillers, supplies)
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <Input
                      id="monthlySpend"
                      type="number"
                      value={monthlySpend}
                      onChange={(e) => setMonthlySpend(Number(e.target.value) || 0)}
                      className="pl-8 h-12 text-lg"
                      placeholder="10,000"
                    />
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Waste */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      ${currentWaste.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Current yearly waste
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Industry avg: {wastePercentage}% expired products
                    </div>
                  </div>
                </div>

                {/* Potential Savings */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ${netSavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Net yearly savings
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {roi.toFixed(0)}% ROI with Supplr
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Waste prevented with Supplr:</span>
                    <span className="font-medium">${supplrSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplr Professional plan:</span>
                    <span className="font-medium">-${supplrCost.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                    <span>Total net savings:</span>
                    <span>${netSavings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Based on industry averages and Supplr customer data
                </p>
                <Link href="/sign-up">
                  <Button size="lg" className="px-8 bg-gradient-to-r from-primary to-primary/80">
                    Start Saving Today
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}