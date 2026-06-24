import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buscarGrupoPorSlug, listarMembros, buscarConfigGrupo } from '../services/groups';
import { buscarEdicaoDoGrupo } from '../services/competitions';
import { getSession } from '../services/auth';

const GrupoContext = createContext();

export function GrupoProvider({ children }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ grupo: null, edition: null, config: null, membros: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionToken, setSessionToken] = useState(() => getSession()?.sessao_token);

  useEffect(() => {
    const sync = () => {
      const t = getSession()?.sessao_token;
      setSessionToken((prev) => (t !== prev ? t : prev));
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const grupoSlug = useMemo(() => slug || null, [slug]);
  const isInGroup = useMemo(() => !!slug, [slug]);

  const load = useCallback(async () => {
    if (!grupoSlug) { setLoading(false); setData({ grupo: null, edition: null, config: null, membros: [] }); return; }
    setLoading(true);
    setError(null);
    try {
      const grupo = await buscarGrupoPorSlug(grupoSlug);
      const [edition, config] = await Promise.all([
        buscarEdicaoDoGrupo(grupoSlug),
        buscarConfigGrupo(grupo.id).catch(() => null),
      ]);
      const session = getSession();
      let membros = [];
      if (session?.sessao_token) {
        try { membros = await listarMembros(grupo.id, session.sessao_token); } catch {}
      }
      setData({ grupo, edition, config, membros });
    } catch (e) {
      setError(e.message);
      setData({ grupo: null, edition: null, config: null, membros: [] });
    }
    setLoading(false);
  }, [grupoSlug, sessionToken]);

  useEffect(() => { load(); }, [load]);

  const membership = useMemo(() => {
    const session = getSession();
    if (!session?.profile_id || !data.membros.length) return null;
    return data.membros.find((m) => m.profile_id === session.profile_id) || null;
  }, [data.membros, sessionToken]);

  const navigateTo = useCallback((path) => {
    navigate(`/g/${grupoSlug}/${path}`, { replace: true });
  }, [grupoSlug, navigate]);

  return (
    <GrupoContext.Provider value={{
      grupoId: data.grupo?.id || null,
      grupo: data.grupo,
      edition: data.edition,
      config: data.config,
      membros: data.membros,
      membership,
      loading,
      error,
      grupoSlug,
      isInGroup,
      navigateTo,
      reload: load,
    }}>
      {children}
    </GrupoContext.Provider>
  );
}

export function useGrupo() {
  const ctx = useContext(GrupoContext);
  if (!ctx) throw new Error('useGrupo must be used within GrupoProvider');
  return ctx;
}
