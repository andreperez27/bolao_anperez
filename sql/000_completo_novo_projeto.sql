-- ============================================================
-- BOLÃO COPA 2026 — Schema completo para novo projeto
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

-- Grupos (bolões)
CREATE TABLE IF NOT EXISTS grupos (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome      TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,
  criador_id TEXT DEFAULT '',
  admin_nome TEXT DEFAULT '',
  criado_por TEXT DEFAULT '',
  valor_aposta NUMERIC DEFAULT 20,
  pontos_acerto_cheio INT DEFAULT 5,
  pontos_acerto_vencedor INT DEFAULT 3,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Jogadores
CREATE TABLE IF NOT EXISTS jogadores (
  nome       TEXT NOT NULL,
  senha      TEXT NOT NULL,
  grupo_id   TEXT REFERENCES grupos(id) DEFAULT 'geral',
  is_ia      BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (nome, grupo_id)
);

-- Cartelas
CREATE TABLE IF NOT EXISTS cartelas (
  id           TEXT PRIMARY KEY,
  participante TEXT NOT NULL,
  nome         TEXT DEFAULT 'Cartela',
  palpites     JSONB DEFAULT '{}',
  campeao      TEXT DEFAULT '',
  campeao_fase TEXT DEFAULT 'grupos',
  status       TEXT DEFAULT 'aguardando',
  valor_pago   NUMERIC DEFAULT 20,
  grupo_id     TEXT DEFAULT 'geral',
  deleted_at   TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Admin (resultados)
CREATE TABLE IF NOT EXISTS admin (
  id          INTEGER DEFAULT 1,
  grupo_id    TEXT DEFAULT 'geral',
  resultados  JSONB DEFAULT '{}',
  campeo_real TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, grupo_id)
);

-- Config
CREATE TABLE IF NOT EXISTS config (
  id             INTEGER DEFAULT 1,
  grupo_id       TEXT DEFAULT 'geral',
  valor_aposta   NUMERIC DEFAULT 20,
  api_url        TEXT DEFAULT 'https://worldcupjson.net/matches',
  admin_password TEXT DEFAULT '',
  bonus_geral    NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, grupo_id)
);

-- Membros do grupo
CREATE TABLE IF NOT EXISTS membros_grupo (
  grupo_id   TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL,
  role       TEXT DEFAULT 'participante',
  pago       BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (grupo_id, usuario_id)
);

