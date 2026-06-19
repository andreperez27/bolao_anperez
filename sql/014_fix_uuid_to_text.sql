-- =============================================================
-- BOLÃO COPA 2026 — Fix UUID params to TEXT
-- =============================================================

-- Recreate listar_membros_grupo with TEXT param
CREATE OR REPLACE FUNCTION listar_membros_grupo(p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'nome', j.nome,
      'role', j.role,
      'created_at', j.created_at
    ) ORDER BY j.role, j.nome
  ), '[]'::JSON) INTO v
  FROM jogadores j
  WHERE j.grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- Recreate atualizar_config_grupo with TEXT params
CREATE OR REPLACE FUNCTION atualizar_config_grupo(
  p_grupo_id TEXT,
  p_admin_nome TEXT,
  p_valor NUMERIC DEFAULT NULL,
  p_pontos_cheio INT DEFAULT NULL,
  p_pontos_vencedor INT DEFAULT NULL,
  p_pontos_gols INT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM jogadores
    WHERE nome = p_admin_nome AND grupo_id = p_grupo_id AND role = 'group_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode alterar configuracoes';
  END IF;

  UPDATE grupos SET
    valor_aposta = COALESCE(p_valor, valor_aposta),
    pontos_acerto_cheio = COALESCE(p_pontos_cheio, pontos_acerto_cheio),
    pontos_acerto_vencedor = COALESCE(p_pontos_vencedor, pontos_acerto_vencedor),
    pontos_acerto_gols = COALESCE(p_pontos_gols, pontos_acerto_gols)
  WHERE id = p_grupo_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- Recreate listar_jogadores with TEXT param
DROP FUNCTION IF EXISTS listar_jogadores();
CREATE OR REPLACE FUNCTION listar_jogadores(p_grupo_id TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object('nome', nome, 'role', role, 'grupo_id', grupo_id)
    ORDER BY nome
  ), '[]'::JSON) INTO v
  FROM jogadores
  WHERE (p_grupo_id IS NULL OR grupo_id = p_grupo_id)
  AND role != 'super_admin';
  RETURN v;
END;
$$;

-- Recreate criar_grupo with TEXT v_grupo_id
CREATE OR REPLACE FUNCTION criar_grupo(
  p_nome TEXT,
  p_slug TEXT,
  p_admin_nome TEXT,
  p_admin_senha TEXT,
  p_valor NUMERIC DEFAULT 20
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grupo_id TEXT;
  v_admin_existente BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM grupos WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug ja esta em uso';
  END IF;

  INSERT INTO grupos (nome, slug, admin_nome, valor_aposta)
  VALUES (p_nome, p_slug, p_admin_nome, p_valor)
  RETURNING id INTO v_grupo_id;

  SELECT EXISTS (SELECT 1 FROM jogadores WHERE nome = p_admin_nome) INTO v_admin_existente;

  IF v_admin_existente THEN
    UPDATE jogadores SET role = 'group_admin', grupo_id = v_grupo_id
    WHERE nome = p_admin_nome;
  ELSE
    INSERT INTO jogadores (nome, senha, role, grupo_id)
    VALUES (p_admin_nome, p_admin_senha, 'group_admin', v_grupo_id);
  END IF;

  RETURN json_build_object(
    'id', v_grupo_id,
    'nome', p_nome,
    'slug', p_slug,
    'admin_nome', p_admin_nome
  );
END;
$$;
