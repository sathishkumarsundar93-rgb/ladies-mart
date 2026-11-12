"use client";
import { useCallback, useEffect, useState } from "react";
import PageShell from "../components/PageShell";

type Item = { name: string; size: string; qty: number; price: number };
type Order = { id: number; order_no: string; customer_name: string; phone: string; address: string; city: string; pincode: string; total: number; status: string; created_at: string; items: Item[] };
type Prod = { id: number; name: string; category: string; price: number; old_price: number; stock: number; active: boolean };
type Stats = { orders: number; sales: number; pending: number; lowStock: number };
const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [prods, setProds] = useState<Prod[]>([]);

  const load = useCallback(async () => {
    const [o, p] = await Promise.all([fetch("/api/admin/orders"), fetch("/api/admin/products")]);
    if (o.status === 401) { setAuthed(false); return; }
    if (o.ok) { const d = await o.json(); setOrders(d.orders); setStats(d.stats); }
    if (p.ok) setProds(await p.json());
    setAuthed(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function login() {
    setMsg("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (!r.ok) { setMsg("Wrong password"); return; }
    setPw(""); load();
  }
  async function logout() { await fetch("/api/admin/login", { method: "DELETE" }); setAuthed(false); }

  async function setStatus(id: number, status: string) {
    const r = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const d = await r.json();
    setMsg(r.ok ? "Order updated" : d.error || "Failed");
    load();
  }
  async function saveProd(p: Prod) {
    const r = await fetch(`/api/admin/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: p.price, old_price: p.old_price, stock: p.stock, active: p.active }) });
    const d = await r.json();
    setMsg(r.ok ? `${p.name} saved` : d.error || "Failed");
    load();
  }
  const edit = (id: number, k: keyof Prod, v: number | boolean) => setProds((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));

  if (authed === null) return <PageShell title="Admin"><p className="muted">Loading…</p></PageShell>;
  if (!authed)
    return <PageShell title="Admin login"><section className="form-card" style={{ maxWidth: 420 }}>
      <h2>Store admin</h2>
      <label>Password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} /></label>
      {msg && <p style={{ color: "#c60058", fontWeight: 600 }}>{msg}</p>}
      <button className="solid-action" onClick={login}>Login</button>
    </section></PageShell>;

  const num = { width: 80, padding: 6 } as const;
  return <PageShell title="Admin dashboard">
    <div className="admin-stats">
      {[["Sales", `₹${stats?.sales ?? 0}`], ["Orders", stats?.orders ?? 0], ["Pending", stats?.pending ?? 0], ["Low stock", stats?.lowStock ?? 0]].map(([k, v]) =>
        <div className="admin-stat" key={String(k)}><small>{k}</small><strong>{v}</strong></div>)}
    </div>
    <div className="category-pills" style={{ margin: "16px 0" }}>
      <button className={tab === "orders" ? "chosen" : ""} onClick={() => setTab("orders")}>Orders</button>
      <button className={tab === "products" ? "chosen" : ""} onClick={() => setTab("products")}>Products</button>
      <button onClick={load}>Refresh</button>
      <button onClick={logout}>Logout</button>
    </div>
    {msg && <p className="muted">{msg}</p>}

    {tab === "orders" && <section className="form-card"><h2>Orders</h2>
      {orders.length === 0 && <p className="muted">No orders yet.</p>}
      {orders.map((o) => <div key={o.id} style={{ borderTop: "1px solid #f3d3e1", padding: "12px 0" }}>
        <b>{o.order_no}</b> · ₹{o.total} · <span className="status">{o.status}</span>
        <div className="muted">{new Date(o.created_at).toLocaleString("en-IN")}</div>
        <div>{o.customer_name} · <a href={`tel:${o.phone}`}>{o.phone}</a></div>
        <div className="muted">{o.address}, {o.city} - {o.pincode}</div>
        <ul style={{ margin: "6px 0 8px 18px" }}>{o.items.map((i, n) => <li key={n}>{i.name} ({i.size}) × {i.qty} — ₹{i.price * i.qty}</li>)}</ul>
        <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ padding: 6 }}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>)}
    </section>}

    {tab === "products" && <section className="form-card"><h2>Products</h2>
      <div style={{ overflowX: "auto" }}><table><thead><tr><th>Product</th><th>Price</th><th>MRP</th><th>Stock</th><th>Live</th><th></th></tr></thead><tbody>
        {prods.map((p) => <tr key={p.id}>
          <td>{p.name}</td>
          <td><input style={num} type="number" value={p.price} onChange={(e) => edit(p.id, "price", Number(e.target.value))} /></td>
          <td><input style={num} type="number" value={p.old_price} onChange={(e) => edit(p.id, "old_price", Number(e.target.value))} /></td>
          <td><input style={num} type="number" value={p.stock} onChange={(e) => edit(p.id, "stock", Number(e.target.value))} /></td>
          <td><input type="checkbox" checked={p.active} onChange={(e) => edit(p.id, "active", e.target.checked)} /></td>
          <td><button className="solid-action" onClick={() => saveProd(p)}>Save</button></td>
        </tr>)}
      </tbody></table></div>
    </section>}
  </PageShell>;
}
