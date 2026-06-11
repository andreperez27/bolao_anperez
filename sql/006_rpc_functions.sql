-- =============================================================
-- BOLÃO COPA 2026 — RPC Functions (bypass schema cache)
-- Execute APÓS 005_auth_simplificado.sql
-- =============================================================

-- Criar jogador (insere e retorna o registro criado)
CREATE OR REPLACE FUNCTION criar_jogador(p_id UUID, p_nome TEXT, p_senha TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verifica se nome já existe
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome) THEN
    RAISE EXCEPTION 'Este nome já está em uso';
  END IF;

  INSERT INTO jogadores (id, nome, senha) VALUES (p_id, p_nome, p_senha);

  SELECT json_build_object('id', id, 'nome', nome, 'created_at', created_at) INTO v_result
  FROM jogadores WHERE id = p_id;

  RETURN v_result;
END;
$$;

-- Buscar jogador por nome e senha
CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object('id', id, 'nome', nome, 'created_at', created_at) INTO v_result
  FROM jogadores WHERE nome = p_nome AND senha = p_senha;

  RETURN v_result;
END;
$$;

-- Buscar jogador por ID
CREATE OR REPLACE FUNCTION buscar_jogador_id(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object('id', id, 'nome', nome, 'created_at', created_at) INTO v_result
  FROM jogadores WHERE id = p_id;

  RETURN v_result;
END;
$$;

-- Listar todos os jogadores
CREATE OR REPLACE FUNCTION listar_jogadores()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_agg(json_build_object('id', id, 'nome', nome, 'created_at', created_at) ORDER BY created_at ASC) INTO v_result
  FROM jogadores;

  RETURN COALESCE(v_result, '[]'::JSON);
END;
$$;
