import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { ShoppingBag, Moon, Sun } from "lucide-react";

export const Header = () => {
  const { theme, toggle } = useTheme();
  return (
    <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 py-5">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
          <ShoppingBag className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">
          Shop<span className="text-gradient">Sense</span>
        </span>
      </Link>
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full glass grid place-items-center hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
};
