-- =============================================================
-- BOLÃO COPA 2026 — RBAC + Multitenancy
-- Adiciona roles (super_admin, group_admin, participant) e
-- isolamento por grupo_id em jogadores e RPCs
-- =============================================================

-- 1. Adicionar colunas role e grupo_id em jogadores
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'participant';
ALTER TABLE jogadores ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id);
ALTER TABLE jogadores DROP CONSTRAINT IF EXISTS jogadores_role_check;
ALTER TABLE jogadores ADD CONSTRAINT jogadores_role_check CHECK (role IN ('super_admin', 'group_admin', 'participant'));

-- 2. Garantir colunas de pontuação existem
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS pontos_acerto_cheio INT DEFAULT 6;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS pontos_acerto_vencedor INT DEFAULT 3;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS pontos_acerto_gols INT DEFAULT 1;

-- 3. Garantir grupo 'geral' existe
INSERT INTO grupos (id, nome, slug, valor_aposta, pontos_acerto_cheio, pontos_acerto_vencedor, pontos_acerto_gols)
VALUES ('00000000-0000-0000-0000-000000000000', 'Geral', 'geral', 20, 6, 3, 1)
ON CONFLICT (id) DO NOTHING;

-- 4. Jogadores existentes sem grupo_id viram participantes do grupo geral
UPDATE jogadores SET grupo_id = '00000000-0000-0000-0000-000000000000' WHERE grupo_id IS NULL AND role != 'super_admin';

-- 5. RPC: buscar jogador com role + grupo_id + slug
DROP FUNCTION IF EXISTS buscar_jogador(TEXT, TEXT);
CREATE OR REPLACE FUNCTION buscar_jogador(p_nome TEXT, p_senha TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object(
    'nome', j.nome,
    'role', j.role,
    'grupo_id', j.grupo_id,
    'grupo_slug', g.slug,
    'grupo_nome', g.nome
  ) INTO v
  FROM jogadores j
  LEFT JOIN grupos g ON g.id = j.grupo_id
  WHERE j.nome = p_nome AND j.senha = p_senha;
  RETURN v;
END;
$$;

-- 17. RPC: criar jogador (participant) com grupo_id
DROP FUNCTION IF EXISTS criar_jogador(TEXT, TEXT);
CREATE OR REPLACE FUNCTION criar_jogador(p_nome TEXT, p_senha TEXT, p_grupo_id UUID DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_nome) THEN
    RAISE EXCEPTION 'Este nome ja esta em uso';
  END IF;
  INSERT INTO jogadores (nome, senha, grupo_id, role)
  VALUES (p_nome, p_senha, COALESCE(p_grupo_id, '00000000-0000-0000-0000-000000000000'), 'participant');
  SELECT json_build_object('nome', nome, 'role', role, 'grupo_id', grupo_id)
  INTO v FROM jogadores WHERE nome = p_nome;
  RETURN v;
END;
$$;

-- 17. RPC: criar grupo + admin do grupo
CREATE OR REPLACE FUNCTION criar_grupo(
  p_nome TEXT,
  p_slug TEXT,
  p_admin_nome TEXT,
  p_admin_senha TEXT,
  p_valor NUMERIC DEFAULT 20
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grupo_id UUID;
  v_admin_existente BOOLEAN;
BEGIN
  -- Verificar se slug já existe
  IF EXISTS (SELECT 1 FROM grupos WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug ja esta em uso';
  END IF;

  -- Criar grupo
  INSERT INTO grupos (nome, slug, admin_nome, valor_aposta)
  VALUES (p_nome, p_slug, p_admin_nome, p_valor)
  RETURNING id INTO v_grupo_id;

  -- Criar ou atualizar jogador admin
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

-- 17. RPC: listar todos grupos (super_admin)
CREATE OR REPLACE FUNCTION listar_todos_grupos()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', g.id,
      'nome', g.nome,
      'slug', g.slug,
      'admin_nome', g.admin_nome,
      'valor_aposta', g.valor_aposta,
      'criado_em', g.criado_em,
      'total_participantes', (SELECT COUNT(*) FROM jogadores j WHERE j.grupo_id = g.id AND j.role = 'participant')
    ) ORDER BY g.criado_em DESC
  ), '[]'::JSON) INTO v
  FROM grupos g;
  RETURN v;
END;
$$;

