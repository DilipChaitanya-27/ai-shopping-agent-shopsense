import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, ShoppingCart, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useShop, Product } from "@/contexts/ShopContext";
import { ChatSidebar, ChatMeta } from "@/components/ChatSidebar";
import { RecommendationsRail } from "@/components/RecommendationsRail";
import { ProductCard } from "@/components/ProductCard";
import { CartWishlistDialog } from "@/components/CartWishlistDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; products?: Product[] };

type ChatData = { meta: ChatMeta; messages: Msg[] };

const STORAGE_KEY = "ss-chats-v1";

const loadChats = (): ChatData[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveChats = (chats: ChatData[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));

const newChat = (): ChatData => ({
  meta: { id: crypto.randomUUID(), title: "New chat", createdAt: Date.now() },
  messages: [],
});

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, cart } = useShop();

  const [chats, setChats] = useState<ChatData[]>(() => {
    const stored = loadChats();
    return stored.length ? stored : [newChat()];
  });
  const [activeId, setActiveId] = useState<string>(() => loadChats()[0]?.meta.id || chats[0].meta.id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [openDialog, setOpenDialog] = useState<"cart" | "wishlist" | null>(null);

  const active = chats.find((c) => c.meta.id === activeId) || chats[0];
  const recProducts = useMemo(() => {
    const seen = new Set<string>();
    const arr: Product[] = [];
    for (let i = active.messages.length - 1; i >= 0; i--) {
      const m = active.messages[i];
      if (m.role === "assistant" && m.products) {
        for (const p of m.products) if (!seen.has(p.id)) { seen.add(p.id); arr.push(p); }
      }
    }
    return arr;
  }, [active]);

  useEffect(() => { saveChats(chats); }, [chats]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active.messages, sending]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const updateActive = (mut: (c: ChatData) => ChatData) =>
    setChats((cs) => cs.map((c) => (c.meta.id === activeId ? mut(c) : c)));

  const handleNew = () => {
    const c = newChat();
    setChats((cs) => [c, ...cs]);
    setActiveId(c.meta.id);
  };

  const handleDelete = (id: string) => {
    setChats((cs) => {
      const next = cs.filter((c) => c.meta.id !== id);
      if (next.length === 0) {
        const fresh = newChat();
        setActiveId(fresh.meta.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].meta.id);
      return next;
    });
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: trimmed };

    // Add user message + set title if first
    updateActive((c) => ({
      ...c,
      meta: { ...c.meta, title: c.messages.length === 0 ? trimmed.slice(0, 40) : c.meta.title },
      messages: [...c.messages, userMsg],
    }));

    setSending(true);
    try {
      const history = [...active.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: history },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const reply: Msg = {
        role: "assistant",
        content: data?.reply || "Sorry, I couldn't generate a response.",
        products: data?.products || [],
      };
      updateActive((c) => ({ ...c, messages: [...c.messages, reply] }));
    } catch (e: any) {
      const errMsg = e?.message || "Something went wrong";
      toast.error(errMsg);
      updateActive((c) => ({
        ...c,
        messages: [...c.messages, { role: "assistant", content: `⚠️ ${errMsg}` }],
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        chats={chats.map((c) => c.meta)}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        onQuickPrompt={(t) => send(t)}
      />

      {/* Main chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display font-semibold truncate">{active.meta.title}</h1>
            <p className="text-xs text-muted-foreground">AI Shopping Assistant · Live Shopify catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="relative w-10 h-10 rounded-full glass grid place-items-center hover:bg-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative w-10 h-10 rounded-full glass grid place-items-center hover:bg-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </span>
              )}
            </Link>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          {active.messages.length === 0 && (
            <div className="max-w-2xl mx-auto text-center pt-16">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-primary shadow-glow mb-5 grid place-items-center">
                <span className="text-2xl">🛍️</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-2">
                What are you <span className="text-gradient">shopping for</span>?
              </h2>
              <p className="text-muted-foreground text-sm">
                I can help with headphones, skincare, snowboards & gift cards. Tell me your need + budget.
              </p>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence initial={false}>
              {active.messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user"
                          ? "bg-gradient-primary text-primary-foreground shadow-soft"
                          : "bg-card border border-border"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                    {m.role === "assistant" && m.products && m.products.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {m.products.slice(0, 6).map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching the store…
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card/40 px-6 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="max-w-3xl mx-auto flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Try: ‘in-ear earbuds under ₹3000 with mic’"
                rows={1}
                className="w-full resize-none rounded-2xl bg-background border border-border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center disabled:opacity-50 hover:scale-105 transition-transform shadow-soft"
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>

      <RecommendationsRail chatProducts={recProducts} />

      <CartWishlistDialog open={openDialog} onClose={() => setOpenDialog(null)} />
    </div>
  );
};

export default Chat;
