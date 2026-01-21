"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Building2, Truck, DollarSign } from "lucide-react";

interface SupplierInfo {
  id: string;
  name: string;
  type: "major_distributor" | "specialty" | "manufacturer";
  deliveryTime: number;
  minimumOrder?: number;
  description: string;
}

interface SupplierPreference {
  supplierId: string;
  preferenceLevel: "preferred" | "neutral" | "excluded";
  accountNumber?: string;
}

const AVAILABLE_SUPPLIERS: SupplierInfo[] = [
  {
    id: "mckesson",
    name: "McKesson Corporation",
    type: "major_distributor",
    deliveryTime: 1,
    minimumOrder: 50,
    description: "Leading pharmaceutical and medical supply distributor"
  },
  {
    id: "cardinal",
    name: "Cardinal Health",
    type: "major_distributor",
    deliveryTime: 1,
    minimumOrder: 75,
    description: "Healthcare services and products company"
  },
  {
    id: "henry_schein",
    name: "Henry Schein",
    type: "major_distributor",
    deliveryTime: 2,
    minimumOrder: 100,
    description: "Healthcare solutions for office-based practitioners"
  },
  {
    id: "medline",
    name: "Medline Industries",
    type: "major_distributor",
    deliveryTime: 2,
    minimumOrder: 50,
    description: "Healthcare supply chain solutions"
  },
  {
    id: "amazon_business",
    name: "Amazon Business",
    type: "specialty",
    deliveryTime: 1,
    minimumOrder: 25,
    description: "Business procurement and supplies"
  }
];

interface SupplierPreferencesProps {
  organizationId: string;
}

export function SupplierPreferences({ organizationId }: SupplierPreferencesProps) {
  const [preferences, setPreferences] = useState<SupplierPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSupplierPreferences();
  }, [organizationId]);

  const fetchSupplierPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings/suppliers');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || []);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch supplier preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to load supplier preferences');
      // Set empty preferences to allow the component to still render
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (supplierId: string, preferenceLevel: "preferred" | "neutral" | "excluded", accountNumber?: string) => {
    setPreferences(prev => {
      const existing = prev.find(p => p.supplierId === supplierId);
      const updated = prev.filter(p => p.supplierId !== supplierId);

      if (preferenceLevel !== "neutral" || accountNumber) {
        updated.push({
          supplierId,
          preferenceLevel,
          accountNumber: accountNumber || existing?.accountNumber
        });
      }

      return updated;
    });
  };

  const updateAccountNumber = (supplierId: string, accountNumber: string) => {
    const preference = preferences.find(p => p.supplierId === supplierId);
    const level = preference?.preferenceLevel || "neutral";
    updatePreference(supplierId, level, accountNumber);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setSuccess(false);

      const response = await fetch('/api/settings/suppliers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save supplier preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const getPreference = (supplierId: string) => {
    return preferences.find(p => p.supplierId === supplierId);
  };

  const getPreferenceLevel = (supplierId: string) => {
    return getPreference(supplierId)?.preferenceLevel || "neutral";
  };

  const getAccountNumber = (supplierId: string) => {
    return getPreference(supplierId)?.accountNumber || "";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error but still allow the component to render with default state
  if (error) {
    console.warn("Supplier preferences failed to load:", error);
    // Continue rendering with empty preferences instead of blocking the entire settings page
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Supplier Preferences
        </CardTitle>
        <CardDescription>
          Configure your preferred medical suppliers for AI-powered reorder recommendations.
          Set account numbers and preferences to streamline ordering.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">
              ⚠️ Unable to load saved preferences: {error}
            </p>
            <p className="text-xs text-red-500 mt-1">
              You can still configure preferences, but changes may not be saved.
            </p>
          </div>
        )}

        {AVAILABLE_SUPPLIERS.map((supplier) => {
          const preferenceLevel = getPreferenceLevel(supplier.id);
          const accountNumber = getAccountNumber(supplier.id);

          return (
            <div key={supplier.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{supplier.name}</h4>
                    <Badge
                      variant={supplier.type === "major_distributor" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {supplier.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {supplier.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {supplier.deliveryTime} day delivery
                    </div>
                    {supplier.minimumOrder && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${supplier.minimumOrder} minimum
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px]">
                  <Select
                    value={preferenceLevel}
                    onValueChange={(value: "preferred" | "neutral" | "excluded") =>
                      updatePreference(supplier.id, value, accountNumber)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preferred">
                        <span className="text-green-600">Preferred</span>
                      </SelectItem>
                      <SelectItem value="neutral">
                        <span className="text-gray-600">Neutral</span>
                      </SelectItem>
                      <SelectItem value="excluded">
                        <span className="text-red-600">Excluded</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {preferenceLevel === "preferred" && (
                <div className="space-y-2">
                  <Label htmlFor={`account-${supplier.id}`} className="text-sm">
                    Account Number (Optional)
                  </Label>
                  <Input
                    id={`account-${supplier.id}`}
                    placeholder="Enter your account number"
                    value={accountNumber}
                    onChange={(e) => updateAccountNumber(supplier.id, e.target.value)}
                    className="h-8"
                  />
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            AI will prioritize preferred suppliers when making reorder recommendations
          </div>

          <Button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <CheckCircle className="h-4 w-4" />
            ) : null}
            {saving ? "Saving..." : success ? "Saved!" : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}