-- 17. RPC: buscar grupo por slug
CREATE OR REPLACE FUNCTION buscar_grupo_por_slug(p_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object(
    'id', g.id,
    'nome', g.nome,
    'slug', g.slug,
    'admin_nome', g.admin_nome,
    'valor_aposta', g.valor_aposta,
    'pontos_acerto_cheio', g.pontos_acerto_cheio,
    'pontos_acerto_vencedor', g.pontos_acerto_vencedor,
    'pontos_acerto_gols', g.pontos_acerto_gols
  ) INTO v
  FROM grupos g
  WHERE g.slug = p_slug;
  RETURN v;
END;
$$;

-- 17. RPC: listar membros do grupo (pelo grupo_id)
CREATE OR REPLACE FUNCTION listar_membros_grupo(p_grupo_id UUID)
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
  WHERE j.grupo_id = p_grupo_id
  ORDER BY j.role, j.nome;
  RETURN v;
END;
$$;

-- 17. RPC: validar código de convite
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
  WHERE cg.codigo = p_codigo AND (cg.usado = false OR cg.usado IS NULL)
  AND (cg.expires_at IS NULL OR cg.expires_at > NOW());

  IF v IS NULL THEN
    RETURN json_build_object('valido', false);
  END IF;

  RETURN v;
END;
$$;

-- 17. RPC: entrar em grupo via código de convite (cria jogador)
CREATE OR REPLACE FUNCTION entrar_grupo_por_convite(
  p_codigo TEXT,
  p_nome TEXT,
  p_senha TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_grupo_id UUID;
  v_grupo_slug TEXT;
  v_grupo_nome TEXT;
BEGIN
  -- Validar convite
  SELECT cg.grupo_id, g.slug, g.nome INTO v_grupo_id, v_grupo_slug, v_grupo_nome
  FROM convites_grupo cg
  JOIN grupos g ON g.id = cg.grupo_id
  WHERE cg.codigo = p_codigo AND (cg.usado = false OR cg.usado IS NULL)
  AND (cg.expires_at IS NULL OR cg.expires_at > NOW());

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

  -- Marcar convite como usado
  UPDATE convites_grupo SET usado = true, usado_por = p_nome
  WHERE codigo = p_codigo;

  RETURN json_build_object(
    'nome', p_nome,
    'role', 'participant',
    'grupo_id', v_grupo_id,
    'grupo_slug', v_grupo_slug,
    'grupo_nome', v_grupo_nome
  );
END;
$$;

-- 17. RPC: gerar convite para grupo (group_admin do grupo)
CREATE OR REPLACE FUNCTION gerar_convite(
  p_grupo_id UUID,
  p_criado_por TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_codigo TEXT;
  v_id UUID;
BEGIN
  v_codigo := upper(substr(md5(random()::TEXT || clock_timestamp()::TEXT), 1, 8));

  INSERT INTO convites_grupo (grupo_id, codigo, criado_por)
  VALUES (p_grupo_id, v_codigo, p_criado_por)
  RETURNING id INTO v_id;

  RETURN json_build_object('id', v_id, 'codigo', v_codigo, 'grupo_id', p_grupo_id);
END;
$$;

-- 17. RPC: listar convites do grupo
CREATE OR REPLACE FUNCTION listar_convites(p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', cg.id,
      'codigo', cg.codigo,
      'usado', cg.usado,
      'usado_por', cg.usado_por,
      'criado_em', cg.criado_em,
      'expires_at', cg.expires_at
    ) ORDER BY cg.criado_em DESC
  ), '[]'::JSON) INTO v
  FROM convites_grupo cg
  WHERE cg.grupo_id = p_grupo_id;
  RETURN v;
END;
$$;

-- 17. RPC: listar jogadores do grupo (filtrado por grupo_id)
DROP FUNCTION IF EXISTS listar_jogadores();
CREATE OR REPLACE FUNCTION listar_jogadores(p_grupo_id UUID DEFAULT NULL)
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

-- 17. RPC: criar super_admin inicial (protegido pela senha admin da config)
CREATE OR REPLACE FUNCTION criar_super_admin(
  p_nome TEXT,
  p_senha TEXT,
  p_admin_password TEXT
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_ok BOOLEAN;
BEGIN
  SELECT (admin_password = p_admin_password) INTO v_admin_ok FROM config WHERE id = 1;

  IF NOT v_admin_ok OR v_admin_ok IS NULL THEN
    RAISE EXCEPTION 'Senha de administrador incorreta';
  END IF;

  IF EXISTS (SELECT 1 FROM jogadores WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'Super admin ja existe';
  END IF;

  INSERT INTO jogadores (nome, senha, role) VALUES (p_nome, p_senha, 'super_admin');

  RETURN json_build_object('nome', p_nome, 'role', 'super_admin');
END;
$$;

-- 17. RPC: atualizar configurações do grupo (group_admin do grupo)
CREATE OR REPLACE FUNCTION atualizar_config_grupo(
  p_grupo_id UUID,
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
