import { Quarter, QuarterInfo } from '../types/index.ts';

export const QUARTER_DETAILS: Record<Quarter, QuarterInfo> = {
  Q1: {
    quarter: 'Q1',
    name: '1st Quarter',
    period: 'Jan 1 – Mar 31',
    months: 'January, February, March',
    ebirFormDeadline: 'May 15',
    birForm: 'BIR Form 1701Q (Q1)',
  },
  Q2: {
    quarter: 'Q2',
    name: '2nd Quarter',
    period: 'Apr 1 – Jun 30',
    months: 'April, May, June',
    ebirFormDeadline: 'August 15',
    birForm: 'BIR Form 1701Q (Q2)',
  },
  Q3: {
    quarter: 'Q3',
    name: '3rd Quarter',
    period: 'Jul 1 – Sep 30',
    months: 'July, August, September',
    ebirFormDeadline: 'November 15',
    birForm: 'BIR Form 1701Q (Q3)',
  },
  Q4: {
    quarter: 'Q4',
    name: 'Q4 / Annual Reconciliation (Form 1701A - Due April 15)',
    period: 'Oct 1 – Dec 31 (Full Year Summary)',
    months: 'October, November, December',
    ebirFormDeadline: 'April 15 (Next Year)',
    birForm: 'BIR Form 1701A (Annual Income Tax Return)',
  },
};

/**
 * Format a number as Philippine Peso: ₱ 1,234,567.89
 */
export function formatPHP(
  amount: number | undefined | null,
  options: { showSymbol?: boolean; showCents?: boolean; fallbackZeroDash?: boolean } = {}
): string {
  const { showSymbol = true, showCents = true, fallbackZeroDash = false } = options;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;

  if (fallbackZeroDash && Math.abs(num) < 0.001) {
    return showSymbol ? '₱ —' : '—';
  }

  const formatted = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(num);

  return showSymbol ? `₱ ${formatted}` : formatted;
}

/**
 * Cleanly parse an input string to positive float number
 */
export function parseCleanNumber(input: string | number | undefined | null): number {
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : Math.max(0, input);
  }
  if (!input) return 0;
  // Strip currency symbols, commas, spaces
  const cleaned = input.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Determine Quarter from YYYY-MM-DD or parseable date string
 */
export function getQuarterFromDate(dateString: string): Quarter {
  if (!dateString) return 'Q1';
  const parts = dateString.split('-');
  let month = 1;

  if (parts.length >= 2) {
    month = parseInt(parts[1], 10);
  } else {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      month = d.getMonth() + 1;
    }
  }

  if (month >= 1 && month <= 3) return 'Q1';
  if (month >= 4 && month <= 6) return 'Q2';
  if (month >= 7 && month <= 9) return 'Q3';
  return 'Q4';
}

/**
 * Format ISO date string into readable Philippine format (e.g., 2026-03-15 -> Mar 15, 2026)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${parseInt(day, 10)}, ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Copy string to clipboard with navigator API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    textArea.remove();
    return success;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
