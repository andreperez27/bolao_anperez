-- =============================================================
-- RPCs — AUTENTICAÇÃO E PERFIS
-- =============================================================

CREATE OR REPLACE FUNCTION buscar_profile(p_nome TEXT, p_senha TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON; v_token UUID; v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles
  WHERE nome = p_nome AND senha_hash = extensions.crypt(p_senha, senha_hash);
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuário ou senha inválidos'; END IF;
  v_token := gen_random_uuid();
  UPDATE profiles SET sessao_token = v_token WHERE id = v_profile.id;
  SELECT json_build_object(
    'id', v_profile.id, 'nome', v_profile.nome,
    'sessao_token', v_token, 'role_global', v_profile.role_global
  ) INTO v;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION criar_profile(p_nome TEXT, p_senha TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON; v_id UUID; v_token UUID;
BEGIN
  IF LENGTH(p_nome) < 3 THEN RAISE EXCEPTION 'Nome deve ter pelo menos 3 caracteres'; END IF;
  IF LENGTH(p_senha) < 6 THEN RAISE EXCEPTION 'Senha deve ter pelo menos 6 caracteres'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE nome = p_nome) THEN
    RAISE EXCEPTION 'Este nome já está em uso';
  END IF;
  v_token := gen_random_uuid();
  INSERT INTO profiles (nome, senha_hash, sessao_token)
  VALUES (p_nome, extensions.crypt(p_senha, extensions.gen_salt('bf')), v_token)
  RETURNING id INTO v_id;
  SELECT json_build_object('id', v_id, 'nome', p_nome, 'sessao_token', v_token) INTO v;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION trocar_senha_profile(p_sessao_token UUID, p_senha_antiga TEXT, p_senha_nova TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF v_profile.senha_hash IS NOT NULL AND v_profile.senha_hash != extensions.crypt(p_senha_antiga, v_profile.senha_hash) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;
  IF LENGTH(p_senha_nova) < 6 THEN RAISE EXCEPTION 'A nova senha deve ter pelo menos 6 caracteres'; END IF;
  UPDATE profiles SET senha_hash = extensions.crypt(p_senha_nova, extensions.gen_salt('bf'))
  WHERE id = v_profile.id;
  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION logout_profile(p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET sessao_token = NULL WHERE sessao_token = p_sessao_token;
  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION verificar_sessao(p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('id', id, 'nome', nome, 'role_global', role_global) INTO v
  FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  RETURN v;
END;
$$;
