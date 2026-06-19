import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { buscarGrupoPorSlug } from "../services/grupos";

const GrupoContext = createContext(null);

export function GrupoProvider({ children }) {
  const location = useLocation();
  const [grupo, setGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const slug = extrairSlug(location.pathname);

  useEffect(() => {
    if (!slug) {
      setGrupo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    buscarGrupoPorSlug(slug)
      .then((data) => {
        if (!cancelled) {
          if (data && data.id) {
            setGrupo(data);
          } else {
            setError("Grupo não encontrado");
            setGrupo(null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setGrupo(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await buscarGrupoPorSlug(slug);
      if (data && data.id) setGrupo(data);
    } catch {}
  }, [slug]);

  return (
    <GrupoContext.Provider value={{ grupo, loading, error, slug, refresh }}>
      {children}
    </GrupoContext.Provider>
  );
}

export function useGrupo() {
  const ctx = useContext(GrupoContext);
  if (!ctx) throw new Error("useGrupo must be used within GrupoProvider");
  return ctx;
}

function extrairSlug(pathname) {
  const match = pathname.match(/\/grupo\/([^/]+)/);
  return match ? match[1] : null;
}