-- Convites
CREATE TABLE IF NOT EXISTS convites_grupo (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id  TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  token     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  criado_por TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  max_usos  INT NOT NULL DEFAULT 0,
  usos      INT NOT NULL DEFAULT 0,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_convites_token ON convites_grupo(token);

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Grupo padrão
INSERT INTO grupos (id, nome, slug, valor_aposta)
VALUES ('geral', 'Bolão Geral', 'geral', 20)
ON CONFLICT (id) DO NOTHING;

-- Config do grupo geral
INSERT INTO config (id, grupo_id, valor_aposta, admin_password, api_url, bonus_geral)
VALUES (1, 'geral', 20, '1234', 'https://worldcupjson.net/matches', 0)
ON CONFLICT (id, grupo_id) DO NOTHING;

-- Admin do grupo geral
INSERT INTO admin (id, grupo_id, resultados, campeo_real)
VALUES (1, 'geral', '{}', '')
ON CONFLICT (id, grupo_id) DO NOTHING;

-- IAs
INSERT INTO jogadores (nome, senha, grupo_id, is_ia) VALUES
  ('🤖 Gemini (Google)',   'ia_password', 'geral', TRUE),
  ('🤖 ChatGPT (OpenAI)',   'ia_password', 'geral', TRUE),
  ('🤖 Claude (Anthropic)', 'ia_password', 'geral', TRUE)
ON CONFLICT (nome, grupo_id) DO NOTHING;

-- Desabilitar RLS (simplificado)
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE cartelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
ALTER TABLE membros_grupo DISABLE ROW LEVEL SECURITY;
ALTER TABLE convites_grupo DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION usuario_pertence_ao_grupo(p_usuario TEXT, p_grupo_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM membros_grupo WHERE usuario_id = p_usuario AND grupo_id = p_grupo_id);
END;
$$;

CREATE OR REPLACE FUNCTION usuario_eh_admin_grupo(p_usuario TEXT, p_grupo_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM membros_grupo WHERE usuario_id = p_usuario AND grupo_id = p_grupo_id AND role = 'admin');
END;
$$;

CREATE OR REPLACE FUNCTION usuario_existe(p_usuario TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM jogadores WHERE nome = p_usuario);
END;
$$;

-- ============================================================
-- RPCs DE JOGADORES
-- ============================================================

CREATE OR REPLACE FUNCTION criar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome AND grupo_id = v_grupo) THEN
    RAISE EXCEPTION 'Este nome já está em uso neste grupo';
  END IF;
  INSERT INTO jogadores (nome, senha, grupo_id) VALUES (p_nome, p_senha, v_grupo);
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND senha = p_senha AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_jogador_nome(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_jogadores(p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object('nome', nome) ORDER BY nome), '[]'::JSON) INTO v
  FROM jogadores WHERE grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION deletar_jogador(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cartelas SET deleted_at = NOW() WHERE participante = p_nome AND grupo_id = p_grupo_id;
  DELETE FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
END;
$$;

CREATE OR REPLACE FUNCTION trocar_senha(p_nome TEXT, p_senha_antiga TEXT, p_senha_nova TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome AND senha = p_senha_antiga AND grupo_id = p_grupo_id) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;
  IF LENGTH(p_senha_nova) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter pelo menos 6 caracteres';
  END IF;
  UPDATE jogadores SET senha = p_senha_nova WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPCs DE CARTELAS
-- ============================================================

CREATE OR REPLACE FUNCTION listar_cartelas_do_grupo(p_usuario TEXT, p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', c.id, 'participante', c.participante,
      'nome', c.nome, 'palpites', c.palpites,
      'campeao', c.campeao, 'campeao_fase', c.campeao_fase,
      'status', c.status, 'valor_pago', c.valor_pago,
      'grupo_id', c.grupo_id,
      'created_at', c.created_at, 'updated_at', c.updated_at
    ) AS q
    FROM cartelas c
    WHERE c.grupo_id = p_grupo_id AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  ) sub;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION validar_cartela_grupo(p_usuario TEXT, p_cartela_id TEXT, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id TEXT;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM cartelas WHERE id = p_cartela_id;
  IF NOT usuario_eh_admin_grupo(p_usuario, v_grupo_id) THEN
    RAISE EXCEPTION 'Apenas admin pode validar';
  END IF;
  UPDATE cartelas SET status = p_status, updated_at = NOW() WHERE id = p_cartela_id;
  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION excluir_cartela_definitivo(cartela_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM cartelas WHERE id = cartela_id;
END;
$$;

-- ============================================================
-- RPCs DE GRUPOS
-- ============================================================

CREATE OR REPLACE FUNCTION criar_grupo(p_nome TEXT, p_slug TEXT, p_senha_admin TEXT, p_valor_aposta NUMERIC DEFAULT 20)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM grupos WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Este slug já está em uso';
  END IF;
  v_id := gen_random_uuid()::TEXT;
  INSERT INTO grupos (id, nome, slug) VALUES (v_id, p_nome, p_slug);
  INSERT INTO config (grupo_id, valor_aposta, admin_password, api_url, bonus_geral)
  VALUES (v_id, p_valor_aposta, p_senha_admin, 'https://worldcupjson.net/matches', 0)
  ON CONFLICT DO NOTHING;
  INSERT INTO admin (grupo_id, resultados, campeo_real)
  VALUES (v_id, '{}', '')
  ON CONFLICT DO NOTHING;
  RETURN json_build_object('id', v_id, 'slug', p_slug, 'nome', p_nome);
END;
$$;

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
    FROM grupos g JOIN membros_grupo m ON m.grupo_id = g.id
    WHERE m.usuario_id = p_usuario ORDER BY g.nome
  ) sub;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION entrar_grupo(p_slug TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id TEXT; v_nome TEXT;
BEGIN
  IF NOT usuario_existe(p_usuario) THEN RAISE EXCEPTION 'Usuario nao encontrado'; END IF;
  SELECT id, nome INTO v_grupo_id, v_nome FROM grupos WHERE slug = p_slug;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Grupo nao encontrado'; END IF;
  INSERT INTO membros_grupo (grupo_id, usuario_id, role)
  VALUES (v_grupo_id, p_usuario, 'participante') ON CONFLICT DO NOTHING;
  RETURN json_build_object('id', v_grupo_id, 'nome', v_nome);
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_admin_grupo(
  p_grupo_id TEXT,
  p_nome TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_nome_admin TEXT DEFAULT NULL,
  p_valor_aposta NUMERIC DEFAULT NULL,
  p_senha_admin TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  IF p_nome IS NOT NULL THEN
    UPDATE grupos SET nome = p_nome WHERE id = v_grupo;
  END IF;
  IF p_slug IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM grupos WHERE slug = p_slug AND id <> v_grupo) THEN
      RAISE EXCEPTION 'Este slug já está em uso';
    END IF;
    UPDATE grupos SET slug = p_slug WHERE id = v_grupo;
  END IF;
  IF p_valor_aposta IS NOT NULL THEN
    UPDATE config SET valor_aposta = p_valor_aposta WHERE grupo_id = v_grupo;
  END IF;
  IF p_senha_admin IS NOT NULL THEN
    UPDATE config SET admin_password = p_senha_admin WHERE grupo_id = v_grupo;
  END IF;
  IF p_nome_admin IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome_admin AND grupo_id = v_grupo) THEN
    INSERT INTO jogadores (nome, senha, grupo_id) VALUES (p_nome_admin, '123456', v_grupo);
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPCs DE CONVITES
-- ============================================================

CREATE OR REPLACE FUNCTION gerar_convite_grupo(p_usuario TEXT, p_grupo_id TEXT, p_validade_dias INT DEFAULT 7, p_max_usos INT DEFAULT 0)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_convite convites_grupo;
BEGIN
  IF NOT usuario_eh_admin_grupo(p_usuario, p_grupo_id) THEN RAISE EXCEPTION 'Apenas admin pode gerar convites'; END IF;
  INSERT INTO convites_grupo (grupo_id, criado_por, expira_em, max_usos)
  VALUES (p_grupo_id, p_usuario, NOW() + (p_validade_dias || ' days')::INTERVAL, p_max_usos)
  RETURNING * INTO v_convite;
  RETURN json_build_object(
    'id', v_convite.id, 'token', v_convite.token,
    'grupo_id', v_convite.grupo_id, 'expira_em', v_convite.expira_em,
    'max_usos', v_convite.max_usos, 'ativo', v_convite.ativo
  );
END;
$$;

CREATE OR REPLACE FUNCTION usar_convite(p_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id TEXT; v_nome TEXT; v_slug TEXT;
BEGIN
  SELECT c.grupo_id, g.nome, g.slug
  INTO v_grupo_id, v_nome, v_slug
  FROM convites_grupo c JOIN grupos g ON g.id = c.grupo_id
  WHERE c.token = p_token AND c.ativo = TRUE
    AND c.usos < c.max_usos
    AND (c.expira_em IS NULL OR c.expira_em > NOW());
  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  UPDATE convites_grupo SET usos = usos + 1 WHERE token = p_token;
  RETURN json_build_object('grupo_id', v_grupo_id, 'nome', v_nome, 'slug', v_slug);
END;
$$;

CREATE OR REPLACE FUNCTION listar_convites_grupo(p_usuario TEXT, p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF NOT usuario_eh_admin_grupo(p_usuario, p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas admin pode ver convites';
  END IF;
  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', c.id, 'token', c.token, 'expira_em', c.expira_em,
      'max_usos', c.max_usos, 'usos', c.usos, 'ativo', c.ativo,
      'criado_por', c.criado_por, 'created_at', c.created_at
    ) AS q
    FROM convites_grupo c WHERE c.grupo_id = p_grupo_id
    ORDER BY c.created_at DESC
  ) sub;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION revogar_convite_grupo(p_usuario TEXT, p_convite_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id TEXT;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM convites_grupo WHERE id = p_convite_id;
  IF v_grupo_id IS NULL THEN RAISE EXCEPTION 'Convite nao encontrado'; END IF;
  IF NOT usuario_eh_admin_grupo(p_usuario, v_grupo_id) THEN
    RAISE EXCEPTION 'Apenas admin pode revogar';
  END IF;
  UPDATE convites_grupo SET ativo = FALSE WHERE id = p_convite_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- ============================================================
-- ADMIN
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_data(p_admin_password TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_admin_cfg TEXT;
BEGIN
  SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
  IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  SELECT json_agg(json_build_object(
    'grupo_id', g.id, 'nome', g.nome, 'slug', g.slug,
    'valor_aposta', g.valor_aposta, 'admin_nome', g.admin_nome
  )) INTO v FROM grupos g;
  RETURN COALESCE(v, '[]'::JSON);
END;
$$;
