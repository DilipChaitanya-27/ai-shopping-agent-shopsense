import { Heart, ShoppingCart, ExternalLink, Check } from "lucide-react";
import { Product, useShop } from "@/contexts/ShopContext";
import { formatINR } from "@/lib/currency";
import { motion } from "framer-motion";

export const ProductCard = ({ product, compact = false }: { product: Product; compact?: boolean }) => {
  const { toggleWishlist, isWishlisted, addToCart, cart } = useShop();
  const inCart = cart.some((c) => c.product.id === product.id);
  const wished = isWishlisted(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-card transition-shadow ${compact ? "" : ""}`}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No image</div>
        )}
        <button
          onClick={() => toggleWishlist(product)}
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 w-8 h-8 rounded-full glass grid place-items-center hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-primary text-primary" : ""}`} />
        </button>
        {!product.available && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-semibold">
            Sold out
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h4 className="font-medium text-sm leading-snug line-clamp-2">{product.title}</h4>
        <div className="flex items-center justify-between gap-2">
          <span className="font-display font-bold text-base text-gradient">
            {formatINR(product.price, product.currency)}
          </span>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label="View on Shopify"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <button
          onClick={() => addToCart(product)}
          disabled={!product.available}
          className={`w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            inCart
              ? "bg-accent text-accent-foreground"
              : "bg-gradient-primary text-primary-foreground hover:opacity-90"
          } disabled:opacity-50`}
        >
          {inCart ? <><Check className="w-3.5 h-3.5" /> In cart</> : <><ShoppingCart className="w-3.5 h-3.5" /> Add</>}
        </button>
      </div>
    </motion.div>
  );
};
