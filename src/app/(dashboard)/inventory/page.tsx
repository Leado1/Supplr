"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { Filters } from "@/components/dashboard/filters";
import { ItemModal } from "@/components/modals/item-modal";
import type { ItemWithStatus, InventoryFilters } from "@/types/inventory";
import type { Category } from "@prisma/client";

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemWithStatus[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>({
    status: "all",
    categoryId: "all",
    search: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Apply filters whenever items or filters change
  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/categories"),
      ]);

      if (itemsRes.ok && categoriesRes.ok) {
        const itemsData = await itemsRes.json();
        const categoriesData = await categoriesRes.json();

        setItems(itemsData);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Apply status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "ok") {
        // "In Stock" should show items with any quantity > 0
        filtered = filtered.filter(item =>
          item.quantity > 0 && (item.status === "ok" || item.status === "low_stock")
        );
      } else {
        filtered = filtered.filter(item => item.status === filters.status);
      }
    }

    // Apply category filter
    if (filters.categoryId && filters.categoryId !== "all") {
      filtered = filtered.filter(item => item.categoryId === filters.categoryId);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
        item.category.name.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ItemWithStatus) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: ItemWithStatus) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchInventoryData(); // Refresh the data
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSave = async () => {
    setIsModalOpen(false);
    setEditingItem(null);
    await fetchInventoryData(); // Refresh the data
  };

  const handleQuantityChange = async (item: ItemWithStatus, newQuantity: number) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        // Update the local state immediately for better UX
        setItems(prevItems =>
          prevItems.map(i =>
            i.id === item.id ? { ...i, quantity: newQuantity } : i
          )
        );
      } else {
        alert("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Error updating quantity");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your medical supplies, track expiration dates, and monitor stock levels
          </p>
        </div>
        <Button onClick={handleAddItem}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Item
        </Button>
      </div>

      {/* Filters */}
      <Filters
        categories={categories}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        onStatusFilter={(status) => setFilters({ ...filters, status })}
        onCategoryFilter={(categoryId) => setFilters({ ...filters, categoryId })}
        searchValue={filters.search}
        statusFilter={filters.status}
        categoryFilter={filters.categoryId}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">{items.length}</div>
          <p className="text-sm text-muted-foreground">Total Items</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {items.filter(item => item.status === "expiring_soon").length}
          </div>
          <p className="text-sm text-muted-foreground">Expiring Soon</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-600">
            {items.filter(item => item.status === "expired").length}
          </div>
          <p className="text-sm text-muted-foreground">Expired</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-orange-600">
            {items.filter(item => item.status === "low_stock").length}
          </div>
          <p className="text-sm text-muted-foreground">Low Stock</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredItems.length === items.length
              ? "All Inventory Items"
              : `Filtered Results (${filteredItems.length} of ${items.length})`
            }
          </h2>
        </div>

        <InventoryTable
          items={filteredItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onQuantityChange={handleQuantityChange}
        />
      </div>

      {/* Add/Edit Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        categories={categories}
        editItem={editingItem}
      />
    </div>
  );
}