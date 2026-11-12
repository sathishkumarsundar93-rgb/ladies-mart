// Product image can be an Unsplash photo id (old demo data) or a full Cloudinary URL
export function imageUrl(image: string, w = 600): string {
  if (image.startsWith("https://res.cloudinary.com/")) {
    return image.replace("/upload/", `/upload/c_fill,ar_4:5,w_${w},f_auto,q_auto/`);
  }
  if (image.startsWith("http")) return image;
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${w}&q=85`;
}
