import Link from "next/link";
import type { ReactNode } from "react";

// Shared layout for policy pages. Text is a DRAFT until the business confirms it.
export default function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", color: "#24101b", lineHeight: 1.7 }}>
      <p><Link href="/" style={{ color: "#b8175a", fontWeight: 700 }}>← Back to shop</Link></p>
      <h1 style={{ fontFamily: "Georgia, serif", color: "#3b0b25", fontSize: 34, margin: "8px 0 14px" }}>{title}</h1>
      <div style={{ background: "#fff0c2", color: "#5a3d00", padding: "10px 14px", borderRadius: 12, fontSize: 14 }}>
        DRAFT. Items in [square brackets] must be confirmed by the business before launch.
      </div>
      <div style={{ marginTop: 20 }}>{children}</div>
    </main>
  );
}
