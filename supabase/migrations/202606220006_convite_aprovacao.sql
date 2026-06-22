-- =============================================================
-- CONVITE COM APROVAÇÃO
-- Suporta convite_auto (entrada direta) e convite_aprovacao (solicitação)
-- =============================================================

-- =============================================================
-- 0. Drop functions que podem ter conflito de parâmetros
-- =============================================================
DROP FUNCTION IF EXISTS validar_convite(TEXT);
DROP FUNCTION IF EXISTS solicitar_entrada_com_convite(TEXT, UUID);
DROP FUNCTION IF EXISTS aprovar_solicitacao_entrada(UUID, UUID);
DROP FUNCTION IF EXISTS recusar_solicitacao_entrada(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS listar_solicitacoes_pendentes(UUID, UUID);
DROP FUNCTION IF EXISTS usar_convite_participante(TEXT, UUID);
DROP FUNCTION IF EXISTS gerar_convite_v2(UUID, UUID, TEXT, INT, INT);
DROP FUNCTION IF EXISTS gerar_convite_participante(UUID, UUID, INT, INT);
DROP FUNCTION IF EXISTS usar_admin_invite(UUID, TEXT, UUID);

-- =============================================================
-- 1. Alterar group_invites
-- =============================================================
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS invite_type TEXT NOT NULL DEFAULT 'convite_aprovacao'
  CHECK (invite_type IN ('convite_auto', 'convite_aprovacao'));

ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS uses_count INT NOT NULL DEFAULT 0;
ALTER TABLE group_invites ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- migrar dados existentes: usos → uses_count
UPDATE group_invites SET uses_count = COALESCE(usos, 0) WHERE uses_count = 0 AND usos IS NOT NULL;

-- =============================================================
-- 2. group_join_requests
-- =============================================================
CREATE TABLE IF NOT EXISTS group_join_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invite_id     UUID REFERENCES group_invites(id),
  profile_id    UUID NOT NULL REFERENCES profiles(id),
  nome          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected', 'blocked', 'cancelled')),
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  approved_by   UUID REFERENCES profiles(id),
  approved_at   TIMESTAMPTZ,
  rejected_by   UUID REFERENCES profiles(id),
  rejected_at   TIMESTAMPTZ,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_join_req_grupo ON group_join_requests (grupo_id);
CREATE INDEX IF NOT EXISTS idx_join_req_profile ON group_join_requests (profile_id);
CREATE INDEX IF NOT EXISTS idx_join_req_status ON group_join_requests (grupo_id, status);

-- =============================================================
-- 3. RPC: gerar_convite_v2 (com tipo)
-- =============================================================
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
    p_profile_id, p_invite_type, NOW() + (p_validade_dias || ' days')::INTERVAL, p_max_usos)
  RETURNING id INTO v_invite_id;
  RETURN json_build_object('id', v_invite_id, 'token', v_token, 'expira_em', NOW() + (p_validade_dias || ' days')::INTERVAL, 'invite_type', p_invite_type);
END;
$$;

