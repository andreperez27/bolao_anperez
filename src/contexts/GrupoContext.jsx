import { createContext, useContext, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const GrupoContext = createContext()

const GRUPOS_POR_SLUG = {
  geral: { id: 'geral', nome: 'Bolão Geral', slug: 'geral' },
}

export function GrupoProvider({ children }) {
  const { slug } = useParams()
  const navigate = useNavigate()

  const grupoId = useMemo(() => {
    if (!slug) return 'geral'
    return GRUPOS_POR_SLUG[slug]?.id || null
  }, [slug])

  const grupo = useMemo(() => {
    if (!slug) return GRUPOS_POR_SLUG['geral']
    return GRUPOS_POR_SLUG[slug] || null
  }, [slug])

  const setGrupo = useCallback((g) => {
    if (g?.slug) {
      navigate(`/${g.slug}`, { replace: true })
    }
  }, [navigate])

  return (
    <GrupoContext.Provider value={{ grupoId, grupo, setGrupo, GRUPOS_POR_SLUG }}>
      {children}
    </GrupoContext.Provider>
  )
}

export function useGrupo() {
  const ctx = useContext(GrupoContext)
  if (!ctx) throw new Error('useGrupo must be used within GrupoProvider')
  return ctx
}
