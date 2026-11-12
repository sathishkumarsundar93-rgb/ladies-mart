"use client";
import { useState } from "react";
import PageShell from "../components/PageShell";
import ProductGrid from "../components/ProductGrid";
const cats=["All","Sarees","Kurtis","Dresses","Tops","Jeans","Ethnic Wear","Nightwear"];
export default function ProductsPage(){
 const [cat,setCat]=useState("All");
 return <PageShell title="Explore women's fashion">
  <p className="inner-lead">Find pieces you'll love, from everyday essentials to celebration-ready looks.</p>
  <div className="category-pills">{cats.map(c=><button className={cat===c?"chosen":""} onClick={()=>setCat(c)} key={c}>{c}</button>)}</div>
  <ProductGrid category={cat}/>
 </PageShell>;
}
