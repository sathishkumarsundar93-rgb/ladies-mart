"use client";
import "./seller.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Md from "../components/Md";
import { imageUrl } from "../../lib/image";
import { FIXED1, FORM_SIZES, HEX, OCC, PTYPE, SLOTS, SPEC, SUBCATS, type Spec } from "../../lib/catalog";
import { DISPATCH, GST_RATES, ORIGINS, RETURN_PERIODS } from "../../lib/productForm";

type Seller = { id: number; name: string; owner_name: string; phone: string; status: string; commission_pct: number };
type Row = { id: number; name: string; category: string; sku: string | null; price: number; old_price: number; stock: number; stock_by_size: Record<string, number> | null; active: boolean; approval: string; image: string };
type Line = { item_id: number; name: string; size: string; color: string; qty: number; price: number; item_status: string; tracking: string | null;
  order_no: string; order_status: string; created_at: string; customer_name: string; phone: string; address: string; city: string; pincode: string; payment_method: string };
type Earn = { sales: number; commission: number; payout: number; inProgress: number; commissionPct: number };
type Img = { url: string; file?: File };
type Form = {
  cat: string; sub: string; ptype: string; name: string; brand: string; sku: string; desc: string; hl: string[]; occ: string[];
  a: Record<string, string>; pack: string; comp: string; model: string; kw: string;
  sizes: string[]; stockBy: Record<string, string>; stock: string; cols: string[];
  imgs: Record<string, Img>; cimgs: Record<string, Img>; video: Img | null;
  mrp: string; sell: string; buy: string; hsn: string; gst: string; minq: string; maxq: string;
  wt: string; pl: string; pw: string; ph: string; disp: string; origin: string;
  ret: boolean; exch: boolean; rper: string; rpol: string; mfr: string; mfrAddr: string; decl: boolean;
};
type TextKey = "name" | "brand" | "sku" | "pack" | "comp" | "model" | "kw" | "stock" | "mrp" | "sell" | "buy" | "hsn" | "minq" | "maxq" | "wt" | "pl" | "pw" | "ph" | "mfr" | "mfrAddr" | "rpol" | "desc";
type SelKey = "sub" | "ptype" | "gst" | "disp" | "origin" | "rper";
type Draft = { id: number; title: string; data: Record<string, unknown>; updated_at: string };
type Tab = "home" | "add" | "products" | "orders" | "earnings";

const STEPS = ["Basic Info", "Images & Media", "Size & Variants", "Pricing & Inventory", "Shipping & Publish"];
const NAVI: [string, string, Tab | ""][] = [["🏠", "Seller dashboard", "home"], ["➕", "Add new product", "add"], ["📦", "My products", "products"], ["🛒", "Orders", "orders"], ["💰", "Earnings", "earnings"], ["👤", "Profile", ""], ["🔔", "Notifications", ""], ["❓", "Support", ""]];
const CATS = Object.keys(SUBCATS);

function blank(cat = "Sarees"): Form {
  const a: Record<string, string> = {};
  SPEC[cat].forEach((s) => { if (s[2] === "n") a[s[0]] = String(s[3] ?? ""); });
  return { cat, sub: SUBCATS[cat][0], ptype: PTYPE[cat][0], name: "", brand: "", sku: "", desc: "", hl: ["", "", ""], occ: [], a, pack: "", comp: "", model: "", kw: "",
    sizes: [], stockBy: {}, stock: "", cols: [], imgs: {}, cimgs: {}, video: null, mrp: "", sell: "", buy: "", hsn: "", gst: "", minq: "1", maxq: "10",
    wt: "", pl: "", pw: "", ph: "", disp: "", origin: "India", ret: true, exch: false, rper: "7 days", rpol: "", mfr: "", mfrAddr: "", decl: false };
}
const isCloud = (u: string) => u.startsWith("https://res.cloudinary.com/");
const showIf = (s: Spec, a: Record<string, string>) => !s[5] || Object.entries(s[5]).every(([k, v]) => a[k] === v);
const discount = (f: Form) => { const m = Number(f.mrp), s = Number(f.sell); return m > 0 && s > 0 && s <= m ? Math.round((1 - s / m) * 100) : 0; };

function miss(f: Form, s: number): string[] {
  const m: string[] = [], fixed = FIXED1(f.cat);
  if (s === 0) {
    if (f.name.trim().length < 3) m.push("Product name");
    if (!f.sku.trim()) m.push("SKU / product code");
    if (f.desc.trim().length < 10) m.push("Description (10+ characters)");
    if (!f.pack.trim()) m.push("Package contents");
    SPEC[f.cat].forEach((sp) => { if (sp[4] && showIf(sp, f.a) && !f.a[sp[0]]) m.push(sp[1]); });
  }
  if (s === 1) {
    if (!f.imgs.main) m.push("Main image");
    else if (Object.keys(f.imgs).length < 3) m.push("At least 3 photos (main + 2 more)");
  }
  if (s === 2) {
    if (fixed) { if (f.stock === "" || Number(f.stock) < 0) m.push("Available stock"); }
    else {
      if (!f.cols.length) m.push("Colours");
      if (!f.sizes.length) m.push("Sizes");
      else if (f.sizes.some((z) => f.stockBy[z] === undefined || f.stockBy[z] === "")) m.push("Stock for every size");
      if (f.cols.length > 1) { const nc = f.cols.filter((c) => !f.cimgs[c]); if (nc.length) m.push("Photo for " + nc.join(", ")); }
    }
  }
  if (s === 3) {
    if (!(Number(f.mrp) > 0)) m.push("MRP");
    if (!(Number(f.sell) > 0)) m.push("Selling price"); else if (Number(f.sell) > Number(f.mrp)) m.push("Selling price must not exceed MRP");
    if (f.hsn && !/^\d{4,8}$/.test(f.hsn)) m.push("HSN code (4 to 8 digits)");
    if (Number(f.minq) < 1) m.push("Minimum quantity");
    if (Number(f.maxq) < Number(f.minq)) m.push("Maximum quantity");
  }
  if (s === 4) {
    if (!(Number(f.wt) > 0)) m.push("Weight");
    if (!(Number(f.pl) > 0)) m.push("Package length");
    if (!(Number(f.pw) > 0)) m.push("Package width");
    if (!(Number(f.ph) > 0)) m.push("Package height");
    if (!f.disp) m.push("Dispatch time");
    if (f.ret && !f.rper) m.push("Return period");
    if (!f.mfr.trim()) m.push("Manufacturer / packer name");
    if (f.mfrAddr.trim().length < 8) m.push("Manufacturer / packer address");
    if (!f.decl) m.push("Seller declaration");
  }
  return m;
}

