"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "./components/CartContext";
import {
  Search, UserRound, Heart, ShoppingCart, ChevronDown, ChevronRight,
  Truck, ShieldCheck, Headset, PackageCheck, Menu, X, SlidersHorizontal,
  Star, ArrowRight, Sparkles
} from "lucide-react";

const categories = [
  { name: "Sarees", image: "photo-1610030469983-98e550d6193c" },
  { name: "Kurtis", image: "photo-1583391733956-6c78276477e8" },
  { name: "Dresses", image: "photo-1539008835657-9e8e9680c956" },
  { name: "Tops", image: "photo-1566206091558-7f218b696731" },
  { name: "Jeans", image: "photo-1541099649105-f69ad21f3246" },
  { name: "Ethnic Wear", image: "photo-1594633312681-425c7b97ccd1" },
  { name: "Nightwear", image: "photo-1551488831-00ddcb6c6bd3" },
];

const products = [
  { id: 1, name: "Designer Festive Saree", category: "Sarees", price: 799, old: 1999, off: "60% OFF", rating: "4.8", image: "photo-1610030469983-98e550d6193c", tag: "Bestseller" },
  { id: 2, name: "Everyday Printed Kurti", category: "Kurtis", price: 499, old: 1199, off: "58% OFF", rating: "4.7", image: "photo-1583391733956-6c78276477e8", tag: "Trending" },
  { id: 3, name: "Floral Midi Dress", category: "Dresses", price: 649, old: 1599, off: "59% OFF", rating: "4.6", image: "photo-1539008835657-9e8e9680c956", tag: "New" },
  { id: 4, name: "Elegant Casual Top", category: "Tops", price: 399, old: 999, off: "60% OFF", rating: "4.5", image: "photo-1566206091558-7f218b696731", tag: "Popular" },
  { id: 5, name: "Classic Wide-Leg Jeans", category: "Jeans", price: 899, old: 1799, off: "50% OFF", rating: "4.7", image: "photo-1541099649105-f69ad21f3246", tag: "Bestseller" },
  { id: 6, name: "Embroidered Ethnic Set", category: "Ethnic Wear", price: 1199, old: 2499, off: "52% OFF", rating: "4.9", image: "photo-1594633312681-425c7b97ccd1", tag: "Premium" },
];

