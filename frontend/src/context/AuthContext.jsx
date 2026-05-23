import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiJson, getStoredToken, setStoredToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getStoredToken());
  const [ready, setReady] = useState(false);

  const setSession = useCallback(({ token: t, user: u }) => {
    if (t) setStoredToken(t);
    else setStoredToken("");
    setTokenState(t || "");
    setUser(u ?? null);
  }, []);

  const logout = useCallback(() => {
    setStoredToken("");
    setTokenState("");
    setUser(null);
  }, []);

  const loadProfile = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const data = await apiJson("/api/auth/me", { token: t });
      setUser(data.user);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadProfile();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(
    async (email, password) => {
      const data = await apiJson("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setSession({ token: data.token, user: data.user });
      return data;
    },
    [setSession]
  );

  const register = useCallback(
    async (fullName, email, password) => {
      const data = await apiJson("/api/auth/register", {
        method: "POST",
        body: { fullName, email, password },
      });
      setSession({ token: data.token, user: data.user });
      return data;
    },
    [setSession]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      isAuthenticated: ready && Boolean(token && user),
      login,
      register,
      logout,
      loadProfile,
    }),
    [user, token, ready, login, register, logout, loadProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