async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const sc = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("resize failed"))), "image/jpeg", 0.85));
  } catch { return file; }
}
async function uploadOne(file: File): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const fd = new FormData();
  if (isVideo) fd.append("file", file, file.name); else fd.append("file", await shrink(file), "photo.jpg");
  const r = await fetch("/api/seller/upload", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Upload failed");
  return d.url as string;
}

export default function SellerPage() {
  const [seller, setSeller] = useState<Seller | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [auth, setAuth] = useState({ name: "", owner: "", phone: "", password: "" });
  const [authMsg, setAuthMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(blank());
  const [draftId, setDraftId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [prods, setProds] = useState<Row[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [earn, setEarn] = useState<Earn | null>(null);
  const [track, setTrack] = useState<Record<number, string>>({});
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"" | "size" | "guide" | "preview">("");
  const tt = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slot = useRef("");

  const say = (m: string) => { setToast(m); if (tt.current) clearTimeout(tt.current); tt.current = setTimeout(() => setToast(""), 3200); };
  const setT = (k: TextKey, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setS = (k: SelKey, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setA = (k: string, v: string) => setF((p) => ({ ...p, a: { ...p.a, [k]: v } }));
  const toggle = (k: "occ" | "sizes" | "cols", v: string) => setF((p) => {
    const has = p[k].includes(v);
    const next = { ...p, [k]: has ? p[k].filter((x) => x !== v) : [...p[k], v] };
    if (has && k === "sizes") { const sb = { ...p.stockBy }; delete sb[v]; next.stockBy = sb; }
    if (has && k === "cols") { const ci = { ...p.cimgs }; delete ci[v]; next.cimgs = ci; }
    return next;
  });
  const changeCat = (c: string) => setF((p) => ({ ...blank(c), name: p.name, brand: p.brand, sku: p.sku, desc: p.desc, hl: p.hl, occ: p.occ, imgs: p.imgs, video: p.video,
    mrp: p.mrp, sell: p.sell, buy: p.buy, hsn: p.hsn, gst: p.gst, minq: p.minq, maxq: p.maxq, wt: p.wt, pl: p.pl, pw: p.pw, ph: p.ph, disp: p.disp, origin: p.origin,
    ret: p.ret, exch: p.exch, rper: p.rper, rpol: p.rpol, pack: p.pack, kw: p.kw, comp: p.comp, mfr: p.mfr, mfrAddr: p.mfrAddr, decl: p.decl }));

  const load = useCallback(async () => {
    try {
      const me = await (await fetch("/api/seller/auth")).json();
      setSeller(me.seller);
      if (!me.seller) return;
      const [p, o, d] = await Promise.all([fetch("/api/seller/products"), fetch("/api/seller/orders"), fetch("/api/seller/drafts")]);
      if (p.ok) setProds(await p.json());
      if (o.ok) { const x = await o.json(); setLines(x.items); setEarn(x.earnings); }
      if (d.ok) setDrafts(await d.json());
    } catch { setSeller(null); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function doAuth() {
    setAuthMsg(""); setBusy(true);
    try {
      const r = await fetch("/api/seller/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, ...auth }) });
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
  const editRow = (id: number, patch: Partial<Row>) => setProds((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  async function saveRow(p: Row) {
    const sized = !!p.stock_by_size && Object.keys(p.stock_by_size).length > 0;
    const r = await fetch(`/api/seller/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: p.price, old_price: p.old_price, active: p.active, ...(sized ? { stock_by_size: p.stock_by_size } : { stock: p.stock }) }) });
    const d = await r.json();
    say(r.ok ? `${p.name} saved` : d.error || "Failed");
    load();
  }

  function pickFile(files: FileList | null) {
    const file = files?.[0];
    const key = slot.current;
    if (!file || !key) return;
    if (!/^image\/(jpeg|png)$/.test(file.type)) { say("Only JPG or PNG allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { say("Image is over 5 MB"); return; }
    const img: Img = { url: URL.createObjectURL(file), file };
    if (key.startsWith("c:")) setF((p) => ({ ...p, cimgs: { ...p.cimgs, [key.slice(2)]: img } }));
    else setF((p) => ({ ...p, imgs: { ...p.imgs, [key]: img } }));
  }
  function pickVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { say("Video is over 20 MB"); return; }
    setF((p) => ({ ...p, video: { url: URL.createObjectURL(file), file } }));
  }
  const openSlot = (key: string) => { slot.current = key; fileRef.current?.click(); };

  // upload anything not yet on Cloudinary, return the form with cloud URLs
  async function withUploads(): Promise<Form> {
    const todo: [string, string, File][] = [];
    Object.entries(f.imgs).forEach(([k, v]) => { if (v.file) todo.push(["i", k, v.file]); });
    Object.entries(f.cimgs).forEach(([k, v]) => { if (v.file) todo.push(["c", k, v.file]); });
    if (f.video?.file) todo.push(["v", "video", f.video.file]);
    const imgs = { ...f.imgs }, cimgs = { ...f.cimgs };
    let video = f.video;
    for (let n = 0; n < todo.length; n++) {
      say(`Uploading ${n + 1} of ${todo.length}…`);
      const [t, k, file] = todo[n];
      const url = await uploadOne(file);
      if (t === "i") imgs[k] = { url }; else if (t === "c") cimgs[k] = { url }; else video = { url };
    }
    const next = { ...f, imgs, cimgs, video };
    if (todo.length) setF(next);
    return next;
  }
  const cloudMap = (m: Record<string, Img>) => Object.fromEntries(Object.entries(m).filter(([, v]) => isCloud(v.url)).map(([k, v]) => [k, v.url]));

  async function saveDraft() {
    setBusy(true);
    try {
      const x = await withUploads();
      const data = { ...x, imgs: cloudMap(x.imgs), cimgs: cloudMap(x.cimgs), video: x.video && isCloud(x.video.url) ? x.video.url : null };
      const r = await fetch("/api/seller/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: draftId, data }) });
      const d = await r.json();
      if (!r.ok) { say(d.error || "Could not save draft"); return; }
      setDraftId(d.id); say("Saved as draft. Find it in My products."); load();
    } catch (e) { say(e instanceof Error ? e.message : "Could not save draft"); } finally { setBusy(false); }
  }
  function loadDraft(d: Draft) {
    const x = d.data as unknown as Partial<Form> & { imgs?: Record<string, string>; cimgs?: Record<string, string>; video?: string | null };
    const base = blank(typeof x.cat === "string" && SUBCATS[x.cat] ? x.cat : "Sarees");
    const toImg = (m?: Record<string, string>) => Object.fromEntries(Object.entries(m ?? {}).map(([k, u]) => [k, { url: u }]));
    setF({ ...base, ...x, imgs: toImg(x.imgs), cimgs: toImg(x.cimgs), video: x.video ? { url: x.video } : null });
    setDraftId(d.id); setStep(0); setTab("add");
  }
  async function delDraft(id: number) {
    await fetch(`/api/seller/drafts/${id}`, { method: "DELETE" });
    if (draftId === id) setDraftId(null);
    load();
  }

  async function submit() {
    const bad = [0, 1, 2, 3, 4].find((i) => miss(f, i).length);
    if (bad !== undefined) { setStep(bad); say("Please complete: " + miss(f, bad)[0]); window.scrollTo(0, 0); return; }
    setBusy(true);
    try {
      const x = await withUploads();
      const fixed = FIXED1(x.cat);
      const stockBy = Object.fromEntries(x.sizes.map((z) => [z, Number(x.stockBy[z])]));
      say("Saving product…");
      const r = await fetch("/api/seller/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        draftId, category: x.cat, sub_category: x.sub, product_type: x.ptype, name: x.name, brand: x.brand, sku: x.sku, description: x.desc,
        highlights: x.hl.filter(Boolean), occasion: x.occ, attributes: x.a, package_contents: x.pack, composition: x.comp, model_info: x.model, keywords: x.kw,
        ...(fixed ? { stock: Number(x.stock) } : { stock_by_size: stockBy, colors: x.cols }),
        images: cloudMap(x.imgs), color_images: cloudMap(x.cimgs), video_url: x.video && isCloud(x.video.url) ? x.video.url : "",
        mrp: Number(x.mrp), price: Number(x.sell), purchase_price: x.buy === "" ? null : Number(x.buy), hsn: x.hsn, gst_rate: x.gst,
        min_qty: Number(x.minq), max_qty: Number(x.maxq), weight_kg: Number(x.wt), pkg_length_cm: Number(x.pl), pkg_width_cm: Number(x.pw), pkg_height_cm: Number(x.ph),
        dispatch_time: x.disp, country_of_origin: x.origin, return_available: x.ret, exchange_available: x.exch, return_period: x.rper, return_policy: x.rpol,
        mfr_name: x.mfr, mfr_address: x.mfrAddr, declaration: x.decl }) });
      const d = await r.json();
      if (!r.ok) { say(d.error || "Could not submit"); return; }
      say("Submitted. Your product goes live after admin approval.");
      setF(blank()); setDraftId(null); setStep(0); load(); setTab("products"); window.scrollTo(0, 0);
    } catch (e) { say(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }

  // ---------- small render helpers ----------
  const lbl = (l: string, req: boolean) => <>{l}{req ? <span className="sp-rq"> *</span> : <span className="sp-opt">optional</span>}</>;
  const text = (k: TextKey, l: string, ph: string, req = false, type = "text", extra?: ReactExtra) => (
    <label>{lbl(l, req)}{extra?.sfx}<input type={type} value={f[k]} placeholder={ph} maxLength={extra?.max} inputMode={extra?.mode} step={extra?.step}
      onChange={(e) => setT(k, e.target.value)} /></label>);
  const select = (k: SelKey, l: string, opts: string[], req = false) => (
    <label>{lbl(l, req)}<select value={f[k]} onChange={(e) => setS(k, e.target.value)}><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>);
  const specField = (sp: Spec) => {
    const [k, l, t, o, r] = sp;
    if (!showIf(sp, f.a)) return null;
    const req = !!r;
    if (t === "s" || t === "c") return <label key={k}>{lbl(l, req)}<select value={f.a[k] ?? ""} onChange={(e) => setA(k, e.target.value)}><option value="">Select…</option>{(o as string[]).map((x) => <option key={x}>{x}</option>)}</select></label>;
    if (t === "y") return <div className="sp-fw" key={k}><b>{lbl(l, req)}</b><div className="sp-yn">{["Yes", "No"].map((x) => <button type="button" key={x} className={f.a[k] === x ? "sp-on" : ""} onClick={() => setA(k, x)}>{x}</button>)}</div></div>;
    return <label key={k}>{lbl(l, req)}<input type="number" step="0.01" value={f.a[k] ?? ""} onChange={(e) => setA(k, e.target.value)} /></label>;
  };
  const switchBtn = (on: boolean, fn: () => void, label: string) => <button type="button" className={`sp-sw ${on ? "sp-on" : ""}`} aria-label={label} onClick={fn} />;
  const fmt = (kind: "b" | "i" | "ul" | "ol") => {
    const ta = document.getElementById("sp-desc") as HTMLTextAreaElement | null;
    if (!ta) return;
    const a = ta.selectionStart, b = ta.selectionEnd, s = ta.value.slice(a, b) || "text";
    const r = kind === "b" ? `**${s}**` : kind === "i" ? `*${s}*` : kind === "ul" ? s.split("\n").map((x) => "- " + x).join("\n") : s.split("\n").map((x, i) => `${i + 1}. ${x}`).join("\n");
    setT("desc", (ta.value.slice(0, a) + r + ta.value.slice(b)).slice(0, 1000));
  };

  if (seller === undefined) return <div className="sp"><p style={{ padding: 24 }}>Loading…</p></div>;

  if (!seller) return <div className="sp"><section className="sp-auth sp-g">
    <Link href="/" style={{ font: '700 24px "Playfair Display",serif', color: "#e0107a", textDecoration: "none" }}>🛍 Ladies Mart</Link>
    <h2 style={{ marginTop: 12 }}>{mode === "login" ? "Seller login" : "Become a Ladies Mart seller"}</h2>
    <div className="sp-yn" style={{ margin: "8px 0 12px" }}>
      <button className={mode === "login" ? "sp-on" : ""} onClick={() => { setMode("login"); setAuthMsg(""); }}>Login</button>
      <button className={mode === "register" ? "sp-on" : ""} onClick={() => { setMode("register"); setAuthMsg(""); }}>Register</button>
    </div>
    <div className="sp-fg" style={{ gridTemplateColumns: "1fr" }}>
      {mode === "register" && <>
        <label>Shop / business name<input type="text" value={auth.name} onChange={(e) => setAuth({ ...auth, name: e.target.value })} /></label>
        <label>Owner name<input type="text" value={auth.owner} onChange={(e) => setAuth({ ...auth, owner: e.target.value })} /></label>
      </>}
      <label>Mobile number<input type="text" value={auth.phone} inputMode="numeric" maxLength={10} onChange={(e) => setAuth({ ...auth, phone: e.target.value })} /></label>
      <label>Password<input type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && doAuth()} /></label>
      {authMsg && <div style={{ color: "#d6003f", fontWeight: 600 }}>{authMsg}</div>}
      <button className="sp-btn" disabled={busy} onClick={doAuth}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Register"}</button>
      {mode === "register" && <small className="sp-mut">After registration our team will review and approve your account.</small>}
    </div>
  </section></div>;

  const approved = seller.status === "approved";
  const toShip = lines.filter((l) => l.order_status !== "cancelled" && l.item_status === "pending").length;
  const live = prods.filter((p) => p.approval === "approved" && p.active).length;
  const waiting = prods.filter((p) => p.approval === "pending").length;
  const fixed = FIXED1(f.cat);
  const pending = [0, 1, 2, 3, 4].reduce((t, i) => t + miss(f, i).length, 0);
  const d = discount(f);
  const price = Number(f.sell) > 0 && Number(f.sell) <= Number(f.mrp) ? Number(f.sell) : Number(f.mrp) || 0;
  const extraImgs = Object.entries(f.imgs).filter(([k]) => k !== "main").map(([, v]) => v.url);
  const reports: [string, string[]][] = [["Product details", miss(f, 0)], ["Images", miss(f, 1)], ["Size, colour & stock", miss(f, 2)], ["Price", miss(f, 3)], ["Shipping, legal & returns", miss(f, 4)]];

  const stepBody = () => {
    if (step === 0) return <>
      <div className="sp-legend"><b className="sp-rq">*</b> means required. Fields marked <span className="sp-opt" style={{ margin: 0 }}>optional</span> can be left empty, but filled listings sell more.</div>
      <section className="sp-g sp-card"><h2>Product information</h2><p className="sp-sub">Enter basic details about your product</p><div className="sp-fg">
        {text("name", "Product name", "e.g. Women's casual shirt", true, "text", { max: 120 })}
        <label>{lbl("Category", true)}<select value={f.cat} onChange={(e) => changeCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        {select("sub", "Sub category", SUBCATS[f.cat], true)}{select("ptype", "Product type", PTYPE[f.cat], true)}
        {text("brand", "Brand name", "e.g. ZARA")}{text("sku", "SKU / Product code", "e.g. LM-SH-2025-001", true, "text", { max: 40 })}
        {text("pack", "Package contents", "e.g. 1 saree with blouse piece", true, "text", { max: 120 })}{text("comp", "Fabric composition", "e.g. 60% cotton, 40% polyester", false, "text", { max: 80 })}
        {!fixed && text("model", "Model height & size worn", "e.g. Model is 5ft 6in, wears M", false, "text", { max: 80 })}{text("kw", "Search keywords", "e.g. silk saree, wedding saree", false, "text", { max: 120 })}
        <div className="sp-fw sp-full"><b>Occasion <span className="sp-opt">optional</span></b><div className="sp-chips">{OCC.map((o) => <button type="button" key={o} className={f.occ.includes(o) ? "sp-on" : ""} onClick={() => toggle("occ", o)}>{o}</button>)}</div></div>
        <div className="sp-full"><b style={{ fontSize: 14 }}>Description <span className="sp-rq">*</span></b>
          <div className="sp-tb"><button type="button" onClick={() => fmt("b")} aria-label="Bold"><b>B</b></button><button type="button" onClick={() => fmt("i")} aria-label="Italic"><i>I</i></button><button type="button" onClick={() => fmt("ul")} aria-label="Bullet list">•≡</button><button type="button" onClick={() => fmt("ol")} aria-label="Numbered list">1≡</button></div>
          <textarea id="sp-desc" maxLength={1000} value={f.desc} placeholder="Describe fabric, fit, look, what is included, care tips…" onChange={(e) => setT("desc", e.target.value)} />
          <div className="sp-cnt">{f.desc.length}/1000</div></div>
        <div className="sp-fw sp-full"><b>Product highlights <span className="sp-opt">optional</span></b><div className="sp-hl">{f.hl.map((h, i) =>
          <div key={i}><i>✓</i><input type="text" maxLength={60} value={h} placeholder={["Soft cotton fabric", "Trendy design", "Perfect for all occasions"][i]} onChange={(e) => setF((p) => ({ ...p, hl: p.hl.map((x, n) => (n === i ? e.target.value : x)) }))} /></div>)}</div></div>
      </div></section>
      <section className="sp-g sp-card"><h2>{f.cat === "Sarees" ? "Saree" : f.cat} specifications</h2><p className="sp-sub">Specific to {f.cat.toLowerCase()}. Accurate details mean fewer returns.</p><div className="sp-fg">{SPEC[f.cat].map(specField)}</div></section>
    </>;
    if (step === 1) return <section className="sp-g sp-card"><h2>Upload product images</h2><p className="sp-sub">Clear photos on a plain background sell best. JPG or PNG, max 5 MB each. Main image and at least 3 photos in total are required.</p>
      <div className="sp-slots">{SLOTS(f.cat).map(([k, l, r]) => { const im = f.imgs[k]; return <div className="sp-slot" key={k} role="button" tabIndex={0} onClick={() => openSlot(k)}>
        {im ? <><img src={im.url} alt={l} /><button className="sp-x" aria-label="Remove" onClick={(e) => { e.stopPropagation(); setF((p) => { const m = { ...p.imgs }; delete m[k]; return { ...p, imgs: m }; }); }}>✕</button><b>{l}</b></>
          : <span><em>＋</em>{l}{r ? <span className="sp-rq"> *</span> : null}</span>}</div>; })}</div>
      <label style={{ marginTop: 14 }}>Product video <span className="sp-opt">optional</span><input type="file" accept="video/mp4,video/quicktime" onChange={(e) => pickVideo(e.target.files)} /></label>
      <div className="sp-hint">{f.video ? (f.video.file ? `Selected: ${f.video.file.name} · ` : "Video saved · ") : ""}Up to 30 seconds, max 20 MB.</div></section>;
    if (step === 2) return fixed
      ? <section className="sp-g sp-card"><h2>Size &amp; stock</h2><p className="sp-sub">{f.cat} is sold as free size, so one stock number is enough.</p><div className="sp-fg">{text("stock", "Available stock", "Total pieces", true, "number")}</div></section>
      : <section className="sp-g sp-card"><h2>Size &amp; colour variants</h2><p className="sp-sub">Customers choose from these on the product page.</p>
        <div className="sp-fw"><b>Colours <span className="sp-rq">*</span></b><div className="sp-chips sp-dots">{Object.keys(HEX).map((c) =>
          <button type="button" key={c} title={c} aria-label={c} className={f.cols.includes(c) ? "sp-on" : ""} style={{ background: HEX[c] }} onClick={() => toggle("cols", c)} />)}</div></div>
        <div className="sp-fw" style={{ marginTop: 14 }}><b>Available sizes <span className="sp-rq">*</span></b><div className="sp-chips">{FORM_SIZES.map((z) =>
          <button type="button" key={z} className={f.sizes.includes(z) ? "sp-on" : ""} onClick={() => toggle("sizes", z)}>{f.sizes.includes(z) ? "✓ " : ""}{z}</button>)}</div></div>
        {f.sizes.length > 0 && <div className="sp-fw" style={{ marginTop: 14 }}><b>Stock per size <span className="sp-rq">*</span></b><div className="sp-stk" style={{ marginTop: 8 }}>{f.sizes.map((z) =>
          <label key={z}>{z}<input type="number" min={0} placeholder="0" value={f.stockBy[z] ?? ""} onChange={(e) => setF((p) => ({ ...p, stockBy: { ...p.stockBy, [z]: e.target.value } }))} /></label>)}</div></div>}
        {f.cols.length > 1 && <div className="sp-fw" style={{ marginTop: 14 }}><b>Photo for each colour <span className="sp-rq">*</span></b><div className="sp-hint">Customers must see the colour they order. Add one photo per colour.</div>
          <div className="sp-cps">{f.cols.map((c) => { const im = f.cimgs[c]; return <div className="sp-slot" key={c} role="button" tabIndex={0} onClick={() => openSlot("c:" + c)}>
            {im ? <><img src={im.url} alt={c} /><button className="sp-x" aria-label="Remove" onClick={(e) => { e.stopPropagation(); setF((p) => { const m = { ...p.cimgs }; delete m[c]; return { ...p, cimgs: m }; }); }}>✕</button><b>{c}</b></> : <span><em>＋</em>{c}</span>}</div>; })}</div></div>}
        <button className="sp-link" type="button" onClick={() => setModal("size")}>View size chart ✎</button></section>;
    if (step === 3) return <section className="sp-g sp-card"><h2>Price details</h2><p className="sp-sub">Customers see MRP, selling price and discount. Purchase price stays private.</p><div className="sp-fg">
      {text("mrp", "MRP (₹)", "Printed price", true, "number")}{text("sell", "Selling price (₹)", "What customer pays", true, "number")}
      <label>Discount (%)<input type="text" readOnly value={d ? d + "%" : "—"} /></label>
      {text("buy", "Purchase price (₹)", "Your cost", false, "number", { sfx: <span className="sp-priv">Private</span> })}
      {text("hsn", "HSN code", "e.g. 6206", false, "text", { max: 8, mode: "numeric" })}{select("gst", "GST rate", GST_RATES)}
      {text("minq", "Minimum order quantity", "1", true, "number")}{text("maxq", "Maximum order quantity", "10", true, "number")}
    </div><div className="sp-hint">HSN code must match your product type. Ask your CA if you are not sure.</div></section>;
    return <>
      <section className="sp-g sp-card"><h2>Shipping details</h2><p className="sp-sub">Measure the packed parcel. It decides courier charges.</p><div className="sp-fg">
        {text("wt", "Product weight with packing (kg)", "e.g. 0.25", true, "number", { step: "0.01" })}{select("disp", "Dispatch time", DISPATCH, true)}
        {text("pl", "Package length (cm)", "", true, "number")}{text("pw", "Package width (cm)", "", true, "number")}{text("ph", "Package height (cm)", "", true, "number")}{select("origin", "Country of origin", ORIGINS, true)}</div></section>
      <section className="sp-g sp-card"><h2>Return &amp; exchange</h2><p className="sp-sub">Customers trust listings with clear return rules.</p><div className="sp-fg">
        <div className="sp-fw"><b>Return available</b><div style={{ marginTop: 6 }}>{switchBtn(f.ret, () => setF((p) => ({ ...p, ret: !p.ret })), "Return available")}</div></div>
        <div className="sp-fw"><b>Exchange available</b><div style={{ marginTop: 6 }}>{switchBtn(f.exch, () => setF((p) => ({ ...p, exch: !p.exch })), "Exchange available")}</div></div>
        {f.ret && select("rper", "Return period", RETURN_PERIODS, true)}
        <label className="sp-full">Return policy <span className="sp-opt">optional</span><textarea style={{ borderTop: "1.5px solid var(--line)", borderRadius: 12 }} maxLength={400} value={f.rpol} placeholder="e.g. Return only if unused, with tags and original packing." onChange={(e) => setT("rpol", e.target.value)} /></label></div></section>
      <section className="sp-g sp-card"><h2>Legal details</h2><p className="sp-sub">Indian e-commerce rules need manufacturer or packer details and country of origin on every listing.</p><div className="sp-fg">
        {text("mfr", "Manufacturer / packer name", "Name as on your label", true, "text", { max: 100 })}{text("mfrAddr", "Manufacturer / packer address", "Full address with PIN code", true, "text", { max: 250 })}
        <label className="sp-ck sp-full"><input type="checkbox" checked={f.decl} onChange={(e) => setF((p) => ({ ...p, decl: e.target.checked }))} /><span>I confirm these photos and details are of my own product. It is genuine (not fake or copied) and I will ship exactly what I list.</span></label></div></section>
      <section className="sp-g sp-card"><h2>Final check</h2><ul className="sp-chk">{reports.map(([l, m]) => <li key={l} className={m.length ? "sp-bad" : ""}><i>{m.length ? "!" : "✓"}</i><span>{l}{m.length > 0 && <small>Missing: {m.join(", ")}</small>}</span></li>)}</ul></section>
    </>;
  };

  return <div className="sp">
    <div className="sp-app">
      <aside className="sp-side">
        <div className="sp-lg">Ladies Mart<small>Wear your style…</small></div>
        {NAVI.map(([ic, label, t]) => <button key={label} className={t && tab === t ? "sp-on" : ""} onClick={() => (t ? setTab(t) : say("This page is coming soon"))}>{ic} {label}{t === "orders" && toShip > 0 && <em>{toShip}</em>}</button>)}
        <button onClick={logout}>↪️ Logout</button>
        <div className="sp-promo">Grow your business with Ladies Mart<br /><Link href="/"><span>View store</span></Link></div>
      </aside>
      <div className="sp-main">
        <div className="sp-top"><label className="sp-srch">🔍<input placeholder="Search…" aria-label="Search" /></label>
          <div className="sp-who" style={{ marginLeft: "auto" }}><div className="sp-av">{seller.name.charAt(0).toUpperCase()}</div><span>{seller.name}<small>Seller · {seller.commission_pct}% commission</small></span></div></div>
        {!approved && <div className="sp-warn">{seller.status === "pending" ? "Your account is waiting for approval. You can upload products after approval." : "Your account is suspended. Please contact Ladies Mart support."}</div>}

        {tab === "home" && <>
          <div className="sp-hd sp-g"><div className="sp-ic">🏠</div><div><h1>Welcome, {seller.owner_name}</h1><p>Here is how your shop is doing</p></div>{approved && <button className="sp-gl" onClick={() => setTab("add")}>+ Add new product</button>}</div>
          <div className="sp-stats" style={{ marginTop: 14 }}>
            <div className="sp-g sp-stat"><small>Orders to ship</small><b>{toShip}</b></div><div className="sp-g sp-stat"><small>Live products</small><b>{live}</b></div>
            <div className="sp-g sp-stat"><small>Waiting approval</small><b>{waiting}</b></div><div className="sp-g sp-stat"><small>Your payout so far</small><b>₹{earn?.payout ?? 0}</b></div>
          </div></>}

        {tab === "add" && (approved ? <>
          <div className="sp-hd sp-g"><div className="sp-ic">📦</div><div><h1>Add new product</h1><p>Fill the details to list your product on Ladies Mart</p></div><button className="sp-gl" onClick={() => setModal("guide")}>📖 View guidelines</button></div>
          <div className="sp-steps">{STEPS.map((n, i) => { const ok = i !== step && !miss(f, i).length; return <button key={n} className={`sp-st ${i === step ? "sp-on" : ""} ${i < step ? "sp-done" : ""} ${ok ? "sp-ok" : ""}`} onClick={() => setStep(i)}><i>{ok ? "✓" : i + 1}</i>{n}</button>; })}</div>
          {drafts.length > 0 && draftId === null && step === 0 && <div className="sp-legend">Saved drafts: {drafts.map((x) => <button key={x.id} className="sp-link" style={{ marginRight: 12 }} onClick={() => loadDraft(x)}>{x.title}</button>)}</div>}
          <div className="sp-cols"><div>{stepBody()}
            <div className="sp-nav"><button className="sp-ghost" disabled={step === 0} onClick={() => { setStep(step - 1); window.scrollTo(0, 0); }}>← Back</button>{step < 4 ? <button className="sp-btn" onClick={() => { setStep(step + 1); window.scrollTo(0, 0); }}>Next →</button> : <span />}</div></div>
            <aside className="sp-g sp-pv"><div className="sp-pvh"><b>👁 Live preview</b></div>
              <div className="sp-pvg"><div className="sp-pvi">{f.imgs.main ? <img src={f.imgs.main.url} alt="" /> : "👗"}</div>
                <div className="sp-ths">{extraImgs.slice(0, 2).map((u) => <div className="sp-th" key={u}><img src={u} alt="" /></div>)}{extraImgs.length > 2 && <div className="sp-th">+{extraImgs.length - 2}</div>}</div></div>
              <div style={{ fontWeight: 700, marginTop: 10 }}>{f.name.trim() || "Your product name"}</div>
              <div className="sp-pvp"><span>₹{price}</span>{d > 0 && <><del>₹{f.mrp}</del><em>{d}% off</em></>}</div>
              <div className="sp-hint">{[f.cat + " · " + f.sub, f.a.fabric, f.a.color].filter(Boolean).join(" · ")}</div>
              {f.hl.some(Boolean) && <ul style={{ paddingLeft: 18, margin: "8px 0 0", fontSize: 13.5 }}>{f.hl.filter(Boolean).map((h) => <li key={h}>{h}</li>)}</ul>}</aside></div>
        </> : <div className="sp-g sp-card"><p className="sp-mut">Uploading opens after your account is approved.</p></div>)}

        {tab === "products" && <><section className="sp-g sp-card"><h2>My products</h2>
          {prods.length === 0 && <p className="sp-mut">No products yet.</p>}
          {prods.length > 0 && <div style={{ overflowX: "auto" }}><table className="sp-tbl"><thead><tr><th></th><th>Product</th><th>Status</th><th>Price</th><th>MRP</th><th>Stock</th><th>Live</th><th></th></tr></thead><tbody>
            {prods.map((p) => { const sb = p.stock_by_size && Object.keys(p.stock_by_size).length ? p.stock_by_size : null; return <tr key={p.id}>
              <td><img src={imageUrl(p.image, 120)} alt="" style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 8 }} /></td>
              <td>{p.name}{p.sku && <div className="sp-mut">{p.sku}</div>}</td><td><span className="sp-chip">{p.approval}</span></td>
              <td><input type="number" value={p.price} onChange={(e) => editRow(p.id, { price: Number(e.target.value) })} /></td>
              <td><input type="number" value={p.old_price} onChange={(e) => editRow(p.id, { old_price: Number(e.target.value) })} /></td>
              <td>{sb ? <div className="sp-sizes">{Object.keys(sb).map((z) => <label key={z} style={{ fontSize: 12 }}>{z}<input type="number" value={sb[z]} onChange={(e) => editRow(p.id, { stock_by_size: { ...sb, [z]: Number(e.target.value) } })} /></label>)}</div>
                : <input type="number" value={p.stock} onChange={(e) => editRow(p.id, { stock: Number(e.target.value) })} />}</td>
              <td><input type="checkbox" checked={p.active} onChange={(e) => editRow(p.id, { active: e.target.checked })} /></td>
              <td><button className="sp-btn" style={{ padding: "6px 14px" }} onClick={() => saveRow(p)}>Save</button></td></tr>; })}</tbody></table></div>}</section>
          <section className="sp-g sp-card"><h2>Drafts</h2>{drafts.length === 0 && <p className="sp-mut">No saved drafts.</p>}
            {drafts.map((x) => <div className="sp-dr" key={x.id}><span><b>{x.title}</b><div className="sp-mut">{new Date(x.updated_at).toLocaleString("en-IN")}</div></span>
              <span><button className="sp-btn" style={{ padding: "6px 14px", marginRight: 8 }} onClick={() => loadDraft(x)}>Continue</button><button className="sp-ghost" style={{ padding: "6px 14px" }} onClick={() => delDraft(x.id)}>Delete</button></span></div>)}</section></>}

        {tab === "orders" && <section className="sp-g sp-card"><h2>Orders to ship</h2>
          {lines.length === 0 && <p className="sp-mut">No orders yet.</p>}
          {lines.map((l) => { const cancelled = l.order_status === "cancelled"; return <div key={l.item_id} className="sp-line" style={{ opacity: cancelled ? 0.55 : 1 }}>
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
            </div>}</div>; })}</section>}

        {tab === "earnings" && <><div className="sp-hd sp-g"><div className="sp-ic">💰</div><div><h1>Earnings</h1><p>Payout is calculated on delivered orders only</p></div></div>
          <div className="sp-stats" style={{ marginTop: 14 }}>{earn && ([["Delivered sales", `₹${earn.sales}`], [`Commission (${earn.commissionPct}%)`, `₹${earn.commission}`], ["Your payout", `₹${earn.payout}`], ["In progress", `₹${earn.inProgress}`]] as [string, string][]).map(([k, v]) =>
            <div className="sp-g sp-stat" key={k}><small>{k}</small><b>{v}</b></div>)}</div>
          <p className="sp-mut">Settlement is done by Ladies Mart as per your seller agreement.</p></>}
      </div>
    </div>

    {tab === "add" && approved && <div className="sp-bar">
      <span className={`sp-state ${pending ? "sp-w" : ""}`}>{pending ? `${pending} field${pending > 1 ? "s" : ""} pending` : "✓ All fields are complete!"}</span>
      <button className="sp-ghost" disabled={busy} onClick={saveDraft}>💾 Save as draft</button>
      <button className="sp-ghost" onClick={() => setModal("preview")}>👁 Preview product</button>
      <button className="sp-btn" disabled={busy} onClick={submit}>{busy ? "Please wait…" : "Submit for approval ➤"}</button></div>}

    <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => { pickFile(e.target.files); e.target.value = ""; }} />

    {modal && <div className="sp-ovl" onClick={() => setModal("")}><div className="sp-mod" onClick={(e) => e.stopPropagation()}>
      {modal === "size" && <><h3>Size chart (sample)</h3><p className="sp-sub">Standard women&apos;s sizes in inches. Update the numbers if your product is different.</p>
        <table><thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead><tbody>{[["XS", 32, 26, 35], ["S", 34, 28, 37], ["M", 36, 30, 39], ["L", 38, 32, 41], ["XL", 40, 34, 43], ["XXL", 42, 36, 45]].map((r) => <tr key={r[0]}>{r.map((x, i) => <td key={i}>{x}</td>)}</tr>)}</tbody></table></>}
      {modal === "guide" && <><h3>Listing guidelines</h3><ul className="sp-gd"><li>Use real photos of your own product on a plain background.</li><li>Do not copy photos, brand names or text from other sellers.</li><li>Enter true fabric, size and weight. Wrong details cause returns.</li><li>Keep stock updated so customers do not get cancelled orders.</li><li>Pack the parcel well and dispatch within the time you choose.</li><li>Fake branded or restricted items are not allowed.</li><li>Add at least 3 photos, and one photo for every colour you sell.</li><li>No watermarks, phone numbers or text on photos.</li><li>Give manufacturer or packer details and country of origin.</li></ul></>}
      {modal === "preview" && <><h3>How customers will see it</h3><div className="sp-pvi" style={{ maxHeight: 340 }}>{f.imgs.main ? <img src={f.imgs.main.url} alt="" /> : "👗"}</div>
        <div style={{ fontWeight: 700, marginTop: 10 }}>{f.name || "Your product name"}</div><div className="sp-pvp"><span>₹{price}</span>{d > 0 && <><del>₹{f.mrp}</del><em>{d}% off</em></>}</div>
        <div className="sp-hint">{f.cat} · {f.sub} · {f.ptype}</div>
        {f.hl.some(Boolean) && <ul>{f.hl.filter(Boolean).map((h) => <li key={h}>{h}</li>)}</ul>}
        <Md className="sp-md" text={f.desc} /><p className="sp-hint">In the box: {f.pack || "—"}</p>
        <table><tbody>{SPEC[f.cat].filter((sp) => f.a[sp[0]]).map((sp) => <tr key={sp[0]}><td style={{ textAlign: "left", fontWeight: 600 }}>{sp[1]}</td><td style={{ textAlign: "left" }}>{f.a[sp[0]]}</td></tr>)}</tbody></table></>}
      <div className="sp-nav" style={{ marginTop: 14 }}><span /><button className="sp-btn" onClick={() => setModal("")}>Close</button></div>
    </div></div>}
    {toast && <div className="sp-toast">{toast}</div>}
  </div>;
}

type ReactExtra = { sfx?: React.ReactNode; max?: number; mode?: "numeric"; step?: string };
