-- =============================================================
-- RPCs — ENTRADA PÚBLICA (sem token)
-- =============================================================

-- buscar_grupo_publico — retorna dados básicos do grupo (sem auth)
CREATE OR REPLACE FUNCTION buscar_grupo_publico(p_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_g RECORD; v_edicao TEXT;
BEGIN
  SELECT g.id, g.nome, g.slug, ce.nome AS edicao_nome
  INTO v_g
  FROM groups g
  JOIN competition_editions ce ON ce.id = g.edition_id
  WHERE g.slug = p_slug AND g.ativo = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('encontrado', false);
  END IF;
  RETURN json_build_object(
    'encontrado', true,
    'id', v_g.id,
    'nome', v_g.nome,
    'slug', v_g.slug,
    'edicao_nome', v_g.edicao_nome
  );
END;
$$;

-- solicitar_entrada_grupo — cadastro + solicitação em um passo (sem token)
CREATE OR REPLACE FUNCTION solicitar_entrada_grupo(
  p_grupo_slug TEXT, p_nome TEXT, p_senha TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_grupo_id UUID; v_grupo_nome TEXT;
  v_profile_id UUID; v_sessao_token UUID;
  v_profile_existed BOOLEAN := FALSE;
  v_existing_status TEXT; v_request_id UUID;
BEGIN
  SELECT id, nome INTO v_grupo_id, v_grupo_nome
  FROM groups WHERE slug = p_grupo_slug AND ativo = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  SELECT id, sessao_token INTO v_profile_id, v_sessao_token
  FROM profiles WHERE nome = p_nome;

  IF FOUND THEN
    v_profile_existed := TRUE;

    -- 1o: verificar se já tem relação com o grupo (antes de checar senha)
    IF EXISTS (SELECT 1 FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id) THEN
      RETURN json_build_object(
        'status', 'member',
        'profile_id', v_profile_id,
        'sessao_token', v_sessao_token,
        'nome', p_nome,
        'grupo_slug', p_grupo_slug,
        'grupo_nome', v_grupo_nome
      );
    END IF;

    SELECT status INTO v_existing_status FROM group_join_requests
    WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id
    ORDER BY requested_at DESC LIMIT 1;

    IF FOUND THEN
      IF v_existing_status = 'pending' THEN
        RETURN json_build_object(
          'status', 'pending',
          'profile_id', v_profile_id,
          'sessao_token', v_sessao_token,
          'nome', p_nome,
          'grupo_slug', p_grupo_slug,
          'grupo_nome', v_grupo_nome,
          'mensagem', 'Você já possui uma solicitação pendente. Aguarde a aprovação do administrador.'
        );
      ELSIF v_existing_status = 'rejected' THEN
        RETURN json_build_object(
          'status', 'rejected',
          'profile_id', v_profile_id,
          'sessao_token', v_sessao_token,
          'nome', p_nome,
          'grupo_slug', p_grupo_slug,
          'grupo_nome', v_grupo_nome,
          'mensagem', 'Sua solicitação anterior foi recusada pelo administrador.'
        );
      ELSIF v_existing_status = 'approved' THEN
        INSERT INTO group_members (grupo_id, profile_id, role)
        VALUES (v_grupo_id, v_profile_id, 'participante')
        ON CONFLICT (grupo_id, profile_id) DO NOTHING;
        RETURN json_build_object(
          'status', 'member',
          'profile_id', v_profile_id,
          'sessao_token', v_sessao_token,
          'nome', p_nome,
          'grupo_slug', p_grupo_slug,
          'grupo_nome', v_grupo_nome
        );
      END IF;
    END IF;

    -- Sem relação com o grupo: precisa verificar senha
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = v_profile_id AND senha_hash = extensions.crypt(p_senha, senha_hash)
    ) THEN
      RETURN json_build_object('status', 'wrong_password', 'mensagem', 'Senha incorreta');
    END IF;
    IF v_sessao_token IS NULL THEN
      UPDATE profiles SET sessao_token = gen_random_uuid() WHERE id = v_profile_id
      RETURNING sessao_token INTO v_sessao_token;
    END IF;
  ELSE
    INSERT INTO profiles (nome, senha_hash, sessao_token, role_global)
    VALUES (p_nome, extensions.crypt(p_senha, extensions.gen_salt('bf')), gen_random_uuid(), 'user')
    RETURNING id, sessao_token INTO v_profile_id, v_sessao_token;
  END IF;

  INSERT INTO group_join_requests (grupo_id, profile_id, nome, status)
  VALUES (v_grupo_id, v_profile_id, p_nome, 'pending')
  RETURNING id INTO v_request_id;

  RETURN json_build_object(
    'status', 'pending',
    'profile_id', v_profile_id,
    'sessao_token', v_sessao_token,
    'nome', p_nome,
    'request_id', v_request_id,
    'grupo_slug', p_grupo_slug,
    'grupo_nome', v_grupo_nome,
    'mensagem', 'Solicitação enviada! Aguarde a aprovação do administrador.'
  );
END;
$$;

-- verificar_status_participante — consulta status sem criar nada
CREATE OR REPLACE FUNCTION verificar_status_participante(
  p_grupo_slug TEXT, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_grupo_id UUID; v_profile_id UUID;
  v_status TEXT; v_mensagem TEXT;
BEGIN
  SELECT id INTO v_grupo_id FROM groups WHERE slug = p_grupo_slug AND ativo = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found');
  END IF;

  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_logged');
  END IF;

  IF EXISTS (SELECT 1 FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id) THEN
    RETURN json_build_object('status', 'member');
  END IF;

  SELECT status INTO v_status FROM group_join_requests
  WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id
  ORDER BY requested_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'none');
  END IF;

  IF v_status = 'pending' THEN
    v_mensagem := 'Aguardando aprovação do administrador.';
  ELSIF v_status = 'rejected' THEN
    v_mensagem := 'Solicitação recusada.';
  ELSE
    v_mensagem := 'Status: ' || v_status;
  END IF;

  RETURN json_build_object('status', v_status, 'mensagem', v_mensagem);
END;
$$;
