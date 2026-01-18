"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { Filters } from "@/components/dashboard/filters";
import { ItemModal } from "@/components/modals/item-modal";
import { BarcodeScannerModal } from "@/components/modals/barcode-scanner-modal";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { generateInventoryPDF, generateCSV } from "@/lib/pdf-generator";
import { calculateInventorySummary } from "@/lib/inventory-status";
import { LoadingScreen, InlineLoading } from "@/components/ui/loading-spinner";
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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"add" | "remove">("add");
  const [newBarcode, setNewBarcode] = useState<string | null>(null);
  const [sortField, setSortField] = useState<
    "name" | "quantity" | "unitCost" | "expirationDate" | "status" | "category"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Check for barcode parameter from scanner or add action from dashboard
  useEffect(() => {
    const barcodeParam = searchParams.get("new_barcode");
    const actionParam = searchParams.get("action");

    if (barcodeParam) {
      setNewBarcode(barcodeParam);
      setEditingItem(null);
      setIsModalOpen(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, "/inventory");
    } else if (actionParam === "add") {
      setEditingItem(null);
      setIsModalOpen(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, "/inventory");
    }
  }, [searchParams]);

  // Apply filters whenever items, filters, or sorting changes
  useEffect(() => {
    applyFilters();
  }, [items, filters, sortField, sortDirection]);

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
        filtered = filtered.filter(
          (item) =>
            item.quantity > 0 &&
            (item.status === "ok" || item.status === "low_stock")
        );
      } else {
        filtered = filtered.filter((item) => item.status === filters.status);
      }
    }

    // Apply category filter
    if (filters.categoryId && filters.categoryId !== "all") {
      filtered = filtered.filter(
        (item) => item.categoryId === filters.categoryId
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
          item.category.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "unitCost":
          aValue = Number(a.unitCost);
          bValue = Number(b.unitCost);
          break;
        case "expirationDate":
          aValue = new Date(a.expirationDate).getTime();
          bValue = new Date(b.expirationDate).getTime();
          break;
        case "status":
          // Define status priority for sorting
          const statusPriority = {
            expired: 0,
            expiring_soon: 1,
            low_stock: 2,
            ok: 3,
          };
          aValue = statusPriority[a.status];
          bValue = statusPriority[b.status];
          break;
        case "category":
          aValue = a.category.name.toLowerCase();
          bValue = b.category.name.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredItems(filtered);
  };

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
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

  const handleQuantityChange = async (
    item: ItemWithStatus,
    newQuantity: number
  ) => {
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
        setItems((prevItems) =>
          prevItems.map((i) =>
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
      const allIds = new Set(filteredItems.map((item) => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || bulkLoading) return;

    const selectedItems = filteredItems.filter((item) =>
      selectedIds.has(item.id)
    );
    const itemNames = selectedItems.map((item) => item.name).join(", ");

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} item(s)? (${itemNames})`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/items/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const allSuccessful = results.every((response) => response.ok);

      if (allSuccessful) {
        setSelectedIds(new Set());
        await fetchInventoryData(); // Refresh the data
      } else {
        alert("Some items could not be deleted");
      }
    } catch (error) {
      console.error("Error deleting items:", error);
      alert("Error deleting items");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkQuantityUpdate = async (newQuantity: number) => {
    if (selectedIds.size === 0 || bulkLoading) return;

    setBulkLoading(true);
    try {
      const updatePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );

      const results = await Promise.all(updatePromises);
      const allSuccessful = results.every((response) => response.ok);

      if (allSuccessful) {
        setSelectedIds(new Set());
        await fetchInventoryData(); // Refresh the data
      } else {
        alert("Some items could not be updated");
      }
    } catch (error) {
      console.error("Error updating quantities:", error);
      alert("Error updating quantities");
    } finally {
      setBulkLoading(false);
    }
  };

  // Barcode scanner handlers
  const handleItemScanned = async (item: any, mode: "add" | "remove") => {
    const foundItem = items.find((i) => i.id === item.id);
    if (!foundItem) return;

    if (mode === "add") {
      // Add 1 to quantity
      await handleQuantityChange(foundItem, foundItem.quantity + 1);
    } else if (mode === "remove") {
      // Remove 1 from quantity (minimum 0)
      const newQuantity = Math.max(0, foundItem.quantity - 1);
      await handleQuantityChange(foundItem, newQuantity);
    }

    // Scroll to and highlight the item with appropriate color
    const element = document.getElementById(`item-${item.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add(mode === "add" ? "bg-green-100" : "bg-red-100");
      setTimeout(() => {
        element.classList.remove(
          mode === "add" ? "bg-green-100" : "bg-red-100"
        );
      }, 3000);
    }

    // Close scanner after successful operation
    setIsScannerOpen(false);
  };

  const openScannerForAdd = () => {
    setScannerMode("add");
    setIsScannerOpen(true);
  };

  const openScannerForRemove = () => {
    setScannerMode("remove");
    setIsScannerOpen(true);
  };

  const handleNewItemFromBarcode = (barcode: string) => {
    // Pre-fill the item modal with the scanned barcode as SKU
    setEditingItem(null); // Ensure we're adding, not editing
    setIsModalOpen(true);

    // Set a timeout to pre-fill the SKU field after modal opens
    setTimeout(() => {
      const skuInput = document.querySelector(
        'input[name="sku"]'
      ) as HTMLInputElement;
      if (skuInput) {
        skuInput.value = barcode;
        skuInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, 100);
  };

  // Export handlers
  const handleExportPDF = async () => {
    const summary = calculateInventorySummary(filteredItems);

    // Convert items to the format expected by the PDF generator
    const convertedItems = filteredItems.map((item) => ({
      ...item,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toString(),
    }));

    const reportData = {
      organizationName: "Your Organization", // We'll get this from the organization context
      items: convertedItems,
      summary,
      filters: {
        status: filters.status,
        category:
          filters.categoryId === "all"
            ? undefined
            : categories.find((c) => c.id === filters.categoryId)?.name,
        search: filters.search || undefined,
      },
    };

    try {
      await generateInventoryPDF(reportData);
    } catch (error) {
      console.error("PDF export error:", error);
      alert(
        "Failed to generate PDF. Please check the browser console for details."
      );
    }
  };

  const handleExportCSV = async () => {
    // Convert items to the format expected by the CSV generator
    const convertedItems = filteredItems.map((item) => ({
      ...item,
      unitCost: item.unitCost.toString(),
      expirationDate: item.expirationDate.toString(),
    }));

    const reportData = {
      organizationName: "Your Organization", // We'll get this from the organization context
      items: convertedItems,
    };

    generateCSV(reportData);
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        <LoadingScreen
          message="Loading inventory..."
          size="xl"
          className="min-h-[400px]"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your medical supplies, track expiration dates, and monitor
            stock levels
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
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Import Items
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={openScannerForAdd}
            className="text-green-600 hover:text-green-700"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Scan to Add
          </Button>
          <Button
            variant="outline"
            onClick={openScannerForRemove}
            className="text-red-600 hover:text-red-700"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 12H6"
              />
            </svg>
            Scan to Remove
          </Button>
          <Button onClick={handleAddItem}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
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
        onCategoryFilter={(categoryId) =>
          setFilters({ ...filters, categoryId })
        }
        searchValue={filters.search}
        statusFilter={filters.status}
        categoryFilter={filters.categoryId}
      />

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">
            Sort by:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <span className="capitalize">
                  {sortField === "unitCost"
                    ? "Unit Cost"
                    : sortField === "expirationDate"
                      ? "Expiration Date"
                      : sortField}
                </span>
                {sortDirection === "asc" ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleSort("name")}>
                <div className="flex items-center justify-between w-full">
                  <span>Name</span>
                  {sortField === "name" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("quantity")}>
                <div className="flex items-center justify-between w-full">
                  <span>Quantity</span>
                  {sortField === "quantity" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("unitCost")}>
                <div className="flex items-center justify-between w-full">
                  <span>Unit Cost</span>
                  {sortField === "unitCost" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("expirationDate")}>
                <div className="flex items-center justify-between w-full">
                  <span>Expiration Date</span>
                  {sortField === "expirationDate" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("status")}>
                <div className="flex items-center justify-between w-full">
                  <span>Status</span>
                  {sortField === "status" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("category")}>
                <div className="flex items-center justify-between w-full">
                  <span>Category</span>
                  {sortField === "category" && (
                    <svg
                      className="h-4 w-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}{" "}
          displayed
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold">{items.length}</div>
          <p className="text-sm text-muted-foreground">Total Items</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {items.filter((item) => item.status === "expiring_soon").length}
          </div>
          <p className="text-sm text-muted-foreground">Expiring Soon</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-red-600">
            {items.filter((item) => item.status === "expired").length}
          </div>
          <p className="text-sm text-muted-foreground">Expired</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-bold text-orange-600">
            {items.filter((item) => item.status === "low_stock").length}
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
              : `Filtered Results (${filteredItems.length} of ${items.length})`}
          </h2>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
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
                disabled={bulkLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkLoading ? (
                  <InlineLoading size="sm" className="mr-2" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                {bulkLoading ? "Deleting..." : "Delete Selected"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={bulkLoading}
                onClick={() => {
                  const newQuantity = prompt(
                    "Enter new quantity for selected items:"
                  );
                  if (newQuantity && !isNaN(parseInt(newQuantity))) {
                    handleBulkQuantityUpdate(parseInt(newQuantity));
                  }
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                {bulkLoading ? (
                  <InlineLoading size="sm" className="mr-2" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                )}
                {bulkLoading ? "Updating..." : "Update Quantity"}
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
        mode={scannerMode}
      />
    </div>
  );
}
