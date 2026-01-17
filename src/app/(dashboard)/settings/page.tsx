"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Organization, Settings, Category } from "@prisma/client";

interface SettingsData {
  organization: Organization;
  settings: Settings;
  categories: Category[];
}

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "",
    expirationWarningDays: "",
    lowStockThreshold: "",
    currency: "",
    timezone: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    notificationEmail: "",
    notificationPhone: "",
    smsCarrier: "att",
    expirationAlerts: true,
    lowStockAlerts: true,
    notificationFrequency: "daily" as "daily" | "weekly" | "immediate",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [testingNotifications, setTestingNotifications] = useState(false);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [settingsRes, categoriesRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/categories"),
      ]);

      if (settingsRes.ok && categoriesRes.ok) {
        const settings = await settingsRes.json();
        const categories = await categoriesRes.json();

        setSettingsData({ ...settings, categories });
        setFormData({
          organizationName: settings.organization.name,
          organizationType: settings.organization.type,
          expirationWarningDays:
            settings.settings.expirationWarningDays.toString(),
          lowStockThreshold: settings.settings.lowStockThreshold.toString(),
          currency: settings.settings.currency,
          timezone: settings.settings.timezone,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          expirationWarningDays: parseInt(formData.expirationWarningDays),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          currency: formData.currency,
          timezone: formData.timezone,
        }),
      });

      if (response.ok) {
        await fetchSettingsData(); // Refresh data
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setAddingCategory(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
        }),
      });

      if (response.ok) {
        setNewCategoryName("");
        await fetchSettingsData(); // Refresh categories
      } else {
        alert("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Error adding category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the "${categoryName}" category? This will also delete all items in this category.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchSettingsData(); // Refresh categories
      } else {
        alert("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category");
    }
  };

  const handleTestNotifications = async () => {
    try {
      setTestingNotifications(true);

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationEmail: notificationSettings.notificationEmail,
          smsEnabled: notificationSettings.smsNotifications,
          phone: notificationSettings.notificationPhone,
          carrier: notificationSettings.smsCarrier,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const emailTarget = notificationSettings.notificationEmail?.trim()
          ? notificationSettings.notificationEmail
          : "your account email";

        alert(
          `Test notifications sent successfully!\n\nEmails sent: ${result.details.emailsSent}\nSMS sent: ${result.details.smsSent}\n\nCheck ${emailTarget} for notifications about any inventory alerts.`
        );
      } else {
        alert(`Failed to send test notifications: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending test notifications:", error);
      alert("Error sending test notifications");
    } finally {
      setTestingNotifications(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!settingsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
          <p className="text-muted-foreground">
            Could not load organization settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization preferences and inventory settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) =>
                  setFormData({ ...formData, organizationType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Medical Clinic</SelectItem>
                  <SelectItem value="medspa">Medical Spa</SelectItem>
                  <SelectItem value="dentist">Dental Practice</SelectItem>
                  <SelectItem value="practice">Private Practice</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expirationDays">Expiration Warning (Days)</Label>
              <Input
                id="expirationDays"
                type="number"
                min="1"
                max="365"
                value={formData.expirationWarningDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expirationWarningDays: e.target.value,
                  })
                }
                placeholder="30"
              />
              <p className="text-sm text-muted-foreground">
                Alert when items expire within this many days
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="1"
                max="1000"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lowStockThreshold: e.target.value,
                  })
                }
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Default threshold for low stock alerts
              </p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="email-notifications"
                  className="text-base font-medium"
                >
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive inventory alerts via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: checked,
                  })
                }
              />
            </div>

            {notificationSettings.emailNotifications && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={notificationSettings.notificationEmail}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notificationEmail: e.target.value,
                    })
                  }
                  placeholder="Enter email for notifications"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use your account email
                </p>
              </div>
            )}
          </div>

          {/* SMS Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="sms-notifications"
                  className="text-base font-medium"
                >
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive urgent alerts via SMS
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    smsNotifications: checked,
                  })
                }
              />
            </div>

            {notificationSettings.smsNotifications && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-phone">Phone Number</Label>
                    <Input
                      id="notification-phone"
                      type="tel"
                      value={notificationSettings.notificationPhone}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          notificationPhone: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-carrier">Carrier</Label>
                    <Select
                      value={notificationSettings.smsCarrier}
                      onValueChange={(value) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          smsCarrier: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="att">AT&T</SelectItem>
                        <SelectItem value="verizon">Verizon</SelectItem>
                        <SelectItem value="tmobile">T-Mobile</SelectItem>
                        <SelectItem value="sprint">Sprint</SelectItem>
                        <SelectItem value="uscellular">US Cellular</SelectItem>
                        <SelectItem value="boost">Boost Mobile</SelectItem>
                        <SelectItem value="cricket">Cricket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  SMS uses email-to-SMS gateways. Standard messaging rates may
                  apply.
                </p>
              </div>
            )}
          </div>

          {/* Alert Types */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Alert Types</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="expiration-alerts"
                    className="text-sm font-medium"
                  >
                    Expiration Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when items are expiring soon or expired
                  </p>
                </div>
                <Switch
                  id="expiration-alerts"
                  checked={notificationSettings.expirationAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      expirationAlerts: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="low-stock-alerts"
                    className="text-sm font-medium"
                  >
                    Low Stock Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when inventory levels are low
                  </p>
                </div>
                <Switch
                  id="low-stock-alerts"
                  checked={notificationSettings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      lowStockAlerts: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Notification Frequency */}
          <div className="space-y-2">
            <Label htmlFor="notification-frequency">
              Notification Frequency
            </Label>
            <Select
              value={notificationSettings.notificationFrequency}
              onValueChange={(value: "daily" | "weekly" | "immediate") =>
                setNotificationSettings({
                  ...notificationSettings,
                  notificationFrequency: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate (Real-time)</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Test Notifications */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Test Notifications</h4>
                <p className="text-xs text-muted-foreground">
                  Send a test notification to verify your settings
                </p>
              </div>
              <Button
                onClick={handleTestNotifications}
                disabled={testingNotifications}
                variant="outline"
                size="sm"
              >
                {testingNotifications ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Category */}
            <div className="flex space-x-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
              >
                {addingCategory ? "Adding..." : "Add Category"}
              </Button>
            </div>

            {/* Existing Categories */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Current Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {settingsData.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="text-sm"
                  >
                    {category.name}
                    <button
                      onClick={() =>
                        handleDeleteCategory(category.id, category.name)
                      }
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Organization ID
              </Label>
              <p className="font-mono text-sm">
                {settingsData.organization.id}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Created
              </Label>
              <p className="text-sm">
                {new Date(
                  settingsData.organization.createdAt
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </Label>
              <p className="text-sm">
                {new Date(settingsData.settings.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
