import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getSession, limparSession } from "../services/auth";
import { getJogador } from "../services/jogadores";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jogador, setJogador] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role || null;
  const grupoId = user?.grupo_id || null;
  const grupoSlug = user?.grupo_slug || null;
  const isAdmin = role === "super_admin" || role === "group_admin";
  const isSuperAdmin = role === "super_admin";
  const isGroupAdmin = role === "group_admin";

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      if (session.nome && session.role && session.role !== "super_admin") {
        getJogador(session.nome).then((p) => setJogador(p)).catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  const setSession = useCallback((session) => {
    setUser(session);
    if (session?.nome && session?.role && session.role !== "super_admin") {
      getJogador(session.nome).then((p) => setJogador(p)).catch(() => {});
    }
  }, []);

  const signOut = useCallback(async () => {
    limparSession();
    setUser(null);
    setJogador(null);
  }, []);

  const refreshJogador = useCallback(async () => {
    const session = getSession();
    if (session?.nome && session.role && session.role !== "super_admin") {
      const p = await getJogador(session.nome).catch(() => null);
      setJogador(p);
    }
  }, []);

  const refreshUser = useCallback(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      if (session.nome && session.role && session.role !== "super_admin") {
        getJogador(session.nome).then((p) => setJogador(p)).catch(() => {});
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        jogador,
        role,
        grupoId,
        grupoSlug,
        isAdmin,
        isSuperAdmin,
        isGroupAdmin,
        loading,
        signOut,
        setSession,
        refreshJogador,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
