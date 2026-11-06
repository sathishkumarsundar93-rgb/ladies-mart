"use client";
import Link from "next/link";
import { Heart, ShoppingCart, UserRound, Search, ArrowLeft, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "./CartContext";

export default function PageShell({ title, children }: { title: string; children: ReactNode }) {
  const { count } = useCart();
  return <main className="inner-page">
    <header className="inner-header">
      <Link className="brand" href="/"><span className="brand-mark">LM</span><span><strong>Ladies Mart</strong><small>Fashion for Every You ♥</small></span></Link>
      <nav className="inner-nav"><Link href="/">Home</Link><Link href="/products">Shop</Link><Link href="/wishlist"><Heart size={16}/> Wishlist</Link><Link href="/cart"><ShoppingCart size={16}/> Cart{count>0&&` (${count})`}</Link><Link href="/profile"><UserRound size={16}/> Profile</Link></nav>
    </header>
    <div className="inner-title"><Link href="/" className="back-link"><ArrowLeft size={16}/> Back to shopping</Link><h1>{title}</h1></div>
    <div className="inner-content">{children}</div>
    <footer className="inner-footer">© 2025 Ladies Mart · Fashion for Every You ♥</footer>
  </main>;
}
