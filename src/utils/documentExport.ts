import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quarter, TaxpayerProfile, Transaction } from '../types/index.ts';
import { formatPHP, QUARTER_DETAILS } from './formatters.ts';

interface ExportJournalOptions {
  transactions: Transaction[];
  quarter: Quarter;
  year: number;
  taxpayer: TaxpayerProfile;
  emptyRowCount?: number;
  viewScope?: 'quarter' | 'year';
}

/**
 * Direct client-side A4 Landscape PDF Export for official BIR Cash Receipts Journal.
 * Generates crisp vector PDF without relying on window.print().
 * Filename format: Kuentas_Cash_Receipts_Journal_Q[Quarter].pdf
 */
export function exportJournalToPDF({
  transactions,
  quarter,
  year,
  taxpayer,
  emptyRowCount = 5,
  viewScope = 'quarter',
}: ExportJournalOptions): void {
  // A4 Landscape: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const quarterInfo = QUARTER_DETAILS[quarter];
  const activeTransactions =
    viewScope === 'quarter'
      ? transactions.filter((t) => t.quarter === quarter)
      : [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  const totalDebit = activeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCredit = totalDebit;

  const periodCoveredText =
    viewScope === 'quarter'
      ? `${quarterInfo.name} (${quarterInfo.period}, ${year})`
      : `Taxable Calendar Year ${year} (Full Ledger)`;

  // --- Document Header ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'REPUBLIC OF THE PHILIPPINES · BUREAU OF INTERNAL REVENUE',
    148.5,
    12,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('CASH RECEIPTS JOURNAL', 148.5, 18, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(
    '(Prescribed for Taxpayers subject to 8% Income Tax Rate under RA No. 10963 / TRAIN Law)',
    148.5,
    22.5,
    { align: 'center' }
  );

  // --- Taxpayer Information Box ---
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(14, 25, 273, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);

  // Left column
  doc.text(`TAXPAYER NAME: ${taxpayer.taxpayerName || 'JUAN DELA CRUZ'}`, 14, 29);
  doc.text(`REGISTERED ADDRESS: ${taxpayer.registeredAddress || 'N/A'}`, 14, 33);
  doc.text(`LINE OF BUSINESS: ${taxpayer.lineOfBusiness || 'Professional Services'}`, 14, 37);

  // Right column
  doc.text(`TIN: ${taxpayer.tin || '000-000-000-000'}`, 165, 29);
  doc.text(`RDO / DISTRICT: ${taxpayer.rdo || 'RDO 044'}`, 165, 33);
  doc.text(`PERIOD COVERED: ${periodCoveredText}`, 165, 37);

  doc.line(14, 39, 273, 39);

  // --- Prepare Table Data ---
  const bodyRows: any[] = [];

  activeTransactions.forEach((txn) => {
    bodyRows.push([
      txn.date,
      txn.reference,
      txn.payor + (txn.notes ? `\n(${txn.notes})` : ''),
      formatPHP(txn.amount, { showSymbol: false }),
      formatPHP(txn.amount, { showSymbol: false }),
    ]);
  });

  // Empty placeholder rows to simulate physical columnar notebooks
  const placeholdersToAdd = Math.max(emptyRowCount, 5);
  for (let i = 0; i < placeholdersToAdd; i++) {
    bodyRows.push(['', '', '', '—', '—']);
  }

  // Grand Totals Footer row (uses 'PHP' prefix instead of raw ₱ to prevent ± glyph rendering errors)
  const footRow = [
    { content: 'TOTALS CARRIED FORWARD (BALANCED):', colSpan: 3, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `PHP ${formatPHP(totalDebit, { showSymbol: false })}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `PHP ${formatPHP(totalCredit, { showSymbol: false })}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
  ];

  autoTable(doc, {
    startY: 42,
    margin: { left: 14, right: 24, bottom: 35 }, // 24mm right margin (+10mm padding to keep borders comfortably away from edge)
    head: [
      [
        { content: 'DATE', styles: { halign: 'center' as const } },
        { content: 'INVOICE / OR / REF #', styles: { halign: 'center' as const } },
        { content: 'PAYOR NAME / DESCRIPTION / PARTICULARS', styles: { halign: 'left' as const } },
        { content: 'DEBIT (PHP)\nCash on Hand / In Bank', styles: { halign: 'right' as const } },
        { content: 'CREDIT (PHP)\nProfessional / Service Income', styles: { halign: 'right' as const } },
      ],
    ],
    body: bodyRows,
    foot: [footRow],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 30, 30],
      lineColor: [50, 50, 50],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [240, 243, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.4,
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 38, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 42, halign: 'right' },
      4: { cellWidth: 42, halign: 'right' },
    },
  });

  // --- Perjury Declaration & Signature Block at Bottom ---
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  const startSigY = Math.min(finalY + 8, 175);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text(
    '"I declare, under penalties of perjury, that this Cash Receipts Journal has been made in good faith, verified by me, and to the best of my knowledge and belief, is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended."',
    14,
    startSigY,
    { maxWidth: 259 }
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Date Verified: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, startSigY + 14);

  // Taxpayer signature line
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.line(190, startSigY + 12, 273, startSigY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(taxpayer.taxpayerName || 'JUAN DELA CRUZ', 231.5, startSigY + 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Taxpayer / Authorized Representative Signature', 231.5, startSigY + 19.5, { align: 'center' });

  // Filename format: Kuentas_Cash_Receipts_Journal_Q[Quarter].pdf
  const filename = `Kuentas_Cash_Receipts_Journal_Q${quarter}.pdf`;
  doc.save(filename);
}

/**
 * Client-side Word (.DOC) Export for official BIR Cash Receipts Journal.
 * Generates an editable Word-compatible document formatted in landscape orientation with full table.
 */
export function exportJournalToDOC({
  transactions,
  quarter,
  year,
  taxpayer,
  emptyRowCount = 5,
  viewScope = 'quarter',
}: ExportJournalOptions): void {
  const quarterInfo = QUARTER_DETAILS[quarter];
  const activeTransactions =
    viewScope === 'quarter'
      ? transactions.filter((t) => t.quarter === quarter)
      : [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  const totalDebit = activeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCredit = totalDebit;

  const periodCoveredText =
    viewScope === 'quarter'
      ? `${quarterInfo.name} (${quarterInfo.period}, ${year})`
      : `Taxable Calendar Year ${year} (Full Ledger)`;

  // Generate table rows HTML
  const rowsHtml = activeTransactions
    .map(
      (txn) => `
    <tr>
      <td style="text-align: center; font-family: monospace;">${txn.date}</td>
      <td style="text-align: center; font-family: monospace;">${txn.reference}</td>
      <td><strong>${escapeHtml(txn.payor)}</strong>${txn.notes ? `<br><small style="color: #555;">${escapeHtml(txn.notes)}</small>` : ''}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatPHP(txn.amount, { showSymbol: false })}</td>
      <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatPHP(txn.amount, { showSymbol: false })}</td>
    </tr>`
    )
    .join('\n');

  // Generate placeholder rows
  let emptyRowsHtml = '';
  for (let i = 0; i < Math.max(emptyRowCount, 5); i++) {
    emptyRowsHtml += `
    <tr style="height: 24px;">
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td style="text-align: right; color: #ccc;">—</td>
      <td style="text-align: right; color: #ccc;">—</td>
    </tr>`;
  }

  // Construct official Word document template
  const docHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset='utf-8'>
    <title>Cash Receipts Journal - ${quarter}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page Section1 {
        size: 841.9pt 595.3pt;
        mso-page-orientation: landscape;
        margin: 0.5in 0.5in 0.5in 0.5in;
        mso-header-margin: 0.3in;
        mso-footer-margin: 0.3in;
      }
      div.Section1 {
        page: Section1;
        font-family: Arial, sans-serif;
      }
      h1 {
        text-align: center;
        font-size: 16pt;
        margin: 2px 0;
        text-transform: uppercase;
        color: #111;
      }
      .subhead {
        text-align: center;
        font-size: 9pt;
        color: #555;
        margin: 2px 0 12px 0;
        font-style: italic;
      }
      .meta-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
        font-size: 9pt;
      }
      .meta-table td {
        padding: 3px 5px;
        border: none;
      }
      .journal-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
      }
      .journal-table th, .journal-table td {
        border: 1px solid #000000;
        padding: 5px 6px;
      }
      .journal-table th {
        background-color: #f1f5f9;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 8pt;
      }
      .footer-totals {
        background-color: #f8fafc;
        font-weight: bold;
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
      }
      .certification {
        margin-top: 24px;
        font-size: 8.5pt;
        color: #444;
      }
      .sig-line {
        border-top: 1px solid #000;
        width: 250px;
        text-align: center;
        margin-top: 30px;
        padding-top: 4px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="Section1">
      <div style="text-align: center; font-size: 8pt; letter-spacing: 2px; color: #666; text-transform: uppercase;">
        Republic of the Philippines · Bureau of Internal Revenue
      </div>
      <h1>Cash Receipts Journal</h1>
      <div class="subhead">
        (Prescribed for Taxpayers subject to 8% Income Tax Rate under RA No. 10963 / TRAIN Law)
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 55%;"><strong>TAXPAYER NAME:</strong> ${escapeHtml(taxpayer.taxpayerName || 'JUAN DELA CRUZ')}</td>
          <td style="width: 45%;"><strong>TIN:</strong> ${escapeHtml(taxpayer.tin || '000-000-000-000')}</td>
        </tr>
        <tr>
          <td><strong>REGISTERED ADDRESS:</strong> ${escapeHtml(taxpayer.registeredAddress || 'N/A')}</td>
          <td><strong>RDO / DISTRICT:</strong> ${escapeHtml(taxpayer.rdo || 'RDO 044')}</td>
        </tr>
        <tr>
          <td><strong>LINE OF BUSINESS:</strong> ${escapeHtml(taxpayer.lineOfBusiness || 'Professional Services')}</td>
          <td><strong>PERIOD COVERED:</strong> ${escapeHtml(periodCoveredText)}</td>
        </tr>
      </table>

      <table class="journal-table">
        <thead>
          <tr>
            <th style="width: 10%; text-align: center;">Date</th>
            <th style="width: 15%; text-align: center;">Invoice / OR / Ref #</th>
            <th style="width: 45%; text-align: left;">Payor Name / Description / Particulars</th>
            <th style="width: 15%; text-align: right;">DEBIT (PHP)<br><span style="font-size: 7pt; font-weight: normal;">Cash on Hand / In Bank</span></th>
            <th style="width: 15%; text-align: right;">CREDIT (PHP)<br><span style="font-size: 7pt; font-weight: normal;">Service Income</span></th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          ${emptyRowsHtml}
          <tr class="footer-totals">
            <td colspan="3" style="text-align: right; font-weight: bold;">TOTALS CARRIED FORWARD (BALANCED):</td>
            <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatPHP(totalDebit)}</td>
            <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatPHP(totalCredit)}</td>
          </tr>
        </tbody>
      </table>

      <div class="certification">
        <p style="font-style: italic; margin-top: 15px;">
          "I declare, under penalties of perjury, that this Cash Receipts Journal has been made in good faith, verified by me, and to the best of my knowledge and belief, is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended."
        </p>

        <table style="width: 100%; margin-top: 25px; border: none;">
          <tr>
            <td style="vertical-align: bottom; border: none; font-size: 8pt;">
              <strong>Date Verified:</strong> ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
            <td style="text-align: right; border: none;">
              <div style="display: inline-block; text-align: center;">
                <div class="sig-line">
                  ${escapeHtml(taxpayer.taxpayerName || 'JUAN DELA CRUZ')}
                </div>
                <div style="font-size: 7pt; color: #666; text-transform: uppercase;">
                  Taxpayer / Authorized Representative Signature
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </body>
  </html>`;

  // Create Blob with proper Word MIME type
  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const filename = `Kuentas_Cash_Receipts_Journal_Q${quarter}.doc`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sandbox-resilient print trigger.
 * If window.print() is blocked by an iframe sandbox lacking allow-modals,
 * falls back gracefully by opening the printable ledger in a clean new tab
 * and triggering print there, or offering instant PDF download.
 */
export function triggerSandboxResilientPrint(
  printContainerHtml: string,
  taxpayerName: string,
  periodText: string,
  onFallbackToPDF: () => void
): void {
  try {
    // Attempt standard print first
    window.print();
  } catch (err: any) {
    console.warn('Standard window.print() was blocked or threw an error:', err);

    // Fallback: Attempt opening printable content in a clean new browser tab
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow && !printWindow.closed) {
        const fullDoc = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cash Receipts Journal - ${periodText}</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 10px; color: #000; background: #fff; }
            .journal-print-container { width: 100%; }
            table { width: 100%; border-collapse: collapse; font-size: 9pt; }
            th, td { border: 1px solid #000; padding: 5px 8px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .print\\:hidden, button, nav { display: none !important; }
          </style>
        </head>
        <body>
          ${printContainerHtml}
          <script>
            window.onload = function() {
              window.focus();
              try { window.print(); } catch(e) { console.error(e); }
            };
          </script>
        </body>
        </html>`;

        printWindow.document.open();
        printWindow.document.write(fullDoc);
        printWindow.document.close();
      } else {
        // If popup blocker blocked window.open, trigger direct PDF export fallback
        onFallbackToPDF();
      }
    } catch {
      // In strict sandboxes where window.open also throws, fallback directly to PDF export
      onFallbackToPDF();
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
