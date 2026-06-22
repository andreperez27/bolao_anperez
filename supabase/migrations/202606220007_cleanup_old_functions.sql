-- =============================================================
-- CLEANUP: Remove old convite functions with wrong signatures
-- =============================================================

DROP FUNCTION IF EXISTS gerar_convite_participante(UUID, UUID, INT, INT);
DROP FUNCTION IF EXISTS usar_convite_participante(TEXT, UUID, UUID);  -- old version with profile_id
DROP FUNCTION IF EXISTS usar_convite_participante(TEXT, TEXT, UUID);  -- any variant

-- Ensure the wrapper function exists and works
DROP FUNCTION IF EXISTS usar_convite_participante(TEXT, UUID);
CREATE OR REPLACE FUNCTION usar_convite_participante(p_token TEXT, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN solicitar_entrada_com_convite(p_token, p_sessao_token);
END;
$$;
