"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Edit, Trash2, Building2, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddLocationModal } from "./add-location-modal";
import { EditLocationModal } from "./edit-location-modal";
import { DeleteLocationModal } from "./delete-location-modal";
import { useLocationContext } from "@/contexts/location-context";
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
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export function LocationManagement() {
  const {
    locations,
    refreshLocations,
    hasMultiLocationAccess,
    isLoading,
    error
  } = useLocationContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  // Refresh locations on component mount
  useEffect(() => {
    if (hasMultiLocationAccess) {
      refreshLocations();
    }
  }, [hasMultiLocationAccess, refreshLocations]);

  const handleLocationAdded = () => {
    setIsAddModalOpen(false);
    refreshLocations();
    toast.success("Location added successfully");
  };

  const handleLocationUpdated = () => {
    setEditingLocation(null);
    refreshLocations();
    toast.success("Location updated successfully");
  };

  const handleLocationDeleted = () => {
    setDeletingLocation(null);
    refreshLocations();
    toast.success("Location deleted successfully");
  };

  if (!hasMultiLocationAccess) {
    return (
      <div className="container mx-auto p-8">
        <Alert>
          <AlertDescription>
            Multi-location management requires an Enterprise subscription.
            <Button asChild className="ml-4">
              <a href="/billing">Upgrade to Enterprise</a>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage your organization's locations and inventory distribution
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Locations Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Locations Yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first location to organize your inventory.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Location
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id} className={`relative ${!location.isActive ? 'opacity-75' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={location.isActive ? "default" : "secondary"}>
                          {location.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLocation(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingLocation(location)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.address && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{location.address}</span>
                  </div>
                )}

                {location.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{location.phone}</span>
                  </div>
                )}

                {location.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{location.email}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {location.timezone} • {location.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleLocationAdded}
      />

      {/* Edit Location Modal */}
      {editingLocation && (
        <EditLocationModal
          location={editingLocation}
          isOpen={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          onSuccess={handleLocationUpdated}
        />
      )}

      {/* Delete Location Modal */}
      {deletingLocation && (
        <DeleteLocationModal
          location={deletingLocation}
          isOpen={!!deletingLocation}
          onClose={() => setDeletingLocation(null)}
          onSuccess={handleLocationDeleted}
        />
      )}
    </div>
  );
}