export type DbProduct = {
  id: number; name: string; category: string; price: number;
  old_price: number; image: string; stock: number;
  images?: string[] | null; sub_category?: string | null; description?: string | null;
  sizes?: string[] | null; colors?: string[] | null;
  product_type?: string | null; brand?: string | null; highlights?: string[] | null; attributes?: Record<string, string> | null;
  package_contents?: string | null; composition?: string | null; model_info?: string | null;
  stock_by_size?: Record<string, number> | null; color_images?: Record<string, string> | null; video_url?: string | null;
  min_qty?: number | null; max_qty?: number | null; dispatch_time?: string | null; country_of_origin?: string | null;
  return_available?: boolean | null; exchange_available?: boolean | null; return_period?: string | null; return_policy?: string | null;
  mfr_name?: string | null; mfr_address?: string | null;
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
  type: r.product_type ?? "",
  brand: r.brand ?? "",
  description: r.description ?? "",
  highlights: r.highlights ?? [],
  attributes: r.attributes ?? {},
  packageContents: r.package_contents ?? "",
  composition: r.composition ?? "",
  modelInfo: r.model_info ?? "",
  sizes: r.sizes ?? [],
  sizeStock: r.stock_by_size ?? {},
  colors: r.colors ?? [],
  colorImages: r.color_images ?? {},
  video: r.video_url ?? "",
  minQty: r.min_qty ?? 1,
  maxQty: r.max_qty ?? 10,
  dispatch: r.dispatch_time ?? "",
  origin: r.country_of_origin ?? "",
  returnAvailable: r.return_available ?? true,
  exchangeAvailable: r.exchange_available ?? false,
  returnPeriod: r.return_period ?? "",
  returnPolicy: r.return_policy ?? "",
  mfrName: r.mfr_name ?? "",
  mfrAddress: r.mfr_address ?? "",
  off: Math.round((1 - r.price / r.old_price) * 100) + "% OFF",
  stock: r.stock,
});
