"use client";
import "./seller.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Md from "../components/Md";
import { imageUrl } from "../../lib/image";
import { FIXED1, sizeOptions, HEX, OCC, PTYPE, SLOTS, SPEC, SUBCATS, type Spec } from "../../lib/catalog";
import { DISPATCH, GST_RATES, ORIGINS, RETURN_PERIODS } from "../../lib/productForm";

type Seller = { id: number; name: string; owner_name: string; phone: string; status: string; commission_pct: number };
type Row = { id: number; name: string; category: string; sku: string | null; price: number; old_price: number; stock: number; stock_by_size: Record<string, number> | null; variant_stock: Record<string, Record<string, number>> | null; active: boolean; approval: string; reject_reason: string | null; image: string };
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
  multi: boolean; varStock: Record<string, Record<string, string>>;
};
type TextKey = "name" | "brand" | "sku" | "pack" | "comp" | "model" | "kw" | "stock" | "mrp" | "sell" | "buy" | "hsn" | "minq" | "maxq" | "wt" | "pl" | "pw" | "ph" | "mfr" | "mfrAddr" | "rpol" | "desc";
type SelKey = "sub" | "ptype" | "gst" | "disp" | "origin" | "rper";
type Draft = { id: number; title: string; data: Record<string, unknown>; updated_at: string };
type Tab = "home" | "add" | "products" | "orders" | "earnings" | "profile";
type Profile = { pickup_address: string; pickup_city: string; pickup_pincode: string; support_phone: string; pan: string; gstin: string; bank_holder: string; bank_account: string; bank_ifsc: string; upi_id: string };
const NOPROFILE: Profile = { pickup_address: "", pickup_city: "", pickup_pincode: "", support_phone: "", pan: "", gstin: "", bank_holder: "", bank_account: "", bank_ifsc: "", upi_id: "" };

const STEPS = ["Basic Info", "Images & Media", "Size & Variants", "Pricing & Inventory", "Shipping & Publish"];
const NAVI: [string, string, Tab | ""][] = [["🏠", "Seller dashboard", "home"], ["➕", "Add new product", "add"], ["📦", "My products", "products"], ["🛒", "Orders", "orders"], ["💰", "Earnings", "earnings"], ["👤", "Profile", "profile"], ["🔔", "Notifications", ""], ["❓", "Support", ""]];
const CATS = Object.keys(SUBCATS);

