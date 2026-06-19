-- =============================================================
-- BOLÃO COPA 2026 — RPCs editar/excluir grupo (super_admin)
-- =============================================================

-- Atualizar dados do grupo (super_admin only)
CREATE OR REPLACE FUNCTION atualizar_grupo_admin(
  p_grupo_id TEXT,
  p_nome TEXT DEFAULT NULL,
  p_novo_admin TEXT DEFAULT NULL,
  p_nova_senha_admin TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_nome IS NOT NULL THEN
    UPDATE grupos SET nome = p_nome WHERE id = p_grupo_id;
  END IF;

  IF p_novo_admin IS NOT NULL THEN
    -- Remove admin anterior
    UPDATE jogadores SET role = 'participant' WHERE grupo_id = p_grupo_id AND role = 'group_admin';
    -- Se o novo admin já existe como participant, promove
    IF EXISTS (SELECT 1 FROM jogadores WHERE nome = p_novo_admin) THEN
      UPDATE jogadores SET role = 'group_admin', grupo_id = p_grupo_id WHERE nome = p_novo_admin;
    ELSE
      INSERT INTO jogadores (nome, senha, role, grupo_id)
      VALUES (p_novo_admin, COALESCE(p_nova_senha_admin, '123456'), 'group_admin', p_grupo_id);
    END IF;
    UPDATE grupos SET admin_nome = p_novo_admin WHERE id = p_grupo_id;
  END IF;

  RETURN json_build_object('ok', true);
END;
$$;

-- Excluir grupo (super_admin only)
CREATE OR REPLACE FUNCTION deletar_grupo(p_grupo_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM convites_grupo WHERE grupo_id = p_grupo_id;
  DELETE FROM cartelas WHERE grupo_id = p_grupo_id;
  DELETE FROM jogadores WHERE grupo_id = p_grupo_id;
  DELETE FROM grupos WHERE id = p_grupo_id;
  RETURN json_build_object('ok', true);
END;
$$;
