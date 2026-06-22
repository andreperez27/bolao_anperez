-- Renomeia slugs de grupos inativos para liberar o slug original
UPDATE groups SET slug = slug || '_deleted_' || extract(epoch from now())::TEXT
WHERE ativo = FALSE AND slug !~ '_deleted_';

CREATE OR REPLACE FUNCTION criar_grupo_admin(
  p_nome TEXT, p_slug TEXT, p_edition_id UUID,
  p_admin_nome TEXT, p_admin_senha TEXT,
  p_criador_sessao UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $_$
DECLARE
  v_profile_id UUID; v_admin_id UUID; v_grupo_id UUID;
  v_admin_token UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_criador_sessao;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF EXISTS (SELECT 1 FROM groups WHERE slug = p_slug AND ativo = TRUE) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;
  -- Libera slug de grupos inativos antes de inserir
  UPDATE groups SET slug = slug || '_deleted_' || extract(epoch from now())::TEXT
  WHERE slug = p_slug AND ativo = FALSE;
  SELECT id INTO v_admin_id FROM profiles WHERE nome = p_admin_nome;
  IF NOT FOUND THEN
    IF LENGTH(p_admin_senha) < 6 THEN RAISE EXCEPTION 'Senha do admin deve ter pelo menos 6 caracteres'; END IF;
    v_admin_token := gen_random_uuid();
    INSERT INTO profiles (nome, senha_hash, sessao_token)
    VALUES (p_admin_nome, extensions.crypt(p_admin_senha, extensions.gen_salt('bf')), v_admin_token)
    RETURNING id INTO v_admin_id;
  ELSE
    UPDATE profiles SET
      senha_hash = extensions.crypt(p_admin_senha, extensions.gen_salt('bf')),
      sessao_token = gen_random_uuid()
    WHERE id = v_admin_id;
  END IF;
  INSERT INTO groups (nome, slug, edition_id, criado_por)
  VALUES (p_nome, p_slug, p_edition_id, v_profile_id)
  RETURNING id INTO v_grupo_id;
  INSERT INTO group_members (grupo_id, profile_id, role)
  VALUES (v_grupo_id, v_admin_id, 'admin');
  INSERT INTO group_config (grupo_id) VALUES (v_grupo_id);
  RETURN json_build_object(
    'grupo_id', v_grupo_id, 'slug', p_slug, 'admin_nome', p_admin_nome
  );
END;
$_$;
