import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth-helpers";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { hasPermission, Permission } from "@/lib/permissions";

interface ImportRow {
  name?: string;
  sku?: string;
  category?: string;
  quantity?: string | number;
  unitCost?: string | number;
  expirationDate?: string;
  reorderThreshold?: string | number;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ImportError[];
  categories: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Get user's organization with security checks
    const { error: orgError, organization, user } = await getUserOrganization();
    if (orgError) return orgError;

    if (!user || !hasPermission(user.role, Permission.MANAGE_INVENTORY)) {
      return NextResponse.json(
        { message: "Insufficient permissions to import inventory" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { message: "Invalid file type. Please upload a CSV or Excel file." },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    let rows: ImportRow[] = [];

    try {
      if (isCSV) {
        // Parse CSV
        const csvContent = buffer.toString("utf-8");
        rows = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet) as ImportRow[];
      }
    } catch (parseError) {
      console.error("File parsing error:", parseError);
      return NextResponse.json(
        { message: "Failed to parse file. Please check the file format." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No data found in file" },
        { status: 400 }
      );
    }

    // Process rows
    const result = await processImportData(rows, organization!.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processImportData(
  rows: ImportRow[],
  organizationId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
    categories: [],
  };

  // Get existing categories
  const existingCategories = await prisma.category.findMany({
    where: { organizationId },
    select: { name: true, id: true },
  });

  const categoryMap = new Map(
    existingCategories.map((cat) => [cat.name.toLowerCase(), cat.id])
  );

  // Get or create a default location for imported items
  let defaultLocation = await prisma.location.findFirst({
    where: { organizationId },
  });

  if (!defaultLocation) {
    defaultLocation = await prisma.location.create({
      data: {
        name: "Main Location",
        organizationId,
      },
    });
  }

  // Get existing SKUs to check for duplicates
  const existingSKUs = await prisma.item.findMany({
    where: {
      organizationId,
      sku: { not: null },
    },
    select: { sku: true },
  });

  const skuSet = new Set(
    existingSKUs
      .map((item) => item.sku?.toLowerCase())
      .filter((sku): sku is string => sku != null)
  );
  const newCategories: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Account for header row

    try {
      // Validate required fields
      const errors = validateRow(row, rowNumber, skuSet);
      if (errors.length > 0) {
        result.errors.push(...errors);
        result.errorCount++;
        result.skippedCount++;
        continue;
      }

      // Normalize and prepare data
      const name = String(row.name).trim();
      const sku = row.sku ? String(row.sku).trim() : null;
      const categoryName = String(row.category).trim();
      const quantity = Number(row.quantity);
      const unitCost = Number(String(row.unitCost).replace(/[$,]/g, ""));
      const reorderThreshold = Number(row.reorderThreshold || 5);

      // Handle expiration date
      let expirationDate: Date;
      if (row.expirationDate) {
        const dateStr = String(row.expirationDate).trim();
        const parsedDate = parseDate(dateStr);
        if (!parsedDate || parsedDate < new Date()) {
          result.errors.push({
            row: rowNumber,
            field: "expirationDate",
            message: "Invalid or past date",
          });
          result.errorCount++;
          result.skippedCount++;
          continue;
        }
        expirationDate = parsedDate;
      } else {
        // Default to 1 year from now
        expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }

      // Get or create category
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        try {
          const newCategory = await prisma.category.create({
            data: {
              name: categoryName,
              organizationId,
            },
          });
          categoryId = newCategory.id;
          categoryMap.set(categoryName.toLowerCase(), categoryId);
          newCategories.push(categoryName);
        } catch (categoryError) {
          result.errors.push({
            row: rowNumber,
            field: "category",
            message: "Failed to create category",
          });
          result.errorCount++;
          result.skippedCount++;
          continue;
        }
      }

      // Create the item
      try {
        await prisma.item.create({
          data: {
            name,
            sku,
            categoryId,
            organizationId,
            locationId: defaultLocation.id,
            quantity,
            unitCost,
            expirationDate,
            reorderThreshold,
          },
        });

        result.importedCount++;

        // Add SKU to set to prevent duplicates in same import
        if (sku) {
          skuSet.add(sku.toLowerCase());
        }
      } catch (createError) {
        console.error(`Error creating item for row ${rowNumber}:`, createError);
        result.errors.push({
          row: rowNumber,
          field: "general",
          message: "Failed to create item",
        });
        result.errorCount++;
        result.skippedCount++;
      }
    } catch (error) {
      console.error(`Error processing row ${rowNumber}:`, error);
      result.errors.push({
        row: rowNumber,
        field: "general",
        message: "Unexpected error processing row",
      });
      result.errorCount++;
      result.skippedCount++;
    }
  }

  result.categories = newCategories;
  result.success = result.importedCount > 0;

  return result;
}

function validateRow(
  row: ImportRow,
  rowNumber: number,
  existingSKUs: Set<string>
): ImportError[] {
  const errors: ImportError[] = [];

  // Required fields
  if (!row.name || String(row.name).trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: "name",
      message: "Name is required",
    });
  }

  if (!row.category || String(row.category).trim().length === 0) {
    errors.push({
      row: rowNumber,
      field: "category",
      message: "Category is required",
    });
  }

  // Validate quantity
  const quantity = Number(row.quantity);
  if (isNaN(quantity) || quantity < 0) {
    errors.push({
      row: rowNumber,
      field: "quantity",
      message: "Quantity must be a non-negative number",
    });
  }

  // Validate unit cost
  const unitCost = Number(String(row.unitCost).replace(/[$,]/g, ""));
  if (isNaN(unitCost) || unitCost < 0) {
    errors.push({
      row: rowNumber,
      field: "unitCost",
      message: "Unit cost must be a non-negative number",
    });
  }

  // Validate reorder threshold
  if (row.reorderThreshold) {
    const reorderThreshold = Number(row.reorderThreshold);
    if (isNaN(reorderThreshold) || reorderThreshold < 0) {
      errors.push({
        row: rowNumber,
        field: "reorderThreshold",
        message: "Reorder threshold must be a non-negative number",
      });
    }
  }

  // Validate SKU uniqueness
  if (row.sku) {
    const sku = String(row.sku).trim().toLowerCase();
    if (existingSKUs.has(sku)) {
      errors.push({
        row: rowNumber,
        field: "sku",
        message: "SKU already exists",
      });
    }
  }

  // Validate name length
  if (row.name && String(row.name).trim().length > 100) {
    errors.push({
      row: rowNumber,
      field: "name",
      message: "Name is too long (max 100 characters)",
    });
  }

  // Validate SKU length
  if (row.sku && String(row.sku).trim().length > 50) {
    errors.push({
      row: rowNumber,
      field: "sku",
      message: "SKU is too long (max 50 characters)",
    });
  }

  return errors;
}

function parseDate(dateStr: string): Date | null {
  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ];

  for (const format of formats) {
    if (format.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try parsing with Date constructor as fallback
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date : null;
}
