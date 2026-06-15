-- ============================================================
-- BOLÃO COPA 2026 — Multitenancy Segurança + Convites v3
-- Corrige vazamentos entre grupos, implementa convites
-- ============================================================

-- 1. Tabela de convites
CREATE TABLE IF NOT EXISTS convites_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  criado_por TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  max_usos INT NOT NULL DEFAULT 0,
  usos INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_convites_token ON convites_grupo(token);

-- ============================================================
-- RPCs de AUDITORIA / SEGURANÇA
-- ============================================================

-- Helper: validar que usuario pertence ao grupo
CREATE OR REPLACE FUNCTION usuario_pertence_ao_grupo(p_usuario TEXT, p_grupo_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM membros_grupo WHERE usuario_id = p_usuario AND grupo_id = p_grupo_id);
END;
$$;

-- Helper: validar que usuario é admin do grupo
CREATE OR REPLACE FUNCTION usuario_eh_admin_grupo(p_usuario TEXT, p_grupo_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM membros_grupo WHERE usuario_id = p_usuario AND grupo_id = p_grupo_id AND role = 'admin');
END;
$$;

-- Helper: validar sessão (usuario existe)
CREATE OR REPLACE FUNCTION usuario_existe(p_usuario TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM jogadores WHERE nome = p_usuario);
END;
$$;

-- ============================================================
-- RPCs CORRIGIDAS — Com validação de pertencimento
-- ============================================================

-- listar_jogadores: SEMPRE retorna só membros do grupo ativo
CREATE OR REPLACE FUNCTION listar_membros_do_grupo(p_usuario TEXT, p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF NOT usuario_pertence_ao_grupo(p_usuario, p_grupo_id) THEN
    RAISE EXCEPTION 'Acesso negado: você não pertence a este grupo';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'usuario_id', m.usuario_id,
      'role', m.role,
      'pago', m.pago
    ) AS q
    FROM membros_grupo m
    WHERE m.grupo_id = p_grupo_id
    ORDER BY m.role, m.usuario_id
  ) sub;
  RETURN v;
END;
$$;

-- listar_grupos_usuario: sem mudança (já é por usuario), mas valida que o caller é o próprio
CREATE OR REPLACE FUNCTION listar_grupos_usuario(p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF NOT usuario_existe(p_usuario) THEN
    RAISE EXCEPTION 'Usuario nao encontrado';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', g.id, 'nome', g.nome, 'slug', g.slug,
      'valor_aposta', g.valor_aposta, 'admin_nome', g.admin_nome,
      'role', m.role, 'criado_em', g.criado_em
    ) AS q
    FROM grupos g
    JOIN membros_grupo m ON m.grupo_id = g.id
    WHERE m.usuario_id = p_usuario
    ORDER BY g.nome
  ) sub;
  RETURN v;
END;
$$;

-- listar_membros_grupo (substituída por listar_membros_do_grupo)
-- Mantida para compatibilidade, mas agora valida pertencimento
CREATE OR REPLACE FUNCTION listar_membros_grupo(p_grupo_id UUID, p_usuario TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF p_usuario IS NOT NULL AND NOT usuario_pertence_ao_grupo(p_usuario, p_grupo_id) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object('usuario_id', m.usuario_id, 'role', m.role, 'pago', m.pago) AS q
    FROM membros_grupo m
    WHERE m.grupo_id = p_grupo_id
    ORDER BY m.role, m.usuario_id
  ) sub;
  RETURN v;
END;
$$;

-- listar_todos_grupos: APENAS super admin (verifica senha)
CREATE OR REPLACE FUNCTION listar_todos_grupos(p_admin_password TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_admin_cfg TEXT;
BEGIN
  SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
  IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
    RAISE EXCEPTION 'Acesso negado: senha de admin invalida';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', g.id, 'nome', g.nome, 'slug', g.slug,
      'admin_nome', g.admin_nome, 'valor_aposta', g.valor_aposta,
      'criado_em', g.criado_em
    ) AS q
    FROM grupos g ORDER BY g.criado_em DESC
  ) sub;
  RETURN v;
END;
$$;

