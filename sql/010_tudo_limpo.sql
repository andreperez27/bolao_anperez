-- =============================================================
-- BOLÃO COPA 2026 — Script Único (executar inteiro de uma vez)
-- =============================================================

-- 1. Remover FKs que apontam para auth.users (caso ainda existam)
ALTER TABLE jogadores DROP CONSTRAINT IF EXISTS jogadores_id_fkey;
ALTER TABLE cartelas DROP CONSTRAINT IF EXISTS cartelas_user_id_fkey;

-- 2. Garantir coluna admin_password na config
ALTER TABLE config ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT '';

-- 3. Desabilitar RLS em todas as tabelas
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE cartelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS admins;

-- 4. Configurar senha do admin
UPDATE config SET admin_password = 'admin123' WHERE id = 1;
INSERT INTO config (id, valor_aposta, admin_password)
SELECT 1, 20, 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM config WHERE id = 1);

-- 5. RPC: criar jogador (nome é PK)
DROP FUNCTION IF EXISTS criar_jogador(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION criar_jogador(p_nome TEXT, p_senha TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome) THEN
    RAISE EXCEPTION 'Este nome ja esta em uso';
  END IF;
  INSERT INTO jogadores (nome, senha) VALUES (p_nome, p_senha);
  SELECT json_build_object('nome', nome) INTO v FROM jogadores WHERE nome = p_nome;
  RETURN v;
END;
$$;

-- Drop old functions that referenced jogadores.id
DROP FUNCTION IF EXISTS buscar_jogador_id(UUID);
DROP FUNCTION IF EXISTS listar_jogadores();
DROP FUNCTION IF EXISTS buscar_jogador(TEXT, TEXT);

-- 6. RPC: buscar jogador por nome + senha
CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome) INTO v
  FROM jogadores WHERE nome = p_nome AND senha = p_senha;
  RETURN v;
END;
$$;

-- 7. RPC: buscar jogador por nome
CREATE OR REPLACE FUNCTION buscar_jogador_nome(p_nome TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object('nome', nome) INTO v
  FROM jogadores WHERE nome = p_nome;
  RETURN v;
END;
$$;

-- 8. RPC: listar jogadores
CREATE OR REPLACE FUNCTION listar_jogadores()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object('nome', nome)), '[]'::JSON) INTO v
  FROM jogadores ORDER BY nome;
  RETURN v;
END;
$$;

-- 9. RPC: deletar jogador por nome
CREATE OR REPLACE FUNCTION deletar_jogador(p_nome TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM cartelas WHERE participante = p_nome;
  DELETE FROM jogadores WHERE nome = p_nome;
END;
$$;
