CREATE OR REPLACE FUNCTION excluir_grupo_v2(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role_global TEXT; v_role TEXT;
BEGIN
  SELECT id, role_global INTO v_profile_id, v_role_global FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  IF v_role_global = 'superadmin' THEN
    UPDATE groups SET ativo = FALSE, slug = slug || '_deleted_' || extract(epoch from now())::TEXT WHERE id = p_grupo_id;
    RETURN json_build_object('ok', true);
  END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode excluir grupo'; END IF;
  UPDATE groups SET ativo = FALSE, slug = slug || '_deleted_' || extract(epoch from now())::TEXT WHERE id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;
