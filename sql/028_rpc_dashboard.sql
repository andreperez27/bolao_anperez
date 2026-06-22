-- Dashboard / Superadmin RPCs

CREATE OR REPLACE FUNCTION listar_grupos_dashboard()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', g.id, 'nome', g.nome, 'slug', g.slug,
    'edition_id', g.edition_id, 'edition_nome', e.nome,
    'admin_nome', (SELECT p.nome FROM group_members gm JOIN profiles p ON p.id = gm.profile_id WHERE gm.grupo_id = g.id AND gm.role = 'admin' LIMIT 1),
    'participantes', (SELECT COUNT(*) FROM group_members gm WHERE gm.grupo_id = g.id AND gm.role = 'participante'),
    'created_at', g.created_at
  ) ORDER BY g.created_at DESC), '[]'::JSON) INTO v
  FROM groups g
  JOIN competition_editions e ON e.id = g.edition_id
  WHERE g.ativo = TRUE;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION excluir_grupo_v2(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode excluir grupo'; END IF;
  UPDATE groups SET ativo = FALSE WHERE id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;
