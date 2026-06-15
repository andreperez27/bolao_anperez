-- Corrige RPCs de grupos (json_agg + ORDER BY precisa de subquery)

CREATE OR REPLACE FUNCTION listar_grupos_usuario(p_usuario TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', g.id,
      'nome', g.nome,
      'slug', g.slug,
      'valor_aposta', g.valor_aposta,
      'admin_nome', g.admin_nome,
      'role', m.role,
      'criado_em', g.criado_em
    ) AS q
    FROM grupos g
    JOIN membros_grupo m ON m.grupo_id = g.id
    WHERE m.usuario_id = p_usuario
    ORDER BY g.nome
  ) sub;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_membros_grupo(p_grupo_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
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

CREATE OR REPLACE FUNCTION listar_todos_grupos()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(sub.q), '[]'::JSON) INTO v
  FROM (
    SELECT json_build_object(
      'id', g.id,
      'nome', g.nome,
      'slug', g.slug,
      'admin_nome', g.admin_nome,
      'valor_aposta', g.valor_aposta,
      'criado_em', g.criado_em
    ) AS q
    FROM grupos g
    ORDER BY g.criado_em DESC
  ) sub;
  RETURN v;
END;
$$;
