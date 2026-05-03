import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Brain, ShoppingCart, Heart, ArrowRight, LogIn, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle, signInAsGuest } from "@/lib/firebase";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import bgLight from "@/assets/bg-light.png";
import bgDark from "@/assets/bg-dark.png";

const features = [
  {
    icon: Brain,
    title: "Understands Intent",
    desc: "Asks smart follow-ups instead of dumping every product. Knows what you actually need.",
  },
  {
    icon: Sparkles,
    title: "Live Shopify Catalog",
    desc: "Recommends real, in-stock products from the store — never invents anything.",
  },
  {
    icon: ShoppingCart,
    title: "From Intent to Cart",
    desc: "Compares tradeoffs, explains the pick, and gets you to checkout in one conversation.",
  },
  {
    icon: Heart,
    title: "Memory & Wishlist",
    desc: "Remembers your preferences across the chat. Save favorites, refine on the fly.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const [signing, setSigning] = useState<"google" | "guest" | null>(null);

  const go = () => navigate("/chat");

  const handleGoogle = async () => {
    setSigning("google");
    try {
      await signInWithGoogle();
      toast.success("Welcome to ShopSense!");
      navigate("/chat");
    } catch (e: any) {
      toast.error(e?.message || "Sign-in failed");
    } finally {
      setSigning(null);
    }
  };

  const handleGuest = async () => {
    setSigning("guest");
    try {
      await signInAsGuest();
      toast.success("Continuing as guest");
      navigate("/chat");
    } catch (e: any) {
      toast.error(e?.message || "Guest sign-in failed");
    } finally {
      setSigning(null);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-500"
        style={{ backgroundImage: `url(${theme === "dark" ? bgDark : bgLight})` }}
      />
      <div className="absolute inset-0 -z-10 bg-background/40 dark:bg-background/60" />

      <Header />

      <main className="relative flex-1 min-h-0 px-6 lg:px-10 max-w-7xl w-full mx-auto flex flex-col justify-center gap-8 py-6 overflow-hidden">
        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              AI Shopping Agent 
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-4">
              Stop browsing. <br />
              <span className="text-gradient">Start telling.</span>
            </h1>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              ShopSense is your conversational shopping assistant. Tell it what you need, your budget,
              your vibe — it finds the right product, explains why, and drops it in your cart.
            </p>

            <div className="flex flex-wrap gap-3">
              {user && !loading ? (
                <button
                  onClick={go}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform"
                >
                  Open Chat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGoogle}
                    disabled={signing !== null}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60"
                  >
                    {signing === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                    Sign in with Google
                  </button>
                  <button
                    onClick={handleGuest}
                    disabled={signing !== null}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass font-semibold hover:bg-accent transition-colors disabled:opacity-60"
                  >
                    {signing === "guest" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    Continue as Guest
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Try: <span className="text-foreground">“Wireless over-ear headphones under ₹15,000 for gaming”</span>
            </p>
          </motion.div>

          <div className="hidden lg:block" />
        </section>

        {/* Features */}
        <section>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative p-[1.5px] rounded-2xl bg-gradient-primary shadow-card hover:shadow-glow transition-shadow"
              >
                <div className="h-full rounded-2xl bg-card p-4 flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-gradient-warm grid place-items-center mb-3">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>
);

export default Index;
