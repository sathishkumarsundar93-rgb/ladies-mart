export type DbProduct = {
  id: number; name: string; category: string; price: number;
  old_price: number; image: string; stock: number;
};

export const shape = (r: DbProduct) => ({
  id: r.id,
  name: r.name,
  cat: r.category,
  price: r.price,
  old: r.old_price,
  image: r.image,
  off: Math.round((1 - r.price / r.old_price) * 100) + "% OFF",
  stock: r.stock,
});
