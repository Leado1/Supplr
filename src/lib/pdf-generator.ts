import jsPDF from "jspdf";
import "jspdf-autotable";

// Type declaration for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
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

// Helper function to convert image to base64
function getImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateInventoryPDF(data: ReportData): Promise<void> {
  try {
    const doc = new jsPDF();

    // Try to load the logo once at the beginning
    let logoBase64: string | null = null;
    try {
      logoBase64 = await getImageAsBase64('/images/s2.png');
    } catch (error) {
      console.warn('Could not load logo for PDF:', error);
    }

  // Modern black and white color palette with strategic color accents
  const black: [number, number, number] = [0, 0, 0]; // Pure black
  const darkGray: [number, number, number] = [55, 55, 55]; // Dark gray
  const mediumGray: [number, number, number] = [128, 128, 128]; // Medium gray
  const lightGray: [number, number, number] = [245, 245, 245]; // Light background
  const white: [number, number, number] = [255, 255, 255]; // Pure white

  // Strategic colors for status/meaning only
  const dangerColor: [number, number, number] = [220, 38, 38]; // Red for negative/expired
  const warningColor: [number, number, number] = [217, 119, 6]; // Amber for warning
  const successColor: [number, number, number] = [22, 163, 74]; // Green for positive/money

  // Clean white header with subtle gray border
  doc.setFillColor(white[0], white[1], white[2]);
  doc.rect(0, 0, 210, 50, 'F');

  // Add clean border line
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(1);
  doc.line(0, 50, 210, 50);

  // Add Supplr logo to header - larger and better positioned with proper aspect ratio
  if (logoBase64) {
    // Add the logo to the PDF (larger size with better aspect ratio to prevent squishing)
    doc.addImage(logoBase64, 'PNG', 20, 8, 45, 30); // x, y, width, height - wider and less tall to prevent squishing

    // Adjust text to align properly with logo and avoid cutting off
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Report', 70, 20);

    // Subtitle next to logo - aligned with title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Medical Inventory Management', 70, 28);

    // Clean separator line under title
    doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setLineWidth(0.5);
    doc.line(70, 32, 190, 32);
  } else {
    // Fallback to clean text logo if image loading fails
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Supplr', 20, 20);

    // Clean accent mark
    doc.setFillColor(black[0], black[1], black[2]);
    doc.circle(85, 17, 1.5, 'F');

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Medical Inventory Management', 20, 30);

    // Report title
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Report', 20, 42);
  }


  // Organization info box - clean white with black borders
  doc.setFillColor(white[0], white[1], white[2]);
  doc.rect(140, 8, 65, 35, 'F');
  doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
  doc.setLineWidth(0.8);
  doc.rect(140, 8, 65, 35, 'S');

  // Organization details
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Organization', 143, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.organizationName, 143, 25);

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Generated', 143, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(currentDate, 143, 38);

  let yPosition = 65;

  // Summary section with clean black and white design
  if (data.summary) {
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 5;

    // Add clean line under title
    doc.setDrawColor(black[0], black[1], black[2]);
    doc.setLineWidth(1.5);
    doc.line(20, yPosition, 85, yPosition);
    yPosition += 15;

    // Modern summary cards with better formatting
    const summaryData = [
      ['Total Items', data.summary.totalItems.toString(), '#6B7280'],
      ['Total Value', `$${data.summary.totalValue.toFixed(2)}`, '#059669'],
      ['Expired Items', data.summary.expired.toString(), data.summary.expired > 0 ? '#DC2626' : '#6B7280'],
      ['Expiring Soon', data.summary.expiringSoon.toString(), data.summary.expiringSoon > 0 ? '#D97706' : '#6B7280'],
      ['Low Stock Items', data.summary.lowStock.toString(), data.summary.lowStock > 0 ? '#EA580C' : '#6B7280'],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData.map(([metric, value]) => [metric, value]),
      theme: 'grid',
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: 'bold',
        fontSize: 12,
        cellPadding: { top: 10, bottom: 10, left: 15, right: 15 }
      },
      bodyStyles: {
        fontSize: 11,
        cellPadding: { top: 8, bottom: 8, left: 15, right: 15 },
        textColor: black
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80, textColor: black },
        1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data: any) {
        // Clean borders
        if (data.row.index >= 0) {
          data.cell.styles.lineWidth = 0.5;
          data.cell.styles.lineColor = mediumGray;

          // Strategic color coding for values only where it adds meaning
          if (data.column.index === 1 && data.row.index >= 0) {
            const rowData = summaryData[data.row.index];
            if (rowData && rowData[2]) {
              const colorCode = rowData[2];
              if (colorCode === '#DC2626') data.cell.styles.textColor = dangerColor; // Red for expired
              else if (colorCode === '#D97706') data.cell.styles.textColor = warningColor; // Amber for expiring
              else if (colorCode === '#EA580C') data.cell.styles.textColor = warningColor; // Orange for low stock
              else if (colorCode === '#059669') data.cell.styles.textColor = successColor; // Green for money/value
              else data.cell.styles.textColor = black;
            }
          }
        }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Clean filters section
  if (data.filters && (data.filters.status !== 'all' || data.filters.category !== 'all' || data.filters.search)) {
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Applied Filters', 20, yPosition);
    yPosition += 5;

    // Add clean line
    doc.setDrawColor(black[0], black[1], black[2]);
    doc.setLineWidth(1);
    doc.line(20, yPosition, 70, yPosition);
    yPosition += 15;

    const filters = [];
    if (data.filters.status && data.filters.status !== 'all') {
      filters.push(['Status', data.filters.status]);
    }
    if (data.filters.category && data.filters.category !== 'all') {
      filters.push(['Category', data.filters.category]);
    }
    if (data.filters.search) {
      filters.push(['Search Term', data.filters.search]);
    }

    if (filters.length > 0) {
      // Create clean filter box
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, yPosition - 5, 170, (filters.length * 10) + 10, 'F');
      doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.setLineWidth(0.8);
      doc.rect(20, yPosition - 5, 170, (filters.length * 10) + 10, 'S');

      let filterY = yPosition + 5;
      filters.forEach(([label, value]) => {
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 25, filterY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(value, 70, filterY);
        filterY += 10;
      });

      yPosition += (filters.length * 10) + 15;
    }
  }

  // Clean inventory table section
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory Details', 20, yPosition);
  yPosition += 5;

  // Add clean line
  doc.setDrawColor(black[0], black[1], black[2]);
  doc.setLineWidth(1.5);
  doc.line(20, yPosition, 90, yPosition);
  yPosition += 15;

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

  // Create the clean main table
  doc.autoTable({
    startY: yPosition,
    head: [['Product Name', 'SKU', 'Category', 'Qty', 'Unit Cost', 'Expires', 'Reorder', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: black,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }, // reduced padding for more space
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, // reduced padding for more space
      textColor: black,
      lineWidth: 0.5,
      lineColor: mediumGray
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' }, // Name - wider but fits page
      1: { cellWidth: 20, halign: 'center', fontSize: 8 }, // SKU
      2: { cellWidth: 30, halign: 'center' }, // Category - wider
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Quantity
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Unit Cost - wider
      5: { cellWidth: 25, halign: 'center', fontSize: 8 }, // Expiration - wider
      6: { cellWidth: 18, halign: 'center' }, // Reorder
      7: { cellWidth: 22, halign: 'center', fontStyle: 'bold', fontSize: 8 } // Status - wider
    },
    didParseCell: function(data: any) {
      // Strategic status styling - only use color where it adds clear meaning
      if (data.column.index === 7 && data.row.index >= 0) {
        const status = data.cell.text[0].toLowerCase();
        if (status === 'expired') {
          data.cell.styles.fillColor = [255, 245, 245]; // Very light red
          data.cell.styles.textColor = dangerColor; // Red text
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'expiring_soon') {
          data.cell.styles.fillColor = [255, 251, 235]; // Very light amber
          data.cell.styles.textColor = warningColor; // Amber text
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'low_stock') {
          data.cell.styles.fillColor = [255, 247, 237]; // Very light orange
          data.cell.styles.textColor = warningColor; // Orange text
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'ok') {
          data.cell.styles.fillColor = white; // Keep white for OK status
          data.cell.styles.textColor = black; // Black text for neutral
        }
      }

      // Clean alternate row styling
      if (data.row.index >= 0 && data.row.index % 2 === 0) {
        if (data.column.index !== 7) { // Don't override status column colors
          data.cell.styles.fillColor = lightGray;
        }
      }

      // Make product names stand out with bold
      if (data.column.index === 0 && data.row.index >= 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = black;
      }

      // Style unit costs with green (money = positive)
      if (data.column.index === 4 && data.row.index >= 0) {
        data.cell.styles.textColor = successColor; // Green for money
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 8, right: 8 }, // minimal margins to maximize table space
    pageBreak: 'auto',
    showHead: 'everyPage'
  });

  // Clean footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Clean white footer with top border
    doc.setFillColor(white[0], white[1], white[2]);
    doc.rect(0, 280, 210, 17, 'F');

    // Footer border line
    doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setLineWidth(0.8);
    doc.line(0, 280, 210, 280);

    // Supplr branding with larger logo in footer
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 20, 283, 15, 10); // Larger logo in footer with better aspect ratio

      doc.setTextColor(black[0], black[1], black[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Supplr', 35, 291);
    } else {
      // Fallback to text only
      doc.setTextColor(black[0], black[1], black[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Supplr', 20, 291);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Medical Inventory Management', 20, 295);

    // Website
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('www.supplr.net', 90, 291);

    // Page numbers in clean style
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Page ${i} of ${pageCount}`, 175, 291);

    // Generation timestamp
    doc.setFontSize(8);
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${timestamp}`, 140, 295);
  }

  // Add item count summary before saving
  if (data.items.length > 0) {
    doc.setPage(1); // Go to first page
    doc.setTextColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Report contains ${data.items.length} inventory item${data.items.length === 1 ? '' : 's'}`, 20, 57);
  }

  // Generate professional filename
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const orgName = data.organizationName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const filename = `Supplr_Inventory_Report_${orgName}_${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
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