const img = (id: string, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const { count, add } = useCart();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => products.filter((p) =>
    (activeCategory === "All" || p.category === activeCategory) &&
    `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())
  ), [activeCategory, query]);

  const toggleWishlist = (id: number) => {
    setWishlist((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]);
  };
  const addToCart = (id: number) => {
    const p = products.find((x) => x.id === id)!;
    add({ id: p.id, name: p.name, cat: p.category, price: p.price, old: p.old, image: p.image });
    setNotice("Added to your bag");
    window.setTimeout(() => setNotice(""), 1800);
  };

  return (
    <main>
      <div className="top-strip">
        <div className="top-inner">
          <span><Truck size={14}/> Free shipping on orders above ₹999</span>
          <span><ShieldCheck size={14}/> Secure payments</span>
          <span><PackageCheck size={14}/> Easy returns</span>
          <span className="top-right">Download App&nbsp; · &nbsp;Help Centre</span>
        </div>
      </div>

      <header className="header">
        <div className="header-main">
          <button className="icon-btn mobile-only" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
          <a className="brand" href="#">
            <span className="brand-mark">LM</span>
            <span><strong>Ladies Mart</strong><small>Fashion for Every You <b>♥</b></small></span>
          </a>
          <div className="search-box">
            <Search size={19}/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for sarees, kurtis, dresses..." />
            <button aria-label="Search"><Search size={19}/></button>
          </div>
          <div className="header-actions">
            <Link className="action-link" href="/login"><UserRound/><span>Login<br/>Sign Up</span></Link>
            <Link className="action-link" href="/wishlist"><Heart/><span>Wishlist</span><i>{wishlist.length}</i></Link>
            <Link className="action-link" href="/cart"><ShoppingCart/><span>Cart</span><i>{count}</i></Link>
          </div>
        </div>
        <nav className={`nav ${mobileMenu ? "nav-open" : ""}`}>
          <button className="all-categories" onClick={() => setActiveCategory("All")}><Menu size={16}/> All Categories <ChevronDown size={14}/></button>
          {["New Arrivals", "Offers", "Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "More"].map((item) =>
            <button key={item} onClick={() => { setActiveCategory(categories.some(c => c.name === item) ? item : "All"); setMobileMenu(false); }}>{item}</button>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="script">Discover your style</p>
          <h1>Fashion that<br/><em>feels like you.</em></h1>
          <p className="hero-sub">Fresh looks · Lovely prices · Everyday confidence</p>
          <button className="primary-btn" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>Shop the collection <ArrowRight size={17}/></button>
          <div className="hero-offer"><span>UP TO</span><strong>50%</strong><span>OFF</span></div>
        </div>
        <div className="hero-photo" role="img" aria-label="Women's festive fashion collection"/>
        <div className="hero-flower">✿</div>
      </section>

      <section className="category-section section-wrap">
        <div className="section-heading"><div><p className="eyebrow">FIND YOUR FAVOURITE</p><h2>Shop by category</h2></div><button className="text-link" onClick={() => setActiveCategory("All")}>View all <ChevronRight size={16}/></button></div>
        <div className="category-grid">
          {categories.map((c) => <button className={`category-card ${activeCategory === c.name ? "selected" : ""}`} key={c.name} onClick={() => {setActiveCategory(c.name); document.getElementById("shop")?.scrollIntoView({behavior:"smooth"});}}>
            <img src={img(c.image, 300)} alt={c.name}/><span>{c.name}</span>
          </button>)}
        </div>
      </section>

      <section className="benefits">
        <div><Truck/><span><b>Free Shipping</b><small>On orders above ₹999</small></span></div>
        <div><ShieldCheck/><span><b>Secure Payments</b><small>100% safe checkout</small></span></div>
        <div><Headset/><span><b>Friendly Support</b><small>We're here to help</small></span></div>
        <div><PackageCheck/><span><b>Easy Returns</b><small>Simple return process</small></span></div>
      </section>

      <section className="section-wrap product-section" id="shop">
        <div className="section-heading"><div><p className="eyebrow">HANDPICKED FOR YOU</p><h2>{activeCategory === "All" ? "Today's lovely finds" : activeCategory}</h2></div><div className="heading-tools"><span><Sparkles size={15}/> Curated styles</span><button className="filter-btn"><SlidersHorizontal size={16}/> Filter</button></div></div>
        <div className="product-grid">
          {visibleProducts.map((p) => <article className="product-card" key={p.id}>
            <div className="product-image"><img src={img(p.image, 600)} alt={p.name}/><span className="discount">{p.off}</span><button className={`wish-btn ${wishlist.includes(p.id) ? "active" : ""}`} onClick={() => toggleWishlist(p.id)} aria-label="Add to wishlist"><Heart fill={wishlist.includes(p.id) ? "currentColor" : "none"}/></button><span className="product-tag">{p.tag}</span></div>
            <div className="product-info"><p className="product-category">{p.category}</p><h3>{p.name}</h3><div className="rating"><Star size={13} fill="currentColor"/> {p.rating} <span>·</span> <small>Popular choice</small></div><div className="price-row"><strong>₹{p.price}</strong><del>₹{p.old}</del><span>{p.off}</span></div><button className="add-btn" onClick={() => addToCart(p.id)}>Add to bag <ShoppingCart size={15}/></button></div>
          </article>)}
          {visibleProducts.length === 0 && <div className="empty-state">No matching styles found. Try another search or category.</div>}
        </div>
      </section>

      <section className="promo-row section-wrap">
        <div className="promo-card promo-fashion"><div><p className="eyebrow">MADE FOR YOUR MOMENTS</p><h2>Fashion for<br/><em>every mood.</em></h2><p>From everyday comfort to celebration-ready looks.</p><button className="outline-btn" onClick={() => setActiveCategory("Ethnic Wear")}>Explore collection <ArrowRight size={15}/></button></div></div>
        <div className="promo-card promo-gift"><div><p className="eyebrow">A LITTLE TREAT FOR YOU</p><h2>Welcome offer</h2><strong>FLAT 20% OFF</strong><p>Use code <b>HELLO20</b> on your first order</p><button className="primary-btn" onClick={() => setNotice("Offer code HELLO20 copied — apply it at checkout!")}>Shop now <ArrowRight size={15}/></button></div></div>
      </section>

      <section className="trust-section"><p className="eyebrow">THE LADIES MART PROMISE</p><h2>A little more love in every order.</h2><div className="trust-items"><span>✧ Thoughtful styles</span><span>♡ Quality you can trust</span><span>✿ Prices you'll love</span><span>☺ Support that cares</span></div></section>

      <footer className="footer"><div className="footer-brand"><a className="brand" href="#"><span className="brand-mark">LM</span><span><strong>Ladies Mart</strong><small>Fashion for Every You ♥</small></span></a><p>Your everyday destination for women's fashion, from timeless ethnic wear to modern essentials.</p></div><div><b>Shop</b><a>Sarees</a><a>Kurtis</a><a>Dresses</a><a>Tops & Jeans</a></div><div><b>Customer care</b><a>Contact us</a><a>Shipping policy</a><a>Returns & exchanges</a><a>FAQs</a></div><div><b>Stay in style</b><p>Get updates on new arrivals and special offers.</p><div className="subscribe"><input placeholder="Your email address"/><button>Join</button></div></div><div className="copyright">© 2025 Ladies Mart. All rights reserved. <span>Made with ♥ for every woman.</span></div></footer>

      <nav className="mobile-bottom"><button className="active"><span>⌂</span>Home</button><button onClick={() => document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}><span>▦</span>Categories</button><Link href="/wishlist"><Heart/>Wishlist</Link><Link href="/cart"><ShoppingCart/>Cart</Link><Link href="/profile"><UserRound/>Profile</Link></nav>
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}
