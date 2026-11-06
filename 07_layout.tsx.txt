import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartContext";

export const metadata: Metadata = {
  title: "Ladies Mart | Fashion for Every You",
  description: "Discover beautiful women's fashion at Ladies Mart.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CartProvider>{children}</CartProvider></body></html>;
}
