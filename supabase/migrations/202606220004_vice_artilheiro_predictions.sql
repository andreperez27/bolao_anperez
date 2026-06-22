-- Adiciona campos de vice-campeão e artilheiro na tabela predictions
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS vice_campeao_id UUID REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS artilheiro_nome TEXT,
  ADD COLUMN IF NOT EXISTS artilheiro_selecao TEXT;

-- Atualiza listar_predictions para incluir os novos campos
CREATE OR REPLACE FUNCTION listar_predictions(
  p_grupo_id UUID, p_profile_id UUID DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', pr.id, 'participante', pr.participante, 'nome', pr.nome,
    'palpites', pr.palpites,
    'campeao_id', pr.campeao_id, 'campeao_nome', tc.nome,
    'campeao_fase', pr.campeao_fase,
    'vice_campeao_id', pr.vice_campeao_id, 'vice_campeao_nome', tv.nome,
    'artilheiro_nome', pr.artilheiro_nome,
    'artilheiro_selecao', pr.artilheiro_selecao,
    'status', pr.status, 'valor_pago', pr.valor_pago,
    'created_at', pr.created_at, 'updated_at', pr.updated_at
  ) ORDER BY pr.created_at DESC), '[]'::JSON) INTO v
  FROM predictions pr
  LEFT JOIN teams tc ON tc.id = pr.campeao_id
  LEFT JOIN teams tv ON tv.id = pr.vice_campeao_id
  WHERE pr.grupo_id = p_grupo_id
    AND pr.deleted_at IS NULL
    AND (p_profile_id IS NULL OR pr.profile_id = p_profile_id);
  RETURN v;
END;
$$;

-- Atualiza salvar_prediction para aceitar os novos campos
CREATE OR REPLACE FUNCTION salvar_prediction(
  p_id TEXT, p_grupo_id UUID, p_sessao_token UUID,
  p_participante TEXT, p_nome TEXT DEFAULT 'Cartela',
  p_palpites JSONB DEFAULT '{}',
  p_campeao_id UUID DEFAULT NULL,
  p_campeao_fase TEXT DEFAULT NULL,
  p_vice_campeao_id UUID DEFAULT NULL,
  p_artilheiro_nome TEXT DEFAULT NULL,
  p_artilheiro_selecao TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  INSERT INTO predictions (id, grupo_id, profile_id, participante, nome, palpites,
    campeao_id, campeao_fase, vice_campeao_id, artilheiro_nome, artilheiro_selecao)
  VALUES (p_id, p_grupo_id, v_profile_id, p_participante, p_nome, p_palpites,
    p_campeao_id, p_campeao_fase, p_vice_campeao_id, p_artilheiro_nome, p_artilheiro_selecao)
  ON CONFLICT (id) DO UPDATE SET
    palpites = EXCLUDED.palpites,
    campeao_id = EXCLUDED.campeao_id,
    campeao_fase = EXCLUDED.campeao_fase,
    vice_campeao_id = EXCLUDED.vice_campeao_id,
    artilheiro_nome = EXCLUDED.artilheiro_nome,
    artilheiro_selecao = EXCLUDED.artilheiro_selecao,
    updated_at = NOW();
  RETURN json_build_object('id', p_id);
END;
$$;
