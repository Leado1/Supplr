"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Code } from "lucide-react";

export function DevActivation() {
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isSyncingUser, setIsSyncingUser] = useState(false);

  const plans = [
    { value: 'starter', label: 'Starter' },
    { value: 'professional', label: 'Professional' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const periods = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' }
  ];

  const productIds: Record<string, Record<string, string>> = {
    starter: {
      monthly: "80233fb0-8372-4b73-b584-5e156e47c801",
      annual: "c6b81c8b-2fb6-4ab7-ad27-dbb51525557e"
    },
    professional: {
      monthly: "421dbc95-45f5-4233-bc13-c0975d8df9c2",
      annual: "dcce171f-ba7d-4ebf-b76d-ee4cf91492aa"
    },
    enterprise: {
      monthly: "97a755c6-a969-4cdc-8d89-b2bdf12ef01b",
      annual: "332fafed-0207-4c80-837a-6f884ca7d6bb"
    }
  };

  const debugSubscription = async () => {
    try {
      const response = await fetch('/api/billing/debug-subscription');
      const data = await response.json();
      setDebugInfo(data);
      console.log('Debug info:', data);
    } catch (error) {
      console.error('Error debugging subscription:', error);
    }
  };

  const manuallyActivateSubscription = async () => {
    try {
      setIsActivating(true);
      setActivationStatus('idle');
      setErrorMessage('');

      const productId = productIds[selectedPlan][selectedPeriod];

      console.log('Manually activating subscription with:', {
        plan: selectedPlan,
        period: selectedPeriod,
        productId
      });

      const response = await fetch('/api/billing/manual-activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutId: 'manual-dev-activation', // Fake checkout ID for dev
          productId: productId,
          customerId: 'create-real-customer', // This triggers real customer creation
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Subscription activated successfully:', data);
        setActivationStatus('success');
        // Refresh debug info
        setTimeout(debugSubscription, 1000);
      } else {
        console.error('Failed to activate subscription:', data);
        setActivationStatus('error');
        setErrorMessage(data.error || 'Failed to activate subscription');
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      setActivationStatus('error');
      setErrorMessage('Network error occurred');
    } finally {
      setIsActivating(false);
    }
  };

  const createOrganization = async () => {
    try {
      setIsCreatingOrg(true);

      // Just call the manual activate with dummy data to trigger org creation
      const response = await fetch('/api/billing/manual-activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutId: 'org-creation-only',
          productId: '80233fb0-8372-4b73-b584-5e156e47c801', // Starter monthly (just for org creation)
          customerId: 'temp-customer',
        }),
      });

      const data = await response.json();
      console.log('Organization creation result:', data);

      // Refresh debug info
      setTimeout(debugSubscription, 1000);
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const syncUser = async () => {
    try {
      setIsSyncingUser(true);

      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('User sync result:', data);

      // Refresh debug info
      setTimeout(debugSubscription, 1000);
    } catch (error) {
      console.error('Error syncing user:', error);
    } finally {
      setIsSyncingUser(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Code className="h-5 w-5" />
          Development Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Since webhooks don't work on localhost, use this tool to manually activate your subscription after completing checkout.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Plan</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={manuallyActivateSubscription}
            disabled={isActivating}
            size="sm"
          >
            {isActivating ? 'Activating...' : 'Manually Activate Subscription'}
          </Button>

          <Button
            onClick={debugSubscription}
            variant="outline"
            size="sm"
          >
            Debug Subscription
          </Button>

          {!debugInfo?.debug?.userFound && (
            <Button
              onClick={syncUser}
              disabled={isSyncingUser}
              variant="destructive"
              size="sm"
            >
              {isSyncingUser ? 'Syncing...' : 'Sync User to Database'}
            </Button>
          )}

          {debugInfo?.debug?.userFound && debugInfo?.debug?.organization === null && (
            <Button
              onClick={createOrganization}
              disabled={isCreatingOrg}
              variant="secondary"
              size="sm"
            >
              {isCreatingOrg ? 'Creating Org...' : 'Create Organization'}
            </Button>
          )}
        </div>

        {activationStatus === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Subscription activated successfully! Refresh the page to see changes.
            </AlertDescription>
          </Alert>
        )}

        {activationStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error: {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug Info:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}