import { Link } from "react-router-dom";
import { Heart, ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { formatINR } from "@/lib/currency";
import { Header } from "@/components/Header";
import { motion } from "framer-motion";

const Wishlist = () => {
  const { user, loading } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useShop();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to chat
            </Link>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Heart className="w-7 h-7 text-primary fill-primary" />
              Your <span className="text-gradient">Wishlist</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved.
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-border">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Link
              to="/chat"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow"
            >
              Discover products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-medium text-sm line-clamp-2">{p.title}</h4>
                  <p className="font-display font-bold text-lg text-gradient">
                    {formatINR(p.price, p.currency)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(p)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gradient-primary text-primary-foreground"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(p)}
                      aria-label="Remove"
                      className="w-9 h-9 rounded-lg grid place-items-center bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
