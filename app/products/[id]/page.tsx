"use client";
import "./product.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Share2, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import PageShell from "../../components/PageShell";
import Md from "../../components/Md";
import { useProducts } from "../../components/useProducts";
import { imageUrl } from "../../../lib/image";
import { COLOURS, FORM_SIZES, SPEC } from "../../../lib/catalog";
import { useCart, FREE_SHIPPING_MIN, SHIPPING_FEE } from "../../components/CartContext";

export default function ProductDetail(){
 const params=useParams(); const router=useRouter(); const { products }=useProducts();
 const product=products.find(p=>p.id===Number(params.id))||products[0];
 const sized=!!product.sizeStock&&Object.keys(product.sizeStock).length>0;
 const sizes=product.sizes&&product.sizes.length?product.sizes:FORM_SIZES.slice(0,6);
 const vs=product.variantStock&&Object.keys(product.variantStock).length>0?product.variantStock:null;
 const stockFor=(s:string,c:string)=>vs?(c?(vs[c]?.[s]??0):Object.values(vs).reduce((n,row)=>n+(row[s]??0),0)):sized?(product.sizeStock![s]??0):(product.stock??99);
 const colors=useMemo(()=>product.colors??[],[product.colors]);
 const out=product.stock!==undefined&&product.stock<=0;
 const [size,setSize]=useState(""); const [color,setColor]=useState(""); const [pic,setPic]=useState(0);
 const [liked,setLiked]=useState(false); const [added,setAdded]=useState(false); const [note,setNote]=useState("");
 const slider=useRef<HTMLDivElement>(null);
 const variantRef=useRef<HTMLDivElement>(null);
 const similarRef=useRef<HTMLHeadingElement>(null);
 const [showPrice,setShowPrice]=useState(false);
 const [zoom,setZoom]=useState(false);
 const simRef=useRef<HTMLDivElement>(null);
 const stockOf=(s:string)=>stockFor(s,color);
 const colourOut=(c:string)=>vs?sizes.every(s=>stockFor(s,c)<=0):false;
 const { add }=useCart();

 useEffect(()=>{
  const ok=sizes.filter(s=>stockOf(s)>0);
  setSize(ok.includes("M")?"M":(ok[0]??sizes[0]));
  setColor(colors.length===1?colors[0]:""); setPic(0); setNote("");
  slider.current?.scrollTo({left:0});
 },[product.id]); // eslint-disable-line react-hooks/exhaustive-deps

 const base=product.images&&product.images.length?product.images:[product.image];
 const cImg=color?product.colorImages?.[color]:undefined;
 const gallery=cImg?[cImg,...base.filter(x=>x!==cImg)]:base;
 const left=size?stockOf(size):0;
 const colourPhotos=colors.length>1&&colors.every(c=>product.colorImages?.[c]);
 const similar=products.filter(p=>p.cat===product.cat&&p.id!==product.id).slice(0,8);
 const siblings=product.groupId?products.filter(p=>p.groupId===product.groupId):[];
 useEffect(()=>{
  if(!zoom) return;
  const k=(e:KeyboardEvent)=>{ if(e.key==="Escape") setZoom(false); if(e.key==="ArrowRight") setPic(p=>Math.min(gallery.length-1,p+1)); if(e.key==="ArrowLeft") setPic(p=>Math.max(0,p-1)); };
  window.addEventListener("keydown",k); return ()=>window.removeEventListener("keydown",k);
 },[zoom,gallery.length]);

 const chooseColor=(c:string)=>{ setColor(c); setPic(0); if(size&&stockFor(size,c)<=0){ const ok=sizes.find(s=>stockFor(s,c)>0); if(ok) setSize(ok); } slider.current?.scrollTo({left:0,behavior:"smooth"}); };
 const goTo=(i:number)=>{ const el=slider.current; if(el) el.scrollTo({left:i*el.clientWidth,behavior:"smooth"}); };

 function addToBag(go:boolean){
  if(colors.length>1&&!color){ setNote("Please choose a colour"); return; }
  if(left<=0){ setNote("This size is sold out"); return; }
  setNote("");
  add({id:product.id,name:product.name,cat:product.cat,price:product.price,old:product.old,image:gallery[0]},size,colors.length===1?colors[0]:color);
  if(go){ router.push("/checkout"); return; }
  setAdded(true); setTimeout(()=>setAdded(false),1500);
 }
 async function share(){
  const url=window.location.href;
  try{
   if(typeof navigator.share==="function"){ await navigator.share({title:product.name,url}); return; }
   await navigator.clipboard.writeText(url); setNote("Link copied"); setTimeout(()=>setNote(""),1800);
  }catch{}
 }

 const a=product.attributes??{};
 const rows:[string,string][]=[
  ["Brand",product.brand??""],["Product type",product.type??""],
  ...(SPEC[product.cat]??[]).map(f=>[f[1],a[f[0]]??""] as [string,string]),
  ["Fabric composition",product.composition??""],["Package contents",product.packageContents??""],
  ["Country of origin",product.origin??""],["Dispatch time",product.dispatch??""],
  ["Manufacturer / packer",[product.mfrName,product.mfrAddress].filter(Boolean).join(", ")],
 ].filter(r=>r[1]) as [string,string][];
 const hasReturnInfo=product.returnPeriod||product.returnAvailable===false||product.exchangeAvailable;

 return <PageShell title="Product details"><div className="detail-layout">
  <div>
   <div className="pd-gal">
   {gallery.length>1&&<div className="pd-vthumbs">{gallery.map((g,i)=><button key={g} className={pic===i?"on":""} onClick={()=>goTo(i)} aria-label={`Photo ${i+1}`}><img src={imageUrl(g,160)} alt=""/></button>)}</div>}
   <div className="pd-galmain">
   <div className="pd-slidewrap">
   <div className="pd-slider" ref={slider} onScroll={e=>setPic(Math.round(e.currentTarget.scrollLeft/Math.max(1,e.currentTarget.clientWidth)))}>
    {gallery.map((g,i)=><div className="pd-slide" key={g}><img src={imageUrl(g,900)} alt={`${product.name} photo ${i+1}`} loading={i===0?"eager":"lazy"}/></div>)}
   </div>
   {gallery.length>1&&<><button type="button" className="pd-arrow l" aria-label="Previous photo" onClick={()=>goTo(Math.max(0,pic-1))}>‹</button><button type="button" className="pd-arrow r" aria-label="Next photo" onClick={()=>goTo(Math.min(gallery.length-1,pic+1))}>›</button></>}
   <button type="button" className="pd-zoom" onClick={()=>setZoom(true)}>🔍 Click to Zoom</button>
   {similar.length>0&&<button type="button" className="pd-more" onClick={()=>similarRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}>＋ More like this</button>}
   </div>
   {gallery.length>1&&<div className="pd-dots">{gallery.map((g,i)=><span key={g} className={pic===i?"on":""}/>)}</div>}
   </div></div>
   {product.video&&<video controls playsInline preload="none" src={product.video} style={{width:"100%",marginTop:12,borderRadius:12}}/>}
   {colors.length>1&&<>
    <div className="pd-sec">Select Colour</div>
    <div className="pd-variant-wrap"><div className="pd-variant-list" ref={variantRef}>{colors.map(c=>colourPhotos
     ?<button type="button" key={c} className={`pd-variant-card ${color===c?"on":""}`} onClick={()=>chooseColor(c)} disabled={colourOut(c)} style={colourOut(c)?{opacity:.45}:undefined} aria-label={`View ${c} colour`}><img src={imageUrl(product.colorImages![c],240)} alt={`${product.name} - ${c}`} /><span>{c}{colourOut(c)?" · Sold out":""}</span></button>
     :<button type="button" key={c} className={`pd-variant-swatch ${color===c?"on":""}`} onClick={()=>chooseColor(c)} disabled={colourOut(c)} style={colourOut(c)?{opacity:.45}:undefined} aria-label={`View ${c} colour`}><span style={{background:COLOURS[c]??"#ccc"}}/><b>{c}{colourOut(c)?" · Sold out":""}</b></button>)}</div>{colors.length>3&&<button type="button" className="pd-next" aria-label="More colours" onClick={()=>variantRef.current?.scrollBy({left:220,behavior:"smooth"})}>›</button>}</div></>}
  {siblings.length>1&&<div style={{marginTop:14}}><div className="pd-sec">{siblings.length} Similar Products</div>
    <div className="pd-thumbs">{siblings.map(x=><Link key={x.id} href={`/products/${x.id}`} className={`pd-thumb ${x.id===product.id?"on":""}`} aria-label={x.name} style={{textDecoration:"none"}}><img src={imageUrl(x.image,200)} alt={x.name}/>{(x.colors&&x.colors[0])||x.name.split("–").pop()?.trim().slice(0,10)}</Link>)}</div></div>}
  </div>
  <div className="detail-copy"><small className="eyebrow">{product.cat}{product.sub?` · ${product.sub}`:""}{product.brand?` · ${product.brand}`:""}</small>
   <div className="pd-titlerow"><h2>{product.name}</h2>
    <div className="pd-icons">
     <button className="pd-icon" onClick={()=>setLiked(!liked)} aria-label="Wishlist"><Heart fill={liked?"#c60058":"none"} color={liked?"#c60058":"currentColor"}/>Wishlist</button>
     <button className="pd-icon" onClick={share} aria-label="Share"><Share2/>Share</button></div></div>
   <div className="detail-price">₹{product.price} <del>₹{product.old}</del><span>{product.off}</span> <button type="button" className="pd-info" aria-label="Price details" onClick={()=>setShowPrice(!showPrice)}>ⓘ</button></div>
   {showPrice&&<div className="pd-price-box"><div><span>MRP</span><span>₹{product.old}</span></div><div><span>Discount</span><span>−₹{Math.max(0,product.old-product.price)} ({product.off})</span></div><div><b>Selling price</b><b>₹{product.price}</b></div><div><span>Delivery</span><span>{product.price>=FREE_SHIPPING_MIN?"Free":`Free above ₹${FREE_SHIPPING_MIN}, else ₹${SHIPPING_FEE}`}</span></div><div><span>Payment</span><span>Cash on delivery available</span></div></div>}
   <div className="pd-ship"><Truck/><span><b>{product.price>=FREE_SHIPPING_MIN?"Free delivery":`Free delivery on orders above ₹${FREE_SHIPPING_MIN}`}</b><small>Cash on delivery available</small></span></div>
   {product.highlights&&product.highlights.length>0&&<ul style={{margin:"8px 0",paddingLeft:20}}>{product.highlights.map(h=><li key={h}>{h}</li>)}</ul>}
   <b>Select size</b><div className="size-row">{sizes.map(s=>{const o=stockOf(s)<=0;return <button className={size===s?"chosen":""} onClick={()=>!o&&setSize(s)} key={s} disabled={o} style={o?{opacity:.4,textDecoration:"line-through"}:undefined}>{s}</button>})}</div>
   {size&&left>0&&left<=3&&<p style={{color:"#b45309",fontWeight:600,margin:"4px 0"}}>Only {left} left in this size</p>}
   {product.modelInfo&&<small className="muted">{product.modelInfo}</small>}
   {colors.length===1&&<b style={{display:"block",marginTop:12}}>Colour: {colors[0]}</b>}
   {colors.length>1&&!colourPhotos&&<><b style={{display:"block",marginTop:12}}>Colour{color?`: ${color}`:""}</b>
    <div style={{display:"flex",gap:10,margin:"8px 0",flexWrap:"wrap"}}>{colors.map(c=>
     <button key={c} onClick={()=>chooseColor(c)} title={c} aria-label={c} style={{width:34,height:34,borderRadius:"50%",background:COLOURS[c]??"#ccc",border:"3px solid #fff",outline:color===c?"2px solid #3a1030":"1px solid #e5cdd9",cursor:"pointer"}}/>)}</div></>}
   {colourPhotos&&color&&<b style={{display:"block",marginTop:12}}>Colour: {color}</b>}
   {note&&<p style={{color:"#c60058",fontWeight:600}}>{note}</p>}
   <div className="pd-actions">
    <button className="pd-wish" onClick={()=>setLiked(!liked)}><Heart size={18} fill={liked?"#c60058":"none"} color="#c60058"/> {liked?"In Wishlist":"Add to Wishlist"}</button>
    <button className="pd-add" disabled={out} onClick={()=>addToBag(false)}>{out?"Sold out":added?"Added ✓":"Add to Cart"}</button>
    <button className="pd-buy" disabled={out} onClick={()=>addToBag(true)}>Buy Now</button>
   </div>
   <div className="detail-perks"><span><Truck/> Cash on delivery</span><span><ShieldCheck/> Secure checkout</span><span><RotateCcw/> {product.returnAvailable===false?"No returns":"Easy returns*"}</span></div>
   {hasReturnInfo?<small className="muted">{product.returnAvailable===false?"This item cannot be returned.":`Return within ${product.returnPeriod}.`}{product.exchangeAvailable?" Exchange available.":""}{product.returnPolicy?` ${product.returnPolicy}`:""}</small>:<small className="muted">*Return eligibility depends on product policy.</small>}
   <h3 style={{margin:"18px 0 4px"}}>About this product</h3>
   {product.description?<Md text={product.description}/>:<p className="muted">A thoughtfully selected style made to bring comfort and confidence to your wardrobe.</p>}
   {rows.length>0&&<><h3 style={{margin:"18px 0 4px"}}>Product details</h3>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><tbody>{rows.map(([k,v])=><tr key={k} style={{borderTop:"1px solid #f3d3e1"}}><td style={{padding:"7px 8px 7px 0",color:"#7b6571",width:"42%",verticalAlign:"top"}}>{k}</td><td style={{padding:"7px 0"}}>{v}</td></tr>)}</tbody></table></>}
   {similar.length>0&&<><div className="pd-simhead"><h3 ref={similarRef} style={{margin:0,scrollMarginTop:80}}>Similar products<small>You may also like these</small></h3><Link href={`/products?category=${encodeURIComponent(product.cat)}`} className="pd-viewall">View All →</Link></div>
    <div className="pd-simwrap"><div className="pd-sim" ref={simRef}>{similar.map(p=><Link key={p.id} href={`/products/${p.id}`}><img src={imageUrl(p.image,300)} alt={p.name} loading="lazy"/><span>{p.name}</span><b>₹{p.price} <del>₹{p.old}</del> <em>{p.off}</em></b></Link>)}</div>{similar.length>2&&<button type="button" className="pd-next" aria-label="More products" onClick={()=>simRef.current?.scrollBy({left:300,behavior:"smooth"})}>›</button>}</div></>}
   <div className="pd-trust"><span><ShieldCheck size={18}/> Secure checkout</span><span><Truck size={18}/> Cash on delivery</span><span><RotateCcw size={18}/> Returns as per product policy</span></div>
   <div style={{height:84}}/>
  </div>
 </div>
 <div className="pd-bar">
  <button className="pd-add" disabled={out} onClick={()=>addToBag(false)}>{out?"Sold out":added?"Added ✓":"Add to Cart"}</button>
  <button className="pd-buy" disabled={out} onClick={()=>addToBag(true)}>Buy Now</button>
 </div>
 {zoom&&<div className="pd-lb" onClick={()=>{setZoom(false);goTo(pic);}}><img src={imageUrl(gallery[Math.min(pic,gallery.length-1)],1600)} alt={product.name} onClick={e=>e.stopPropagation()}/>
  {gallery.length>1&&<><button className="pd-arrow l" aria-label="Previous" onClick={e=>{e.stopPropagation();setPic(Math.max(0,pic-1));}}>‹</button><button className="pd-arrow r" aria-label="Next" onClick={e=>{e.stopPropagation();setPic(Math.min(gallery.length-1,pic+1));}}>›</button></>}
  <button className="pd-close" aria-label="Close" onClick={()=>{setZoom(false);goTo(pic);}}>✕</button></div>}</PageShell>;
}
