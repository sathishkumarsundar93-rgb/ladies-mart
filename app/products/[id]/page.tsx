"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import PageShell from "../../components/PageShell";
import { useProducts } from "../../components/useProducts";
import { imageUrl } from "../../../lib/image";
import { COLOURS, SIZES } from "../../../lib/catalog";
import { useCart } from "../../components/CartContext";

export default function ProductDetail(){
 const params=useParams(); const { products }=useProducts();
 const product=products.find(p=>p.id===Number(params.id))||products[0];
 const out=product.stock!==undefined&&product.stock<=0;
 const sizes=product.sizes&&product.sizes.length?product.sizes:SIZES.filter(s=>s!=="Free Size");
 const colors=product.colors??[];
 const gallery=product.images&&product.images.length?product.images:[product.image];
 const [size,setSize]=useState(""); const [color,setColor]=useState(""); const [pic,setPic]=useState(0);
 const [liked,setLiked]=useState(false); const [added,setAdded]=useState(false); const [note,setNote]=useState("");
 const { add }=useCart();

 useEffect(()=>{ setSize(sizes.includes("M")?"M":sizes[0]); setColor(colors.length===1?colors[0]:""); setPic(0); setNote(""); },[product.id]); // eslint-disable-line react-hooks/exhaustive-deps

 function addToBag(){
  if(colors.length&&!color){ setNote("Please choose a colour"); return; }
  setNote("");
  add({id:product.id,name:product.name,cat:product.cat,price:product.price,old:product.old,image:product.image},size,color);
  setAdded(true); setTimeout(()=>setAdded(false),1500);
 }

 return <PageShell title="Product details"><div className="detail-layout">
  <div>
   <img className="detail-image" src={imageUrl(gallery[Math.min(pic,gallery.length-1)],1000)} alt={product.name}/>
   {gallery.length>1&&<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{gallery.map((g,i)=>
    <button key={g} onClick={()=>setPic(i)} aria-label={`Photo ${i+1}`} style={{padding:0,border:i===pic?"2px solid #c60058":"2px solid transparent",borderRadius:10,overflow:"hidden",width:64,height:80,background:"none",cursor:"pointer"}}>
     <img src={imageUrl(g,160)} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/></button>)}</div>}
  </div>
  <div className="detail-copy"><small className="eyebrow">{product.cat}{product.sub?` · ${product.sub}`:""}</small><h2>{product.name}</h2>
   <div className="detail-price">₹{product.price} <del>₹{product.old}</del><span>{product.off}</span></div>
   <p className="inner-lead">{product.description||"A thoughtfully selected style made to bring comfort and confidence to your wardrobe."}</p>
   <b>Select size</b><div className="size-row">{sizes.map(s=><button className={size===s?"chosen":""} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div>
   {colors.length>0&&<><b style={{display:"block",marginTop:12}}>Colour{color?`: ${color}`:""}</b>
    <div style={{display:"flex",gap:10,margin:"8px 0",flexWrap:"wrap"}}>{colors.map(c=>
     <button key={c} onClick={()=>setColor(c)} title={c} aria-label={c} style={{width:34,height:34,borderRadius:"50%",background:COLOURS[c]??"#ccc",border:"3px solid #fff",outline:color===c?"2px solid #3a1030":"1px solid #e5cdd9",cursor:"pointer"}}/>)}</div></>}
   {note&&<p style={{color:"#c60058",fontWeight:600}}>{note}</p>}
   <div className="detail-actions"><button className="solid-action" disabled={out} onClick={addToBag}><ShoppingCart size={17}/> {out?"Sold out":added?"Added ✓":"Add to bag"}</button><button className="light-action" onClick={()=>setLiked(!liked)}><Heart fill={liked?"currentColor":"none"}/> {liked?"Saved":"Wishlist"}</button></div>
   <div className="detail-perks"><span><Truck/> Cash on delivery</span><span><ShieldCheck/> Secure checkout</span><span><RotateCcw/> Easy returns*</span></div><small className="muted">*Return eligibility depends on product policy.</small></div>
 </div></PageShell>;
}
