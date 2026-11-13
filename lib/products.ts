export type DbProduct = {
  id: number; name: string; category: string; price: number;
  old_price: number; image: string; stock: number;
  images?: string[] | null; sub_category?: string | null; description?: string | null;
  sizes?: string[] | null; colors?: string[] | null;
};

export const shape = (r: DbProduct) => ({
  id: r.id,
  name: r.name,
  cat: r.category,
  price: r.price,
  old: r.old_price,
  image: r.image,
  images: r.images && r.images.length ? r.images : [r.image],
  sub: r.sub_category ?? "",
  description: r.description ?? "",
  sizes: r.sizes ?? [],
  colors: r.colors ?? [],
  off: Math.round((1 - r.price / r.old_price) * 100) + "% OFF",
  stock: r.stock,
});