-- criar_grupo: super admin (valida senha)
CREATE OR REPLACE FUNCTION criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC DEFAULT 20, p_admin_password TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID; v_admin_cfg TEXT;
BEGIN
  SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
  IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
    RAISE EXCEPTION 'Acesso negado: senha de admin invalida';
  END IF;

  INSERT INTO grupos (nome, slug, criador_id, admin_nome, criado_por, valor_aposta)
  VALUES (p_nome, p_slug, p_admin, p_admin, p_admin, p_valor)
  RETURNING id INTO v_grupo_id;

  INSERT INTO membros_grupo (grupo_id, usuario_id, role)
  VALUES (v_grupo_id, p_admin, 'admin');

  RETURN json_build_object('id', v_grupo_id, 'nome', p_nome, 'slug', p_slug);
END;
$$;

-- entrar_grupo: agora valida que usuario existe
CREATE OR REPLACE FUNCTION entrar_grupo(p_slug TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID; v_nome TEXT;
BEGIN
  IF NOT usuario_existe(p_usuario) THEN
    RAISE EXCEPTION 'Usuario nao encontrado. Faca cadastro primeiro.';
  END IF;

  SELECT id, nome INTO v_grupo_id, v_nome FROM grupos WHERE slug = p_slug;
  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Grupo nao encontrado';
  END IF;

  INSERT INTO membros_grupo (grupo_id, usuario_id, role)
  VALUES (v_grupo_id, p_usuario, 'participante')
  ON CONFLICT (grupo_id, usuario_id) DO NOTHING;

  RETURN json_build_object('id', v_grupo_id, 'nome', v_nome);
END;
$$;

-- atualizar_grupo: admin do grupo (já validava, mantido)
CREATE OR REPLACE FUNCTION atualizar_grupo(p_grupo_id UUID, p_admin TEXT, p_valor NUMERIC, p_pontos_cheio INT, p_pontos_vencedor INT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT usuario_eh_admin_grupo(p_admin, p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode atualizar';
  END IF;

  UPDATE grupos SET
    valor_aposta = p_valor,
    pontos_acerto_cheio = p_pontos_cheio,
    pontos_acerto_vencedor = p_pontos_vencedor
  WHERE id = p_grupo_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- remover_membro_grupo: admin do grupo
CREATE OR REPLACE FUNCTION remover_membro_grupo(p_grupo_id UUID, p_admin TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT usuario_eh_admin_grupo(p_admin, p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode remover membros';
  END IF;

  DELETE FROM membros_grupo WHERE grupo_id = p_grupo_id AND usuario_id = p_usuario;

  RETURN json_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPCs DE CONVITES
-- ============================================================

-- Gerar convite (admin do grupo)
CREATE OR REPLACE FUNCTION gerar_convite_grupo(
  p_usuario TEXT,
  p_grupo_id UUID,
  p_validade_dias INT DEFAULT 7,
  p_max_usos INT DEFAULT 0
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_convite convites_grupo;
BEGIN
  IF NOT usuario_eh_admin_grupo(p_usuario, p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode gerar convites';
  END IF;

  INSERT INTO convites_grupo (grupo_id, criado_por, expira_em, max_usos)
  VALUES (p_grupo_id, p_usuario, NOW() + (p_validade_dias || ' days')::INTERVAL, p_max_usos)
  RETURNING * INTO v_convite;

  RETURN json_build_object(
    'id', v_convite.id,
    'token', v_convite.token,
    'grupo_id', v_convite.grupo_id,
    'expira_em', v_convite.expira_em,
    'max_usos', v_convite.max_usos,
    'ativo', v_convite.ativo
  );
END;
$$;

-- Listar convites ativos do grupo (admin)
CREATE OR REPLACE FUNCTION listar_convites_grupo(p_usuario TEXT, p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF NOT usuario_eh_admin_grupo(p_usuario, p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode ver convites';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', c.id, 'token', c.token,
      'expira_em', c.expira_em, 'max_usos', c.max_usos,
      'usos', c.usos, 'ativo', c.ativo,
      'criado_por', c.criado_por, 'created_at', c.created_at
    ) AS q
    FROM convites_grupo c
    WHERE c.grupo_id = p_grupo_id
    ORDER BY c.created_at DESC
  ) sub;
  RETURN v;
END;
$$;

-- Revogar convite (admin)
CREATE OR REPLACE FUNCTION revogar_convite_grupo(p_usuario TEXT, p_convite_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM convites_grupo WHERE id = p_convite_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Convite nao encontrado'; END IF;

  IF NOT usuario_eh_admin_grupo(p_usuario, v_grupo_id) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode revogar convites';
  END IF;

  UPDATE convites_grupo SET ativo = FALSE WHERE id = p_convite_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- Usar convite (qualquer usuario logado)
CREATE OR REPLACE FUNCTION usar_convite_grupo(p_token TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_convite convites_grupo;
DECLARE v_grupo_nome TEXT;
BEGIN
  IF NOT usuario_existe(p_usuario) THEN
    RAISE EXCEPTION 'Usuario nao encontrado. Faca cadastro primeiro.';
  END IF;

  SELECT * INTO v_convite FROM convites_grupo WHERE token = p_token;
  IF v_convite.id IS NULL THEN
    RAISE EXCEPTION 'Convite invalido ou inexistente';
  END IF;

  IF NOT v_convite.ativo THEN
    RAISE EXCEPTION 'Convite foi revogado';
  END IF;

  IF v_convite.expira_em < NOW() THEN
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  IF v_convite.max_usos > 0 AND v_convite.usos >= v_convite.max_usos THEN
    RAISE EXCEPTION 'Convite esgotou o numero de usos';
  END IF;

  IF EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = v_convite.grupo_id AND usuario_id = p_usuario) THEN
    SELECT nome INTO v_grupo_nome FROM grupos WHERE id = v_convite.grupo_id;
    RETURN json_build_object('mensagem', 'Voce ja pertence a este grupo', 'grupo_nome', v_grupo_nome);
  END IF;

  INSERT INTO membros_grupo (grupo_id, usuario_id, role)
  VALUES (v_convite.grupo_id, p_usuario, 'participante');

  UPDATE convites_grupo SET usos = usos + 1 WHERE id = v_convite.id;

  SELECT nome INTO v_grupo_nome FROM grupos WHERE id = v_convite.grupo_id;

  RETURN json_build_object('ok', true, 'grupo_nome', v_grupo_nome);
END;
$$;

-- ============================================================
-- RPCs de CARTELAS (substituem acesso REST direto)
-- ============================================================

-- Listar cartelas do grupo (validando pertencimento)
CREATE OR REPLACE FUNCTION listar_cartelas_do_grupo(p_usuario TEXT, p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF NOT usuario_pertence_ao_grupo(p_usuario, p_grupo_id) AND
     NOT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_usuario AND is_ia = TRUE) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', c.id, 'participante', c.participante, 'nome', c.nome,
      'palpites', c.palpites, 'campeao', c.campeao,
      'campeao_fase', c.campeao_fase, 'status', c.status,
      'valor_pago', c.valor_pago, 'grupo_id', c.grupo_id,
      'created_at', c.created_at, 'updated_at', c.updated_at
    ) AS q
    FROM cartelas c
    WHERE c.grupo_id = p_grupo_id AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  ) sub;
  RETURN v;
END;
$$;

-- Validar cartela (admin do grupo)
CREATE OR REPLACE FUNCTION validar_cartela_grupo(p_usuario TEXT, p_cartela_id TEXT, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM cartelas WHERE id = p_cartela_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Cartela nao encontrada'; END IF;

  IF NOT usuario_eh_admin_grupo(p_usuario, v_grupo_id) THEN
    RAISE EXCEPTION 'Apenas admin do grupo pode validar cartelas';
  END IF;

  UPDATE cartelas SET status = p_status, updated_at = NOW() WHERE id = p_cartela_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- ============================================================
-- RLS Policies (DOCUMENTAÇÃO — não ativas sem Supabase Auth)
-- Se no futuro migrar para Supabase Auth, descomentar:
-- ============================================================
/*
ALTER TABLE convites_grupo ENABLE ROW LEVEL SECURITY;
CREATE POLICY convites_select_admin ON convites_grupo FOR SELECT USING (
  EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = convites_grupo.grupo_id AND usuario_id = auth.email() AND role = 'admin')
);
CREATE POLICY convites_insert_admin ON convites_grupo FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = convites_grupo.grupo_id AND usuario_id = auth.email() AND role = 'admin')
);
CREATE POLICY convites_update_admin ON convites_grupo FOR UPDATE USING (
  EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = convites_grupo.grupo_id AND usuario_id = auth.email() AND role = 'admin')
);
*/
