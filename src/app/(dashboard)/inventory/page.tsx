"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { Filters } from "@/components/dashboard/filters";
import { ItemModal } from "@/components/modals/item-modal";
import { BarcodeScannerModal } from "@/components/modals/barcode-scanner-modal";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { generateInventoryPDF, generateCSV } from "@/lib/pdf-generator";
import { calculateInventorySummary } from "@/lib/inventory-status";
import type { ItemWithStatus, InventoryFilters } from "@/types/inventory";
import type { Category } from "@prisma/client";

export default function InventoryPage() {
  const searchParams = useSearchParams();
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [newBarcode, setNewBarcode] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Check for barcode parameter from scanner
  useEffect(() => {
    const barcodeParam = searchParams.get('new_barcode');
    if (barcodeParam) {
      setNewBarcode(barcodeParam);
      setEditingItem(null);
      setIsModalOpen(true);

      // Clean up the URL
      window.history.replaceState({}, document.title, '/inventory');
    }
  }, [searchParams]);

  // Apply filters whenever items or filters change
  useEffect(() => {
    applyFilters();
  }, [items, filters]);

  // Clear selections when filtered items change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filteredItems]);

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
    setNewBarcode(null);
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

  // Selection handlers
  const handleSelectionChange = (itemId: string, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (isSelected) {
      newSelectedIds.add(itemId);
    } else {
      newSelectedIds.delete(itemId);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(filteredItems.map(item => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const selectedItems = filteredItems.filter(item => selectedIds.has(item.id));
    const itemNames = selectedItems.map(item => item.name).join(", ");

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} item(s)? (${itemNames})`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/items/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every(response => response.ok);

      if (allSuccessful) {
        setSelectedIds(new Set());
        await fetchInventoryData(); // Refresh the data
      } else {
        alert("Some items could not be deleted");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      alert("Error deleting items");
    }
  };

  const handleBulkQuantityUpdate = async (newQuantity: number) => {
    if (selectedIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );

      const results = await Promise.all(updatePromises);
      const allSuccessful = results.every(response => response.ok);

      if (allSuccessful) {
        setSelectedIds(new Set());
        await fetchInventoryData(); // Refresh the data
      } else {
        alert("Some items could not be updated");
      }
    } catch (error) {
      console.error("Error updating quantities:", error);
      alert("Error updating quantities");
    }
  };

  // Barcode scanner handlers
  const handleItemScanned = (item: any) => {
    // Highlight the scanned item in the table
    const foundItem = items.find(i => i.id === item.id);
    if (foundItem) {
      // Scroll to and highlight the item
      const element = document.getElementById(`item-${item.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-green-100');
        setTimeout(() => {
          element.classList.remove('bg-green-100');
        }, 3000);
      }
    }

    // Refresh the inventory data to get latest quantities
    fetchInventoryData();
  };

  const handleNewItemFromBarcode = (barcode: string) => {
    // Pre-fill the item modal with the scanned barcode as SKU
    setEditingItem(null); // Ensure we're adding, not editing
    setIsModalOpen(true);

    // Set a timeout to pre-fill the SKU field after modal opens
    setTimeout(() => {
      const skuInput = document.querySelector('input[name="sku"]') as HTMLInputElement;
      if (skuInput) {
        skuInput.value = barcode;
        skuInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  // Export handlers
  const handleExportPDF = async () => {
    const summary = calculateInventorySummary(filteredItems);

    // Convert items to the format expected by the PDF generator
    const convertedItems = filteredItems.map(item => ({
      ...item,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toString()
    }));

    const reportData = {
      organizationName: "Your Organization", // We'll get this from the organization context
      items: convertedItems,
      summary,
      filters: {
        status: filters.status,
        category: filters.categoryId === "all" ? undefined : categories.find(c => c.id === filters.categoryId)?.name,
        search: filters.search || undefined
      }
    };

    generateInventoryPDF(reportData);
  };

  const handleExportCSV = async () => {
    // Convert items to the format expected by the CSV generator
    const convertedItems = filteredItems.map(item => ({
      ...item,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toString()
    }));

    const reportData = {
      organizationName: "Your Organization", // We'll get this from the organization context
      items: convertedItems
    };

    generateCSV(reportData);
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
        <div className="flex space-x-3">
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            variant="outline"
          />
          <Link href="/import">
            <Button variant="outline">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import Items
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 21l4-7 4 7M8 5h8v4H8z" />
            </svg>
            Scan Barcode
          </Button>
          <Button onClick={handleAddItem}>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </Button>
        </div>
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

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Clear Selection
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newQuantity = prompt("Enter new quantity for selected items:");
                  if (newQuantity && !isNaN(parseInt(newQuantity))) {
                    handleBulkQuantityUpdate(parseInt(newQuantity));
                  }
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Quantity
              </Button>
            </div>
          </div>
        )}

        <InventoryTable
          items={filteredItems}
          selectedIds={selectedIds}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onQuantityChange={handleQuantityChange}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          onAddItem={handleAddItem}
        />
      </div>

      {/* Add/Edit Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        categories={categories}
        editItem={editingItem}
        defaultSku={newBarcode || undefined}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemScanned={handleItemScanned}
        onNewItemRequested={handleNewItemFromBarcode}
      />
    </div>
  );
}