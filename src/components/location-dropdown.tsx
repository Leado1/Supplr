"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";
import { useLocationContext } from "@/contexts/location-context";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

interface LocationDropdownProps {
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact";
}

export function LocationDropdown({
  className,
  showIcon = true,
  variant = "default",
}: LocationDropdownProps) {
  const {
    locations,
    selectedLocation,
    setSelectedLocation,
    isLoading,
    hasMultiLocationAccess,
  } = useLocationContext();

  // Don't render if user doesn't have multi-location access
  if (!hasMultiLocationAccess || locations.length <= 1) {
    return null;
  }

  const handleLocationChange = (locationId: string) => {
    const location = locations.find((loc) => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {showIcon && <MapPin className="h-4 w-4 text-muted-foreground" />}
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {showIcon && <Building2 className="h-4 w-4 text-muted-foreground" />}
        <Select
          value={selectedLocation?.id || ""}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-sm border-none bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-ring">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex items-center space-x-2">
                  <span>{location.name}</span>
                  {!location.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showIcon && <MapPin className="h-4 w-4 text-muted-foreground" />}
      <Select
        value={selectedLocation?.id || ""}
        onValueChange={handleLocationChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{location.name}</span>
                  {!location.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                {location.address && (
                  <span className="text-xs text-muted-foreground">
                    {location.address}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}