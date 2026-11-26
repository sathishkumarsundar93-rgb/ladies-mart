"use client";
import "./home.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./components/CartContext";
import { useProducts, type Product } from "./components/useProducts";
import { imageUrl } from "../lib/image";
import { HEX, needsOptions } from "../lib/catalog";

const BROWSE: string[] = ["Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "Nightwear", "Dress Material"];
const SIZES: string[] = ["S", "M", "L", "XL", "XXL"];
const SIZE_CHART: [string, string, string, string][] = [
  ["XS", "32", "26", "36"], ["S", "34", "28", "37"], ["M", "36", "30", "38"],
  ["L", "38", "32", "39"], ["XL", "40", "34", "40"], ["XXL", "42", "36", "41"],
];
const WISH_KEY = "ladies-mart-wish-v1";
// Format: country code + number, digits only, e.g. 91XXXXXXXXXX. Set NEXT_PUBLIC_WHATSAPP in .env.local
const WA = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const waLink = (msg: string) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
const off = (p: Product) => Math.round((1 - p.price / p.old) * 100);
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const f2 = (n: number) => String(n).padStart(2, "0");

// Festival campaigns. Dates are approximate: check each year's calendar.
const FESTS: { id: string; name: string; ta: string; theme: string; from: string; to: string; offer: string }[] = [
  { id: "pongal", name: "Pongal", ta: "பொங்கல்", theme: "theme-pongal", from: "01-12", to: "01-17", offer: "Pongal special prices on sarees and kurtis" },
  { id: "puthandu", name: "Tamil Puthandu", ta: "புத்தாண்டு", theme: "theme-puthandu", from: "04-12", to: "04-16", offer: "Puthandu collection is here" },
  { id: "aadi", name: "Aadi Sale", ta: "ஆடி தள்ளுபடி", theme: "theme-puthandu", from: "07-16", to: "08-17", offer: "Aadi special offers across all categories" },
  { id: "deepavali", name: "Deepavali", ta: "தீபாவளி", theme: "theme-deepavali", from: "10-25", to: "11-12", offer: "Deepavali festive collection and offers" },
];
const THEMES: { id: string; name: string; sw: string }[] = [
  { id: "", name: "Classic", sw: "linear-gradient(135deg,#4a0e2e,#b8175a)" },
  { id: "theme-pongal", name: "Pongal", sw: "linear-gradient(135deg,#5a3a00,#c98a00,#ffd23f)" },
  { id: "theme-deepavali", name: "Deepavali", sw: "linear-gradient(135deg,#4a0a0a,#b0161a,#f5b700)" },
  { id: "theme-puthandu", name: "Puthandu", sw: "linear-gradient(135deg,#0f3d2a,#1f7a4d,#f4c430)" },
];
// Today's festival by date (MM-DD). Opening the page with #pongal, #deepavali etc. forces that festival for testing.
function activeFest(): (typeof FESTS)[number] | null {
  if (typeof window !== "undefined") {
    const forced = FESTS.find((f) => f.id === window.location.hash.replace("#", ""));
    if (forced) return forced;
  }
  const d = new Date();
  const md = `${f2(d.getMonth() + 1)}-${f2(d.getDate())}`;
  return FESTS.find((f) => md >= f.from && md <= f.to) ?? null;
}
const inStock = (p: Product) => !(p.stock !== undefined && p.stock <= 0);

// Find my look: occasion -> categories that suit it
const OCC: Record<string, string[]> = {
  wedding: ["Sarees", "Ethnic Wear"],
  festival: ["Sarees", "Ethnic Wear", "Dress Material", "Dresses"],
  office: ["Tops", "Jeans", "Kurtis"],
  daily: ["Kurtis", "Tops", "Jeans", "Dresses", "Nightwear", "Dress Material"],
};
const OCC_LABEL: Record<string, string> = { wedding: "Wedding", festival: "Festival", office: "Office", daily: "Daily wear" };
// Style -> categories (traditional or modern); "any" uses the occasion list as it is
const STY: Record<string, string[] | null> = {
  trad: ["Sarees", "Kurtis", "Ethnic Wear", "Dress Material"],
  modern: ["Dresses", "Tops", "Jeans", "Nightwear"],
  any: null,
};
const QUIZ: { t: string; k: "occ" | "bud" | "sty"; o: [string, string][] }[] = [
  { t: "What is the occasion?", k: "occ", o: [["wedding", "Wedding"], ["festival", "Festival"], ["office", "Office"], ["daily", "Daily wear"]] },
  { t: "What is your budget?", k: "bud", o: [["500", "Under ₹500"], ["1000", "Under ₹1,000"], ["99999", "No limit"]] },
  { t: "Which style feels like you?", k: "sty", o: [["trad", "Traditional"], ["modern", "Modern"], ["any", "A mix of both"]] },
];

// Fun finds: aesthetics match product name and sub-category by keyword
const AES: { k: string; n: string; d: string; re: RegExp }[] = [
  { k: "minimal", n: "Minimal", d: "Clean lines, neutral tones", re: /casual|wide|straight|midi|shirt|basic/i },
  { k: "boho", n: "Boho", d: "Prints, flow and earthy tones", re: /print|maxi|wrap|floral|flow/i },
  { k: "ethnic", n: "Ethnic modern", d: "Traditional cuts, new twists", re: /anarkali|churidar|kanchi|silk|kurta|dupatta|embroid|saree|ethnic|festive/i },
  { k: "street", n: "Street", d: "Bold, oversized, easy to wear", re: /crop|skinny|oversize|denim|jeans/i },
];
const GIFT: { k: string; n: string; d: string; cats: string[] }[] = [
  { k: "birthday", n: "Friend birthday", d: "Fun, bright and easy to gift", cats: ["Dresses", "Tops", "Kurtis"] },
  { k: "amma", n: "Amma-ku gift", d: "Comfortable, traditional, elegant", cats: ["Sarees", "Kurtis", "Dress Material"] },
  { k: "bridesmaid", n: "Bridesmaid", d: "Festive and coordinated", cats: ["Sarees", "Ethnic Wear"] },
];

// Shop the look: a pair from two categories. Item i of each category is used for look i.
const LOOKS: { t: string; d: string; cats: string[] }[] = [
  { t: "Office set", d: "A sharp top with jeans, from desk to dinner.", cats: ["Tops", "Jeans"] },
  { t: "Festive pair", d: "A saree with an ethnic set for two.", cats: ["Sarees", "Ethnic Wear"] },
  { t: "Weekend layer", d: "A dress with a top worn over it.", cats: ["Dresses", "Tops"] },
];
const BUNDLE_OFF = 10; // sample, confirm before launch

// Shop by mood: each mood lists the categories that suit it
const MOODS: { k: string; n: string; t: string; d: string; cats: string[]; cls: string }[] = [
  { k: "chai", n: "Morning chai", t: "காலை தேநீர்", d: "Soft cotton for a slow start", cats: ["Kurtis", "Dress Material"], cls: "m-chai" },
  { k: "wedding", n: "Wedding guest", t: "திருமண விருந்தினர்", d: "Silk, zari and embroidery", cats: ["Sarees", "Ethnic Wear"], cls: "m-wedding" },
  { k: "office", n: "Office Monday", t: "அலுவலக திங்கள்", d: "Sharp and neat from morning to evening", cats: ["Tops", "Jeans", "Kurtis"], cls: "m-office" },
  { k: "temple", n: "Temple visit", t: "கோயில் தரிசனம்", d: "Simple, respectful and graceful", cats: ["Sarees", "Kurtis", "Dress Material"], cls: "m-temple" },
  { k: "rain", n: "Rainy day comfort", t: "மழை நாள்", d: "Soft layers for slow days", cats: ["Nightwear", "Dress Material"], cls: "m-rain" },
  { k: "brunch", n: "Weekend brunch", t: "வார இறுதி", d: "Light dresses and easy styles", cats: ["Dresses", "Tops", "Jeans"], cls: "m-brunch" },
];

// Sample bulk tiers. Confirm the real percentages before launch.
const TIERS: [number, number, string][] = [
  [10, 10, "Boutiques and resellers starting out"],
  [25, 15, "College, group and party orders"],
  [50, 20, "Wholesale with WhatsApp support"],
];

// Next Sunday 23:59:59 (local time). Used for the weekly drop countdown.
function dropEnd(): Date {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  end.setHours(23, 59, 59, 999);
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7);
  return end;
}

