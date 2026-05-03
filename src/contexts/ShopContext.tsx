import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Product = {
  id: string;
  title: string;
  description?: string;
  handle?: string;
  image?: string;
  price: number; // USD numeric
  currency: string;
  url?: string;
  productType?: string;
  tags?: string[];
  available?: boolean;
};

type Ctx = {
  wishlist: Product[];
  cart: { product: Product; qty: number }[];
  toggleWishlist: (p: Product) => void;
  isWishlisted: (id: string) => boolean;
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  cartTotal: number;
};

const ShopContext = createContext<Ctx>(null as any);

const load = <T,>(k: string, fb: T): T => {
  try { return JSON.parse(localStorage.getItem(k) || "") ?? fb; } catch { return fb; }
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => load("ss-wishlist", []));
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>(() => load("ss-cart", []));

  useEffect(() => { localStorage.setItem("ss-wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("ss-cart", JSON.stringify(cart)); }, [cart]);

  const toggleWishlist = (p: Product) =>
    setWishlist((w) => (w.find((x) => x.id === p.id) ? w.filter((x) => x.id !== p.id) : [...w, p]));

  const isWishlisted = (id: string) => wishlist.some((x) => x.id === id);

  const addToCart = (p: Product) =>
    setCart((c) => {
      const ex = c.find((x) => x.product.id === p.id);
      return ex ? c.map((x) => (x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { product: p, qty: 1 }];
    });

  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.product.id !== id));
  const updateQty = (id: string, qty: number) =>
    setCart((c) => (qty <= 0 ? c.filter((x) => x.product.id !== id) : c.map((x) => (x.product.id === id ? { ...x, qty } : x))));

  const cartTotal = cart.reduce((s, x) => s + x.product.price * x.qty, 0);

  return (
    <ShopContext.Provider value={{ wishlist, cart, toggleWishlist, isWishlisted, addToCart, removeFromCart, updateQty, cartTotal }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
