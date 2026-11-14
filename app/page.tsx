"use client";
import "./home.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./components/CartContext";
import { useProducts, type Product } from "./components/useProducts";
import { imageUrl } from "../lib/image";
import { needsOptions } from "../lib/catalog";

const CATS: [string, string, string][] = [
  ["Sarees", "#c60058", "🥻"], ["Kurtis", "#e8458b", "👗"], ["Dresses", "#a24fb5", "💃"], ["Tops", "#d9788f", "👚"],
  ["Jeans", "#4c6ea8", "👖"], ["Ethnic Wear", "#b8325f", "✨"], ["Nightwear", "#7b5ea7", "🌙"], ["Dress Material", "#8a5a9e", "🧵"],
];
const BANNERS = [
  { t: "Festive saree sale", s: "Up to 60% off on sarees", bg: "linear-gradient(120deg,#c60058,#7a0a3c)", href: "/products?category=Sarees" },
  { t: "Kurtis from ₹299", s: "Daily wear that feels good", bg: "linear-gradient(120deg,#a24fb5,#5b1b6d)", href: "/products?category=Kurtis" },
  { t: "Night wear under ₹399", s: "Soft cotton, all sizes", bg: "linear-gradient(120deg,#e8458b,#c60058)", href: "/products?category=Nightwear" },
];
const OCCASIONS: [string, string][] = [["Daily wear", "Kurtis"], ["Office", "Tops"], ["Festive", "Sarees"], ["Party", "Dresses"], ["Wedding", "Ethnic Wear"], ["Night wear", "Nightwear"]];
const PRICES = [299, 499, 799, 999];
const WA = process.env.NEXT_PUBLIC_WHATSAPP;
const off = (p: Product) => Math.round((1 - p.price / p.old) * 100);

