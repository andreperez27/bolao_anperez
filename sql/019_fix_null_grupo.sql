-- ============================================================
-- Fix: RPCs tratarem null em p_grupo_id como 'geral'
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND senha = p_senha AND grupo_id = v_grupo;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_jogador_nome(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = v_grupo;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_jogadores(p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  SELECT COALESCE(json_agg(json_build_object('nome', nome) ORDER BY nome), '[]'::JSON) INTO v
  FROM jogadores WHERE grupo_id = v_grupo;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION deletar_jogador(p_nome TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  UPDATE cartelas SET deleted_at = NOW() WHERE participante = p_nome AND grupo_id = v_grupo;
  DELETE FROM jogadores WHERE nome = p_nome AND grupo_id = v_grupo;
END;
$$;

CREATE OR REPLACE FUNCTION trocar_senha(p_nome TEXT, p_senha_antiga TEXT, p_senha_nova TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome AND senha = p_senha_antiga AND grupo_id = v_grupo) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;
  IF LENGTH(p_senha_nova) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter pelo menos 6 caracteres';
  END IF;
  UPDATE jogadores SET senha = p_senha_nova WHERE nome = p_nome AND grupo_id = v_grupo;
  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION criar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id TEXT DEFAULT 'geral')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON; v_grupo TEXT := COALESCE(NULLIF(p_grupo_id, ''), 'geral');
BEGIN
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome AND grupo_id = v_grupo) THEN
    RAISE EXCEPTION 'Este nome já está em uso neste grupo';
  END IF;
  INSERT INTO jogadores (nome, senha, grupo_id) VALUES (p_nome, p_senha, v_grupo);
  SELECT json_build_object('nome', nome, 'grupo_id', grupo_id) INTO v
  FROM jogadores WHERE nome = p_nome AND grupo_id = v_grupo;
  RETURN v;
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
-- Fix: getAdminData, salvarAdminData etc. via REST (não RPC)
-- Não precisam de fix pois têm default 'geral' no JS
-- ============================================================
