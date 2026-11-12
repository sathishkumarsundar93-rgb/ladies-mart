"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import PageShell from "../../components/PageShell";
import { useProducts } from "../../components/useProducts";
import { imageUrl } from "../../../lib/image";
import { useCart } from "../../components/CartContext";
export default function ProductDetail(){
 const params=useParams(); const { products }=useProducts(); const product=products.find(p=>p.id===Number(params.id))||products[0]; const out=product.stock!==undefined&&product.stock<=0;
 const [size,setSize]=useState("M"); const [liked,setLiked]=useState(false); const [added,setAdded]=useState(false); const { add }=useCart();
 return <PageShell title="Product details"><div className="detail-layout">
  <img className="detail-image" src={imageUrl(product.image,1000)} alt={product.name}/>
  <div className="detail-copy"><small className="eyebrow">{product.cat} · LADIES MART EDIT</small><h2>{product.name}</h2><div className="detail-rating"><Star size={15} fill="currentColor"/> 4.8 · Loved by shoppers</div><div className="detail-price">₹{product.price} <del>₹{product.old}</del><span>{product.off}</span></div><p className="inner-lead">A thoughtfully selected style made to bring comfort and confidence to your wardrobe. Product details and availability shown here are sample content for the frontend preview.</p>
  <b>Select size</b><div className="size-row">{["XS","S","M","L","XL","XXL"].map(s=><button className={size===s?"chosen":""} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div>
  <div className="detail-actions"><button className="solid-action" disabled={out} onClick={()=>{add({id:product.id,name:product.name,cat:product.cat,price:product.price,old:product.old,image:product.image},size);setAdded(true);setTimeout(()=>setAdded(false),1500);}}><ShoppingCart size={17}/> {out?"Sold out":added?"Added ✓":"Add to bag"}</button><button className="light-action" onClick={()=>setLiked(!liked)}><Heart fill={liked?"currentColor":"none"}/> {liked?"Saved":"Wishlist"}</button></div>
  <div className="detail-perks"><span><Truck/> Standard delivery</span><span><ShieldCheck/> Secure checkout</span><span><RotateCcw/> Easy returns*</span></div><small className="muted">*Return eligibility depends on product policy.</small></div>
 </div></PageShell>;
}
