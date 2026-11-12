"use client";
import { useCallback, useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { imageUrl } from "../../lib/image";

type Seller = { id: number; name: string; owner_name: string; phone: string; status: string; commission_pct: number };
type Prod = { id: number; name: string; category: string; price: number; old_price: number; stock: number; active: boolean; approval: string };
type Line = { item_id: number; name: string; size: string; qty: number; price: number; item_status: string; tracking: string | null;
  order_no: string; order_status: string; created_at: string; customer_name: string; phone: string; address: string; city: string; pincode: string; payment_method: string };
type Earn = { sales: number; commission: number; payout: number; inProgress: number; commissionPct: number };
const CATS = ["Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "Nightwear"];
const blank = { name: "", category: "Sarees", price: "", old_price: "", stock: "10", weight_g: "400" };

export default function SellerPage() {
  const [seller, setSeller] = useState<Seller | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", owner: "", phone: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"orders" | "products" | "add" | "earnings">("orders");
  const [prods, setProds] = useState<Prod[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [earn, setEarn] = useState<Earn | null>(null);
  const [track, setTrack] = useState<Record<number, string>>({});
  const [nf, setNf] = useState(blank);
  const [photo, setPhoto] = useState<File | null>(null);

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
    setMsg(""); setBusy(true);
    try {
      const r = await fetch("/api/seller/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, ...f }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "Something went wrong"); return; }
      load();
    } catch { setMsg("Network problem. Try again."); } finally { setBusy(false); }
  }
  async function logout() {
    await fetch("/api/seller/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setSeller(null); setLines([]); setProds([]);
  }
  async function setItem(l: Line, status: string) {
    const r = await fetch("/api/seller/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: l.item_id, status, tracking: track[l.item_id] ?? "" }) });
    const d = await r.json();
    setMsg(r.ok ? "Updated" : d.error || "Failed");
    load();
  }
  async function saveProd(p: Prod) {
    const r = await fetch(`/api/seller/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: p.price, old_price: p.old_price, stock: p.stock, active: p.active }) });
    const d = await r.json();
    setMsg(r.ok ? `${p.name} saved` : d.error || "Failed");
    load();
  }
  const editP = (id: number, k: keyof Prod, v: number | boolean) => setProds((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));

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
  async function addProduct() {
    setMsg("");
    if (nf.name.trim().length < 3) { setMsg("Enter the product name"); return; }
    if (!(Number(nf.price) >= 1)) { setMsg("Enter the selling price"); return; }
    if (!(Number(nf.old_price) >= Number(nf.price))) { setMsg("MRP must be equal to or more than the selling price"); return; }
    if (!photo) { setMsg("Choose a product photo"); return; }
    setBusy(true); setMsg("Uploading photo…");
    try {
      const fd = new FormData();
      fd.append("file", await shrink(photo), "product.jpg");
      const up = await fetch("/api/seller/upload", { method: "POST", body: fd });
      const ud = await up.json();
      if (!up.ok) { setMsg(ud.error || "Upload failed"); return; }
      setMsg("Saving product…");
      const r = await fetch("/api/seller/products", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nf.name, category: nf.category, price: Number(nf.price), old_price: Number(nf.old_price), stock: Number(nf.stock), weight_g: Number(nf.weight_g), image: ud.url }) });
      const d = await r.json();
      if (!r.ok) { setMsg(d.error || "Could not add product"); return; }
      setMsg("Product submitted. It will go live after admin approval.");
      setNf(blank); setPhoto(null); load(); setTab("products");
    } catch (e) { setMsg("Something went wrong: " + (e instanceof Error ? e.message : "try again")); } finally { setBusy(false); }
  }

  const box = { padding: 6 } as const;
  const num = { width: 80, padding: 6 } as const;
  const err = { color: "#c60058", fontWeight: 600 } as const;

  if (seller === undefined) return <PageShell title="Seller portal"><p className="muted">Loading…</p></PageShell>;

  if (!seller) return <PageShell title="Seller portal"><section className="form-card" style={{ maxWidth: 440 }}>
    <h2>{mode === "login" ? "Seller login" : "Become a Ladies Mart seller"}</h2>
    <div className="category-pills" style={{ margin: "8px 0" }}>
      <button className={mode === "login" ? "chosen" : ""} onClick={() => { setMode("login"); setMsg(""); }}>Login</button>
      <button className={mode === "register" ? "chosen" : ""} onClick={() => { setMode("register"); setMsg(""); }}>Register</button>
    </div>
    {mode === "register" && <>
      <label>Shop / business name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label>Owner name<input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></label>
    </>}
    <label>Mobile number<input value={f.phone} inputMode="numeric" maxLength={10} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
    <label>Password<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && auth()} /></label>
    {msg && <p style={err}>{msg}</p>}
    <button className="solid-action" disabled={busy} onClick={auth}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Register"}</button>
    {mode === "register" && <small className="muted">After registration our team will review and approve your account.</small>}
  </section></PageShell>;

  const approved = seller.status === "approved";
  return <PageShell title="Seller portal">
    <section className="form-card">
      <h2>{seller.name}</h2>
      <p className="muted">{seller.owner_name} · {seller.phone} · Commission {seller.commission_pct}%</p>
      {seller.status === "pending" && <p style={err}>Your account is waiting for approval. You can add products after approval.</p>}
      {seller.status === "suspended" && <p style={err}>Your account is suspended. Please contact Ladies Mart support.</p>}
    </section>
    <div className="category-pills" style={{ margin: "16px 0" }}>
      <button className={tab === "orders" ? "chosen" : ""} onClick={() => setTab("orders")}>Orders</button>
      <button className={tab === "products" ? "chosen" : ""} onClick={() => setTab("products")}>My products</button>
      {approved && <button className={tab === "add" ? "chosen" : ""} onClick={() => setTab("add")}>+ Add product</button>}
      <button className={tab === "earnings" ? "chosen" : ""} onClick={() => setTab("earnings")}>Earnings</button>
      <button onClick={load}>Refresh</button>
      <button onClick={logout}>Logout</button>
    </div>
    {msg && tab !== "add" && <p className="muted">{msg}</p>}

    {tab === "orders" && <section className="form-card"><h2>Orders to ship</h2>
      {lines.length === 0 && <p className="muted">No orders yet.</p>}
      {lines.map((l) => {
        const cancelled = l.order_status === "cancelled";
        return <div key={l.item_id} style={{ borderTop: "1px solid #f3d3e1", padding: "12px 0", opacity: cancelled ? 0.55 : 1 }}>
          <b>{l.order_no}</b> · {new Date(l.created_at).toLocaleDateString("en-IN")} · <span className="status">{cancelled ? "cancelled" : l.item_status}</span>
          <div>{l.name} ({l.size}) × {l.qty} — ₹{l.price * l.qty}</div>
          <div className="muted">Ship to: {l.customer_name}, <a href={`tel:${l.phone}`}>{l.phone}</a></div>
          <div className="muted">{l.address}, {l.city} - {l.pincode} · {l.payment_method}</div>
          {l.tracking && <div className="muted">Tracking: {l.tracking}</div>}
          {!cancelled && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input style={{ ...box, width: 160 }} placeholder="Tracking / AWB no." value={track[l.item_id] ?? ""} onChange={(e) => setTrack({ ...track, [l.item_id]: e.target.value })} />
            {l.item_status === "pending" && <button className="solid-action" onClick={() => setItem(l, "packed")}>Mark packed</button>}
            {l.item_status !== "shipped" && <button className="solid-action" onClick={() => setItem(l, "shipped")}>Mark shipped</button>}
            {l.item_status === "shipped" && <button className="solid-action" onClick={() => setItem(l, "shipped")}>Save tracking</button>}
          </div>}
        </div>;
      })}
    </section>}

    {tab === "products" && <section className="form-card"><h2>My products</h2>
      {prods.length === 0 && <p className="muted">No products yet.</p>}
      <div style={{ overflowX: "auto" }}>{prods.length > 0 && <table><thead><tr><th>Product</th><th>Status</th><th>Price</th><th>MRP</th><th>Stock</th><th>Live</th><th></th></tr></thead><tbody>
        {prods.map((p) => <tr key={p.id}>
          <td>{p.name}</td><td><span className="status">{p.approval}</span></td>
          <td><input style={num} type="number" value={p.price} onChange={(e) => editP(p.id, "price", Number(e.target.value))} /></td>
          <td><input style={num} type="number" value={p.old_price} onChange={(e) => editP(p.id, "old_price", Number(e.target.value))} /></td>
          <td><input style={num} type="number" value={p.stock} onChange={(e) => editP(p.id, "stock", Number(e.target.value))} /></td>
          <td><input type="checkbox" checked={p.active} onChange={(e) => editP(p.id, "active", e.target.checked)} /></td>
          <td><button className="solid-action" onClick={() => saveProd(p)}>Save</button></td>
        </tr>)}
      </tbody></table>}</div>
    </section>}

    {tab === "add" && approved && <section className="form-card"><h2>Add product</h2>
      <div className="form-grid">
        <label className="wide">Product name<input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} /></label>
        <label>Category<select value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })} style={{ padding: 10 }}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Selling price (₹)<input type="number" inputMode="numeric" value={nf.price} onChange={(e) => setNf({ ...nf, price: e.target.value })} /></label>
        <label>MRP (₹)<input type="number" inputMode="numeric" value={nf.old_price} onChange={(e) => setNf({ ...nf, old_price: e.target.value })} /></label>
        <label>Stock<input type="number" inputMode="numeric" value={nf.stock} onChange={(e) => setNf({ ...nf, stock: e.target.value })} /></label>
        <label>Weight (grams)<input type="number" inputMode="numeric" value={nf.weight_g} onChange={(e) => setNf({ ...nf, weight_g: e.target.value })} /></label>
        <label className="wide">Photo<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></label>
      </div>
      {msg && <p style={{ color: msg.startsWith("Product submitted") ? "#1a7f37" : msg.endsWith("…") ? "#555" : "#c60058", fontWeight: 600 }}>{msg}</p>}
      <button className="solid-action" disabled={busy} onClick={addProduct}>{busy ? "Please wait…" : "Submit product"}</button>
    </section>}

    {tab === "earnings" && <>
      <div className="admin-stats">
        {earn && [["Delivered sales", `₹${earn.sales}`], [`Commission (${earn.commissionPct}%)`, `₹${earn.commission}`], ["Your payout", `₹${earn.payout}`], ["In progress", `₹${earn.inProgress}`]].map(([k, v]) =>
          <div className="admin-stat" key={String(k)}><small>{k}</small><strong>{v}</strong></div>)}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>Payout is calculated on delivered orders only. Settlement is done by Ladies Mart as per your seller agreement.</p>
    </>}
  </PageShell>;
}
