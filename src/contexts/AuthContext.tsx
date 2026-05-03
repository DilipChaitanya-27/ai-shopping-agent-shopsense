import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuth, type User } from "@/lib/firebase";

type Ctx = { user: User | null; loading: boolean };
const AuthContext = createContext<Ctx>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
