"use client";
import Link from "next/link";
import { useCart } from "./CartContext";
import { Heart, ShoppingCart, Star } from "lucide-react";
const data = [
 {id:1,name:"Designer Festive Saree",cat:"Sarees",price:799,old:1999,image:"photo-1610030469983-98e550d6193c",off:"60% OFF"},
 {id:2,name:"Everyday Printed Kurti",cat:"Kurtis",price:499,old:1199,image:"photo-1583391733956-6c78276477e8",off:"58% OFF"},
 {id:3,name:"Floral Midi Dress",cat:"Dresses",price:649,old:1599,image:"photo-1539008835657-9e8e9680c956",off:"59% OFF"},
 {id:4,name:"Elegant Casual Top",cat:"Tops",price:399,old:999,image:"photo-1566206091558-7f218b696731",off:"60% OFF"},
 {id:5,name:"Classic Wide-Leg Jeans",cat:"Jeans",price:899,old:1799,image:"photo-1541099649105-f69ad21f3246",off:"50% OFF"},
 {id:6,name:"Embroidered Ethnic Set",cat:"Ethnic Wear",price:1199,old:2499,image:"photo-1594633312681-425c7b97ccd1",off:"52% OFF"}
];
const photo=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=85`;
export const products=data;
export default function ProductGrid({ids}:{ids?:number[]}) {
 const { add } = useCart();
 const items=data.filter(p=>!ids||ids.includes(p.id));
 return <div className="inner-product-grid">{items.map(p=><article className="inner-product-card" key={p.id}>
   <Link href={`/products/${p.id}`}><img src={photo(p.image)} alt={p.name}/></Link><span className="inner-discount">{p.off}</span>
   <div className="inner-product-info"><small>{p.cat}</small><Link href={`/products/${p.id}`}><b>{p.name}</b></Link><div className="inner-price">₹{p.price} <del>₹{p.old}</del></div><div className="inner-rating"><Star size={13} fill="currentColor"/> 4.8 rating</div><button onClick={()=>add({id:p.id,name:p.name,cat:p.cat,price:p.price,old:p.old,image:p.image})}><ShoppingCart size={15}/> Add to bag</button></div>
 </article>)}</div>;
}
