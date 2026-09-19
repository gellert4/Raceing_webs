// Authoritative server catalog. Browser amounts are never accepted.
export const catalog = {
  1: { name: "STATE 01 HEAVY TEE", huf: 16990, sizes: ["S", "M", "L", "XL", "XXL"] },
  2: { name: "47°N DIVISION HOODIE", huf: 32990, sizes: ["S", "M", "L", "XL", "XXL"] },
  4: { name: "EUROPEAN DIVISION JET TAG", huf: 4490, sizes: ["ONE SIZE"] },
};
export function priceCart(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 15) throw new Error("cart");
  const keys = new Set<string>();
  const lines = input.map(row => {
    if (!row || typeof row !== "object" || !Number.isInteger(row.id) || !Object.hasOwn(catalog, row.id)) throw new Error("product");
    const p = catalog[row.id as keyof typeof catalog];
    if (!p.sizes.includes(row.size) || !Number.isInteger(row.qty) || row.qty < 1 || row.qty > 5) throw new Error("quantity_or_size");
    const key = `${row.id}:${row.size}`;
    if (keys.has(key)) throw new Error("duplicate");
    keys.add(key);
    return { id: row.id as number, size: row.size as string, qty: row.qty as number, name: p.name, unit: p.huf * 100 };
  });
  if (lines.reduce((s, l) => s + l.qty, 0) > 10) throw new Error("limit");
  return { lines, subtotal: lines.reduce((s, l) => s + l.unit * l.qty, 0) };
}
