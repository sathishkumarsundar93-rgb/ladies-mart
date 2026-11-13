export const SUBCATS: Record<string, string[]> = {
  Sarees: ["Silk", "Cotton", "Designer", "Party wear"],
  Kurtis: ["Straight", "A-line", "Anarkali", "Printed"],
  Dresses: ["Maxi", "Midi", "Party", "Casual"],
  Tops: ["Crop", "Casual", "Formal"],
  Jeans: ["Straight", "Wide-leg", "Skinny"],
  "Ethnic Wear": ["Lehenga", "Salwar set", "Palazzo set"],
  Nightwear: ["Night suit", "Gown", "Co-ord set"],
};
export const CATEGORIES = Object.keys(SUBCATS);
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
export const COLOURS: Record<string, string> = {
  Pink: "#e0107a", Purple: "#7c3aed", Blue: "#3b82f6", Red: "#e11d2a",
  Green: "#3f9b4a", Orange: "#f59e0b", Black: "#222222", White: "#f4f4f4",
};

// Products with several sizes or any colour need the customer to choose first
export const needsOptions = (p: { sizes?: string[]; colors?: string[] }) =>
  (p.sizes?.length ?? 0) > 1 || (p.colors?.length ?? 0) > 0;
