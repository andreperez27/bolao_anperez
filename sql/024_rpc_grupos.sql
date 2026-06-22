-- =============================================================
-- RPCs — GRUPOS / MEMBROS / CONFIG
-- =============================================================

CREATE OR REPLACE FUNCTION criar_grupo_bolao(
  p_nome TEXT, p_slug TEXT, p_edition_id UUID,
  p_criador_sessao UUID, p_valor_aposta NUMERIC DEFAULT 20
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_profile_id UUID; v_grupo_id UUID;
  v_admin_senha TEXT; v_admin_secret_hash TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_criador_sessao;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF EXISTS (SELECT 1 FROM groups WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;
  INSERT INTO groups (nome, slug, edition_id, criado_por)
  VALUES (p_nome, p_slug, p_edition_id, v_profile_id)
  RETURNING id INTO v_grupo_id;
  INSERT INTO group_members (grupo_id, profile_id, role) VALUES (v_grupo_id, v_profile_id, 'admin');
  INSERT INTO group_config (grupo_id, valor_aposta) VALUES (v_grupo_id, p_valor_aposta);
  v_admin_senha := encode(extensions.gen_random_bytes(4), 'hex');
  v_admin_secret_hash := extensions.crypt(v_admin_senha, extensions.gen_salt('bf'));
  INSERT INTO admin_invites (grupo_id, profile_id, secret_hash)
  VALUES (v_grupo_id, v_profile_id, v_admin_secret_hash);
  RETURN json_build_object('grupo_id', v_grupo_id, 'slug', p_slug, 'admin_password', v_admin_senha);
END;
$$;

CREATE OR REPLACE FUNCTION listar_grupos_publicos()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', g.id, 'nome', g.nome, 'slug', g.slug,
    'edition_id', g.edition_id, 'edition_nome', e.nome
  ) ORDER BY g.nome), '[]'::JSON) INTO v
  FROM groups g
  JOIN competition_editions e ON e.id = g.edition_id
  WHERE g.ativo = TRUE;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_grupo_por_slug_v2(p_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object(
    'id', g.id, 'nome', g.nome, 'slug', g.slug,
    'edition_id', g.edition_id, 'edition_nome', e.nome,
    'edition_slug', e.slug
  ) INTO v
  FROM groups g
  JOIN competition_editions e ON e.id = g.edition_id
  WHERE g.slug = p_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado'; END IF;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION slug_disponivel(p_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM groups WHERE slug = p_slug) INTO v;
  RETURN json_build_object('disponivel', v);
END;
$$;

CREATE OR REPLACE FUNCTION listar_membros_grupo_v2(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON; v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  SELECT COALESCE(json_agg(json_build_object(
    'profile_id', p.id, 'nome', p.nome,
    'role', gm.role, 'pago', gm.pago
  ) ORDER BY gm.role, p.nome), '[]'::JSON) INTO v
  FROM group_members gm
  JOIN profiles p ON p.id = gm.profile_id
  WHERE gm.grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION entrar_em_grupo(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_nome TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  INSERT INTO group_members (grupo_id, profile_id, role)
  VALUES (p_grupo_id, v_profile_id, 'participante')
  ON CONFLICT (grupo_id, profile_id) DO NOTHING;
  SELECT nome INTO v_nome FROM groups WHERE id = p_grupo_id;
  RETURN json_build_object('ok', true, 'grupo_nome', v_nome);
END;
$$;

-- Config

CREATE OR REPLACE FUNCTION buscar_config_grupo_v2(p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT row_to_json(gc.*)::JSON INTO v
  FROM group_config gc WHERE gc.grupo_id = p_grupo_id;
  IF NOT FOUND THEN
    SELECT json_build_object(
      'valor_aposta', 20, 'api_url', '',
      'bonus_geral', 0, 'regras', '{"pontos_placar_exato":5,"pontos_diferenca_certa":4,"pontos_vencedor_certo":3}'
    ) INTO v;
  END IF;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_config_grupo_v2(
  p_grupo_id UUID, p_sessao_token UUID,
  p_valor_aposta NUMERIC DEFAULT NULL,
  p_api_url TEXT DEFAULT NULL,
  p_bonus_geral NUMERIC DEFAULT NULL,
  p_regras JSONB DEFAULT NULL
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
    updated_at = NOW()
  WHERE grupo_id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;
