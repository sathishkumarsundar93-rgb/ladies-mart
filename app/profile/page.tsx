"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../components/PageShell";

type User = { name: string; phone: string };
type Order = { order_no: string; total: number; status: string; created_at: string; items: { name: string; size: string; qty: number }[] };

export default function ProfilePage(){
 const router=useRouter();
 const [user,setUser]=useState<User|null|undefined>(undefined);
 const [orders,setOrders]=useState<Order[]>([]);

 useEffect(()=>{
  (async()=>{
   try{
    const me=await (await fetch("/api/auth/me")).json();
    setUser(me.user);
    if(me.user){ const r=await fetch("/api/orders"); if(r.ok) setOrders((await r.json()).orders); }
   }catch{ setUser(null); }
  })();
 },[]);

 async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); setUser(null); setOrders([]); router.refresh(); }

 if(user===undefined) return <PageShell title="My account"><p className="muted">Loading…</p></PageShell>;
 if(!user) return <PageShell title="My account"><div className="profile-card"><div className="avatar">👤</div><div><h2>Welcome to Ladies Mart</h2><p className="muted">Login to see your orders and account details.</p><Link className="solid-action" href="/login">Login / Create account</Link></div></div></PageShell>;

 return <PageShell title="My account">
  <div className="profile-card"><div className="avatar">👤</div><div><h2>{user.name}</h2><p className="muted">+91 {user.phone}</p><button className="solid-action" onClick={logout}>Logout</button></div></div>
  <section className="form-card" style={{marginTop:16}}><h2>My orders</h2>
   {orders.length===0&&<p className="muted">No orders yet. <Link href="/products">Start shopping</Link></p>}
   {orders.map(o=><div key={o.order_no} style={{borderTop:"1px solid #f3d3e1",padding:"12px 0"}}>
    <b>{o.order_no}</b> · ₹{o.total} · <span className="status">{o.status}</span>
    <div className="muted">{new Date(o.created_at).toLocaleDateString("en-IN")}</div>
    <ul style={{margin:"6px 0 0 18px"}}>{o.items.map((i,n)=><li key={n}>{i.name} ({i.size}) × {i.qty}</li>)}</ul>
   </div>)}
  </section>
 </PageShell>;
    }