export default function Home() {
  const router = useRouter();
  const { count, add } = useCart();
  const { products, loading } = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [max, setMax] = useState(0);
  const [shown, setShown] = useState(8);
  const [wish, setWish] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [slide, setSlide] = useState(0);
  const [left, setLeft] = useState<number[] | null>(null);
  const sl = useRef<HTMLDivElement>(null);
  const shop = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // countdown to midnight (client only, avoids hydration mismatch)
  useEffect(() => {
    const tick = () => {
      const n = new Date(), e = new Date(n); e.setHours(23, 59, 59, 999);
      const s = Math.max(0, Math.floor((e.getTime() - n.getTime()) / 1000));
      setLeft([Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // banner auto-slide
  useEffect(() => {
    const id = setInterval(() => {
      const el = sl.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      el.scrollTo({ left: ((Math.round(el.scrollLeft / el.clientWidth) + 1) % BANNERS.length) * el.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => (cat === "All" || p.cat === cat) && (!max || p.price <= max) && (!t || (p.name + p.cat).toLowerCase().includes(t)));
  }, [products, cat, max, q]);
  const deals = useMemo(() => [...products].sort((a, b) => off(b) - off(a)).slice(0, 6), [products]);
  const fresh = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 8), [products]);

  const say = (m: string) => {
    setToast(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 1600);
  };
  const toShop = () => shop.current?.scrollIntoView({ behavior: "smooth" });
  const pickCat = (c: string) => { setCat(c); setShown(8); toShop(); };
  const pickMax = (v: number) => { setMax(max === v ? 0 : v); setShown(8); toShop(); };
  const toggleWish = (id: number) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const f2 = (n: number) => String(n).padStart(2, "0");

  const card = (p: Product) => {
    const out = p.stock !== undefined && p.stock <= 0;
    return <article className="hm-card" key={p.id}>
      <div className="hm-img">
        <Link href={`/products/${p.id}`}><img loading="lazy" src={imageUrl(p.image, 400)} alt={p.name} style={out ? { opacity: 0.5 } : undefined} /></Link>
        <span className="hm-off">{out ? "Sold out" : `${off(p)}% off`}</span>
        <button className={`hm-wish ${wish.includes(p.id) ? "hm-on" : ""}`} onClick={() => toggleWish(p.id)} aria-label="Wishlist">{wish.includes(p.id) ? "♥" : "♡"}</button>
      </div>
      <div className="hm-info">
        <Link href={`/products/${p.id}`} className="hm-nm">{p.name}</Link>
        <div className="hm-pr"><b>₹{p.price}</b><del>₹{p.old}</del></div>
        <div className="hm-rt">Cash on delivery</div>
        <button className="hm-add" disabled={out} style={out ? { opacity: 0.5 } : undefined}
          onClick={() => { if (needsOptions(p)) { router.push(`/products/${p.id}`); return; } add({ id: p.id, name: p.name, cat: p.cat, price: p.price, old: p.old, image: p.image }, p.sizes?.[0] ?? "M", p.colors?.[0] ?? ""); say(`${p.name} added to bag`); }}>
          {out ? "Sold out" : needsOptions(p) ? "Select options" : "Add to bag"}</button>
      </div>
    </article>;
  };
  const skeletons = (n: number) => Array.from({ length: n }, (_, i) => <div className="hm-skel" key={i} />);

  return <div className="hm">
    <div className="hm-strip">Free shipping above ₹999 · Cash on delivery · Easy returns</div>
    <header>
      <div className="hm-bar">
        <Link className="hm-logo" href="/">Ladies Mart</Link>
        <label className="hm-search">🔍<input value={q} onChange={(e) => { setQ(e.target.value); setShown(8); }}
          onKeyDown={(e) => e.key === "Enter" && q.trim() && router.push(`/products?q=${encodeURIComponent(q.trim())}`)}
          placeholder="Search sarees, kurtis, dresses…" aria-label="Search products" /></label>
        <Link className="hm-cart" href="/profile" aria-label="My account">👤</Link>
        <Link className="hm-cart" href="/cart" aria-label="Cart">🛍{count > 0 && <b>{count}</b>}</Link>
      </div>
    </header>

    <div className="hm-cats">{[["All", "#f5a623", "🛍"] as [string, string, string], ...CATS].map(([n, c, e]) =>
      <button key={n} className={`hm-cat ${cat === n ? "hm-on" : ""}`} onClick={() => pickCat(n)}><i style={{ background: c + "22" }}>{e}</i>{n}</button>)}</div>

    <main className="hm-wrap">
      <div className="hm-slider" ref={sl} onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {BANNERS.map((b) => <div className="hm-slide" style={{ background: b.bg }} key={b.t}><h2>{b.t}</h2><p>{b.s}</p><Link href={b.href}><button>Shop now</button></Link></div>)}
      </div>
      <div className="hm-dots">{BANNERS.map((b, i) => <span key={b.t} className={slide === i ? "hm-on" : ""} />)}</div>

      <h3 className="hm-t">Shop by price</h3>
      <div className="hm-tiles">{PRICES.map((v) => <button key={v} className={`hm-tile ${max === v ? "hm-on" : ""}`} onClick={() => pickMax(v)}>Under<b>₹{v}</b></button>)}</div>

      <section className="hm-deal">
        <div className="hm-hd"><h3>Deal of the day</h3>
          <div className="hm-timer">{left ? left.map((n, i) => <span key={i}>{f2(n)}</span>) : null}</div></div>
        <div className="hm-row">{loading ? skeletons(3) : deals.map(card)}</div>
      </section>

      <h3 className="hm-t">New arrivals<Link href="/products"><small>See all</small></Link></h3>
      <div className="hm-row" style={{ paddingRight: 0 }}>{loading ? skeletons(3) : fresh.map(card)}</div>

      <h3 className="hm-t" ref={shop}>Trending for you</h3>
      <div>{cat !== "All" && <button className="hm-fchip" onClick={() => setCat("All")}>{cat} ✕</button>}
        {max > 0 && <button className="hm-fchip" onClick={() => setMax(0)}>Under ₹{max} ✕</button>}</div>
      <div className="hm-grid">{loading ? skeletons(4) : list.length ? list.slice(0, shown).map(card)
        : <p style={{ gridColumn: "1/-1", color: "var(--muted)" }}>No products found. Try another category or price.</p>}</div>
      {list.length > shown && <button className="hm-more" onClick={() => setShown(shown + 8)}>Load more</button>}

      <h3 className="hm-t">Shop by occasion</h3>
      <div className="hm-chips">{OCCASIONS.map(([o, c]) => <Link key={o} href={`/products?category=${encodeURIComponent(c)}`}><button className="hm-chip">{o}</button></Link>)}</div>

      <div className="hm-trust">
        <div><i>💵</i><span><b>Cash on delivery</b>Pay when it arrives</span></div>
        <div><i>↩️</i><span><b>Easy returns</b>Simple return process</span></div>
        <div><i>🚚</i><span><b>Free shipping</b>On orders above ₹999</span></div>
        <div><i>🔒</i><span><b>Safe checkout</b>Your details stay private</span></div>
      </div>

      <div className="hm-seller"><div><h3>Sell your clothes on Ladies Mart</h3><p>Add your products, get orders, we handle the website.</p></div><Link href="/seller">Become a seller</Link></div>
    </main>

    <footer>
      <div className="hm-cols">
        <div><b>Shop</b>{["Sarees", "Kurtis", "Dresses", "Nightwear"].map((c) => <Link key={c} href={`/products?category=${c}`}>{c}</Link>)}</div>
        <div><b>Help</b><Link href="/profile">Track order</Link><Link href="/">Returns &amp; refunds</Link><Link href="/">Shipping policy</Link><Link href="/">Contact us</Link></div>
        <div><b>Company</b><Link href="/">About us</Link><Link href="/">Privacy policy</Link><Link href="/">Terms of use</Link><Link href="/seller">Sell with us</Link></div>
        <div><b>Ladies Mart</b>Fashion for every you. Made in Tamil Nadu.</div>
      </div>
    </footer>

    {WA && <a className="hm-wa" href={`https://wa.me/91${WA}`} target="_blank" rel="noopener noreferrer">💬 Chat on WhatsApp</a>}
    {toast && <div className="hm-toast">{toast}</div>}
  </div>;
                       }
