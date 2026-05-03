// Shopify dev store reports prices in USD but the numeric values are already INR-scale
// (e.g., $349 for a sunscreen). We treat them as INR and just change the symbol to ₹.
// If your store is in real USD, set CONVERT_USD_TO_INR = true.
export const CONVERT_USD_TO_INR = false;
export const USD_TO_INR = 83;

export function formatINR(amount: number | string, currency = "USD"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return "₹—";
  let inr: number;
  if (currency === "INR") inr = n;
  else if (CONVERT_USD_TO_INR) inr = n * USD_TO_INR;
  else inr = n; // treat USD numeric as INR (Shopify dev store)
  return "₹" + Math.round(inr).toLocaleString("en-IN");
}
