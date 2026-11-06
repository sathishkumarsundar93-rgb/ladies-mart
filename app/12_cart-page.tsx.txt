"use client";
import Link from "next/link";
import PageShell from "../components/PageShell";
import { useCart, FREE_SHIPPING_MIN } from "../components/CartContext";

export default function CartPage(){
 const { items, subtotal, shipping, total, setQty, remove } = useCart();
 if (items.length === 0) return <PageShell title="Shopping bag"><section className="form-card"><h2>Your bag is empty</h2><p className="muted">Add something lovely and it will show up here.</p><Link className="solid-action" href="/products">Start shopping</Link></section></PageShell>;
 return <PageShell title="Shopping bag"><div className="checkout-layout">
  <section className="form-card"><h2>Your bag <small>({items.length} {items.length===1?"item":"items"})</small></h2>
   {items.map(i=><div className="cart-line" key={`${i.id}-${i.size}`}>
    <img src={`https://images.unsplash.com/${i.image}?auto=format&fit=crop&w=300&q=80`} alt={i.name}/>
    <div><b>{i.name}</b><p>Size: {i.size}</p><strong>₹{i.price*i.qty}</strong>
     <div className="quantity"><button onClick={()=>setQty(i.id,i.size,i.qty-1)}>−</button>{i.qty}<button onClick={()=>setQty(i.id,i.size,i.qty+1)}>+</button></div>
     <button className="remove-btn" onClick={()=>remove(i.id,i.size)}>Remove</button></div>
   </div>)}
  </section>
  <aside className="summary-card"><h2>Price details</h2>
   <p>Subtotal <b>₹{subtotal}</b></p>
   <p>Shipping <b>{shipping===0?"Free":`₹${shipping}`}</b></p>
   {shipping>0&&<small className="muted">Add ₹{FREE_SHIPPING_MIN-subtotal} more for free shipping</small>}
   <hr/><h3>Total <strong>₹{total}</strong></h3>
   <Link className="solid-action full-action" href="/checkout">Continue to checkout</Link>
  </aside></div></PageShell>;
}
