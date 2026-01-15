import jsPDF from "jspdf";
import "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface InventoryItem {
  name: string;
  sku?: string | null;
  category: { name: string };
  quantity: number;
  unitCost: string | number;
  expirationDate: string;
  reorderThreshold: number;
  status: string;
}

interface ReportData {
  organizationName: string;
  items: InventoryItem[];
  summary?: {
    totalItems: number;
    totalValue: number;
    expired: number;
    expiringSoon: number;
    lowStock: number;
  };
  filters?: {
    status?: string;
    category?: string;
    search?: string;
  };
}

export function generateInventoryPDF(data: ReportData): void {
  const doc = new jsPDF();

  // Set up colors and styles
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const secondaryColor: [number, number, number] = [107, 114, 128]; // Gray
  const dangerColor: [number, number, number] = [239, 68, 68]; // Red
  const warningColor: [number, number, number] = [245, 158, 11]; // Amber
  const successColor: [number, number, number] = [34, 197, 94]; // Green

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory Report', 20, 25);

  // Organization name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.organizationName, 20, 35);

  // Date
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated on: ${currentDate}`, 140, 35);

  let yPosition = 50;

  // Summary section
  if (data.summary) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 15;

    // Summary cards
    const summaryData = [
      ['Total Items', data.summary.totalItems.toString()],
      ['Total Value', `$${data.summary.totalValue.toFixed(2)}`],
      ['Expired Items', data.summary.expired.toString()],
      ['Expiring Soon', data.summary.expiringSoon.toString()],
      ['Low Stock Items', data.summary.lowStock.toString()],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Filters section
  if (data.filters && (data.filters.status !== 'all' || data.filters.category !== 'all' || data.filters.search)) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Filters', 20, yPosition);
    yPosition += 10;

    const filters = [];
    if (data.filters.status && data.filters.status !== 'all') {
      filters.push(['Status', data.filters.status]);
    }
    if (data.filters.category && data.filters.category !== 'all') {
      filters.push(['Category', data.filters.category]);
    }
    if (data.filters.search) {
      filters.push(['Search', data.filters.search]);
    }

    if (filters.length > 0) {
      doc.autoTable({
        startY: yPosition,
        body: filters,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 30 },
          1: { cellWidth: 80 }
        },
        margin: { left: 20 }
      });
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
  }

  // Inventory table
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory Items', 20, yPosition);
  yPosition += 10;

  // Prepare table data
  const tableData = data.items.map(item => [
    item.name,
    item.sku || 'N/A',
    item.category.name,
    item.quantity.toString(),
    `$${parseFloat(item.unitCost.toString()).toFixed(2)}`,
    new Date(item.expirationDate).toLocaleDateString(),
    item.reorderThreshold.toString(),
    item.status.toUpperCase()
  ]);

  // Create the main table
  doc.autoTable({
    startY: yPosition,
    head: [['Name', 'SKU', 'Category', 'Qty', 'Unit Cost', 'Expires', 'Reorder', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Name
      1: { cellWidth: 20 }, // SKU
      2: { cellWidth: 25 }, // Category
      3: { cellWidth: 15, halign: 'center' }, // Quantity
      4: { cellWidth: 20, halign: 'right' }, // Unit Cost
      5: { cellWidth: 22 }, // Expiration
      6: { cellWidth: 18, halign: 'center' }, // Reorder
      7: { cellWidth: 18, halign: 'center' } // Status
    },
    didParseCell: function(data) {
      // Color code status column
      if (data.column.index === 7) {
        const status = data.cell.text[0].toLowerCase();
        if (status === 'expired') {
          data.cell.styles.fillColor = [254, 242, 242]; // Red background
          data.cell.styles.textColor = dangerColor;
        } else if (status === 'expiring soon') {
          data.cell.styles.fillColor = [255, 251, 235]; // Amber background
          data.cell.styles.textColor = warningColor;
        } else if (status === 'low stock') {
          data.cell.styles.fillColor = [255, 247, 237]; // Orange background
          data.cell.styles.textColor = warningColor;
        } else if (status === 'ok') {
          data.cell.styles.fillColor = [240, 253, 244]; // Green background
          data.cell.styles.textColor = successColor;
        }
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto',
    showHead: 'everyPage'
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 285, 210, 12, 'F');

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Supplr - Medical Inventory Management System', 20, 292);
    doc.text(`Page ${i} of ${pageCount}`, 170, 292);
    doc.text(`www.supplr.net`, 20, 296);
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = `${data.organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_inventory_${timestamp}.pdf`;

  // Save the PDF
  doc.save(filename);
}

export function generateCSV(data: ReportData): void {
  // Prepare CSV headers
  const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Unit Cost', 'Expiration Date', 'Reorder Threshold', 'Status'];

  // Prepare CSV rows
  const rows = data.items.map(item => [
    item.name,
    item.sku || '',
    item.category.name,
    item.quantity.toString(),
    item.unitCost.toString(),
    new Date(item.expirationDate).toISOString().split('T')[0], // YYYY-MM-DD format
    item.reorderThreshold.toString(),
    item.status
  ]);

  // Combine headers and rows
  const csvContent = [
    headers,
    ...rows
  ].map(row =>
    row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = `${data.organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_inventory_${timestamp}.csv`;

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}