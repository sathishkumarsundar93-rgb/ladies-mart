"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: number; name: string; cat: string; price: number; old: number; image: string; size: string; qty: number };
type NewItem = Omit<CartItem, "size" | "qty">;
type Cart = {
  items: CartItem[]; count: number; subtotal: number; shipping: number; total: number;
  add: (p: NewItem, size?: string) => void;
  setQty: (id: number, size: string, qty: number) => void;
  remove: (id: number, size: string) => void;
  clear: () => void;
};

export const FREE_SHIPPING_MIN = 999;
export const SHIPPING_FEE = 60; // placeholder, replace with courier rate later
const KEY = "ladies-mart-cart-v1";
const Ctx = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const same = (a: CartItem, id: number, size: string) => a.id === id && a.size === size;
  const add: Cart["add"] = (p, size = "M") =>
    setItems((old) => old.some((i) => same(i, p.id, size))
      ? old.map((i) => same(i, p.id, size) ? { ...i, qty: i.qty + 1 } : i)
      : [...old, { ...p, size, qty: 1 }]);
  const setQty: Cart["setQty"] = (id, size, qty) =>
    setItems((old) => qty < 1 ? old.filter((i) => !same(i, id, size)) : old.map((i) => same(i, id, size) ? { ...i, qty } : i));
  const remove: Cart["remove"] = (id, size) => setItems((old) => old.filter((i) => !same(i, id, size)));
  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  return <Ctx.Provider value={{ items, count, subtotal, shipping, total: subtotal + shipping, add, setQty, remove, clear }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
