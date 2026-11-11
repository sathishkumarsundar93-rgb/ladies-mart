"use client";
import { useState } from "react";
import Link from "next/link";
import PageShell from "../components/PageShell";
import { useCart } from "../components/CartContext";

export default function CheckoutPage(){
 const { items, count, shipping, total, clear } = useCart();
 const [form,setForm]=useState({name:"",phone:"",address:"",city:"",pincode:""});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [done,setDone]=useState<{orderNo:string;total:number}|null>(null);
 const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm({...form,[k]:e.target.value});

 async function place(){
  setError(""); setBusy(true);
  try{
   const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...form,items:items.map(i=>({id:i.id,size:i.size,qty:i.qty}))})});
   const data=await res.json();
   if(!res.ok){ setError(data.error||"Could not place order"); return; }
   setDone({orderNo:data.orderNo,total:data.total}); clear();
  }catch{ setError("Network problem. Please try again."); }
  finally{ setBusy(false); }
 }

 return <PageShell title="Checkout">{done
  ? <div className="success-card"><div>✓</div><h2>Order placed!</h2><p>Your order number is <b>{done.orderNo}</b>. Please keep ₹{done.total} ready for Cash on Delivery. We will contact you on your mobile number to confirm.</p><Link className="solid-action" href="/products">Continue shopping</Link></div>
  : <div className="checkout-layout"><section className="form-card"><h2>Delivery address</h2>
   <div className="form-grid">
    <label>Full name<input value={form.name} onChange={set("name")} placeholder="Your name"/></label>
    <label>Mobile number<input value={form.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"/></label>
    <label className="wide">Address<input value={form.address} onChange={set("address")} placeholder="House / street / area"/></label>
    <label>City<input value={form.city} onChange={set("city")} placeholder="City"/></label>
    <label>PIN code<input value={form.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} placeholder="6-digit PIN code"/></label>
   </div>
   <h2 className="form-subhead">Payment method</h2>
   <label className="payment-choice"><input type="radio" checked readOnly/>Cash on Delivery</label>
   <small className="muted">UPI and card payments coming soon.</small>
  </section>
  <aside className="summary-card"><h2>Order summary</h2>
   <p>Items <b>{count}</b></p><p>Delivery <b>{shipping===0?"Free":`₹${shipping}`}</b></p><hr/>
   <h3>Payable <strong>₹{total}</strong></h3>
   {error&&<p style={{color:"#c60058",fontWeight:600}}>{error}</p>}
   <button className="solid-action full-action" disabled={items.length===0||busy} onClick={place}>{busy?"Placing order…":"Place order (COD)"}</button>
   {items.length===0&&<small className="muted">Your bag is empty. <Link href="/products">Shop now</Link></small>}
  </aside></div>}</PageShell>;
}
