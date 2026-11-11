"use client";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useProducts } from "./useProducts";
import { Heart, ShoppingCart, Star } from "lucide-react";
const photo=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=85`;
export default function ProductGrid({ids}:{ids?:number[]}) {
 const { add } = useCart();
 const { products: data } = useProducts();
 const items=data.filter(p=>!ids||ids.includes(p.id));
 return <div className="inner-product-grid">{items.map(p=><article className="inner-product-card" key={p.id}>
   <Link href={`/products/${p.id}`}><img src={photo(p.image)} alt={p.name}/></Link><span className="inner-discount">{p.off}</span>
   <div className="inner-product-info"><small>{p.cat}</small><Link href={`/products/${p.id}`}><b>{p.name}</b></Link><div className="inner-price">₹{p.price} <del>₹{p.old}</del></div><div className="inner-rating"><Star size={13} fill="currentColor"/> 4.8 rating</div><button onClick={()=>add({id:p.id,name:p.name,cat:p.cat,price:p.price,old:p.old,image:p.image})}><ShoppingCart size={15}/> Add to bag</button></div>
 </article>)}</div>;
}
