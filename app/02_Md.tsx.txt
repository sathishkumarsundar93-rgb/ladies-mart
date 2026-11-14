import type { ReactNode } from "react";

// Safe mini-markdown for product descriptions: **bold**, *italic*, "- " and "1. " lists. No raw HTML is ever rendered.
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <b key={i}>{p.slice(2, -2)}</b>
    : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <i key={i}>{p.slice(1, -1)}</i>
    : p);
}

export default function Md({ text, className }: { text: string; className?: string }) {
  const out: ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: ReactNode[] } | null = null;
  const flush = () => {
    if (!list) return;
    out.push(list.type === "ul" ? <ul key={out.length}>{list.items}</ul> : <ol key={out.length}>{list.items}</ol>);
    list = null;
  };
  text.split("\n").forEach((line, n) => {
    const u = /^- (.*)/.exec(line), o = /^\d+\. (.*)/.exec(line);
    const type = u ? "ul" : o ? "ol" : null;
    if (type) {
      if (!list || list.type !== type) { flush(); list = { type, items: [] }; }
      list.items.push(<li key={n}>{inline((u ?? o)![1])}</li>);
    } else {
      flush();
      if (line.trim()) out.push(<p key={out.length}>{inline(line)}</p>);
    }
  });
  flush();
  return <div className={className}>{out}</div>;
}
