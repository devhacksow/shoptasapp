import { useCallback, useEffect, useState } from "react";
import { api, setAuthToken, type AuthUser } from "../api/client";

const TOKEN_KEY = "vinted_token";

export interface UseAuth {
  user: AuthUser | null;
  loading: boolean;
  register: (body: {
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  login: (body: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setFavorites: (favorites: string[]) => void;
}

/** Gère l'authentification et restaure la session depuis localStorage. */
export function useAuth(): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restauration de session au montage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = (token: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  };

  const register = useCallback(
    async (body: { email: string; username: string; password: string }) => {
      const res = await api.register(body);
      handleAuth(res.token, res.user);
    },
    []
  );

  const login = useCallback(
    async (body: { email: string; password: string }) => {
      const res = await api.login(body);
      handleAuth(res.token, res.user);
    },
    []
  );

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await api.loginWithGoogle(credential);
    handleAuth(res.token, res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const setFavorites = useCallback((favorites: string[]) => {
    setUser((prev) => (prev ? { ...prev, favorites } : prev));
  }, []);

  return { user, loading, register, login, loginWithGoogle, logout, setFavorites };
}
