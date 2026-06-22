-- ============================================================
-- 011 — Grupos com isolamento real + sistema de convites
-- ============================================================

-- 1. Tabela de grupos (bolões)
CREATE TABLE IF NOT EXISTS grupos (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome      TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coluna grupo_id nas tabelas principais
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS grupo_id TEXT REFERENCES grupos(id) DEFAULT 'geral';
ALTER TABLE cartelas  ADD COLUMN IF NOT EXISTS grupo_id TEXT DEFAULT 'geral';

-- 3. Config por grupo
ALTER TABLE config ADD COLUMN IF NOT EXISTS grupo_id TEXT DEFAULT 'geral';
ALTER TABLE admin  ADD COLUMN IF NOT EXISTS grupo_id TEXT DEFAULT 'geral';

-- 4. Tabela de convites
CREATE TABLE IF NOT EXISTS convites (
  token     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  grupo_id  TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  usado     BOOLEAN DEFAULT FALSE,
  usos      INT DEFAULT 0,
  max_usos  INT DEFAULT 999,
  expira_em TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- 5. Criar grupo padrão "geral" (migra dados existentes)
INSERT INTO grupos (id, nome, slug)
VALUES ('geral', 'Bolão Geral', 'geral')
ON CONFLICT (id) DO NOTHING;

-- 6. Migrar dados existentes para o grupo geral
UPDATE jogadores SET grupo_id = 'geral' WHERE grupo_id IS NULL OR grupo_id = '00000000-0000-0000-0000-000000000000';
UPDATE cartelas  SET grupo_id = 'geral' WHERE grupo_id IS NULL OR grupo_id = '00000000-0000-0000-0000-000000000000';
UPDATE config    SET grupo_id = 'geral' WHERE grupo_id IS NULL;
UPDATE admin     SET grupo_id = 'geral' WHERE grupo_id IS NULL;

-- 7. Garantir linha de config e admin para o grupo geral
INSERT INTO config (id, grupo_id, valor_aposta, admin_password, api_url, bonus_geral)
VALUES (1, 'geral', 20, '', 'https://worldcupjson.net/matches', 0)
ON CONFLICT (id) DO UPDATE SET grupo_id = 'geral', api_url = EXCLUDED.api_url;

INSERT INTO admin (id, grupo_id, resultados, campeo_real)
VALUES (1, 'geral', '{}', '')
ON CONFLICT (id) DO UPDATE SET grupo_id = 'geral';

-- 8. RPC: criar jogador COM grupo_id
DROP FUNCTION IF EXISTS criar_jogador(TEXT, TEXT);
CREATE OR REPLACE FUNCTION criar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id) THEN
    RAISE EXCEPTION 'Este nome já está em uso neste grupo';
  END IF;
  INSERT INTO jogadores (nome, senha, grupo_id) VALUES (p_nome, p_senha, p_grupo_id);
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- 9. RPC: buscar jogador COM grupo_id
DROP FUNCTION IF EXISTS buscar_jogador(TEXT, TEXT);
CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND senha = p_senha AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- 10. RPC: buscar jogador por nome COM grupo_id
DROP FUNCTION IF EXISTS buscar_jogador_nome(TEXT);
CREATE OR REPLACE FUNCTION buscar_jogador_nome(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- 11. RPC: listar jogadores DO GRUPO
DROP FUNCTION IF EXISTS listar_jogadores();
CREATE OR REPLACE FUNCTION listar_jogadores(p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object('nome', nome) ORDER BY nome), '[]'::JSON) INTO v
  FROM jogadores WHERE grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- 12. RPC: validar convite e retornar grupo_id
CREATE OR REPLACE FUNCTION usar_convite(p_token TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id TEXT; v_nome TEXT; v_slug TEXT;
BEGIN
  SELECT c.grupo_id, g.nome, g.slug
  INTO v_grupo_id, v_nome, v_slug
  FROM convites c JOIN grupos g ON g.id = c.grupo_id
  WHERE c.token = p_token
    AND c.usado = FALSE
    AND c.usos < c.max_usos
    AND (c.expira_em IS NULL OR c.expira_em > NOW());
  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  UPDATE convites SET usos = usos + 1 WHERE token = p_token;
  RETURN json_build_object('grupo_id', v_grupo_id, 'nome', v_nome, 'slug', v_slug);
END;
$$;

-- 13. RPC: criar convite (chamado pelo admin)
CREATE OR REPLACE FUNCTION criar_convite(p_grupo_id TEXT, p_max_usos INT DEFAULT 999)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_token TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM grupos WHERE id = p_grupo_id) THEN
    RAISE EXCEPTION 'Grupo não encontrado';
  END IF;
  INSERT INTO convites (grupo_id, max_usos, expira_em)
  VALUES (p_grupo_id, p_max_usos, NOW() + INTERVAL '30 days')
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

-- 14. RPC: criar novo grupo (admin master)
DROP FUNCTION IF EXISTS criar_grupo(TEXT, TEXT, TEXT, NUMERIC);
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

-- 15. RPC: deletar jogador COM grupo_id
DROP FUNCTION IF EXISTS deletar_jogador(TEXT);
CREATE OR REPLACE FUNCTION deletar_jogador(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cartelas SET deleted_at = NOW() WHERE participante = p_nome AND grupo_id = p_grupo_id;
  DELETE FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
END;
$$;

-- 16. RPC: listar cartelas do grupo
DROP FUNCTION IF EXISTS listar_cartelas_do_grupo(TEXT, TEXT);
CREATE OR REPLACE FUNCTION listar_cartelas_do_grupo(p_usuario TEXT, p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object('id', c.id, 'participante', c.participante, 'nome', c.nome, 'palpites', c.palpites, 'campeao', c.campeao, 'campeao_fase', c.campeao_fase, 'status', c.status, 'valor_pago', c.valor_pago, 'grupo_id', c.grupo_id, 'created_at', c.created_at, 'updated_at', c.updated_at) AS q
    FROM cartelas c WHERE c.grupo_id = p_grupo_id AND c.deleted_at IS NULL ORDER BY c.created_at DESC
  ) sub;
  RETURN v;
END;
$$;

-- 17. RPC: validar cartela do grupo
DROP FUNCTION IF EXISTS validar_cartela_grupo(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION validar_cartela_grupo(p_usuario TEXT, p_cartela_id TEXT, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cartelas SET status = p_status, updated_at = NOW() WHERE id = p_cartela_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- 18. RPC: excluir cartela definitivo
DROP FUNCTION IF EXISTS excluir_cartela_definitivo(TEXT);
CREATE OR REPLACE FUNCTION excluir_cartela_definitivo(cartela_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM cartelas WHERE id = cartela_id;
END;
$$;

-- 19. RPC: trocar senha do jogador
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

-- 20. RPC: atualizar dados do grupo (admin master)
DROP FUNCTION IF EXISTS atualizar_admin_grupo(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION atualizar_admin_grupo(
  p_grupo_id TEXT,
  p_nome TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_nome_admin TEXT DEFAULT NULL,
  p_valor_aposta NUMERIC DEFAULT NULL,
  p_senha_admin TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Atualizar nome do grupo
  IF p_nome IS NOT NULL THEN
    UPDATE grupos SET nome = p_nome WHERE id = p_grupo_id;
  END IF;
  -- Atualizar slug (com uniqueness check)
  IF p_slug IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM grupos WHERE slug = p_slug AND id <> p_grupo_id) THEN
      RAISE EXCEPTION 'Este slug já está em uso';
    END IF;
    UPDATE grupos SET slug = p_slug WHERE id = p_grupo_id;
  END IF;
  -- Atualizar config
  IF p_valor_aposta IS NOT NULL THEN
    UPDATE config SET valor_aposta = p_valor_aposta WHERE grupo_id = p_grupo_id;
  END IF;
  IF p_senha_admin IS NOT NULL THEN
    UPDATE config SET admin_password = p_senha_admin WHERE grupo_id = p_grupo_id;
  END IF;
  -- Criar jogador admin se não existir (senha inicial 123456)
  IF p_nome_admin IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome_admin AND grupo_id = p_grupo_id) THEN
    INSERT INTO jogadores (nome, senha, grupo_id) VALUES (p_nome_admin, '123456', p_grupo_id);
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

-- 21. Atualizar criar_grupo para também criar o jogador admin
DROP FUNCTION IF EXISTS criar_grupo(TEXT, TEXT, TEXT, NUMERIC);
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

-- 22. RPC: verificar se jogador tem senha padrão (123456)
CREATE OR REPLACE FUNCTION senha_eh_padrao(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_senha TEXT;
BEGIN
  SELECT senha INTO v_senha FROM jogadores WHERE nome = p_nome AND grupo_id = p_grupo_id;
  RETURN v_senha = '123456';
END;
$$;
