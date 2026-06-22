CREATE OR REPLACE FUNCTION salvar_resultado(
  p_match_id UUID,
  p_placar_a INT,
  p_placar_b INT,
  p_encerrado BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO match_results (match_id, placar_a, placar_b, encerrado, updated_at)
  VALUES (p_match_id, p_placar_a, p_placar_b, p_encerrado, NOW())
  ON CONFLICT (match_id) DO UPDATE SET
    placar_a   = EXCLUDED.placar_a,
    placar_b   = EXCLUDED.placar_b,
    encerrado  = EXCLUDED.encerrado,
    updated_at = NOW();
  RETURN json_build_object('ok', true, 'match_id', p_match_id);
END;
$$;
