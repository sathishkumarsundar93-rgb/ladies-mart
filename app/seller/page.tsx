"use client";
import "./seller.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { imageUrl } from "../../lib/image";
import { CATEGORIES, COLOURS, SIZES, SUBCATS } from "../../lib/catalog";

type Seller = { id: number; name: string; owner_name: string; phone: string; status: string; commission_pct: number };
type Prod = { id: number; name: string; category: string; price: number; old_price: number; stock: number; active: boolean; approval: string; image: string };
type Line = { item_id: number; name: string; size: string; color: string; qty: number; price: number; item_status: string; tracking: string | null;
  order_no: string; order_status: string; created_at: string; customer_name: string; phone: string; address: string; city: string; pincode: string; payment_method: string };
type Earn = { sales: number; commission: number; payout: number; inProgress: number; commissionPct: number };
type Pic = { file: File; url: string };
type Tab = "home" | "upload" | "products" | "orders" | "earnings";

const blank = { name: "", category: CATEGORIES[0], sub: SUBCATS[CATEGORIES[0]][0], mrp: "", sell: "", stock: "", weight: "400", desc: "" };
const NAV: [Tab, string, string][] = [["home", "🏠", "Dashboard"], ["upload", "☁️", "Upload product"], ["products", "📦", "My products"], ["orders", "🛒", "Orders"], ["earnings", "📊", "Earnings"]];

async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("resize failed"))), "image/jpeg", 0.85));
  } catch { return file; }
}

