-- Admin Features: campos reais, remover membro, lixeira, senha admin

-- =============================================================
-- 1. Novas colunas em group_config
-- =============================================================
ALTER TABLE group_config ADD COLUMN IF NOT EXISTS campeao_real_id UUID REFERENCES teams(id);
ALTER TABLE group_config ADD COLUMN IF NOT EXISTS vice_campeao_real_id UUID REFERENCES teams(id);
ALTER TABLE group_config ADD COLUMN IF NOT EXISTS artilheiro_real_nome TEXT;
ALTER TABLE group_config ADD COLUMN IF NOT EXISTS artilheiro_real_selecao TEXT;
ALTER TABLE group_config ADD COLUMN IF NOT EXISTS admin_senha TEXT;

-- =============================================================
-- 2. Atualizar buscar_config_grupo_v2 (já usa row_to_json, pega automaticamente)
-- =============================================================

-- =============================================================
-- 3. Atualizar atualizar_config_grupo_v2
-- =============================================================
CREATE OR REPLACE FUNCTION atualizar_config_grupo_v2(
  p_grupo_id UUID, p_sessao_token UUID,
  p_valor_aposta NUMERIC DEFAULT NULL,
  p_api_url TEXT DEFAULT NULL,
  p_bonus_geral NUMERIC DEFAULT NULL,
  p_regras JSONB DEFAULT NULL,
  p_campeao_real_id UUID DEFAULT NULL,
  p_vice_campeao_real_id UUID DEFAULT NULL,
  p_artilheiro_real_nome TEXT DEFAULT NULL,
  p_artilheiro_real_selecao TEXT DEFAULT NULL,
  p_admin_senha TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode alterar configurações'; END IF;
  UPDATE group_config SET
    valor_aposta = COALESCE(p_valor_aposta, valor_aposta),
    api_url = COALESCE(p_api_url, api_url),
    bonus_geral = COALESCE(p_bonus_geral, bonus_geral),
    regras = COALESCE(p_regras, regras),
    campeao_real_id = COALESCE(p_campeao_real_id, campeao_real_id),
    vice_campeao_real_id = COALESCE(p_vice_campeao_real_id, vice_campeao_real_id),
    artilheiro_real_nome = COALESCE(p_artilheiro_real_nome, artilheiro_real_nome),
    artilheiro_real_selecao = COALESCE(p_artilheiro_real_selecao, artilheiro_real_selecao),
    admin_senha = COALESCE(p_admin_senha, admin_senha),
    updated_at = NOW()
  WHERE grupo_id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- =============================================================
-- 4. remover_membro_grupo_v2
-- =============================================================
CREATE OR REPLACE FUNCTION remover_membro_grupo_v2(
  p_grupo_id UUID, p_membro_profile_id UUID, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode remover membros'; END IF;
  IF v_profile_id = p_membro_profile_id THEN RAISE EXCEPTION 'Admin não pode remover a si mesmo'; END IF;
  DELETE FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = p_membro_profile_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- =============================================================
-- 5. listar_predictions_excluidas
-- =============================================================
CREATE OR REPLACE FUNCTION listar_predictions_excluidas(
  p_grupo_id UUID, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON; v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode ver cartelas excluídas'; END IF;
  SELECT COALESCE(json_agg(json_build_object(
    'id', pr.id, 'participante', pr.participante, 'nome', pr.nome,
    'palpites', pr.palpites,
    'campeao_id', pr.campeao_id, 'campeao_nome', tc.nome,
    'vice_campeao_id', pr.vice_campeao_id, 'vice_campeao_nome', tv.nome,
    'artilheiro_nome', pr.artilheiro_nome,
    'artilheiro_selecao', pr.artilheiro_selecao,
    'status', pr.status, 'deleted_at', pr.deleted_at
  ) ORDER BY pr.deleted_at DESC), '[]'::JSON) INTO v
  FROM predictions pr
  LEFT JOIN teams tc ON tc.id = pr.campeao_id
  LEFT JOIN teams tv ON tv.id = pr.vice_campeao_id
  WHERE pr.grupo_id = p_grupo_id AND pr.deleted_at IS NOT NULL;
  RETURN v;
END;
$$;

-- =============================================================
-- 6. restaurar_prediction
-- =============================================================
CREATE OR REPLACE FUNCTION restaurar_prediction(
  p_id TEXT, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_grupo_id UUID; v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT grupo_id INTO v_grupo_id FROM predictions WHERE id = p_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Cartela não encontrada'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode restaurar cartelas'; END IF;
  UPDATE predictions SET deleted_at = NULL, updated_at = NOW() WHERE id = p_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- =============================================================
-- 7. excluir_prediction_definitivo
-- =============================================================
CREATE OR REPLACE FUNCTION excluir_prediction_definitivo(
  p_id TEXT, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_grupo_id UUID; v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT grupo_id INTO v_grupo_id FROM predictions WHERE id = p_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Cartela não encontrada'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode excluir cartelas permanentemente'; END IF;
  DELETE FROM predictions WHERE id = p_id;
  RETURN json_build_object('ok', true);
END;
$$;
