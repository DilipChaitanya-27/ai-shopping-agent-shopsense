import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShop } from "@/contexts/ShopContext";
import { formatINR } from "@/lib/currency";
import { Heart, Minus, Plus, Trash2, ExternalLink } from "lucide-react";

type Props = { open: "cart" | "wishlist" | null; onClose: () => void };

export const CartWishlistDialog = ({ open, onClose }: Props) => {
  const { cart, wishlist, updateQty, removeFromCart, toggleWishlist, addToCart, cartTotal } = useShop();

  const isCart = open === "cart";

  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {isCart ? "🛒 Your Cart" : "❤️ Wishlist"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin -mx-1 px-1 space-y-3">
          {isCart ? (
            cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Your cart is empty.</p>
            ) : (
              cart.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                  <img src={product.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-muted" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-2">{product.title}</h4>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <span className="font-semibold text-sm text-gradient">
                        {formatINR(product.price * qty, product.currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(product.id, qty - 1)} className="w-6 h-6 rounded grid place-items-center hover:bg-accent">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-5 text-center">{qty}</span>
                        <button onClick={() => updateQty(product.id, qty + 1)} className="w-6 h-6 rounded grid place-items-center hover:bg-accent">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 rounded grid place-items-center hover:bg-destructive/10 text-destructive ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : wishlist.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No items wishlisted yet.</p>
          ) : (
            wishlist.map((product) => (
              <div key={product.id} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                <img src={product.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2">{product.title}</h4>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="font-semibold text-sm text-gradient">{formatINR(product.price, product.currency)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addToCart(product)}
                        className="text-[11px] px-2 py-1 rounded bg-gradient-primary text-primary-foreground font-semibold"
                      >
                        Add to cart
                      </button>
                      <button onClick={() => toggleWishlist(product)} className="w-7 h-7 rounded grid place-items-center hover:bg-destructive/10 text-destructive">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {isCart && cart.length > 0 && (
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-display font-bold text-xl text-gradient">{formatINR(cartTotal)}</p>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow">
              Checkout
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