export default function SellerPage() {
  const [seller, setSeller] = useState<Seller | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", owner: "", phone: "", password: "" });
  const [authMsg, setAuthMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [prods, setProds] = useState<Prod[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [earn, setEarn] = useState<Earn | null>(null);
  const [track, setTrack] = useState<Record<number, string>>({});
  const [toast, setToast] = useState("");
  const tt = useRef<ReturnType<typeof setTimeout> | null>(null);

  // upload form
  const [nf, setNf] = useState(blank);
  const [pics, setPics] = useState<Pic[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (m: string) => { setToast(m); if (tt.current) clearTimeout(tt.current); tt.current = setTimeout(() => setToast(""), 2800); };

  const load = useCallback(async () => {
    try {
      const me = await (await fetch("/api/seller/auth")).json();
      setSeller(me.seller);
      if (!me.seller) return;
      const [p, o] = await Promise.all([fetch("/api/seller/products"), fetch("/api/seller/orders")]);
      if (p.ok) setProds(await p.json());
      if (o.ok) { const d = await o.json(); setLines(d.items); setEarn(d.earnings); }
    } catch { setSeller(null); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function auth() {
    setAuthMsg(""); setBusy(true);
    try {
      const r = await fetch("/api/seller/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, ...f }) });
      const d = await r.json();
      if (!r.ok) { setAuthMsg(d.error || "Something went wrong"); return; }
      load();
    } catch { setAuthMsg("Network problem. Try again."); } finally { setBusy(false); }
  }
  async function logout() {
    await fetch("/api/seller/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setSeller(null); setLines([]); setProds([]);
  }
  async function setItem(l: Line, status: string) {
    const r = await fetch("/api/seller/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: l.item_id, status, tracking: track[l.item_id] ?? "" }) });
    const d = await r.json();
    say(r.ok ? "Order updated" : d.error || "Failed");
    load();
  }
  async function saveProd(p: Prod) {
    const r = await fetch(`/api/seller/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: p.price, old_price: p.old_price, stock: p.stock, active: p.active }) });
    const d = await r.json();
    say(r.ok ? `${p.name} saved` : d.error || "Failed");
    load();
  }
  const editP = (id: number, k: keyof Prod, v: number | boolean) => setProds((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));

  function addFiles(list: FileList | File[]) {
    let msg = "";
    const ok: Pic[] = [];
    for (const file of Array.from(list)) {
      if (pics.length + ok.length >= 5) { msg = "Maximum 5 photos"; break; }
      if (!/^image\/(jpeg|png)$/.test(file.type)) { msg = "Only JPG or PNG allowed"; continue; }
      if (file.size > 5 * 1024 * 1024) { msg = `${file.name} is over 5 MB`; continue; }
      ok.push({ file, url: URL.createObjectURL(file) });
    }
    setPics((p) => [...p, ...ok]);
    setErr((e) => ({ ...e, img: msg }));
  }
  function removePic(i: number) { setPics((p) => { URL.revokeObjectURL(p[i].url); return p.filter((_, n) => n !== i); }); }
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  function resetForm() { pics.forEach((p) => URL.revokeObjectURL(p.url)); setNf(blank); setPics([]); setSizes([]); setCols([]); setErr({}); }

  async function publish() {
    const e: Record<string, string> = {};
    const mrp = Number(nf.mrp), sell = Number(nf.sell) || mrp;
    if (!pics.length) e.img = "Add at least one photo";
    if (nf.name.trim().length < 3) e.name = "Enter the product name";
    if (!(mrp >= 1)) e.price = "Enter the price"; else if (sell > mrp) e.price = "Selling price cannot be more than the price";
    else if (nf.stock === "" || Number(nf.stock) < 0) e.price = "Enter the stock quantity";
    else if (!(Number(nf.weight) >= 1)) e.price = "Enter the weight in grams";
    if (nf.desc.trim().length < 10) e.desc = "Write at least 10 characters about the product";
    if (!sizes.length || !cols.length) e.opt = "Choose at least one size and one colour";
    setErr(e);
    if (Object.keys(e).length) { say("Please fix the highlighted fields"); return; }

    setBusy(true); say("Uploading photos…");
    try {
      const urls: string[] = [];
      for (const p of pics) {
        const fd = new FormData();
        fd.append("file", await shrink(p.file), "product.jpg");
        const up = await fetch("/api/seller/upload", { method: "POST", body: fd });
        const ud = await up.json();
        if (!up.ok) { say(ud.error || "Upload failed"); return; }
        urls.push(ud.url);
      }
      say("Saving product…");
      const r = await fetch("/api/seller/products", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nf.name, category: nf.category, sub_category: nf.sub, description: nf.desc, price: sell, old_price: mrp,
          stock: Number(nf.stock), weight_g: Number(nf.weight), sizes, colors: cols, images: urls }) });
      const d = await r.json();
      if (!r.ok) { say(d.error || "Could not add product"); return; }
      say("Submitted. Your product goes live after approval.");
      resetForm(); load(); setTab("products");
    } catch (x) { say("Something went wrong: " + (x instanceof Error ? x.message : "try again")); } finally { setBusy(false); }
  }

  if (seller === undefined) return <div className="sp"><p style={{ padding: 24 }}>Loading…</p></div>;

  if (!seller) return <div className="sp">
    <section className="sp-auth sp-glass">
      <Link className="sp-logo" href="/">🛍 Ladies Mart</Link>
      <h2 style={{ marginTop: 12 }}>{mode === "login" ? "Seller login" : "Become a Ladies Mart seller"}</h2>
      <div className="sp-tabs">
        <button className={`sp-sz ${mode === "login" ? "sp-on" : ""}`} style={{ padding: "0 18px" }} onClick={() => { setMode("login"); setAuthMsg(""); }}>Login</button>
        <button className={`sp-sz ${mode === "register" ? "sp-on" : ""}`} style={{ padding: "0 18px" }} onClick={() => { setMode("register"); setAuthMsg(""); }}>Register</button>
      </div>
      <div className="sp-f">
        {mode === "register" && <>
          <label>Shop / business name<input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Owner name<input type="text" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></label>
        </>}
        <label>Mobile number<input type="text" value={f.phone} inputMode="numeric" maxLength={10} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label>Password<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && auth()} /></label>
        <div className="sp-err">{authMsg}</div>
        <button className="sp-btn" disabled={busy} onClick={auth}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Register"}</button>
        {mode === "register" && <small className="sp-mut">After registration our team will review and approve your account.</small>}
      </div>
    </section>
  </div>;

  const approved = seller.status === "approved";
  const toShip = lines.filter((l) => l.order_status !== "cancelled" && l.item_status === "pending").length;
  const live = prods.filter((p) => p.approval === "approved" && p.active).length;
  const waiting = prods.filter((p) => p.approval === "pending").length;
  const mrp = Number(nf.mrp) || 0, sellP = Number(nf.sell) || mrp, price = sellP && sellP <= mrp ? sellP : mrp;

  return <div className="sp">
    <header className="sp-top sp-glass">
      <Link className="sp-logo" href="/">🛍 Ladies Mart<small>Seller portal</small></Link>
      <div style={{ flex: 1 }} />
      <div className="sp-who"><div className="sp-av">{seller.name.charAt(0).toUpperCase()}</div><span>{seller.name}<small>Seller</small></span></div>
    </header>
    <div className="sp-shell">
      <aside className="sp-side sp-glass">
        <div className="sp-av">{seller.name.charAt(0).toUpperCase()}</div>
        <h2>{seller.name}</h2><p>{seller.owner_name} · {seller.commission_pct}% commission</p>
        <nav className="sp-nav">
          {NAV.map(([k, ic, label]) => <button key={k} className={tab === k ? "sp-on" : ""} onClick={() => setTab(k)}>{ic} {label}{k === "orders" && toShip > 0 && <em>{toShip}</em>}</button>)}
          <button onClick={logout}>↪️ Logout</button>
        </nav>
        <div className="sp-grow">Grow your business with Ladies Mart ♥</div>
      </aside>

      <section className="sp-main">
        {!approved && <div className="sp-glass sp-card sp-span"><div className="sp-warn" style={{ marginTop: 0 }}>
          {seller.status === "pending" ? "Your account is waiting for approval. You can upload products after approval." : "Your account is suspended. Please contact Ladies Mart support."}</div></div>}

        {tab === "home" && <>
          <div className="sp-hd sp-glass"><div><h1>Welcome, {seller.owner_name}</h1><p>Here is how your shop is doing</p></div>
            {approved && <button className="sp-pill" onClick={() => setTab("upload")}>+ Upload product</button>}</div>
          <div className="sp-stats">
            <div className="sp-glass sp-stat"><small>Orders to ship</small><b>{toShip}</b></div>
            <div className="sp-glass sp-stat"><small>Live products</small><b>{live}</b></div>
            <div className="sp-glass sp-stat"><small>Waiting approval</small><b>{waiting}</b></div>
            <div className="sp-glass sp-stat"><small>Your payout so far</small><b>₹{earn?.payout ?? 0}</b></div>
          </div>
        </>}

        {tab === "upload" && (approved ? <>
          <div className="sp-hd sp-glass"><div><h1>Upload product</h1><p>Add your latest fashion products to reach more customers</p></div></div>
          <div className="sp-glass sp-card">
            <h3>Product images <span className="sp-req">*</span></h3>
            <div className={`sp-drop ${over ? "sp-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}>
              <div className="sp-ic">☁️</div><b>Drag &amp; drop images here</b>
              <div style={{ color: "var(--mut)", margin: "4px 0 10px" }}>or</div>
              <button className="sp-btn" type="button" onClick={() => fileRef.current?.click()}>Choose files</button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
              <div style={{ color: "var(--mut)", fontSize: 12.5, marginTop: 8 }}>JPG or PNG, up to 5 photos, max 5 MB each. First photo is the cover.</div>
            </div>
            <div className="sp-thumbs">{pics.map((p, i) => <div key={p.url} className={`sp-th ${i === 0 ? "sp-cover" : ""}`}>
              <img src={p.url} alt={`Photo ${i + 1}`} /><button type="button" onClick={() => removePic(i)} aria-label="Remove photo">✕</button>{i === 0 && <span>Cover</span>}</div>)}</div>
            <div className="sp-err">{err.img}</div>

            <div className="sp-f"><label>Product name <span className="sp-req">*</span>
              <input type="text" maxLength={120} value={nf.name} placeholder="Enter product name…" onChange={(e) => setNf({ ...nf, name: e.target.value })} /><div className="sp-err">{err.name}</div></label></div>
            <div className="sp-f sp-c2">
              <label>Category <span className="sp-req">*</span><select value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value, sub: SUBCATS[e.target.value][0] })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label>Sub category <span className="sp-req">*</span><select value={nf.sub} onChange={(e) => setNf({ ...nf, sub: e.target.value })}>{SUBCATS[nf.category].map((c) => <option key={c}>{c}</option>)}</select></label>
            </div>
            <div className="sp-f sp-c3">
              <label>Price / MRP (₹) <span className="sp-req">*</span><input type="number" inputMode="numeric" min={1} value={nf.mrp} placeholder="Enter price…" onChange={(e) => setNf({ ...nf, mrp: e.target.value })} /></label>
              <label>Selling price (₹)<input type="number" inputMode="numeric" min={1} value={nf.sell} placeholder="Discount price…" onChange={(e) => setNf({ ...nf, sell: e.target.value })} /></label>
              <label>Stock quantity <span className="sp-req">*</span><input type="number" inputMode="numeric" min={0} value={nf.stock} placeholder="Enter quantity…" onChange={(e) => setNf({ ...nf, stock: e.target.value })} /></label>
            </div>
            <div className="sp-f sp-c2"><label>Weight with packing (grams) <span className="sp-req">*</span><input type="number" inputMode="numeric" min={1} value={nf.weight} onChange={(e) => setNf({ ...nf, weight: e.target.value })} /></label><span /></div>
            <div className="sp-err">{err.price}</div>
            <div className="sp-f"><label>Product description <span className="sp-req">*</span>
              <textarea maxLength={600} value={nf.desc} placeholder="Describe fabric, fit, wash care, what’s in the box…" onChange={(e) => setNf({ ...nf, desc: e.target.value })} /><div className="sp-err">{err.desc}</div></label></div>
            <div className="sp-row2">
              <div><b>Size <span className="sp-req">*</span></b><div className="sp-opts">{SIZES.map((s) => <button key={s} type="button" className={`sp-sz ${sizes.includes(s) ? "sp-on" : ""}`} onClick={() => toggle(sizes, setSizes, s)}>{s}</button>)}</div></div>
              <div><b>Colour <span className="sp-req">*</span></b><div className="sp-opts">{Object.entries(COLOURS).map(([n, c]) => <button key={n} type="button" title={n} aria-label={n} className={`sp-sw ${cols.includes(n) ? "sp-on" : ""}`} style={{ background: c }} onClick={() => toggle(cols, setCols, n)} />)}</div></div>
            </div>
            <div className="sp-err">{err.opt}</div>
          </div>

          <aside className="sp-pv sp-glass sp-card"><h3>👁 Product preview</h3>
            <div className="sp-pvimg">{pics[0] ? <img src={pics[0].url} alt="" /> : "👗"}<span className="sp-live">Live preview</span></div>
            <div className="sp-pvn">{nf.name.trim() || "Your product name"}</div>
            <div className="sp-pvp"><span>₹{price}</span>{mrp > price && <><del>₹{mrp}</del><em>{Math.round((1 - price / mrp) * 100)}% off</em></>}</div>
            <div style={{ color: "var(--mut)", fontSize: 13, marginTop: 4 }}>{[sizes.length ? "Sizes: " + sizes.join(", ") : "", cols.length ? "Colours: " + cols.join(", ") : ""].filter(Boolean).join(" · ")}</div>
            <ul className="sp-tips"><li>Add high quality images</li><li>Set a competitive price</li><li>Reach more customers</li></ul>
          </aside>
          <div className="sp-bar"><button className="sp-ghost" type="button" onClick={resetForm}>↻ Reset form</button><button className="sp-btn" type="button" disabled={busy} onClick={publish}>{busy ? "Please wait…" : "Publish product ➤"}</button></div>
        </> : <div className="sp-glass sp-card sp-span"><p className="sp-mut">Uploading opens after your account is approved.</p></div>)}

        {tab === "products" && <div className="sp-glass sp-card sp-span"><h3>My products</h3>
          {prods.length === 0 && <p className="sp-mut">No products yet.</p>}
          {prods.length > 0 && <div style={{ overflowX: "auto" }}><table className="sp-tbl"><thead><tr><th></th><th>Product</th><th>Status</th><th>Price</th><th>MRP</th><th>Stock</th><th>Live</th><th></th></tr></thead><tbody>
            {prods.map((p) => <tr key={p.id}>
              <td><img src={imageUrl(p.image, 120)} alt="" style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 8 }} /></td>
              <td>{p.name}</td><td><span className="sp-chip">{p.approval}</span></td>
              <td><input type="number" value={p.price} onChange={(e) => editP(p.id, "price", Number(e.target.value))} /></td>
              <td><input type="number" value={p.old_price} onChange={(e) => editP(p.id, "old_price", Number(e.target.value))} /></td>
              <td><input type="number" value={p.stock} onChange={(e) => editP(p.id, "stock", Number(e.target.value))} /></td>
              <td><input type="checkbox" checked={p.active} onChange={(e) => editP(p.id, "active", e.target.checked)} /></td>
              <td><button className="sp-btn" style={{ padding: "6px 14px" }} onClick={() => saveProd(p)}>Save</button></td>
            </tr>)}</tbody></table></div>}
        </div>}

        {tab === "orders" && <div className="sp-glass sp-card sp-span"><h3>Orders to ship</h3>
          {lines.length === 0 && <p className="sp-mut">No orders yet.</p>}
          {lines.map((l) => {
            const cancelled = l.order_status === "cancelled";
            return <div key={l.item_id} className="sp-line" style={{ opacity: cancelled ? 0.55 : 1 }}>
              <b>{l.order_no}</b> · {new Date(l.created_at).toLocaleDateString("en-IN")} · <span className="sp-chip">{cancelled ? "cancelled" : l.item_status}</span>
              <div>{l.name} ({l.size}{l.color ? `, ${l.color}` : ""}) × {l.qty} — ₹{l.price * l.qty}</div>
              <div className="sp-mut">Ship to: {l.customer_name}, <a href={`tel:${l.phone}`}>{l.phone}</a></div>
              <div className="sp-mut">{l.address}, {l.city} - {l.pincode} · {l.payment_method}</div>
              {l.tracking && <div className="sp-mut">Tracking: {l.tracking}</div>}
              {!cancelled && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <input type="text" style={{ width: 170 }} placeholder="Tracking / AWB no." value={track[l.item_id] ?? ""} onChange={(e) => setTrack({ ...track, [l.item_id]: e.target.value })} />
                {l.item_status === "pending" && <button className="sp-btn" style={{ padding: "8px 16px" }} onClick={() => setItem(l, "packed")}>Mark packed</button>}
                {l.item_status !== "shipped" && <button className="sp-btn" style={{ padding: "8px 16px" }} onClick={() => setItem(l, "shipped")}>Mark shipped</button>}
                {l.item_status === "shipped" && <button className="sp-btn" style={{ padding: "8px 16px" }} onClick={() => setItem(l, "shipped")}>Save tracking</button>}
              </div>}
            </div>;
          })}
        </div>}

        {tab === "earnings" && <>
          <div className="sp-hd sp-glass"><div><h1>Earnings</h1><p>Payout is calculated on delivered orders only</p></div></div>
          <div className="sp-stats">
            {earn && [["Delivered sales", `₹${earn.sales}`], [`Commission (${earn.commissionPct}%)`, `₹${earn.commission}`], ["Your payout", `₹${earn.payout}`], ["In progress", `₹${earn.inProgress}`]].map(([k, v]) =>
              <div className="sp-glass sp-stat" key={k}><small>{k}</small><b>{v}</b></div>)}
          </div>
          <p className="sp-mut sp-span">Settlement is done by Ladies Mart as per your seller agreement.</p>
        </>}
      </section>
    </div>
    {toast && <div className="sp-toast">{toast}</div>}
  </div>;
}
