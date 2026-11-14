"use client";
import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import ProductGrid, { type PriceRange, type Sort } from "../components/ProductGrid";

const cats = ["All", "Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "Nightwear", "Dress Material"];
const prices: [PriceRange, string][] = [["all", "Any price"], ["u500", "Under ₹500"], ["500", "₹500 – ₹999"], ["1000", "₹1000+"]];

export default function ProductsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const [price, setPrice] = useState<PriceRange>("all");

  // support links like /products?q=saree or /products?category=Kurtis
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") || "");
    const c = p.get("category");
    if (c && cats.includes(c)) setCat(c);
  }, []);

  const box = { padding: "10px 12px", borderRadius: 10, border: "1px solid #f0c7da", fontSize: 15, background: "#fff" } as const;

  return <PageShell title="Explore women's fashion">
    <p className="inner-lead">Find pieces you'll love, from everyday essentials to celebration-ready looks.</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "8px 0 12px" }}>
      <input style={{ ...box, flex: "1 1 220px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sarees, kurtis, dresses..." />
      <select style={box} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
        <option value="popular">Sort: Popular</option>
        <option value="low">Price: Low to High</option>
        <option value="high">Price: High to Low</option>
        <option value="discount">Biggest discount</option>
        <option value="new">Newest first</option>
      </select>
    </div>
    <div className="category-pills">{cats.map((c) => <button className={cat === c ? "chosen" : ""} onClick={() => setCat(c)} key={c}>{c}</button>)}</div>
    <div className="category-pills" style={{ marginTop: 8 }}>{prices.map(([v, l]) => <button className={price === v ? "chosen" : ""} onClick={() => setPrice(v)} key={v}>{l}</button>)}</div>
    <ProductGrid category={cat} q={q} sort={sort} price={price} />
  </PageShell>;
}
