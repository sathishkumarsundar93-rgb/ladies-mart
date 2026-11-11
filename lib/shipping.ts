// Keep these values same as app/components/CartContext.tsx
export const FREE_SHIPPING_MIN = 999;
export const SHIPPING_FEE = 60;

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
