-- ============================================================
-- BOLÃO COPA 2026 — Multitenancy v2
-- Adapta grupos/membros para usar jogadores.nome como FK
-- ============================================================

-- 1. Corrigir grupos: criador_id passa a ser TEXT (nome do criador)
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_criador_id_fkey;
ALTER TABLE grupos ALTER COLUMN criador_id TYPE TEXT USING criador_id::TEXT;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS admin_nome TEXT DEFAULT '';
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS criado_por TEXT DEFAULT '';

-- 2. Corrigir membros_grupo: usuario_id passa a ser TEXT (nome do jogador)
ALTER TABLE membros_grupo DROP CONSTRAINT IF EXISTS membros_grupo_usuario_id_fkey;
ALTER TABLE membros_grupo DROP CONSTRAINT IF EXISTS membros_grupo_grupo_id_usuario_id_key;
ALTER TABLE membros_grupo ALTER COLUMN usuario_id TYPE TEXT USING usuario_id::TEXT;
ALTER TABLE membros_grupo ADD CONSTRAINT membros_grupo_grupo_id_usuario_id_key UNIQUE(grupo_id, usuario_id);

-- 3. Criar grupo padrão se não existir
INSERT INTO grupos (id, nome, slug, valor_aposta, admin_nome)
VALUES ('00000000-0000-0000-0000-000000000000', 'Grupo Geral', 'geral', 0.00, '')
ON CONFLICT (id) DO NOTHING;

-- 4. RPC: criar grupo
CREATE OR REPLACE FUNCTION criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC DEFAULT 20)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID;
BEGIN
  INSERT INTO grupos (nome, slug, criador_id, admin_nome, criado_por, valor_aposta)
  VALUES (p_nome, p_slug, p_admin, p_admin, p_admin, p_valor)
  RETURNING id INTO v_grupo_id;

  INSERT INTO membros_grupo (grupo_id, usuario_id, role)
  VALUES (v_grupo_id, p_admin, 'admin');

  RETURN json_build_object('id', v_grupo_id, 'nome', p_nome, 'slug', p_slug);
END;
$$;

-- 5. RPC: listar grupos do usuário
CREATE OR REPLACE FUNCTION listar_grupos_usuario(p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', g.id,
      'nome', g.nome,
      'slug', g.slug,
      'valor_aposta', g.valor_aposta,
      'admin_nome', g.admin_nome,
      'role', m.role,
      'criado_em', g.criado_em
    )
  ), '[]'::JSON) INTO v
  FROM grupos g
  JOIN membros_grupo m ON m.grupo_id = g.id
  WHERE m.usuario_id = p_usuario
  ORDER BY g.nome;
  RETURN v;
END;
$$;

-- 6. RPC: listar membros do grupo
CREATE OR REPLACE FUNCTION listar_membros_grupo(p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object('usuario_id', m.usuario_id, 'role', m.role, 'pago', m.pago)
  ), '[]'::JSON) INTO v
  FROM membros_grupo m
  WHERE m.grupo_id = p_grupo_id
  ORDER BY m.role, m.usuario_id;
  RETURN v;
END;
$$;

-- 7. RPC: entrar em grupo via slug
CREATE OR REPLACE FUNCTION entrar_grupo(p_slug TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID;
DECLARE v_nome TEXT;
BEGIN
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

-- 8. RPC: atualizar grupo (admin only)
CREATE OR REPLACE FUNCTION atualizar_grupo(p_grupo_id UUID, p_admin TEXT, p_valor NUMERIC, p_pontos_cheio INT, p_pontos_vencedor INT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = p_grupo_id AND usuario_id = p_admin AND role = 'admin') THEN
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

-- 9. RPC: listar todos os grupos (super admin)
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
      'criado_em', g.criado_em
    )
  ), '[]'::JSON) INTO v
  FROM grupos g
  ORDER BY g.criado_em DESC;
  RETURN v;
END;
$$;

-- 10. RPC: remover membro do grupo
CREATE OR REPLACE FUNCTION remover_membro_grupo(p_grupo_id UUID, p_admin TEXT, p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM membros_grupo WHERE grupo_id = p_grupo_id AND usuario_id = p_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas o admin do grupo pode remover membros';
  END IF;

  DELETE FROM membros_grupo WHERE grupo_id = p_grupo_id AND usuario_id = p_usuario;

  RETURN json_build_object('ok', true);
END;
$$;
