import { CSVColumnMapping, CSVPreviewData, Quarter, Transaction } from '../types/index.ts';
import { getQuarterFromDate, parseCleanNumber } from './formatters.ts';

/**
 * Robust RFC 4180 client-side CSV string tokenizer without external dependencies.
 * Handles multiline quoted values, commas inside quotes, and escaped quotes ("").
 */
export function parseCSVText(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  let cleanContent = csvContent;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    cleanContent = cleanContent.slice(1);
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      currentRow.push(currentField.trim());
      // Only push non-empty rows
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push final field/row if any
  currentRow.push(currentField.trim());
  if (currentRow.some((f) => f.length > 0)) {
    lines.push(currentRow);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // First line is headers
  const headers = lines[0].map((h, idx) => h.trim() || `Column_${idx + 1}`);
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowData = lines[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = rowData[colIdx] !== undefined ? rowData[colIdx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Intelligent detector for CSV columns based on common Philippine freelancer
 * exports (Wise, PayPal, Payoneer, BDO, BPI, UnionBank, GCash, Upwork).
 */
export function guessColumnMapping(headers: string[]): CSVColumnMapping {
  const findMatch = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = headers.find((h) => pattern.test(h.toLowerCase()));
      if (match) return match;
    }
    return '';
  };

  const dateCol =
    findMatch([
      /^date$/i,
      /txn\s*date/i,
      /trans.*date/i,
      /booking.*date/i,
      /posting.*date/i,
      /time/i,
      /date/i,
    ]) || headers[0] || '';

  const payorCol =
    findMatch([
      /payor/i,
      /client/i,
      /customer/i,
      /description/i,
      /particular/i,
      /name/i,
      /sender/i,
      /merchant/i,
      /source/i,
      /details/i,
    ]) || (headers.length > 1 ? headers[1] : headers[0]) || '';

  const refCol =
    findMatch([
      /invoice/i,
      /inv/i,
      /or\s*#/i,
      /or\s*number/i,
      /official\s*receipt/i,
      /reference/i,
      /ref/i,
      /txn\s*id/i,
      /transaction\s*id/i,
      /check\s*#/i,
      /id$/i,
      /order\s*id/i,
    ]) || (headers.length > 2 ? headers[2] : '') || '';

  const amountCol =
    findMatch([
      /gross/i,
      /amount/i,
      /credit/i,
      /inflow/i,
      /total/i,
      /received/i,
      /net/i,
      /value/i,
    ]) || (headers.length > 3 ? headers[3] : '') || '';

  return {
    dateColumn: dateCol,
    payorColumn: payorCol,
    refColumn: refCol,
    amountColumn: amountCol,
  };
}

/**
 * Standardize various date formats into YYYY-MM-DD
 */
export function normalizeDate(rawDate: string): string {
  if (!rawDate) {
    return new Date().toISOString().split('T')[0];
  }

  const clean = rawDate.trim();

  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Check for YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(clean)) {
    const parts = clean.split('/');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }

  // Check for MM/DD/YYYY or DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const parts = clean.split('/');
    // Assume standard MM/DD/YYYY
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parts[2];
    if (month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      // DD/MM/YYYY
      return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
    }
  }

  // Fallback to JS Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Default to today if unparseable
  return new Date().toISOString().split('T')[0];
}

/**
 * Convert parsed CSV rows into typed Transactions based on column mapping
 */
export function convertRowsToTransactions(
  rows: Record<string, string>[],
  mapping: CSVColumnMapping,
  targetQuarter?: Quarter
): Transaction[] {
  const result: Transaction[] = [];

  rows.forEach((row, index) => {
    const rawDate = row[mapping.dateColumn] || '';
    const date = normalizeDate(rawDate);
    const payor = (row[mapping.payorColumn] || '').trim() || 'Undisclosed Payor';
    const reference = (row[mapping.refColumn] || '').trim() || `CSV-IMP-${index + 1}`;
    const rawAmount = row[mapping.amountColumn];
    const amount = parseCleanNumber(rawAmount);

    // Skip zero or empty rows if all primary fields are empty
    if (!payor && !reference && amount === 0) {
      return;
    }

    const quarter = targetQuarter || getQuarterFromDate(date);

    result.push({
      id: `txn_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      payor,
      reference,
      amount: Math.abs(amount),
      quarter,
      notes: mapping.notesColumn ? row[mapping.notesColumn] : undefined,
      category: 'Professional Services',
      createdAt: Date.now() + index,
    });
  });

  return result;
}
