-- ============================================================
-- BOLÃO COPA 2026 — Super Admin CRUD + Correção permissões
-- ============================================================

-- 1. Atualizar grupo com suporte a super admin
--    Versão anterior só permitia admin do grupo editar.
--    Agora super admin (com senha) também pode editar qualquer grupo.
CREATE OR REPLACE FUNCTION atualizar_grupo(
  p_grupo_id UUID,
  p_admin TEXT,
  p_valor NUMERIC,
  p_pontos_cheio INT DEFAULT 5,
  p_pontos_vencedor INT DEFAULT 3,
  p_admin_password TEXT DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_cfg TEXT;
BEGIN
  -- Permite se: é admin do grupo OU é super admin (senha correta)
  IF usuario_eh_admin_grupo(p_admin, p_grupo_id) THEN
    -- ok, admin do grupo
  ELSIF p_admin_password IS NOT NULL THEN
    SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
    IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
      RAISE EXCEPTION 'Acesso negado: senha de admin invalida';
    END IF;
  ELSE
    RAISE EXCEPTION 'Acesso negado: voce nao tem permissao para editar este grupo';
  END IF;

  UPDATE grupos SET
    valor_aposta = p_valor,
    pontos_acerto_cheio = p_pontos_cheio,
    pontos_acerto_vencedor = p_pontos_vencedor
  WHERE id = p_grupo_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- 2. Excluir grupo (apenas super admin com senha)
CREATE OR REPLACE FUNCTION excluir_grupo(p_grupo_id UUID, p_admin_password TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_admin_cfg TEXT;
BEGIN
  SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
  IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
    RAISE EXCEPTION 'Acesso negado: senha de admin invalida';
  END IF;

  -- Remove membros (FK)
  DELETE FROM membros_grupo WHERE grupo_id = p_grupo_id;
  -- Remove convites
  DELETE FROM convites_grupo WHERE grupo_id = p_grupo_id;
  -- Remove cartelas do grupo
  DELETE FROM cartelas WHERE grupo_id = p_grupo_id;
  -- Remove o grupo
  DELETE FROM grupos WHERE id = p_grupo_id;

  RETURN json_build_object('ok', true);
END;
$$;
