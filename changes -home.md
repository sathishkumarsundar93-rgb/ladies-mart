# Home page update: full feature set (matches the Ladies Mart home design)

Changed files:
- app/page.tsx: home page in TypeScript (replaces the old "Rose Pink" home)
- app/home.css: rewritten; every rule is scoped under .hm2 so global styles do not clash

Included on the home page:
- Top strip, sticky header with search, account and bag count
- Hero with "Find my look" quiz (occasion, budget, style), new arrivals, WhatsApp
- Fun finds: aesthetic cards (Minimal, Boho, Ethnic modern, Street) and gift finder
  (Friend birthday, Amma-ku gift, Bridesmaid); results show in a "Picked for you" panel
- Shop the look: three pairs with a bundle price (sample 10% off)
- Browse: category rail (photo from the real product), sub-category chips, colour dots,
  2-column grid, ADD (or Select when size/colour is needed), wishlist heart, size guide
- Weekly drop: countdown to Sunday midnight and the 4 newest products
- Bulk collection: tiers plus an order builder that sends the order on WhatsApp
- Festival banner (date-based, Pongal / Puthandu / Aadi / Deepavali) and theme picker
- Quick view popup on every card: size and colour chips, add to bag, link to full details
- Shop by mood: six mood tiles, each opens a curated list
- Dark mode toggle (remembered on this device)
- Trust points and footer

New pages (DRAFT, business must confirm text in [brackets]):
- /shipping, /returns, /privacy, /terms (shared layout in app/components/PolicyPage.tsx)

Data: products come from /api/products (the database), not hard-coded samples.
Cart, wishlist and product pages reuse CartContext and /products/[id].
Look and gift/aesthetic picks match by category and product name, so they work with real data.

Setup:
- Add NEXT_PUBLIC_WHATSAPP=91XXXXXXXXXX to .env.local (digits only, with country code)
- Run: npm install && npm run build && npm start

Not changed: admin, seller, checkout, profile, login, product pages, API routes.
Original home page backed up in outputs/original-backup/.
Product detail page (app/products/[id]) is unchanged: it already has the gallery with zoom, variants, sticky add/buy bar and similar products.
