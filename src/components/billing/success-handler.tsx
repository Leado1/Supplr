"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export function SuccessHandler() {
  const searchParams = useSearchParams();
  const [isActivating, setIsActivating] = useState(true);
  const [activationStatus, setActivationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      activateSubscription(sessionId);
    } else {
      setActivationStatus('error');
      setErrorMessage('No session ID found in URL');
      setIsActivating(false);
    }
  }, [searchParams]);

  const activateSubscription = async (checkoutId: string) => {
    try {
      console.log('Attempting to activate subscription for checkout:', checkoutId);

      // For development: Since we can't get the exact product/customer ID from checkout ID easily,
      // we'll try to infer it from the success URL or use a fallback
      // In production, the webhook would handle this automatically

      const response = await fetch('/api/billing/manual-activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutId: checkoutId,
          // We'll need to determine these from the checkout session
          // For now, let's try to get them from Polar API
          productId: 'temp', // Will be determined by the API
          customerId: 'temp', // Will be determined by the API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Subscription activated successfully:', data);
        setActivationStatus('success');
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

  const retryActivation = () => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setIsActivating(true);
      setActivationStatus('pending');
      setErrorMessage('');
      activateSubscription(sessionId);
    }
  };

  if (isActivating) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Activating your subscription... Please wait.
        </AlertDescription>
      </Alert>
    );
  }

  if (activationStatus === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          There was an issue activating your subscription: {errorMessage}
          <div className="mt-2">
            <Button onClick={retryActivation} size="sm" variant="outline">
              Retry Activation
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (activationStatus === 'success') {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Subscription activated successfully! You now have access to all your plan features.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}