type Pick = { title: string; list: Product[] } | null;
type QA = { occ?: string; bud?: number; sty?: string };

export default function Home() {
  const router = useRouter();
  const { count, add } = useCart();
  const { products, loading } = useProducts();

  // browse filters
  const [cat, setCat] = useState("All");
  const [sub, setSub] = useState("All");
  const [col, setCol] = useState("All");
  const [q, setQ] = useState("");
  // wishlist
  const [wish, setWish] = useState<number[]>([]);
  const [wishReady, setWishReady] = useState(false);
  // ui
  const [toast, setToast] = useState("");
  const [left, setLeft] = useState<number[] | null>(null);
  const [pick, setPick] = useState<Pick>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [qStep, setQStep] = useState(0);
  const [qa, setQa] = useState<QA>({});
  const [sgOpen, setSgOpen] = useState(false);
  // bulk builder
  const [bp, setBp] = useState<number | null>(null);
  const [bq, setBq] = useState<Record<string, number>>({});
  // festival + theme
  const [fest, setFest] = useState<(typeof FESTS)[number] | null>(null);
  const [theme, setTheme] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);
  const [dark, setDark] = useState(false);
  // quick view
  const [qv, setQv] = useState<Product | null>(null);
  const [qvSize, setQvSize] = useState("");
  const [qvColor, setQvColor] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem("ladies-mart-dark") === "1") setDark(true); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("ladies-mart-dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  useEffect(() => {
    const f = activeFest();
    setFest(f);
    if (f) setTheme(f.theme);
    const onHash = () => setFest(activeFest());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISH_KEY);
      if (raw) setWish(JSON.parse(raw) as number[]);
    } catch {}
    setWishReady(true);
  }, []);
  useEffect(() => {
    if (!wishReady) return;
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); } catch {}
  }, [wish, wishReady]);

  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.floor((dropEnd().getTime() - Date.now()) / 1000));
      setLeft([Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // close modals with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setQuizOpen(false); setSgOpen(false); setQv(null); setThemeOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1800);
  };

  // ---- browse derived lists ----
  const catList = useMemo(() => products.filter((p) => cat === "All" || p.cat === cat), [products, cat]);
  const subs = useMemo(() => [...new Set(catList.map((p) => p.sub).filter((s): s is string => !!s))], [catList]);
  const cols = useMemo(() => [...new Set(catList.map((p) => p.colors?.[0]).filter((c): c is string => !!c))], [catList]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return catList.filter(
      (p) =>
        (sub === "All" || p.sub === sub) &&
        (col === "All" || p.colors?.[0] === col) &&
        (!t || (p.name + " " + p.cat).toLowerCase().includes(t))
    );
  }, [catList, sub, col, q]);
  const fresh = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 4), [products]);

  const pickCat = (c: string) => {
    setCat(c);
    setSub("All");
    setCol("All");
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
  };
  const toggleWish = (id: number) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const quickAdd = (p: Product) => {
    if (needsOptions(p)) {
      router.push(`/products/${p.id}`);
      return;
    }
    add({ id: p.id, name: p.name, cat: p.cat, price: p.price, old: p.old, image: p.image }, p.sizes?.[0] ?? "M", p.colors?.[0] ?? "");
    say(`${p.name} added to bag`);
  };
  const showPick = (title: string, items: Product[]) => {
    setPick({ title, list: items });
    setTimeout(() => document.getElementById("picks")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // ---- find my look ----
  const quizAnswer = (k: "occ" | "bud" | "sty", v: string) => setQa((a) => ({ ...a, [k]: k === "bud" ? Number(v) : v }));
  const finishQuiz = () => {
    const occ = qa.occ ?? "daily";
    const bud = qa.bud ?? 99999;
    const sty = qa.sty ?? "any";
    const styCats = STY[sty];
    const items = products
      .filter((p) => OCC[occ].includes(p.cat) && (styCats === null || styCats.includes(p.cat)) && p.price <= bud && inStock(p))
      .sort((a, b) => a.price - b.price);
    const styleText = sty === "any" ? "mixed" : sty === "trad" ? "traditional" : "modern";
    setQuizOpen(false);
    setQStep(0);
    showPick(`${OCC_LABEL[occ]} looks, ${styleText}`, items);
  };

  // ---- shop the look ----
  const looks = LOOKS.map((L, i) => {
    const items = L.cats
      .map((c) => products.filter((p) => p.cat === c && inStock(p))[i] ?? products.find((p) => p.cat === c && inStock(p)))
      .filter((p): p is Product => !!p);
    const sum = items.reduce((a, p) => a + p.price, 0);
    return { ...L, items, sum, bundle: Math.round(sum * (1 - BUNDLE_OFF / 100)) };
  });

  // ---- bulk builder ----
  const bProd = products.find((p) => p.id === bp) ?? products[0];
  const bn = Object.values(bq).reduce((a, b) => a + b, 0);
  const bd = bn >= 50 ? 20 : bn >= 25 ? 15 : bn >= 10 ? 10 : 0;
  const btotal = bProd ? Math.round(bn * bProd.price * (1 - bd / 100)) : 0;
  const bhint = !bn ? "Add pieces to see your bulk discount"
    : bn < 10 ? `${10 - bn} more pieces unlock 10% off`
    : bn < 25 ? `${25 - bn} more pieces unlock 15% off`
    : bn < 50 ? `${50 - bn} more pieces unlock 20% off`
    : "Top tier unlocked: 20% off";
  const bump = (s: string, d: number) => setBq((b) => ({ ...b, [s]: Math.max(0, (b[s] ?? 0) + d) }));
  const bulkMsg = bProd
    ? `Hi Ladies Mart, bulk order request\n${bProd.name}\n${SIZES.filter((s) => bq[s]).map((s) => `${s}: ${bq[s]}`).join(", ") || "no sizes yet"}\nTotal pieces: ${bn}, estimated total ${inr(btotal)} (${bd}% off)`
    : "Hi Ladies Mart, bulk order request";

  const newest = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 12), [products]);
  const deals = useMemo(() => [...products].filter(inStock).sort((a, b) => off(b) - off(a)).slice(0, 12), [products]);

  // Horizontal product row: images first, swipe left to right
  const hRow = (title: string, items: Product[], key: string) => (
    <section className="hm2-hrow" key={key}>
      <div className="hm2-wrap hm2-hrow-head">
        <h3>{title}</h3>
        <button className="hm2-link" onClick={() => showPick(title, items)}>See all</button>
      </div>
      <div className="hm2-hscroll">
        {items.map((p) => (
          <article className="hm2-tile" key={p.id}>
            <Link href={`/products/${p.id}`} className="hm2-tile-img">
              <img loading="lazy" src={imageUrl(p.image, 360)} alt={p.name} />
              <span className="hm2-rib">{off(p)}% OFF</span>
            </Link>
            <button className="hm2-qbtn" onClick={() => setQv(p)}>Quick view</button>
            <div className="hm2-tile-body">
              <span className="hm2-tile-nm">{p.name}</span>
              {p.sizes && p.sizes.length > 0 && (
                <div className="hm2-tile-sizes">{p.sizes.slice(0, 5).map((s) => <span key={s}>{s}</span>)}</div>
              )}
              <div className="hm2-pr"><b>{inr(p.price)}</b><del>{inr(p.old)}</del></div>
              <button className="hm2-tile-add" disabled={!inStock(p)} onClick={() => (needsOptions(p) ? setQv(p) : quickAdd(p))}>
                {!inStock(p) ? "Sold out" : needsOptions(p) ? "Select size" : "Add to bag"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const card = (p: Product) => {
    const out = !inStock(p);
    const saved = wish.includes(p.id);
    return (
      <article className="hm2-card" key={p.id}>
        <div className="hm2-img">
          <Link href={`/products/${p.id}`}>
            <img loading="lazy" src={imageUrl(p.image, 400)} alt={p.name} style={out ? { opacity: 0.5 } : undefined} />
          </Link>
          <span className="hm2-rib">{out ? "Sold out" : `${off(p)}% OFF`}</span>
          <button className={`hm2-heart ${saved ? "on" : ""}`} onClick={() => toggleWish(p.id)} aria-label="Save to wishlist" aria-pressed={saved}>
            {saved ? "♥" : "♡"}
          </button>
        </div>
        <div className="hm2-body">
          <Link href={`/products/${p.id}`} className="hm2-nm">{p.name}</Link>
          <div className="hm2-prow">
            <div className="hm2-pr"><b>{inr(p.price)}</b><del>{inr(p.old)}</del></div>
            <button className="hm2-add" disabled={out} onClick={() => (needsOptions(p) ? setQv(p) : quickAdd(p))}>
              {out ? "Sold out" : needsOptions(p) ? "Select" : "ADD"}
            </button>
          </div>
          <button className="hm2-sg hm2-sg-left" onClick={() => setQv(p)}>Quick view</button>
        </div>
      </article>
    );
  };

  const skeletons = Array.from({ length: 4 }, (_, i) => <div key={i} className="hm2-skel" />);

  return (
    <div className={`hm2 ${theme} ${dark ? "dark" : ""}`}>
      <div className="hm2-top">Free shipping above ₹999 · Cash on delivery</div>
      {fest && <div className="hm2-fest"><span className="tm">{fest.ta}</span> · <b>{fest.name}</b> — {fest.offer}</div>}

      <header className="hm2-head-bar">
        <div className="hm2-wrap hm2-bar">
          <Link className="hm2-logo" href="/">Ladies<i>Mart</i></Link>
          <button className="hm2-theme" onClick={() => setThemeOpen(true)} aria-label="Choose theme">🪔 {THEMES.find((t) => t.id === theme)?.name ?? "Classic"}</button>
          <label className="hm2-search">
            <span aria-hidden="true">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && q.trim() && router.push(`/products?q=${encodeURIComponent(q.trim())}`)}
              placeholder="Search sarees, kurtis, nightwear"
              aria-label="Search products"
            />
          </label>
          <button className="hm2-icon" onClick={() => setDark((d) => !d)} aria-label="Toggle dark mode">{dark ? "☀️" : "🌙"}</button>
          <Link className="hm2-icon" href="/profile" aria-label="My account">👤</Link>
          <Link className="hm2-bag" href="/cart" aria-label="Bag">Bag <span>{count}</span></Link>
        </div>
      </header>

      <nav className="hm2-topcats" aria-label="Categories">
        <div className="hm2-wrap hm2-topcats-in">
          <button className={cat === "All" ? "on" : ""} onClick={() => pickCat("All")}><span className="ico">🛍</span>All</button>
          {BROWSE.map((c) => {
            const img = products.find((p) => p.cat === c);
            return (
              <button key={c} className={cat === c ? "on" : ""} onClick={() => pickCat(c)}>
                <span className="ico">{img ? <img src={imageUrl(img.image, 96)} alt="" /> : "•"}</span>{c}
              </button>
            );
          })}
        </div>
      </nav>

      <main>
        <section className="hm2-hero hm2-hero-compact">
          <div className="hm2-wrap hm2-hero-row">
            <div>
              <span className="hm2-offer"><b>NEW</b>Sarees from ₹499</span>
              <h1>New this week</h1>
            </div>
            <div className="hm2-ctas">
              <button className="hm2-btn small" onClick={() => { setQStep(0); setQuizOpen(true); }}>Find my look</button>
              <a href={waLink("Hi Ladies Mart, I need help choosing.")} className="hm2-btn ghost small" target="_blank" rel="noopener">WhatsApp us</a>
            </div>
          </div>
        </section>

        {hRow("New arrivals", newest, "new")}
        {hRow("Biggest discounts", deals, "deals")}
        {BROWSE.map((c) => {
          const items = products.filter((p) => p.cat === c && inStock(p));
          return items.length ? hRow(c, items, c) : null;
        })}

        <section className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-sechead"><span className="hm2-eye">Fun finds</span><h2>Find your <em>aesthetic</em></h2></div>
            <div className="hm2-aes">
              {AES.map((a) => (
                <button key={a.k} className={`hm2-aescard a-${a.k}`} onClick={() => showPick(`${a.n} aesthetic`, products.filter((p) => a.re.test(p.name + " " + (p.sub ?? "")) && inStock(p)))}>
                  <b>{a.n}</b><small>{a.d}</small>
                </button>
              ))}
            </div>
            <div className="hm2-sechead" style={{ marginTop: 28 }}><span className="hm2-eye">Gift finder</span><h3>Shopping for someone?</h3></div>
            <div className="hm2-gifts">
              {GIFT.map((g) => (
                <button key={g.k} className="hm2-gift" onClick={() => showPick(`Gift ideas: ${g.n}`, products.filter((p) => g.cats.includes(p.cat) && inStock(p)))}>
                  <b>{g.n}</b><small>{g.d}</small>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-sechead"><span className="hm2-eye">Shop the look</span><h2>Put it <em>together</em></h2></div>
            <div className="hm2-looks">
              {looks.filter((L) => L.items.length > 0).map((L) => (
                <article className="hm2-look" key={L.t}>
                  <h3>{L.t}</h3>
                  <p>{L.d}</p>
                  <div className="hm2-look-items">
                    {L.items.map((p) => (
                      <Link key={p.id} href={`/products/${p.id}`}><img loading="lazy" src={imageUrl(p.image, 300)} alt={p.name} /></Link>
                    ))}
                  </div>
                  <div className="hm2-look-price">
                    <strong>{inr(L.bundle)}</strong><del>{inr(L.sum)}</del><em>Bundle · {BUNDLE_OFF}% off</em>
                  </div>
                  <button className="hm2-btn small" onClick={() => showPick(L.t, L.items)}>Shop this look</button>
                </article>
              ))}
            </div>
            <p className="hm2-note">Bundle prices are sample ({BUNDLE_OFF}% off). Final bundle discounts are confirmed before launch.</p>
          </div>
        </section>

        <section className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-sechead"><span className="hm2-eye">Shop by mood</span><h2>What&apos;s your <em>mood</em> today?</h2></div>
            <div className="hm2-moods">
              {MOODS.map((m) => (
                <button key={m.k} className={`hm2-mood ${m.cls}`} onClick={() => showPick(m.n, products.filter((p) => m.cats.includes(p.cat) && inStock(p)))}>
                  <b>{m.n}</b><span className="tm">{m.t}</span><small>{m.d}</small><em>Shop this mood →</em>
                </button>
              ))}
            </div>
          </div>
        </section>

        {pick && (
          <section id="picks" className="hm2-sec">
            <div className="hm2-wrap">
              <div className="hm2-sechead hm2-sechead-row">
                <div><span className="hm2-eye">Picked for you</span><h2>{pick.title} <em>· {pick.list.length}</em></h2></div>
                <button className="hm2-link" onClick={() => setPick(null)}>Close ×</button>
              </div>
              <div className="hm2-grid hm2-grid-wide">
                {pick.list.length ? pick.list.map(card) : <p className="hm2-empty">Nothing here right now. Try another option.</p>}
              </div>
            </div>
          </section>
        )}

        <section id="browse" className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-sechead">
              <span className="hm2-eye">Browse</span>
              <h2>{cat === "All" ? "All styles" : cat} <em>· {list.length}</em></h2>
            </div>
            <div className="hm2-browse">
              <nav className="hm2-rail" aria-label="Categories">
                <button className={cat === "All" ? "on" : ""} onClick={() => pickCat("All")}>
                  <span className="ico">🛍</span>All
                </button>
                {BROWSE.map((c) => {
                  const img = products.find((p) => p.cat === c);
                  return (
                    <button key={c} className={cat === c ? "on" : ""} onClick={() => pickCat(c)}>
                      <span className="ico">{img ? <img src={imageUrl(img.image, 120)} alt="" /> : "•"}</span>
                      {c}
                    </button>
                  );
                })}
              </nav>

              <div className="hm2-main">
                <div className="hm2-tools">
                  {cols.length > 0 && (
                    <div className="hm2-colors" aria-label="Filter by colour">
                      <button className={`hm2-allc ${col === "All" ? "on" : ""}`} onClick={() => setCol("All")}>All colours</button>
                      {cols.map((c) => (
                        <button key={c} className={`hm2-dot ${col === c ? "on" : ""}`} title={c} aria-label={c} onClick={() => setCol(c)} style={{ background: HEX[c] ?? "#cccccc" }} />
                      ))}
                    </div>
                  )}
                  {subs.length > 0 && (
                    <div className="hm2-subs" aria-label="Sub-categories">
                      {["All", ...subs].map((s) => (
                        <button key={s} className={`hm2-sub ${sub === s ? "on" : ""}`} onClick={() => setSub(s)}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hm2-grid">
                  {loading ? skeletons : list.map(card)}
                  {!loading && list.length === 0 && <p className="hm2-empty">Nothing matches this filter. Try another colour or sub-category.</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-drop">
              <div>
                <span className="hm2-eye gold">This week&apos;s drop</span>
                <h2>Fresh picks, <em>for a limited time</em></h2>
                <p>Newly added styles, shown here until the drop closes on Sunday night.</p>
                <div className="hm2-timer" aria-label="Time left in this drop">
                  <small>Drop closes Sunday midnight</small>
                  {left ? [[left[0], "d"], [left[1], "h"], [left[2], "m"], [left[3], "s"]].map(([n, u]) => (
                    <span key={u as string}><b>{f2(n as number)}</b><i>{u as string}</i></span>
                  )) : null}
                </div>
                <button className="hm2-btn gold" onClick={() => showPick("This week's drop", fresh)}>Shop the drop</button>
              </div>
              <div className="hm2-drop-grid">
                {(loading ? [] : fresh).map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="hm2-mini">
                    <img loading="lazy" src={imageUrl(p.image, 300)} alt={p.name} />
                    <span>{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="hm2-sec">
          <div className="hm2-wrap">
            <div className="hm2-sechead"><span className="hm2-eye">Bulk collection</span><h2>Buy more, <em>pay less</em></h2></div>
            <div className="hm2-tiers">
              {TIERS.map(([n, d, t]) => (
                <div key={n} className={`hm2-tier ${d === 15 ? "hot" : ""}`}>
                  <small>{n}+ pieces</small><strong>{d}% off</strong><span>{t}</span>
                </div>
              ))}
            </div>

            <div className="hm2-builder">
              <label className="hm2-bl-top">Choose a product
                <select value={bProd?.id ?? ""} onChange={(e) => setBp(Number(e.target.value))}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <div className="hm2-bl-sizes">
                {SIZES.map((s) => (
                  <div key={s} className="hm2-bl-row">
                    <span>{s}</span>
                    <div className="hm2-step">
                      <button type="button" onClick={() => bump(s, -1)} aria-label={`Less ${s}`}>−</button>
                      <b>{bq[s] ?? 0}</b>
                      <button type="button" onClick={() => bump(s, 1)} aria-label={`More ${s}`}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hm2-bl-sum">
                <div><small>Pieces</small><strong>{bn}</strong></div>
                <div><small>Discount</small><strong>{bd}%</strong></div>
                <div><small>Estimated total</small><strong>{inr(btotal)}</strong></div>
              </div>
              <p className="hm2-bl-hint">{bhint}</p>
              <a className="hm2-btn" href={`https://wa.me/${WA}?text=${encodeURIComponent(bulkMsg)}`} target="_blank" rel="noopener">Send bulk order on WhatsApp</a>
            </div>
            <p className="hm2-note">Sample tiers. Final discounts are confirmed before launch.</p>
          </div>
        </section>

        <section className="hm2-sec">
          <div className="hm2-wrap hm2-why">
            <div><b>Original price shown</b><span>See the real old price and the discount on every product.</span></div>
            <div><b>Size guide on every product</b><span>Check the measurements before you add to bag.</span></div>
            <div><b>Talk to a real person</b><span>Unsure about fit? Message us on WhatsApp first.</span></div>
            <div><b>Pay on delivery</b><span>Where cash on delivery is available for your pincode.</span></div>
          </div>
        </section>
      </main>

      <footer className="hm2-foot">
        <div className="hm2-wrap hm2-foot-in">
          <div>
            <span className="hm2-logo">Ladies<i>Mart</i></span>
            <p>Trendy styles for the modern girl. Delivered with care.</p>
          </div>
          <div><b>Shop</b><Link href="/products">All products</Link><Link href="/wishlist">Wishlist</Link><Link href="/cart">Bag</Link></div>
          <div><b>Account</b><Link href="/profile">My account</Link><Link href="/login">Log in</Link></div>
          <div><b>Help</b><Link href="/shipping">Shipping</Link><Link href="/returns">Returns and refunds</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of use</Link></div>
          <div><b>Sell</b><Link href="/seller">Sell with us</Link></div>
        </div>
      </footer>

      {/* Find my look quiz */}
      {quizOpen && (
        <div className="hm2-modal" onClick={(e) => e.target === e.currentTarget && setQuizOpen(false)} role="dialog" aria-modal="true" aria-label="Find my look">
          <div className="hm2-box">
            <button className="hm2-x" onClick={() => setQuizOpen(false)} aria-label="Close">×</button>
            <div className="hm2-bar-q"><i style={{ width: `${((qStep + 1) / QUIZ.length) * 100}%` }} /></div>
            <h3>{QUIZ[qStep].t}</h3>
            <div className="hm2-qopts">
              {QUIZ[qStep].o.map(([v, l]) => {
                const k = QUIZ[qStep].k;
                const current = k === "bud" ? String(qa.bud ?? "") : (qa[k] ?? "");
                return <button key={v} className="hm2-qopt" aria-pressed={current === v} onClick={() => quizAnswer(k, v)}>{l}</button>;
              })}
            </div>
            <div className="hm2-qfoot">
              <button className="hm2-link" onClick={() => setQStep((s) => Math.max(0, s - 1))} style={{ visibility: qStep ? "visible" : "hidden" }}>Back</button>
              {qStep < QUIZ.length - 1
                ? <button className="hm2-btn small" disabled={!qa[QUIZ[qStep].k]} onClick={() => setQStep((s) => s + 1)}>Next</button>
                : <button className="hm2-btn small" disabled={!qa.sty} onClick={finishQuiz}>See my looks</button>}
            </div>
          </div>
        </div>
      )}

      {/* Quick view */}
      {qv && (
        <div className="hm2-modal" onClick={(e) => e.target === e.currentTarget && setQv(null)} role="dialog" aria-modal="true" aria-label={`Quick view: ${qv.name}`}>
          <div className="hm2-box hm2-qv">
            <button className="hm2-x" onClick={() => setQv(null)} aria-label="Close">×</button>
            <div className="hm2-qv-img"><img src={imageUrl(qv.image, 600)} alt={qv.name} /></div>
            <div className="hm2-qv-info">
              <span className="hm2-eye">{qv.cat}</span>
              <h3>{qv.name}</h3>
              <div className="hm2-pr"><b>{inr(qv.price)}</b><del>{inr(qv.old)}</del></div>
              {qv.sizes && qv.sizes.length > 0 && (
                <>
                  <p className="hm2-muted">Size</p>
                  <div className="hm2-chips">
                    {qv.sizes.map((s) => <button key={s} className="hm2-chip" aria-pressed={qvSize === s} onClick={() => setQvSize(s)}>{s}</button>)}
                  </div>
                </>
              )}
              {qv.colors && qv.colors.length > 1 && (
                <>
                  <p className="hm2-muted">Colour</p>
                  <div className="hm2-chips">
                    {qv.colors.map((c) => <button key={c} className="hm2-chip" aria-pressed={qvColor === c} onClick={() => setQvColor(c)}>{c}</button>)}
                  </div>
                </>
              )}
              <button
                className="hm2-btn"
                disabled={!inStock(qv)}
                onClick={() => {
                  add({ id: qv.id, name: qv.name, cat: qv.cat, price: qv.price, old: qv.old, image: qv.image }, qvSize || qv.sizes?.[0] || "M", qvColor || qv.colors?.[0] || "");
                  say(`${qv.name} added to bag`);
                  setQv(null);
                }}
              >
                {inStock(qv) ? "Add to bag" : "Sold out"}
              </button>
              <Link href={`/products/${qv.id}`} className="hm2-link" onClick={() => setQv(null)}>View full details →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Size guide */}
      {sgOpen && (
        <div className="hm2-modal" onClick={(e) => e.target === e.currentTarget && setSgOpen(false)} role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="hm2-box">
            <button className="hm2-x" onClick={() => setSgOpen(false)} aria-label="Close">×</button>
            <h3>Size guide</h3>
            <p className="hm2-muted">Body measurements in inches</p>
            <table className="hm2-table">
              <thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Length</th></tr></thead>
              <tbody>{SIZE_CHART.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
            <p className="hm2-muted">Measure your bust at the fullest point and waist at the narrowest. Between sizes? Pick the larger one. Sample chart: confirm per product before launch.</p>
          </div>
        </div>
      )}

      {themeOpen && (
        <div className="hm2-modal" onClick={(e) => e.target === e.currentTarget && setThemeOpen(false)} role="dialog" aria-modal="true" aria-label="Choose a theme">
          <div className="hm2-box">
            <button className="hm2-x" onClick={() => setThemeOpen(false)} aria-label="Close">×</button>
            <h3>Choose a theme</h3>
            <p className="hm2-muted">Applies to the whole site</p>
            <div className="hm2-themes">
              {THEMES.map((t) => (
                <button key={t.name} className="hm2-theme-opt" aria-pressed={theme === t.id}
                  onClick={() => { setTheme(t.id); setThemeOpen(false); say(`${t.name} theme applied`); }}>
                  <span className="hm2-sw" style={{ background: t.sw }} />
                  <b>{t.name}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`hm2-toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
