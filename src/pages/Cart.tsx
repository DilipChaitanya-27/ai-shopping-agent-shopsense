import { Link, Navigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Minus, Plus, Trash2, Heart } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR } from "@/lib/currency";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Cart = () => {
  const { user, loading } = useAuth();
  const { cart, updateQty, removeFromCart, cartTotal, toggleWishlist, isWishlisted } = useShop();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  const itemCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-6">
        <Link
          to="/chat"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to chat
        </Link>
        <h1 className="font-display text-3xl font-bold flex items-center gap-3 mb-1">
          <ShoppingCart className="w-7 h-7 text-primary" />
          Your <span className="text-gradient">Cart</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>

        {cart.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-border">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link
              to="/chat"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {cart.map(({ product, qty }) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-24 h-24 rounded-xl object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatINR(product.price, product.currency)} each
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1">
                        <button
                          onClick={() => updateQty(product.id, qty - 1)}
                          className="w-7 h-7 rounded grid place-items-center hover:bg-accent"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{qty}</span>
                        <button
                          onClick={() => updateQty(product.id, qty + 1)}
                          className="w-7 h-7 rounded grid place-items-center hover:bg-accent"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleWishlist(product)}
                          aria-label="Save for later"
                          className="w-8 h-8 rounded-lg grid place-items-center hover:bg-accent"
                        >
                          <Heart
                            className={`w-4 h-4 ${isWishlisted(product.id) ? "fill-primary text-primary" : ""}`}
                          />
                        </button>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          aria-label="Remove"
                          className="w-8 h-8 rounded-lg grid place-items-center text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-gradient">
                      {formatINR(product.price * qty, product.currency)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <aside className="rounded-2xl bg-card border border-border p-5 h-fit sticky top-6">
              <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-primary">Free</span>
                </div>
                <div className="border-t border-border my-3" />
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>Total</span>
                  <span className="text-gradient">{formatINR(cartTotal)}</span>
                </div>
              </div>
              <button
                onClick={() => toast.success("Checkout coming soon!")}
                className="w-full mt-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow hover:opacity-90"
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
