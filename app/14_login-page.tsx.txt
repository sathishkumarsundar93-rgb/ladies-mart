"use client";
import { useState } from "react";
import Link from "next/link";
export default function LoginPage(){
 const [mode,setMode]=useState("Login");
 return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark">LM</span><span><strong>Ladies Mart</strong><small>Fashion for Every You ♥</small></span></Link><section className="auth-card"><p className="eyebrow">WELCOME TO YOUR STYLE SPACE</p><h1>{mode==="Login"?"Welcome back":"Create your account"}</h1><p className="inner-lead">Sign in to save favourites and follow your orders.</p><div className="auth-tabs"><button className={mode==="Login"?"chosen":""} onClick={()=>setMode("Login")}>Login</button><button className={mode==="Register"?"chosen":""} onClick={()=>setMode("Register")}>Register</button></div>{mode==="Register"&&<label>Full name<input placeholder="Enter your name"/></label>}<label>Mobile number or email<input placeholder="Enter mobile number or email"/></label><label>Password<input type="password" placeholder="Enter password"/></label><button className="solid-action full-action" onClick={()=>alert("Frontend preview only. Authentication will be connected securely in the backend.")}>{mode}</button><small className="muted">By continuing, you agree to our Terms and Privacy Policy.</small></section></main>;
}
