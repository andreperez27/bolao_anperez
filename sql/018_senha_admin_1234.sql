-- ============================================================
-- Ajusta senhas: super admin = '1234', admin do grupo = '1234'
-- ============================================================

-- 1. Define senha do super admin como '1234'
UPDATE config SET admin_password = '1234' WHERE id = 1;

-- 2. Recria criar_grupo para auto-criar o admin com senha '1234'
DROP FUNCTION IF EXISTS criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC, p_admin_password TEXT);

CREATE OR REPLACE FUNCTION criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC DEFAULT 20, p_admin_password TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_grupo_id UUID; v_admin_cfg TEXT; v_admin_existe BOOLEAN;
BEGIN
  SELECT admin_password INTO v_admin_cfg FROM config WHERE id = 1;
  IF v_admin_cfg IS NULL OR v_admin_cfg = '' OR p_admin_password IS DISTINCT FROM v_admin_cfg THEN
    RAISE EXCEPTION 'Acesso negado: senha de admin invalida';
  END IF;

  -- Verifica se o admin já existe como jogador
  SELECT EXISTS(SELECT 1 FROM jogadores WHERE nome = p_admin) INTO v_admin_existe;

  -- Se não existe, cria com senha '1234'
  IF NOT v_admin_existe THEN
    INSERT INTO jogadores (nome, senha) VALUES (p_admin, '1234');
  END IF;

  -- Cria o grupo
  INSERT INTO grupos (nome, slug, criador_id, admin_nome, criado_por, valor_aposta)
  VALUES (p_nome, p_slug, p_admin, p_admin, p_admin, p_valor) RETURNING id INTO v_grupo_id;

  -- Adiciona admin como membro
  INSERT INTO membros_grupo (grupo_id, usuario_id, role) VALUES (v_grupo_id, p_admin, 'admin');

  -- Retorna com aviso sobre senha
  RETURN json_build_object(
    'id', v_grupo_id,
    'nome', p_nome,
    'slug', p_slug,
    'admin_senha', CASE WHEN NOT v_admin_existe THEN '1234' ELSE NULL END,
    'aviso', CASE WHEN NOT v_admin_existe THEN 'Admin criado com senha padrao 1234. Peça para alterar no sistema.' ELSE NULL END
  );
END;
$$;
