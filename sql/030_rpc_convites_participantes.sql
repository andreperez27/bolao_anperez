CREATE OR REPLACE FUNCTION gerar_convite_participante(
  p_grupo_id UUID, p_sessao_token UUID,
  p_validade_dias INT DEFAULT 7, p_max_usos INT DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $_$
DECLARE v_profile_id UUID; v_role TEXT; v_token TEXT; v_invite_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sess\u00E3o inv\u00E1lida'; END IF;
  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_profile_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode gerar convites'; END IF;
  v_token := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO group_invites (grupo_id, token, criado_por, expira_em, max_usos)
  VALUES (p_grupo_id, v_token, v_profile_id, NOW() + (p_validade_dias || ' days')::INTERVAL, p_max_usos)
  RETURNING id INTO v_invite_id;
  RETURN json_build_object('id', v_invite_id, 'token', v_token, 'expira_em', NOW() + (p_validade_dias || ' days')::INTERVAL);
END;
$_$;

CREATE OR REPLACE FUNCTION usar_convite_participante(
  p_token TEXT, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $_$
DECLARE v_profile_id UUID; v_invite RECORD; v_grupo_nome TEXT;
BEGIN
  SELECT id INTO v_profile_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sess\u00E3o inv\u00E1lida. \u00C9 necess\u00E1rio estar logado.'; END IF;
  SELECT gi.*, g.nome AS grupo_nome, g.slug AS grupo_slug INTO v_invite FROM group_invites gi JOIN groups g ON g.id = gi.grupo_id WHERE gi.token = p_token AND gi.ativo = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inv\u00E1lido ou expirado'; END IF;
  IF v_invite.expira_em IS NOT NULL AND v_invite.expira_em < NOW() THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RAISE EXCEPTION 'Convite expirado'; END IF;
  IF v_invite.max_usos > 0 AND v_invite.usos >= v_invite.max_usos THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RAISE EXCEPTION 'Convite j\u00E1 atingiu o limite de usos'; END IF;
  INSERT INTO group_members (grupo_id, profile_id, role)
  VALUES (v_invite.grupo_id, v_profile_id, 'participante')
  ON CONFLICT (grupo_id, profile_id) DO NOTHING;
  UPDATE group_invites SET usos = usos + 1 WHERE id = v_invite.id;
  RETURN json_build_object('ok', true, 'grupo_id', v_invite.grupo_id, 'grupo_nome', v_invite.grupo_nome, 'grupo_slug', v_invite.grupo_slug);
END;
$_$;
