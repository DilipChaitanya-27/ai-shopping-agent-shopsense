import { useEffect, useState } from "react";
import { Sparkles, Loader2, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";

const ROTATING_CATS = ["over-ear headphones", "in-ear headphones", "sunscreen", "moisturizer", "snowboards"];

type Props = { chatProducts: Product[] };

export const RecommendationsRail = ({ chatProducts }: Props) => {
  const [live, setLive] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const cat = ROTATING_CATS[Math.floor(Math.random() * ROTATING_CATS.length)];
        const { data } = await supabase.functions.invoke("shopify-search", {
          body: { category: cat, limit: 6 },
        });
        if (!cancel && data?.products) setLive(data.products);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Combine: chat products first (deduped), then live picks
  const seen = new Set<string>();
  const combined: Product[] = [];
  for (const p of [...chatProducts, ...live]) {
    if (!seen.has(p.id)) { seen.add(p.id); combined.push(p); }
  }

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-sidebar/40 flex flex-col h-screen">
      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-warm grid place-items-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-sm">Live Picks</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Real products, fetched live from the store.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading && combined.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-xs">Loading picks…</p>
          </div>
        ) : combined.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 px-4">
            <ShoppingBag className="w-8 h-8 opacity-50" />
            <p className="text-xs">No products yet. Start a chat to discover items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {combined.map((p) => <ProductCard key={p.id} product={p} compact />)}
          </div>
        )}
      </div>
    </aside>
  );
};