-- =============================================================
-- 4. RPC: validar_convite
-- =============================================================
CREATE OR REPLACE FUNCTION validar_convite(p_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_invite RECORD; v_grupo_nome TEXT; v_grupo_slug TEXT;
BEGIN
  SELECT gi.*, g.nome AS grupo_nome, g.slug AS grupo_slug
  INTO v_invite
  FROM group_invites gi
  JOIN groups g ON g.id = gi.grupo_id
  WHERE gi.token = p_token AND gi.ativo = TRUE;

  IF NOT FOUND THEN
    RETURN json_build_object('valido', false, 'motivo', 'Convite não encontrado ou inativo');
  END IF;

  IF v_invite.expira_em IS NOT NULL AND v_invite.expira_em < NOW() THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RETURN json_build_object('valido', false, 'motivo', 'Este convite expirou');
  END IF;

  IF v_invite.max_usos > 0 AND v_invite.uses_count >= v_invite.max_usos THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RETURN json_build_object('valido', false, 'motivo', 'Este convite já atingiu o limite de usos');
  END IF;

  RETURN json_build_object(
    'valido', true, 'invite_id', v_invite.id, 'grupo_id', v_invite.grupo_id,
    'grupo_nome', v_invite.grupo_nome, 'grupo_slug', v_invite.grupo_slug,
    'invite_type', v_invite.invite_type
  );
END;
$$;

-- =============================================================
-- 5. RPC: solicitar_entrada_com_convite
-- =============================================================
CREATE OR REPLACE FUNCTION solicitar_entrada_com_convite(
  p_token TEXT, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_profile_id UUID; v_profile_nome TEXT;
  v_invite RECORD; v_existing UUID; v_pending_id UUID;
BEGIN
  SELECT id, nome INTO v_profile_id, v_profile_nome FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida. É necessário estar logado.'; END IF;

  -- validar convite
  SELECT gi.*, g.nome AS grupo_nome, g.slug AS grupo_slug
  INTO v_invite
  FROM group_invites gi
  JOIN groups g ON g.id = gi.grupo_id
  WHERE gi.token = p_token AND gi.ativo = TRUE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou inativo'; END IF;
  IF v_invite.expira_em IS NOT NULL AND v_invite.expira_em < NOW() THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RAISE EXCEPTION 'Este convite expirou'; END IF;
  IF v_invite.max_usos > 0 AND v_invite.uses_count >= v_invite.max_usos THEN
    UPDATE group_invites SET ativo = FALSE WHERE id = v_invite.id;
    RAISE EXCEPTION 'Este convite já atingiu o limite de usos'; END IF;

  -- já é membro?
  SELECT id INTO v_existing FROM group_members WHERE grupo_id = v_invite.grupo_id AND profile_id = v_profile_id;
  IF FOUND THEN RAISE EXCEPTION 'Você já faz parte deste grupo'; END IF;

  -- já tem solicitação pendente?
  SELECT id INTO v_pending_id FROM group_join_requests
    WHERE grupo_id = v_invite.grupo_id AND profile_id = v_profile_id AND status = 'pending';
  IF FOUND THEN RAISE EXCEPTION 'Você já possui uma solicitação pendente para este grupo'; END IF;

  -- convite_auto: entra direto
  IF v_invite.invite_type = 'convite_auto' THEN
    INSERT INTO group_members (grupo_id, profile_id, role)
    VALUES (v_invite.grupo_id, v_profile_id, 'participante')
    ON CONFLICT (grupo_id, profile_id) DO NOTHING;
    UPDATE group_invites SET uses_count = uses_count + 1 WHERE id = v_invite.id;
    RETURN json_build_object('ok', true, 'entrada_direta', true, 'grupo_id', v_invite.grupo_id, 'grupo_nome', v_invite.grupo_nome, 'grupo_slug', v_invite.grupo_slug);
  END IF;

  -- convite_aprovacao: criar solicitação
  INSERT INTO group_join_requests (grupo_id, invite_id, profile_id, nome, status)
  VALUES (v_invite.grupo_id, v_invite.id, v_profile_id, v_profile_nome, 'pending')
  RETURNING id INTO v_pending_id;

  RETURN json_build_object(
    'ok', true, 'entrada_direta', false, 'request_id', v_pending_id,
    'grupo_id', v_invite.grupo_id, 'grupo_nome', v_invite.grupo_nome, 'grupo_slug', v_invite.grupo_slug
  );
END;
$$;

-- =============================================================
-- 6. RPC: aprovar_solicitacao_entrada
-- =============================================================
CREATE OR REPLACE FUNCTION aprovar_solicitacao_entrada(
  p_request_id UUID, p_sessao_token UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_admin_id UUID; v_req RECORD; v_role TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;

  SELECT gjr.*, gm.role INTO v_req
  FROM group_join_requests gjr
  JOIN group_members gm ON gm.grupo_id = gjr.grupo_id AND gm.profile_id = v_admin_id
  WHERE gjr.id = p_request_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada ou acesso negado'; END IF;
  IF v_req.role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode aprovar solicitações'; END IF;
  IF v_req.status != 'pending' THEN RAISE EXCEPTION 'Solicitação já foi processada'; END IF;

  INSERT INTO group_members (grupo_id, profile_id, role)
  VALUES (v_req.grupo_id, v_req.profile_id, 'participante')
  ON CONFLICT (grupo_id, profile_id) DO NOTHING;

  UPDATE group_join_requests SET
    status = 'approved', approved_by = v_admin_id, approved_at = NOW()
  WHERE id = p_request_id;

  RETURN json_build_object('ok', true, 'profile_id', v_req.profile_id);
END;
$$;

-- =============================================================
-- 7. RPC: recusar_solicitacao_entrada
-- =============================================================
CREATE OR REPLACE FUNCTION recusar_solicitacao_entrada(
  p_request_id UUID, p_sessao_token UUID, p_notes TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_admin_id UUID; v_req RECORD; v_role TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;

  SELECT gjr.*, gm.role INTO v_req
  FROM group_join_requests gjr
  JOIN group_members gm ON gm.grupo_id = gjr.grupo_id AND gm.profile_id = v_admin_id
  WHERE gjr.id = p_request_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada ou acesso negado'; END IF;
  IF v_req.role != 'admin' THEN RAISE EXCEPTION 'Apenas admin pode recusar solicitações'; END IF;
  IF v_req.status != 'pending' THEN RAISE EXCEPTION 'Solicitação já foi processada'; END IF;

  UPDATE group_join_requests SET
    status = 'rejected', rejected_by = v_admin_id, rejected_at = NOW(), notes = COALESCE(p_notes, notes)
  WHERE id = p_request_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- =============================================================
-- 8. RPC: listar_solicitacoes_pendentes
-- =============================================================
CREATE OR REPLACE FUNCTION listar_solicitacoes_pendentes(p_grupo_id UUID, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_admin_id UUID; v_role TEXT; v_result JSON;
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE sessao_token = p_sessao_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sessão inválida'; END IF;

  SELECT role INTO v_role FROM group_members WHERE grupo_id = p_grupo_id AND profile_id = v_admin_id;
  IF v_role IS NULL OR v_role != 'admin' THEN RAISE EXCEPTION 'Acesso negado'; END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', gjr.id, 'profile_id', gjr.profile_id, 'nome', gjr.nome,
    'status', gjr.status, 'requested_at', gjr.requested_at,
    'invite_type', gi.invite_type,
    'approved_by', gjr.approved_by, 'approved_at', gjr.approved_at,
    'rejected_by', gjr.rejected_by, 'rejected_at', gjr.rejected_at
  ) ORDER BY gjr.requested_at DESC), '[]'::JSON) INTO v_result
  FROM group_join_requests gjr
  LEFT JOIN group_invites gi ON gi.id = gjr.invite_id
  WHERE gjr.grupo_id = p_grupo_id;

  RETURN v_result;
END;
$$;

-- =============================================================
-- 9. Atualizar usar_convite_participante (compatibilidade)
-- =============================================================
CREATE OR REPLACE FUNCTION usar_convite_participante(p_token TEXT, p_sessao_token UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  RETURN solicitar_entrada_com_convite(p_token, p_sessao_token);
END;
$$;
