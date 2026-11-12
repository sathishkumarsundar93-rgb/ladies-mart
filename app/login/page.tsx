"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage(){
 const router=useRouter();
 const [mode,setMode]=useState<"login"|"register">("login");
 const [f,setF]=useState({name:"",phone:"",password:""});
 const [msg,setMsg]=useState("");
 const [busy,setBusy]=useState(false);
 const set=(k:keyof typeof f)=>(e:React.ChangeEvent<HTMLInputElement>)=>setF({...f,[k]:e.target.value});

 async function submit(){
  setMsg(""); setBusy(true);
  try{
   const res=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(mode==="login"?{phone:f.phone,password:f.password}:f)});
   const d=await res.json();
   if(!res.ok){ setMsg(d.error||"Something went wrong"); return; }
   router.push("/profile");
  }catch{ setMsg("Network problem. Please try again."); }
  finally{ setBusy(false); }
 }

 return <main className="auth-page">
  <Link className="brand" href="/"><span className="brand-mark">LM</span><span><strong>Ladies Mart</strong><small>Fashion for Every You ♥</small></span></Link>
  <section className="auth-card">
   <p className="eyebrow">WELCOME TO YOUR STYLE SPACE</p>
   <h1>{mode==="login"?"Welcome back":"Create your account"}</h1>
   <p className="inner-lead">Login to track orders and checkout faster.</p>
   <div className="auth-tabs">
    <button className={mode==="login"?"chosen":""} onClick={()=>{setMode("login");setMsg("");}}>Login</button>
    <button className={mode==="register"?"chosen":""} onClick={()=>{setMode("register");setMsg("");}}>Register</button>
   </div>
   {mode==="register"&&<label>Full name<input value={f.name} onChange={set("name")} placeholder="Enter your name"/></label>}
   <label>Mobile number<input value={f.phone} onChange={set("phone")} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"/></label>
   <label>Password<input type="password" value={f.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={mode==="register"?"At least 6 characters":"Enter password"}/></label>
   {msg&&<p style={{color:"#c60058",fontWeight:600}}>{msg}</p>}
   <button className="solid-action full-action" disabled={busy} onClick={submit}>{busy?"Please wait…":mode==="login"?"Login":"Create account"}</button>
   <small className="muted">By continuing, you agree to our Terms and Privacy Policy.</small>
  </section>
 </main>;
}
