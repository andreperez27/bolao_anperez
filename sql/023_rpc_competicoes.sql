-- =============================================================
-- RPCs — COMPETIÇÃO / EDIÇÃO / PARTIDAS
-- =============================================================

CREATE OR REPLACE FUNCTION listar_edicoes_ativas()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', e.id, 'slug', e.slug, 'nome', e.nome, 'temporada', e.temporada,
    'competicao_slug', c.slug, 'competicao_nome', c.nome,
    'data_inicio', e.data_inicio, 'data_fim', e.data_fim
  ) ORDER BY e.data_inicio DESC), '[]'::JSON) INTO v
  FROM competition_editions e
  JOIN competitions c ON c.id = e.competition_id
  WHERE e.ativo = TRUE;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_edicao_do_grupo(p_grupo_slug TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT json_build_object(
    'edition_id', e.id, 'edition_slug', e.slug,
    'edition_nome', e.nome, 'temporada', e.temporada,
    'config', e.config, 'timezone', e.timezone
  ) INTO v
  FROM groups g
  JOIN competition_editions e ON e.id = g.edition_id
  WHERE g.slug = p_grupo_slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Grupo não encontrado'; END IF;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_partidas_edicao(p_edition_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', m.id, 'slug', m.slug, 'ordem', m.ordem,
    'time_a_nome', COALESCE(t_a.nome, m.time_a_nome),
    'time_b_nome', COALESCE(t_b.nome, m.time_b_nome),
    'time_a_iso', t_a.iso_code, 'time_b_iso', t_b.iso_code,
    'data_iso', m.data_iso, 'horario', m.horario,
    'grupo_letra', m.grupo_letra, 'estadio', m.estadio,
    'status', m.status,
    'stage_id', s.id, 'stage_slug', s.slug, 'stage_nome', s.nome,
    'stage_ordem', s.ordem,
    'round_slug', r.slug, 'round_nome', r.nome,
    'placar_a', mr.placar_a, 'placar_b', mr.placar_b, 'encerrado', mr.encerrado
  ) ORDER BY m.data_iso, m.horario, m.ordem), '[]'::JSON) INTO v
  FROM matches m
  JOIN rounds r ON r.id = m.round_id
  JOIN stages s ON s.id = r.stage_id
  LEFT JOIN teams t_a ON t_a.id = m.time_a_id
  LEFT JOIN teams t_b ON t_b.id = m.time_b_id
  LEFT JOIN match_results mr ON mr.match_id = m.id
  WHERE m.edition_id = p_edition_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_partidas_por_fase(p_edition_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'stage_id', s.id, 'stage_slug', s.slug, 'stage_nome', s.nome,
    'stage_ordem', s.ordem, 'stage_tipo', s.tipo,
    'partidas', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', m.id, 'slug', m.slug,
        'time_a_nome', COALESCE(t_a.nome, m.time_a_nome),
        'time_b_nome', COALESCE(t_b.nome, m.time_b_nome),
        'time_a_iso', t_a.iso_code, 'time_b_iso', t_b.iso_code,
        'data_iso', m.data_iso, 'horario', m.horario,
        'grupo_letra', m.grupo_letra, 'estadio', m.estadio,
        'status', m.status, 'ordem', m.ordem,
        'placar_a', mr.placar_a, 'placar_b', mr.placar_b, 'encerrado', mr.encerrado
      ) ORDER BY m.data_iso, m.horario, m.ordem), '[]'::JSON)
      FROM matches m
      JOIN rounds r ON r.id = m.round_id
      LEFT JOIN teams t_a ON t_a.id = m.time_a_id
      LEFT JOIN teams t_b ON t_b.id = m.time_b_id
      LEFT JOIN match_results mr ON mr.match_id = m.id
      WHERE r.stage_id = s.id AND m.edition_id = p_edition_id
    )
  ) ORDER BY s.ordem), '[]'::JSON) INTO v
  FROM stages s
  WHERE s.edition_id = p_edition_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION listar_times_edicao(p_edition_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', t.id, 'nome', t.nome, 'nome_curto', t.nome_curto,
    'slug', t.slug, 'iso_code', t.iso_code,
    'grupo_letra', et.grupo_letra, 'seed', et.seed
  ) ORDER BY et.grupo_letra, et.seed), '[]'::JSON) INTO v
  FROM edition_teams et
  JOIN teams t ON t.id = et.team_id
  WHERE et.edition_id = p_edition_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION buscar_resultados_edicao(p_edition_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'match_id', mr.match_id,
    'placar_a', mr.placar_a, 'placar_b', mr.placar_b,
    'encerrado', mr.encerrado
  )), '[]'::JSON) INTO v
  FROM match_results mr
  JOIN matches m ON m.id = mr.match_id
  WHERE m.edition_id = p_edition_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION calcular_classificacao(p_edition_id UUID, p_stage_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v JSON;
BEGIN
  WITH resultados AS (
    SELECT
      CASE WHEN mr.placar_a > mr.placar_b THEN m.time_a_id
           WHEN mr.placar_b > mr.placar_a THEN m.time_b_id
           ELSE NULL END AS vencedor_id,
      CASE WHEN mr.placar_a < mr.placar_b THEN m.time_a_id
           WHEN mr.placar_b < mr.placar_a THEN m.time_b_id
           ELSE NULL END AS perdedor_id,
      m.time_a_id, m.time_b_id,
      mr.placar_a, mr.placar_b, mr.encerrado
    FROM matches m
    JOIN match_results mr ON mr.match_id = m.id
    JOIN rounds r ON r.id = m.round_id
    WHERE m.edition_id = p_edition_id AND r.stage_id = p_stage_id AND mr.encerrado = TRUE
  ),
  stats AS (
    SELECT t.id AS team_id, t.nome, et.grupo_letra,
      COUNT(r.time_a_id) FILTER (WHERE r.time_a_id = t.id OR r.time_b_id = t.id) AS j,
      COUNT(r.vencedor_id) FILTER (WHERE r.vencedor_id = t.id) AS v,
      COUNT(r.vencedor_id) FILTER (WHERE r.vencedor_id IS NOT NULL AND r.time_a_id IS NOT NULL AND r.vencedor_id != t.id AND r.perdedor_id != t.id AND (r.time_a_id = t.id OR r.time_b_id = t.id)) AS e,
      COUNT(r.perdedor_id) FILTER (WHERE r.perdedor_id = t.id) AS d,
      COALESCE(SUM(CASE WHEN r.time_a_id = t.id THEN r.placar_a ELSE r.placar_b END), 0) AS gp,
      COALESCE(SUM(CASE WHEN r.time_a_id = t.id THEN r.placar_b ELSE r.placar_a END), 0) AS gc
    FROM teams t
    JOIN edition_teams et ON et.team_id = t.id AND et.edition_id = p_edition_id
    LEFT JOIN resultados r ON r.time_a_id = t.id OR r.time_b_id = t.id
    WHERE et.grupo_letra IS NOT NULL
    GROUP BY t.id, t.nome, et.grupo_letra
  )
  SELECT COALESCE(json_agg(json_build_object(
    'team_id', team_id, 'nome', nome, 'grupo_letra', grupo_letra,
    'pts', v * 3 + e, 'j', j, 'v', v, 'e', e, 'd', d, 'gp', gp, 'gc', gc, 'sg', gp - gc
  ) ORDER BY grupo_letra, v * 3 + e DESC, gp - gc DESC, gp DESC), '[]'::JSON) INTO v
  FROM stats;
  RETURN v;
END;
$$;
