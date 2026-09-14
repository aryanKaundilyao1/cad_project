CREATE OR REPLACE FUNCTION public.test_metrics(p_opp_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_signal_count INT;
    v_raw_avg_confidence NUMERIC;
    v_weighted_strength NUMERIC;
BEGIN
    SELECT 
        COUNT(si.id),
        COALESCE(AVG(scr.base_confidence), 50.0),
        COALESCE(SUM(si.strength * COALESCE(sw.weight, 1.0) * GREATEST(0.5, 1.0 - (EXTRACT(EPOCH FROM (NOW() - si.detected_at))/86400 * 0.01))), 0.0)
    INTO v_signal_count, v_raw_avg_confidence, v_weighted_strength
    FROM public.opportunity_signals os
    JOIN public.signal_instances si ON os.signal_instance_id = si.id
    LEFT JOIN public.signal_weights sw ON si.signal_registry_id = sw.signal_type_id
    LEFT JOIN public.signal_confidence_rules scr ON si.signal_registry_id = scr.signal_type_id
    WHERE os.opportunity_intelligence_id = (SELECT id FROM public.opportunity_intelligence WHERE opportunity_id = p_opp_id);

    RETURN jsonb_build_object(
        'v_signal_count', v_signal_count,
        'v_raw_avg_confidence', v_raw_avg_confidence,
        'v_weighted_strength', v_weighted_strength
    );
END;
$$ LANGUAGE plpgsql;
