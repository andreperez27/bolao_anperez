-- Remove funções antigas com número de parâmetros diferente
-- para eliminar sobrecarga (function overloading)

DROP FUNCTION IF EXISTS criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC);
DROP FUNCTION IF EXISTS criar_grupo(p_nome TEXT, p_slug TEXT, p_admin TEXT, p_valor NUMERIC, p_admin_password TEXT);

DROP FUNCTION IF EXISTS listar_todos_grupos();
DROP FUNCTION IF EXISTS listar_todos_grupos(p_admin_password TEXT);

DROP FUNCTION IF EXISTS listar_membros_grupo(p_grupo_id UUID);
DROP FUNCTION IF EXISTS listar_membros_grupo(p_grupo_id UUID, p_usuario TEXT);

DROP FUNCTION IF EXISTS listar_grupos_usuario(p_usuario TEXT);

DROP FUNCTION IF EXISTS entrar_grupo(p_slug TEXT, p_usuario TEXT);

DROP FUNCTION IF EXISTS remover_membro_grupo(p_grupo_id UUID, p_admin TEXT, p_usuario TEXT);

DROP FUNCTION IF EXISTS atualizar_grupo(p_grupo_id UUID, p_admin TEXT, p_valor NUMERIC, p_pontos_cheio INT, p_pontos_vencedor INT);
DROP FUNCTION IF EXISTS atualizar_grupo(p_grupo_id UUID, p_admin TEXT, p_valor NUMERIC, p_pontos_cheio INT, p_pontos_vencedor INT, p_admin_password TEXT);

DROP FUNCTION IF EXISTS gerar_convite_grupo(p_usuario TEXT, p_grupo_id UUID, p_validade_dias INT, p_max_usos INT);
DROP FUNCTION IF EXISTS listar_convites_grupo(p_usuario TEXT, p_grupo_id UUID);
DROP FUNCTION IF EXISTS revogar_convite_grupo(p_usuario TEXT, p_convite_id UUID);
DROP FUNCTION IF EXISTS usar_convite_grupo(p_token TEXT, p_usuario TEXT);
DROP FUNCTION IF EXISTS listar_cartelas_do_grupo(p_usuario TEXT, p_grupo_id UUID);
DROP FUNCTION IF EXISTS validar_cartela_grupo(p_usuario TEXT, p_cartela_id TEXT, p_status TEXT);

DROP FUNCTION IF EXISTS listar_membros_do_grupo(p_usuario TEXT, p_grupo_id UUID);
DROP FUNCTION IF EXISTS usuario_pertence_ao_grupo(p_usuario TEXT, p_grupo_id UUID);
DROP FUNCTION IF EXISTS usuario_eh_admin_grupo(p_usuario TEXT, p_grupo_id UUID);
DROP FUNCTION IF EXISTS usuario_existe(p_usuario TEXT);

DROP FUNCTION IF EXISTS excluir_grupo(p_grupo_id UUID, p_admin_password TEXT);
