export type CartItem = { id: number; size: string; qty: number };
export function sanitizeCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const valid: CartItem[] = [];
  for (const row of input.slice(0, 30)) {
    if (!row || typeof row !== "object") continue;
    const { id, size, qty } = row;
    if (![1, 2, 4].includes(id) || !Number.isInteger(qty) || qty < 1 || qty > 10) continue;
    if (!(id === 4 ? size === "ONE SIZE" : ["S", "M", "L", "XL", "XXL"].includes(size))) continue;
    const existing = valid.find(item => item.id === id && item.size === size);
    if (existing) existing.qty = Math.min(10, existing.qty + qty);
    else valid.push({ id, size, qty });
  }
  return valid;
}
