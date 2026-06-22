-- Fix gerar_convite_v2: p_profile_id -> v_profile_id
DROP FUNCTION IF EXISTS gerar_convite_v2(UUID, UUID, TEXT, INT, INT);
CREATE OR REPLACE FUNCTION gerar_convite_v2(
  p_grupo_id UUID, p_sessao_token UUID,
  p_invite_type TEXT DEFAULT 'convite_aprovacao',
  p_validade_dias INT DEFAULT 30, p_max_usos INT DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_profile_id UUID; v_role TEXT; v_token TEXT; v_invite_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode gerar convites'; END IF;
  IF p_invite_type NOT IN ('convite_auto', 'convite_aprovacao') THEN
    RAISE EXCEPTION 'Tipo de convite inválido';
  END IF;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO group_invites (grupo_id, token, token_hash, criado_por, invite_type, expira_em, max_usos)
  VALUES (p_grupo_id, v_token, extensions.crypt(v_token, extensions.gen_salt('bf')),
    v_profile_id, p_invite_type, NOW() + (p_validade_dias || ' days')::INTERVAL, p_max_usos)
  RETURNING id INTO v_invite_id;
  RETURN json_build_object('id', v_invite_id, 'token', v_token, 'expira_em', NOW() + (p_validade_dias || ' days')::INTERVAL, 'invite_type', p_invite_type);
END;
$$;
