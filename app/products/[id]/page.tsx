"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import PageShell from "../../components/PageShell";
import Md from "../../components/Md";
import { useProducts } from "../../components/useProducts";
import { imageUrl } from "../../../lib/image";
import { COLOURS, SIZES, SPEC } from "../../../lib/catalog";
import { useCart } from "../../components/CartContext";

export default function ProductDetail(){
 const params=useParams(); const { products }=useProducts();
 const product=products.find(p=>p.id===Number(params.id))||products[0];
 const sized=!!product.sizeStock&&Object.keys(product.sizeStock).length>0;
 const sizes=product.sizes&&product.sizes.length?product.sizes:SIZES.filter(s=>s!=="Free Size");
 const stockOf=(s:string)=>sized?(product.sizeStock![s]??0):(product.stock??99);
 const colors=useMemo(()=>product.colors??[],[product.colors]);
 const out=product.stock!==undefined&&product.stock<=0;
 const [size,setSize]=useState(""); const [color,setColor]=useState(""); const [pic,setPic]=useState(0);
 const [liked,setLiked]=useState(false); const [added,setAdded]=useState(false); const [note,setNote]=useState("");
 const { add }=useCart();

 useEffect(()=>{
  const ok=sizes.filter(s=>stockOf(s)>0);
  setSize(ok.includes("M")?"M":(ok[0]??sizes[0]));
  setColor(colors.length===1?colors[0]:""); setPic(0); setNote("");
 },[product.id]); // eslint-disable-line react-hooks/exhaustive-deps

 const base=product.images&&product.images.length?product.images:[product.image];
 const cImg=color?product.colorImages?.[color]:undefined;
 const gallery=cImg?[cImg,...base.filter(x=>x!==cImg)]:base;
 const left=size?stockOf(size):0;
 const mustPickColor=colors.length>1&&!color;

 function addToBag(){
  if(mustPickColor){ setNote("Please choose a colour"); return; }
  if(left<=0){ setNote("This size is sold out"); return; }
  setNote("");
  add({id:product.id,name:product.name,cat:product.cat,price:product.price,old:product.old,image:gallery[0]},size,colors.length===1?colors[0]:color);
  setAdded(true); setTimeout(()=>setAdded(false),1500);
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
   <img className="detail-image" src={imageUrl(gallery[Math.min(pic,gallery.length-1)],1000)} alt={product.name}/>
   {gallery.length>1&&<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{gallery.map((g,i)=>
    <button key={g} onClick={()=>setPic(i)} aria-label={`Photo ${i+1}`} style={{padding:0,border:i===pic?"2px solid #c60058":"2px solid transparent",borderRadius:10,overflow:"hidden",width:64,height:80,background:"none",cursor:"pointer"}}>
     <img src={imageUrl(g,160)} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/></button>)}</div>}
   {product.video&&<video controls playsInline preload="none" src={product.video} style={{width:"100%",marginTop:12,borderRadius:12}}/>}
  </div>
  <div className="detail-copy"><small className="eyebrow">{product.cat}{product.sub?` · ${product.sub}`:""}{product.brand?` · ${product.brand}`:""}</small><h2>{product.name}</h2>
   <div className="detail-price">₹{product.price} <del>₹{product.old}</del><span>{product.off}</span></div>
   {product.highlights&&product.highlights.length>0&&<ul style={{margin:"8px 0",paddingLeft:20}}>{product.highlights.map(h=><li key={h}>{h}</li>)}</ul>}
   <b>Select size</b><div className="size-row">{sizes.map(s=>{const o=stockOf(s)<=0;return <button className={size===s?"chosen":""} onClick={()=>!o&&setSize(s)} key={s} disabled={o} style={o?{opacity:.4,textDecoration:"line-through"}:undefined}>{s}</button>})}</div>
   {size&&left>0&&left<=3&&<p style={{color:"#b45309",fontWeight:600,margin:"4px 0"}}>Only {left} left in this size</p>}
   {product.modelInfo&&<small className="muted">{product.modelInfo}</small>}
   {colors.length>0&&<><b style={{display:"block",marginTop:12}}>Colour{color?`: ${color}`:colors.length===1?`: ${colors[0]}`:""}</b>
    <div style={{display:"flex",gap:10,margin:"8px 0",flexWrap:"wrap"}}>{colors.map(c=>
     <button key={c} onClick={()=>{setColor(c);setPic(0);}} title={c} aria-label={c} style={{width:34,height:34,borderRadius:"50%",background:COLOURS[c]??"#ccc",border:"3px solid #fff",outline:(color===c||colors.length===1)?"2px solid #3a1030":"1px solid #e5cdd9",cursor:"pointer"}}/>)}</div></>}
   {note&&<p style={{color:"#c60058",fontWeight:600}}>{note}</p>}
   <div className="detail-actions"><button className="solid-action" disabled={out} onClick={addToBag}><ShoppingCart size={17}/> {out?"Sold out":added?"Added ✓":"Add to bag"}</button><button className="light-action" onClick={()=>setLiked(!liked)}><Heart fill={liked?"currentColor":"none"}/> {liked?"Saved":"Wishlist"}</button></div>
   <div className="detail-perks"><span><Truck/> Cash on delivery</span><span><ShieldCheck/> Secure checkout</span><span><RotateCcw/> {product.returnAvailable===false?"No returns":"Easy returns*"}</span></div>
   {hasReturnInfo?<small className="muted">{product.returnAvailable===false?"This item cannot be returned.":`Return within ${product.returnPeriod}.`}{product.exchangeAvailable?" Exchange available.":""}{product.returnPolicy?` ${product.returnPolicy}`:""}</small>:<small className="muted">*Return eligibility depends on product policy.</small>}
   <h3 style={{margin:"18px 0 4px"}}>About this product</h3>
   {product.description?<Md text={product.description}/>:<p className="muted">A thoughtfully selected style made to bring comfort and confidence to your wardrobe.</p>}
   {rows.length>0&&<><h3 style={{margin:"18px 0 4px"}}>Product details</h3>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><tbody>{rows.map(([k,v])=><tr key={k} style={{borderTop:"1px solid #f3d3e1"}}><td style={{padding:"7px 8px 7px 0",color:"#7b6571",width:"42%",verticalAlign:"top"}}>{k}</td><td style={{padding:"7px 0"}}>{v}</td></tr>)}</tbody></table></>}
  </div>
 </div></PageShell>;
}
