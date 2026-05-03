import { useEffect, useRef, useState } from "react";
import { MoreVertical, Plus, Trash2, MessageSquare, Sparkles, LogOut, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/firebase";

export type ChatMeta = { id: string; title: string; createdAt: number };

const QUICK_PROMPTS = [
  "Wireless over-ear headphones under ₹15,000 for gaming",
  "Lightweight in-ear earbuds for daily commute",
  "Sunscreen SPF 50 for oily skin",
  "Best moisturizer under ₹2,000",
  "Recommend a beginner snowboard",
  "Show me gift card options",
];

type Props = {
  chats: ChatMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onQuickPrompt: (text: string) => void;
};

export const ChatSidebar = ({ chats, activeId, onSelect, onNew, onDelete, onQuickPrompt }: Props) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold tracking-tight">
            Shop<span className="text-gradient">Sense</span>
          </span>
        </Link>
        <button
          onClick={onNew}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      <div ref={wrapRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Quick prompts */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Quick Prompts
          </h3>
          <div className="space-y-1">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => onQuickPrompt(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors line-clamp-2"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-sidebar-border my-2" />

        {/* Recent chats */}
        <div className="px-4 pt-2 pb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Recent Chats
          </h3>
          {chats.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No chats yet.</p>
          ) : (
            <div className="space-y-1">
              {chats.map((c) => (
                <div
                  key={c.id}
                  className={`group relative flex items-center rounded-lg transition-colors ${
                    c.id === activeId ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
                  }`}
                >
                  <button
                    onClick={() => onSelect(c.id)}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-left min-w-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="text-xs truncate">{c.title || "New chat"}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === c.id ? null : c.id); }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-2 hover:text-primary transition-opacity"
                    aria-label="Chat options"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen === c.id && (
                    <div className="absolute right-2 top-9 z-10 w-32 rounded-lg bg-popover border border-border shadow-card overflow-hidden">
                      <button
                        onClick={() => { onDelete(c.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-sidebar-accent transition-colors">
          <Home className="w-3.5 h-3.5" /> Home
        </Link>
        {user && (
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-primary grid place-items-center text-[10px] font-bold text-primary-foreground">
                  {user.isAnonymous ? "G" : (user.displayName?.[0] || "U")}
                </div>
              )}
              <span className="text-xs truncate">{user.isAnonymous ? "Guest" : user.displayName || "User"}</span>
            </div>
            <button onClick={() => signOut()} aria-label="Sign out" className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
