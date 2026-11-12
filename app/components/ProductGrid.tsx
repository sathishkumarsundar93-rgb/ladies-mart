"use client";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useProducts, type Product } from "./useProducts";
import { ShoppingCart, Star } from "lucide-react";
import { imageUrl } from "../../lib/image";

export type Sort = "popular" | "low" | "high" | "discount" | "new";
export type PriceRange = "all" | "u500" | "500" | "1000";

const inRange = (p: number, r: PriceRange) =>
  r === "all" || (r === "u500" && p < 500) || (r === "500" && p >= 500 && p < 1000) || (r === "1000" && p >= 1000);

const order: Record<Sort, ((a: Product, b: Product) => number) | null> = {
  popular: null,
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
  discount: (a, b) => b.old / b.price - a.old / a.price,
  new: (a, b) => b.id - a.id,
};

type Props = { ids?: number[]; category?: string; q?: string; sort?: Sort; price?: PriceRange };

export default function ProductGrid({ ids, category, q = "", sort = "popular", price = "all" }: Props) {
  const { add } = useCart();
  const { products: data } = useProducts();
  const term = q.trim().toLowerCase();
  const items = data.filter((p) =>
    (!ids || ids.includes(p.id)) &&
    (!category || category === "All" || p.cat === category) &&
    (!term || p.name.toLowerCase().includes(term) || p.cat.toLowerCase().includes(term)) &&
    inRange(p.price, price));
  const cmp = order[sort];
  if (cmp) items.sort(cmp);

  if (items.length === 0) return <p className="muted">No products found. Try another search or filter.</p>;

  return <div className="inner-product-grid">{items.map((p) => {
    const out = p.stock !== undefined && p.stock <= 0;
    return <article className="inner-product-card" key={p.id}>
      <Link href={`/products/${p.id}`}><img src={imageUrl(p.image, 600)} alt={p.name} style={out ? { opacity: 0.55 } : undefined} /></Link>
      <span className="inner-discount">{out ? "Sold out" : p.off}</span>
      <div className="inner-product-info"><small>{p.cat}</small><Link href={`/products/${p.id}`}><b>{p.name}</b></Link>
        <div className="inner-price">₹{p.price} <del>₹{p.old}</del></div>
        <div className="inner-rating"><Star size={13} fill="currentColor" /> 4.8 rating</div>
        <button disabled={out} style={out ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          onClick={() => add({ id: p.id, name: p.name, cat: p.cat, price: p.price, old: p.old, image: p.image })}>
          <ShoppingCart size={15} /> {out ? "Sold out" : "Add to bag"}</button></div>
    </article>;
  })}</div>;
 }
