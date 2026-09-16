import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCart } from "../lib/cart.ts";
test("reject malformed and obsolete cart rows", () => {
  assert.deepEqual(sanitizeCart(null), []);
  assert.deepEqual(sanitizeCart([{id:3,size:"M",qty:1},{id:1,size:"BAD",qty:1},{id:1,size:"M",qty:-2},{id:1,size:"M",qty:1.5}]), []);
});
test("accept known products and merge duplicates with a cap", () => {
  assert.deepEqual(sanitizeCart([{id:2,size:"XL",qty:6},{id:2,size:"XL",qty:8},{id:4,size:"ONE SIZE",qty:1}]), [{id:2,size:"XL",qty:10},{id:4,size:"ONE SIZE",qty:1}]);
});
