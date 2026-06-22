CREATE OR REPLACE FUNCTION atualizar_grupo_v2(
  p_grupo_id UUID, p_sessao_token UUID,
  p_nome TEXT DEFAULT NULL, p_slug TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode alterar o grupo'; END IF;
  IF p_slug IS NOT NULL AND p_slug != (SELECT slug FROM groups WHERE id = p_grupo_id) THEN
    IF EXISTS (SELECT 1 FROM groups WHERE slug = p_slug AND id != p_grupo_id) THEN
      RAISE EXCEPTION 'Este slug já está em uso';
    END IF;
  END IF;
  UPDATE groups SET
    nome = COALESCE(p_nome, nome),
    slug = COALESCE(p_slug, slug)
  WHERE id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;
