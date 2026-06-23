-- Corrige solicitar_entrada_grupo: membership/request antes de senha
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

    IF EXISTS (SELECT 1 FROM group_members WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id) THEN
      RETURN json_build_object('status', 'member', 'profile_id', v_profile_id, 'sessao_token', v_sessao_token, 'nome', p_nome, 'grupo_slug', p_grupo_slug, 'grupo_nome', v_grupo_nome);
    END IF;

    SELECT status INTO v_existing_status FROM group_join_requests
    WHERE grupo_id = v_grupo_id AND profile_id = v_profile_id
    ORDER BY requested_at DESC LIMIT 1;

    IF FOUND THEN
      IF v_existing_status = 'pending' THEN
        RETURN json_build_object('status', 'pending', 'profile_id', v_profile_id, 'sessao_token', v_sessao_token, 'nome', p_nome, 'grupo_slug', p_grupo_slug, 'grupo_nome', v_grupo_nome, 'mensagem', 'Você já possui uma solicitação pendente. Aguarde a aprovação do administrador.');
      ELSIF v_existing_status = 'rejected' THEN
        RETURN json_build_object('status', 'rejected', 'profile_id', v_profile_id, 'sessao_token', v_sessao_token, 'nome', p_nome, 'grupo_slug', p_grupo_slug, 'grupo_nome', v_grupo_nome, 'mensagem', 'Sua solicitação anterior foi recusada pelo administrador.');
      ELSIF v_existing_status = 'approved' THEN
        INSERT INTO group_members (grupo_id, profile_id, role) VALUES (v_grupo_id, v_profile_id, 'participante') ON CONFLICT (grupo_id, profile_id) DO NOTHING;
        RETURN json_build_object('status', 'member', 'profile_id', v_profile_id, 'sessao_token', v_sessao_token, 'nome', p_nome, 'grupo_slug', p_grupo_slug, 'grupo_nome', v_grupo_nome);
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_profile_id AND senha_hash = extensions.crypt(p_senha, senha_hash)) THEN
      RETURN json_build_object('status', 'wrong_password', 'mensagem', 'Senha incorreta');
    END IF;
    IF v_sessao_token IS NULL THEN
      UPDATE profiles SET sessao_token = gen_random_uuid() WHERE id = v_profile_id RETURNING sessao_token INTO v_sessao_token;
    END IF;
  ELSE
    INSERT INTO profiles (nome, senha_hash, sessao_token, role_global)
    VALUES (p_nome, extensions.crypt(p_senha, extensions.gen_salt('bf')), gen_random_uuid(), 'user')
    RETURNING id, sessao_token INTO v_profile_id, v_sessao_token;
  END IF;

  INSERT INTO group_join_requests (grupo_id, profile_id, nome, status)
  VALUES (v_grupo_id, v_profile_id, p_nome, 'pending')
  RETURNING id INTO v_request_id;

  RETURN json_build_object('status', 'pending', 'profile_id', v_profile_id, 'sessao_token', v_sessao_token, 'nome', p_nome, 'request_id', v_request_id, 'grupo_slug', p_grupo_slug, 'grupo_nome', v_grupo_nome, 'mensagem', 'Solicitação enviada! Aguarde a aprovação do administrador.');
END;
$$;
