-- Function to fork (copy) a goal template
CREATE OR REPLACE FUNCTION fork_goal_template(
    p_original_template_id UUID,
    p_new_title TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_new_template_id UUID;
    v_original_template goal_templates%ROWTYPE;
BEGIN
    -- Fetch the original template
    SELECT * INTO v_original_template FROM goal_templates WHERE id = p_original_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original template with ID % not found', p_original_template_id;
    END IF;
    
    -- Create a new template based on the original
    INSERT INTO goal_templates (
        title,
        description,
        goal_type,
        specific_goal_type,
        default_target_amount,
        default_duration_days,
        is_recurring,
        default_recurrence_pattern
    ) VALUES (
        p_new_title,
        v_original_template.description || ' (Forked)',
        v_original_template.goal_type,
        v_original_template.specific_goal_type,
        v_original_template.default_target_amount,
        v_original_template.default_duration_days,
        v_original_template.is_recurring,
        v_original_template.default_recurrence_pattern
    ) RETURNING id INTO v_new_template_id;
    
    -- Copy milestone templates
    INSERT INTO goal_milestone_templates (
        goal_template_id,
        title,
        description,
        target_percentage,
        due_day
    )
    SELECT
        v_new_template_id,
        title,
        description,
        target_percentage,
        due_day
    FROM goal_milestone_templates
    WHERE goal_template_id = p_original_template_id;
    
    -- Log the template forking action
    INSERT INTO goal_history (
        goal_id,
        changed_by,
        change_type,
        old_value,
        new_value
    ) VALUES (
        v_new_template_id,
        p_user_id,
        'fork_template',
        jsonb_build_object('original_template_id', p_original_template_id),
        jsonb_build_object('new_template_id', v_new_template_id)
    );
    
    RETURN v_new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get forked templates for a user
CREATE OR REPLACE FUNCTION get_user_forked_templates(p_user_id UUID)
RETURNS TABLE (
    template_id UUID,
    title TEXT,
    description TEXT,
    goal_type TEXT,
    specific_goal_type TEXT,
    default_target_amount NUMERIC(20, 2),
    default_duration_days INT,
    is_recurring BOOLEAN,
    default_recurrence_pattern TEXT,
    forked_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gt.id,
        gt.title,
        gt.description,
        gt.goal_type,
        gt.specific_goal_type,
        gt.default_target_amount,
        gt.default_duration_days,
        gt.is_recurring,
        gt.default_recurrence_pattern,
        gh.changed_at AS forked_at
    FROM goal_templates gt
    JOIN goal_history gh ON gh.goal_id = gt.id
    WHERE gh.changed_by = p_user_id
      AND gh.change_type = 'fork_template'
    ORDER BY gh.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;