/**
 * Payroll Calculation Utilities
 * 
 * Functions for calculating earnings, taxes, and splits
 */

/**
 * Calculates net income from farming amount and rate
 * 
 * Logic:
 * 1. Calculate gross income: (amountFarmed / rateUnit) * rate
 * 2. Calculate net income: grossIncome / 2 (50/50 split)
 * 
 * @param amountFarmed - The amount farmed in game currency units
 * @param rate - The currency rate (price per rateUnit)
 * @param rateUnit - The unit of currency the rate applies to (default: 1,000,000)
 * @returns The net income after 50/50 split
 * 
 * @example
 * calculateNetIncome(5000000, 50, 1000000) // Returns 125 (5000000/1000000 * 50 / 2)
 * calculateNetIncome(5000, 100, 1000) // Returns 250 (5000/1000 * 100 / 2)
 */
export function calculateNetIncome(amountFarmed: number, rate: number, rateUnit: number = 1_000_000): number {
  if (amountFarmed < 0 || rate < 0 || rateUnit <= 0) {
    throw new Error("Amount farmed, rate, and rate unit must be non-negative numbers (rate unit must be > 0)");
  }

  // Calculate gross income: (amount / rateUnit) * rate
  const grossIncome = (amountFarmed / rateUnit) * rate;

  // Calculate net income: 50/50 split
  const netIncome = grossIncome / 2;

  // Round to 2 decimal places for currency
  return Math.round(netIncome * 100) / 100;
}

/**
 * Calculates gross income before the split
 * 
 * @param amountFarmed - The amount farmed
 * @param rate - The currency rate
 * @param rateUnit - The unit of currency the rate applies to (default: 1,000,000)
 * @returns The gross income before split
 */
export function calculateGrossIncome(amountFarmed: number, rate: number, rateUnit: number = 1_000_000): number {
  if (amountFarmed < 0 || rate < 0 || rateUnit <= 0) {
    throw new Error("Amount farmed, rate, and rate unit must be non-negative numbers (rate unit must be > 0)");
  }

  const grossIncome = (amountFarmed / rateUnit) * rate;
  return Math.round(grossIncome * 100) / 100;
}

/**
 * Format currency value for display
 * 
 * @param value - The number to format
 * @param currency - The currency code (default: IDR)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
