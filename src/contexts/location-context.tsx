"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  organizationId: string;
}

interface LocationContextValue {
  locations: Location[];
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location) => void;
  isLoading: boolean;
  hasMultiLocationAccess: boolean;
  refreshLocations: () => Promise<void>;
  error: string | null;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

interface LocationProviderProps {
  children: React.ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMultiLocationAccess, setHasMultiLocationAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has multi-location access (Enterprise subscription)
  const checkMultiLocationAccess = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/features");
      const data = await response.json();

      if (response.ok) {
        setHasMultiLocationAccess(data.features?.multiLocation || false);
        return data.features?.multiLocation || false;
      } else {
        console.error("Failed to check multi-location access:", data.error);
        setHasMultiLocationAccess(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking multi-location access:", error);
      setHasMultiLocationAccess(false);
      return false;
    }
  }, []);

  // Fetch locations
  const refreshLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if user has multi-location access
      const hasAccess = await checkMultiLocationAccess();

      if (!hasAccess) {
        setLocations([]);
        setSelectedLocationState(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/locations");
      const data = await response.json();

      if (response.ok) {
        setLocations(data.locations || []);
        // Note: Default location selection is handled in the initialization effect
      } else {
        console.error("Failed to fetch locations:", data.error);
        setError(data.error || "Failed to fetch locations");
        setLocations([]);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setError("Failed to load locations");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [checkMultiLocationAccess]);

  // Set selected location with persistence
  const setSelectedLocation = useCallback((location: Location) => {
    setSelectedLocationState(location);
    localStorage.setItem("selectedLocationId", location.id);

    // Trigger a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent("locationChanged", {
      detail: { location }
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initializeLocation = async () => {
      // First check if user has access
      const hasAccess = await checkMultiLocationAccess();

      if (hasAccess) {
        // Fetch all locations first
        await refreshLocations();
      } else {
        setIsLoading(false);
      }
    };

    initializeLocation();
  }, []); // Empty dependency array to run only once on mount

  // Separate effect to handle location selection after locations are loaded
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      // Try to restore selected location from localStorage
      const savedLocationId = localStorage.getItem("selectedLocationId");
      let locationToSelect: Location | null = null;

      if (savedLocationId) {
        locationToSelect = locations.find(loc => loc.id === savedLocationId) || null;
      }

      // If no saved location or saved location not found, use first active location
      if (!locationToSelect) {
        locationToSelect = locations.find(loc => loc.isActive) || locations[0] || null;
      }

      if (locationToSelect) {
        setSelectedLocationState(locationToSelect);
        localStorage.setItem("selectedLocationId", locationToSelect.id);
      }
    }
  }, [locations, selectedLocation]);

  // Listen for subscription changes that might affect multi-location access
  useEffect(() => {
    const handleSubscriptionChange = () => {
      checkMultiLocationAccess().then((hasAccess) => {
        if (hasAccess) {
          refreshLocations();
        } else {
          setLocations([]);
          setSelectedLocationState(null);
          localStorage.removeItem("selectedLocationId");
        }
      });
    };

    // Listen for subscription updates
    window.addEventListener("subscriptionUpdated", handleSubscriptionChange);

    return () => {
      window.removeEventListener("subscriptionUpdated", handleSubscriptionChange);
    };
  }, []); // Empty dependency array since functions are stable

  const value: LocationContextValue = {
    locations,
    selectedLocation,
    setSelectedLocation,
    isLoading,
    hasMultiLocationAccess,
    refreshLocations,
    error,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}

// Hook for components that need to react to location changes
export function useLocationChangeEffect(callback: (location: Location | null) => void) {
  const { selectedLocation } = useLocationContext();

  useEffect(() => {
    callback(selectedLocation);
  }, [selectedLocation, callback]);

  useEffect(() => {
    const handleLocationChanged = (event: CustomEvent) => {
      callback(event.detail.location);
    };

    window.addEventListener("locationChanged", handleLocationChanged as EventListener);

    return () => {
      window.removeEventListener("locationChanged", handleLocationChanged as EventListener);
    };
  }, [callback]);
}