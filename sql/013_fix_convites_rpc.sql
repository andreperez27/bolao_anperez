-- =============================================================
-- BOLÃO COPA 2026 — Fix RPCs for actual convites_grupo schema
-- =============================================================

-- 1. RPC: validar código de convite (adapted to actual schema)
CREATE OR REPLACE FUNCTION validar_convite(p_codigo TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object(
    'valido', true,
    'grupo_id', cg.grupo_id,
    'grupo_nome', g.nome,
    'grupo_slug', g.slug
  ) INTO v
  FROM convites_grupo cg
  JOIN grupos g ON g.id = cg.grupo_id
  WHERE cg.token = p_codigo
  AND cg.ativo = true
  AND (cg.expira_em IS NULL OR cg.expira_em > NOW())
  AND (cg.max_usos IS NULL OR cg.usos < cg.max_usos);

  IF v IS NULL THEN
    RETURN json_build_object('valido', false);
  END IF;

  RETURN v;
END;
$$;

-- 2. RPC: entrar em grupo via código de convite (cria jogador)
CREATE OR REPLACE FUNCTION entrar_grupo_por_convite(
  p_codigo TEXT,
  p_nome TEXT,
  p_senha TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grupo_id TEXT;
  v_grupo_slug TEXT;
  v_grupo_nome TEXT;
BEGIN
  -- Validar convite
  SELECT cg.grupo_id, g.slug, g.nome INTO v_grupo_id, v_grupo_slug, v_grupo_nome
  FROM convites_grupo cg
  JOIN grupos g ON g.id = cg.grupo_id
  WHERE cg.token = p_codigo
  AND cg.ativo = true
  AND (cg.expira_em IS NULL OR cg.expira_em > NOW())
  AND (cg.max_usos IS NULL OR cg.usos < cg.max_usos);

  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Convite invalido ou expirado';
  END IF;

  -- Verificar se nome já existe
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome) THEN
    RAISE EXCEPTION 'Este nome ja esta em uso';
  END IF;

  -- Criar jogador como participant do grupo
  INSERT INTO jogadores (nome, senha, role, grupo_id)
  VALUES (p_nome, p_senha, 'participant', v_grupo_id);

  -- Incrementar usos do convite
  UPDATE convites_grupo SET usos = COALESCE(usos, 0) + 1
  WHERE token = p_codigo;

  RETURN json_build_object(
    'nome', p_nome,
    'role', 'participant',
    'grupo_id', v_grupo_id,
    'grupo_slug', v_grupo_slug,
    'grupo_nome', v_grupo_nome
  );
END;
$$;

-- 3. RPC: gerar convite para grupo
CREATE OR REPLACE FUNCTION gerar_convite(
  p_grupo_id TEXT,
  p_criado_por TEXT,
  p_max_usos INT DEFAULT 1,
  p_expira_dias INT DEFAULT 30
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
  v_id UUID;
BEGIN
  v_token := upper(substr(md5(random()::TEXT || clock_timestamp()::TEXT), 1, 8));

  INSERT INTO convites_grupo (grupo_id, token, criado_por, max_usos, expira_em, ativo)
  VALUES (p_grupo_id, v_token, p_criado_por, p_max_usos, NOW() + (p_expira_dias || ' days')::INTERVAL, true)
  RETURNING id INTO v_id;

  RETURN json_build_object('id', v_id, 'codigo', v_token, 'grupo_id', p_grupo_id);
END;
$$;

-- 4. RPC: listar convites do grupo
CREATE OR REPLACE FUNCTION listar_convites(p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', cg.id,
      'codigo', cg.token,
      'usado', (cg.max_usos IS NOT NULL AND cg.usos >= cg.max_usos),
      'usos', cg.usos,
      'max_usos', cg.max_usos,
      'usado_por', cg.criado_por,
      'criado_em', cg.created_at,
      'expires_at', cg.expira_em,
      'ativo', cg.ativo
    ) ORDER BY cg.created_at DESC
  ), '[]'::JSON) INTO v
  FROM convites_grupo cg
  WHERE cg.grupo_id = p_grupo_id;
  RETURN v;
END;
$$;
