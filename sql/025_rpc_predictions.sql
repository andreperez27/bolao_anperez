-- =============================================================
-- RPCs — PREDICTIONS / RANKING / ADMIN INVITES
-- =============================================================

CREATE OR REPLACE FUNCTION listar_predictions(
  p_grupo_id UUID, p_profile_id UUID DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', pr.id, 'participante', pr.participante, 'nome', pr.nome,
    'palpites', pr.palpites,
    'campeao_id', pr.campeao_id, 'campeao_nome', t.nome,
    'campeao_fase', pr.campeao_fase,
    'status', pr.status, 'valor_pago', pr.valor_pago,
    'created_at', pr.created_at, 'updated_at', pr.updated_at
  ) ORDER BY pr.created_at DESC), '[]'::JSON) INTO v
  FROM predictions pr
  LEFT JOIN teams t ON t.id = pr.campeao_id
  WHERE pr.grupo_id = p_grupo_id
    AND pr.deleted_at IS NULL
    AND (p_profile_id IS NULL OR pr.profile_id = p_profile_id);
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION salvar_prediction(
  p_id TEXT, p_grupo_id UUID, p_sessao_token UUID,
  p_participante TEXT, p_nome TEXT DEFAULT 'Cartela',
  p_palpites JSONB DEFAULT '{}',
  p_campeao_id UUID DEFAULT NULL,
  p_campeao_fase TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  INSERT INTO predictions (id, grupo_id, profile_id, participante, nome, palpites, campeao_id, campeao_fase)
  VALUES (p_id, p_grupo_id, v_profile_id, p_participante, p_nome, p_palpites, p_campeao_id, p_campeao_fase)
  ON CONFLICT (id) DO UPDATE SET
    palpites = EXCLUDED.palpites,
    campeao_id = EXCLUDED.campeao_id,
    campeao_fase = EXCLUDED.campeao_fase,
    updated_at = NOW();
  RETURN json_build_object('id', p_id);
END;
$$;

CREATE OR REPLACE FUNCTION validar_prediction(
  p_id TEXT, p_sessao_token UUID, p_status TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_grupo_id UUID; v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT grupo_id INTO v_grupo_id FROM predictions WHERE id = p_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Cartela não encontrada'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode validar'; END IF;
  IF p_status NOT IN ('validada', 'rejeitada') THEN
    RAISE EXCEPTION 'Status inválido. Use validada ou rejeitada';
  END IF;
  UPDATE predictions SET status = p_status, updated_at = NOW() WHERE id = p_id;
  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION excluir_prediction(p_id TEXT, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_grupo_id UUID; v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT grupo_id INTO v_grupo_id FROM predictions WHERE id = p_id;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  UPDATE predictions SET deleted_at = NOW() WHERE id = p_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- Ranking

CREATE OR REPLACE FUNCTION calcular_ranking(p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_regras JSONB; v_edition_id UUID;
  v_placar_exato INT; v_diferenca INT; v_vencedor INT;
  v_resultados JSON;
  v JSON;
BEGIN
  SELECT edition_id INTO v_edition_id FROM groups WHERE id = p_grupo_id;
  SELECT regras INTO v_regras FROM group_config WHERE grupo_id = p_grupo_id;
  v_placar_exato := COALESCE((v_regras->>'pontos_placar_exato')::INT, 5);
  v_diferenca := COALESCE((v_regras->>'pontos_diferenca_certa')::INT, 4);
  v_vencedor := COALESCE((v_regras->>'pontos_vencedor_certo')::INT, 3);

  SELECT json_object_agg(match_id::TEXT,
    json_build_object('placar_a', placar_a, 'placar_b', placar_b)
  ) INTO v_resultados
  FROM match_results mr
  JOIN matches m ON m.id = mr.match_id
  WHERE m.edition_id = v_edition_id AND mr.encerrado = TRUE;

  WITH scores AS (
    SELECT
      pr.profile_id, pr.participante, pr.id AS prediction_id,
      pr.palpites,
      (
        SELECT COALESCE(SUM(
          CASE
            WHEN r.value->>'placar_a' IS NULL THEN 0
            WHEN (palp.value->>'gols_a')::INT = (r.value->>'placar_a')::INT
             AND (palp.value->>'gols_b')::INT = (r.value->>'placar_b')::INT
            THEN v_placar_exato
            WHEN ((palp.value->>'gols_a')::INT - (palp.value->>'gols_b')::INT) =
                 ((r.value->>'placar_a')::INT - (r.value->>'placar_b')::INT)
             AND (palp.value->>'gols_a')::INT != (r.value->>'placar_a')::INT
            THEN v_diferenca
            WHEN ((palp.value->>'gols_a')::INT > (palp.value->>'gols_b')::INT
              AND (r.value->>'placar_a')::INT > (r.value->>'placar_b')::INT)
              OR ((palp.value->>'gols_a')::INT < (palp.value->>'gols_b')::INT
              AND (r.value->>'placar_a')::INT < (r.value->>'placar_b')::INT)
            THEN v_vencedor
            ELSE 0
          END
        ), 0)
        FROM jsonb_each(pr.palpites) palp
        LEFT JOIN json_each(v_resultados) r ON r.key = palp.key
      ) AS pontos,
      (
        SELECT COUNT(*)
        FROM jsonb_each(pr.palpites) palp
        JOIN json_each(v_resultados) r ON r.key = palp.key
        WHERE (palp.value->>'gols_a')::INT = (r.value->>'placar_a')::INT
          AND (palp.value->>'gols_b')::INT = (r.value->>'placar_b')::INT
      ) AS exatos,
      (
        SELECT COUNT(*)
        FROM jsonb_each(pr.palpites) palp
        JOIN json_each(v_resultados) r ON r.key = palp.key
        WHERE (r.value->>'placar_a') IS NOT NULL
          AND ((palp.value->>'gols_a')::INT - (palp.value->>'gols_b')::INT) =
              ((r.value->>'placar_a')::INT - (r.value->>'placar_b')::INT)
      ) AS acertos
    FROM predictions pr
    WHERE pr.grupo_id = p_grupo_id AND pr.deleted_at IS NULL AND pr.status = 'validada'
  )
  SELECT COALESCE(json_agg(json_build_object(
    'profile_id', profile_id, 'participante', participante,
    'pontos', pontos, 'acertos', acertos, 'exatos', exatos,
    'diferencas', acertos - exatos,
    'vencedores', pontos - (acertos - exatos) * v_diferenca - exatos * v_placar_exato
  ) ORDER BY pontos DESC, exatos DESC), '[]'::JSON) INTO v
  FROM scores;
  RETURN v;
END;
$$;

-- Admin Invites

CREATE OR REPLACE FUNCTION gerar_admin_invite(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT; v_secret TEXT; v_hash TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode gerar convites de admin'; END IF;
  v_secret := encode(extensions.gen_random_bytes(6), 'hex');
  v_hash := extensions.crypt(v_secret, extensions.gen_salt('bf'));
  INSERT INTO admin_invites (grupo_id, profile_id, secret_hash)
  VALUES (p_grupo_id, v_profile_id, v_hash)
  ON CONFLICT (grupo_id, profile_id) DO UPDATE SET
    secret_hash = v_hash, usado = FALSE,
    expira_em = NOW() + INTERVAL '7 days';
  RETURN json_build_object('secret', v_secret, 'expira_em', NOW() + INTERVAL '7 days');
END;
$$;

CREATE OR REPLACE FUNCTION usar_admin_invite(p_grupo_id UUID, p_secret TEXT, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_invite admin_invites%ROWTYPE;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT * INTO v_invite FROM admin_invites
  WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id AND usado = FALSE
    AND expira_em > NOW();
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite de admin inválido ou expirado'; END IF;
  IF v_invite.secret_hash != extensions.crypt(p_secret, v_invite.secret_hash) THEN
    RAISE EXCEPTION 'Senha secreta inválida';
  END IF;
  INSERT INTO group_members (grupo_id, profile_id, role)
  VALUES (p_grupo_id, v_profile_id, 'admin')
  ON CONFLICT (grupo_id, profile_id) DO UPDATE SET role = 'admin';
  UPDATE admin_invites SET usado = TRUE WHERE id = v_invite.id;
  RETURN json_build_object('ok', true);
END;
$$;
