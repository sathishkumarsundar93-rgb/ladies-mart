CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  old_price INTEGER NOT NULL,
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 50,
  weight_g INTEGER NOT NULL DEFAULT 400,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO products (id, name, category, price, old_price, image, weight_g) VALUES
 (1,'Designer Festive Saree','Sarees',799,1999,'photo-1610030469983-98e550d6193c',700),
 (2,'Everyday Printed Kurti','Kurtis',499,1199,'photo-1583391733956-6c78276477e8',350),
 (3,'Floral Midi Dress','Dresses',649,1599,'photo-1539008835657-9e8e9680c956',400),
 (4,'Elegant Casual Top','Tops',399,999,'photo-1566206091558-7f218b696731',250),
 (5,'Classic Wide-Leg Jeans','Jeans',899,1799,'photo-1541099649105-f69ad21f3246',650),
 (6,'Embroidered Ethnic Set','Ethnic Wear',1199,2499,'photo-1594633312681-425c7b97ccd1',800)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
