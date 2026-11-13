"use client";
import { useEffect, useState } from "react";

export type Product = {
  id: number; name: string; cat: string; price: number; old: number; image: string; off: string; stock?: number;
  images?: string[]; sub?: string; description?: string; sizes?: string[]; colors?: string[];
};

// Shown instantly and used if the API is unreachable
export const FALLBACK: Product[] = [
  { id: 1, name: "Designer Festive Saree", cat: "Sarees", price: 799, old: 1999, image: "photo-1610030469983-98e550d6193c", off: "60% OFF" },
  { id: 2, name: "Everyday Printed Kurti", cat: "Kurtis", price: 499, old: 1199, image: "photo-1583391733956-6c78276477e8", off: "58% OFF" },
  { id: 3, name: "Floral Midi Dress", cat: "Dresses", price: 649, old: 1599, image: "photo-1539008835657-9e8e9680c956", off: "59% OFF" },
  { id: 4, name: "Elegant Casual Top", cat: "Tops", price: 399, old: 999, image: "photo-1566206091558-7f218b696731", off: "60% OFF" },
  { id: 5, name: "Classic Wide-Leg Jeans", cat: "Jeans", price: 899, old: 1799, image: "photo-1541099649105-f69ad21f3246", off: "50% OFF" },
  { id: 6, name: "Embroidered Ethnic Set", cat: "Ethnic Wear", price: 1199, old: 2499, image: "photo-1594633312681-425c7b97ccd1", off: "52% OFF" },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(FALLBACK);
  const [fromApi, setFromApi] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive && Array.isArray(d) && d.length) { setProducts(d); setFromApi(true); } })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return { products, fromApi, loading };
}