function blank(cat = "Sarees"): Form {
  const a: Record<string, string> = {};
  SPEC[cat].forEach((s) => { if (s[2] === "n") a[s[0]] = String(s[3] ?? ""); });
  return { cat, sub: SUBCATS[cat][0], ptype: PTYPE[cat][0], name: "", brand: "", sku: "", desc: "", hl: ["", "", ""], occ: [], a, pack: "", comp: "", model: "", kw: "",
    sizes: [], stockBy: {}, stock: "", cols: [], imgs: {}, cimgs: {}, video: null, mrp: "", sell: "", buy: "", hsn: "", gst: "", minq: "1", maxq: "10",
    wt: "", pl: "", pw: "", ph: "", disp: "", origin: "India", ret: true, exch: false, rper: "7 days", rpol: "", mfr: "", mfrAddr: "", decl: false, multi: false, varStock: {} };
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
      if (f.multi) { if (f.cols.length < 2) m.push("At least 2 colours"); } else if (f.cols.length !== 1) m.push("Colour");
      if (!f.sizes.length) m.push("Sizes");
      else if (f.multi) { if (f.cols.some((c) => f.sizes.some((z) => (f.varStock[c]?.[z] ?? "") === ""))) m.push("Stock for every colour and size"); }
      else if (f.sizes.some((z) => f.stockBy[z] === undefined || f.stockBy[z] === "")) m.push("Stock for every size");
      if (f.multi && f.cols.length > 1) { const nc = f.cols.filter((c) => !f.cimgs[c]); if (nc.length) m.push("Photo for " + nc.join(", ")); }
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
  const [pf, setPf] = useState<Profile>(NOPROFILE);
  const [kyc, setKyc] = useState({ status: "incomplete", note: "" });
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
    const single = k === "cols" && !p.multi;
    const next = { ...p, [k]: has ? p[k].filter((x) => x !== v) : single ? [v] : [...p[k], v] };
    if (has && k === "sizes") {
      const sb = { ...p.stockBy }; delete sb[v]; next.stockBy = sb;
      const vs: Record<string, Record<string, string>> = {};
      Object.keys(p.varStock).forEach((c) => { const row = { ...p.varStock[c] }; delete row[v]; vs[c] = row; });
      next.varStock = vs;
    }
    if (has && k === "cols") { const ci = { ...p.cimgs }; delete ci[v]; next.cimgs = ci; const vs = { ...p.varStock }; delete vs[v]; next.varStock = vs; }
    return next;
  });
  const setMulti = (on: boolean) => setF((p) => ({ ...p, multi: on, cols: on ? p.cols : p.cols.slice(0, 1) }));
  const changeCat = (c: string) => setF((p) => ({ ...blank(c), name: p.name, brand: p.brand, sku: p.sku, desc: p.desc, hl: p.hl, occ: p.occ, imgs: p.imgs, video: p.video,
    mrp: p.mrp, sell: p.sell, buy: p.buy, hsn: p.hsn, gst: p.gst, minq: p.minq, maxq: p.maxq, wt: p.wt, pl: p.pl, pw: p.pw, ph: p.ph, disp: p.disp, origin: p.origin,
    ret: p.ret, exch: p.exch, rper: p.rper, rpol: p.rpol, pack: p.pack, kw: p.kw, comp: p.comp, mfr: p.mfr, mfrAddr: p.mfrAddr, decl: p.decl }));

  const load = useCallback(async () => {
    try {
      const me = await (await fetch("/api/seller/auth")).json();
      setSeller(me.seller);
      if (!me.seller) return;
      const [p, o, d, pr] = await Promise.all([fetch("/api/seller/products"), fetch("/api/seller/orders"), fetch("/api/seller/drafts"), fetch("/api/seller/profile")]);
      if (p.ok) setProds(await p.json());
      if (o.ok) { const x = await o.json(); setLines(x.items); setEarn(x.earnings); }
      if (d.ok) setDrafts(await d.json());
      if (pr.ok) { const { kyc_status, kyc_note, ...rest } = await pr.json(); setPf(rest as Profile); setKyc({ status: kyc_status, note: kyc_note }); }
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
    const varied = !!p.variant_stock && Object.keys(p.variant_stock).length > 0;
    const r = await fetch(`/api/seller/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: p.price, old_price: p.old_price, active: p.active, ...(varied ? { variant_stock: p.variant_stock } : sized ? { stock_by_size: p.stock_by_size } : { stock: p.stock }) }) });
    const d = await r.json();
    say(r.ok ? `${p.name} saved` : d.error || "Failed");
    load();
  }

  async function saveProfile() {
    setBusy(true);
    try {
      const r = await fetch("/api/seller/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pf) });
      const d = await r.json();
      say(r.ok ? (d.kyc_status === "verified" ? "Profile saved" : "Saved. Our team will verify your details.") : d.error || "Could not save");
      if (r.ok) load();
    } catch { say("Network problem. Try again."); } finally { setBusy(false); }
  }
  const pfText = (k: keyof Profile, l: string, ph: string, req: boolean, extra?: { max?: number; mode?: "numeric"; upper?: boolean }) => (
    <label>{lbl(l, req)}<input type="text" value={pf[k]} placeholder={ph} maxLength={extra?.max} inputMode={extra?.mode}
      onChange={(e) => setPf((p) => ({ ...p, [k]: extra?.upper ? e.target.value.toUpperCase() : e.target.value }))} /></label>);

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
        ...(fixed ? { stock: Number(x.stock) } : x.multi
          ? { variant_stock: Object.fromEntries(x.cols.map((c) => [c, Object.fromEntries(x.sizes.map((z) => [z, Number(x.varStock[c]?.[z] ?? 0)]))])), colors: x.cols }
          : { stock_by_size: stockBy, colors: x.cols }),
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
  const select = (k: SelKey, l: string, opts
