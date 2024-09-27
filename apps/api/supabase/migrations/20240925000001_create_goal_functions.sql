-- Function to create a new goal
CREATE OR REPLACE FUNCTION create_goal(
    p_user_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_goal_type TEXT,
    p_target_amount NUMERIC(20, 2),
    p_start_date DATE,
    p_end_date DATE,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurrence_pattern TEXT DEFAULT NULL,
    p_parent_goal_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_goal_id UUID;
BEGIN
    INSERT INTO goals (user_id, title, description, goal_type, target_amount, start_date, end_date, is_recurring, recurrence_pattern, parent_goal_id)
    VALUES (p_user_id, p_title, p_description, p_goal_type, p_target_amount, p_start_date, p_end_date, p_is_recurring, p_recurrence_pattern, p_parent_goal_id)
    RETURNING id INTO v_goal_id;
    
    -- Log the creation in goal_history
    INSERT INTO goal_history (goal_id, changed_by, change_type, new_value)
    VALUES (v_goal_id, p_user_id, 'create', to_jsonb(goals.*))
    FROM goals WHERE id = v_goal_id;
    
    RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress(
    p_goal_id UUID,
    p_current_amount NUMERIC(20, 2)
) RETURNS VOID AS $$
BEGIN
    UPDATE goals
    SET current_amount = p_current_amount,
        updated_at = NOW()
    WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a milestone to a goal
CREATE OR REPLACE FUNCTION add_goal_milestone(
    p_goal_id UUID,
    p_title TEXT,
    p_target_amount NUMERIC(20, 2),
    p_due_date DATE
) RETURNS UUID AS $$
DECLARE
    v_milestone_id UUID;
BEGIN
    INSERT INTO goal_milestones (goal_id, title, target_amount, due_date)
    VALUES (p_goal_id, p_title, p_target_amount, p_due_date)
    RETURNING id INTO v_milestone_id;
    
    RETURN v_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a task to a goal
CREATE OR REPLACE FUNCTION add_goal_task(
    p_goal_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_due_date DATE,
    p_priority INT
) RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
BEGIN
    INSERT INTO goal_tasks (goal_id, title, description, due_date, priority)
    VALUES (p_goal_id, p_title, p_description, p_due_date, p_priority)
    RETURNING id INTO v_task_id;
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a collaborator to a goal
CREATE OR REPLACE FUNCTION add_goal_collaborator(
    p_goal_id UUID,
    p_user_id UUID,
    p_role TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO goal_collaborators (goal_id, user_id, role)
    VALUES (p_goal_id, p_user_id, p_role)
    ON CONFLICT (goal_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a goal notification
CREATE OR REPLACE FUNCTION create_goal_notification(
    p_goal_id UUID,
    p_user_id UUID,
    p_message TEXT,
    p_type TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO goal_notifications (goal_id, user_id, message, type)
    VALUES (p_goal_id, p_user_id, p_message, p_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award an achievement
CREATE OR REPLACE FUNCTION award_achievement(
    p_user_id UUID,
    p_achievement_type TEXT,
    p_description TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO goal_achievements (user_id, achievement_type, description)
    VALUES (p_user_id, p_achievement_type, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update goal status
CREATE OR REPLACE FUNCTION update_goal_status(
    p_goal_id UUID,
    p_status TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    SELECT status INTO v_old_status FROM goals WHERE id = p_goal_id;
    
    UPDATE goals
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_goal_id;
    
    -- Log the status change in goal_history
    INSERT INTO goal_history (goal_id, changed_by, change_type, old_value, new_value)
    VALUES (p_goal_id, p_user_id, 'status_change', jsonb_build_object('status', v_old_status), jsonb_build_object('status', p_status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clone recurring goals
CREATE OR REPLACE FUNCTION clone_recurring_goal(p_goal_id UUID) RETURNS UUID AS $$
DECLARE
    v_new_goal_id UUID;
    v_old_goal goals%ROWTYPE;
BEGIN
    SELECT * INTO v_old_goal FROM goals WHERE id = p_goal_id;
    
    IF v_old_goal.is_recurring THEN
        INSERT INTO goals (
            user_id, title, description, goal_type, target_amount, 
            start_date, end_date, is_recurring, recurrence_pattern, parent_goal_id
        )
        VALUES (
            v_old_goal.user_id, v_old_goal.title, v_old_goal.description, 
            v_old_goal.goal_type, v_old_goal.target_amount,
            v_old_goal.end_date + INTERVAL '1 day', 
            v_old_goal.end_date + (v_old_goal.end_date - v_old_goal.start_date) + INTERVAL '1 day',
            v_old_goal.is_recurring, v_old_goal.recurrence_pattern, v_old_goal.id
        )
        RETURNING id INTO v_new_goal_id;
        
        -- Clone milestones
        INSERT INTO goal_milestones (goal_id, title, target_amount, due_date)
        SELECT v_new_goal_id, title, target_amount, 
               due_date + (v_old_goal.end_date - v_old_goal.start_date) + INTERVAL '1 day'
        FROM goal_milestones
        WHERE goal_id = p_goal_id;
        
        -- Clone tasks
        INSERT INTO goal_tasks (goal_id, title, description, due_date, priority)
        SELECT v_new_goal_id, title, description, 
               due_date + (v_old_goal.end_date - v_old_goal.start_date) + INTERVAL '1 day',
               priority
        FROM goal_tasks
        WHERE goal_id = p_goal_id;
        
        RETURN v_new_goal_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate goal health score
CREATE OR REPLACE FUNCTION calculate_goal_health(p_goal_id UUID) RETURNS NUMERIC(5, 2) AS $$
DECLARE
    v_health_score NUMERIC(5, 2);
    v_goal goals%ROWTYPE;
    v_days_passed INT;
    v_total_days INT;
    v_expected_progress NUMERIC(5, 2);
    v_actual_progress NUMERIC(5, 2);
BEGIN
    SELECT * INTO v_goal FROM goals WHERE id = p_goal_id;
    
    v_days_passed := CURRENT_DATE - v_goal.start_date;
    v_total_days := v_goal.end_date - v_goal.start_date;
    
    IF v_total_days = 0 THEN
        RETURN 100; -- Avoid division by zero
    END IF;
    
    v_expected_progress := (v_days_passed::NUMERIC / v_total_days::NUMERIC) * 100;
    v_actual_progress := (v_goal.current_amount / v_goal.target_amount) * 100;
    
    v_health_score := 100 - (v_expected_progress - v_actual_progress);
    
    -- Ensure the health score is between 0 and 100
    v_health_score := GREATEST(0, LEAST(100, v_health_score));
    
    -- Update the goal's health score
    UPDATE goals SET health_score = v_health_score WHERE id = p_goal_id;
    
    RETURN v_health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance get_goal_progress function
CREATE OR REPLACE FUNCTION get_goal_progress(p_goal_id UUID)
RETURNS TABLE (
    goal_id UUID,
    title TEXT,
    goal_type TEXT,
    target_amount NUMERIC(20, 2),
    current_amount NUMERIC(20, 2),
    progress_percentage NUMERIC(5, 2),
    start_date DATE,
    end_date DATE,
    days_remaining INT,
    status TEXT,
    health_score NUMERIC(5, 2),
    is_recurring BOOLEAN,
    recurrence_pattern TEXT,
    parent_goal_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.goal_type,
        g.target_amount,
        g.current_amount,
        CASE 
            WHEN g.target_amount = 0 THEN 0
            ELSE (g.current_amount / g.target_amount) * 100
        END AS progress_percentage,
        g.start_date,
        g.end_date,
        (g.end_date - CURRENT_DATE)::INT AS days_remaining,
        g.status,
        g.health_score,
        g.is_recurring,
        g.recurrence_pattern,
        g.parent_goal_id
    FROM goals g
    WHERE g.id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming tasks for a user
CREATE OR REPLACE FUNCTION get_upcoming_tasks(p_user_id UUID, p_days INT)
RETURNS TABLE (
    task_id UUID,
    goal_id UUID,
    goal_title TEXT,
    task_title TEXT,
    due_date DATE,
    priority INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS task_id,
        t.goal_id,
        g.title AS goal_title,
        t.title AS task_title,
        t.due_date,
        t.priority
    FROM goal_tasks t
    JOIN goals g ON t.goal_id = g.id
    WHERE g.user_id = p_user_id
      AND t.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days * INTERVAL '1 day')
      AND t.is_completed = FALSE
    ORDER BY t.due_date, t.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a goal from a template
CREATE OR REPLACE FUNCTION create_goal_from_template(
    p_user_id UUID,
    p_template_id UUID,
    p_target_amount NUMERIC(20, 2),
    p_start_date DATE,
    p_end_date DATE
) RETURNS UUID AS $$
DECLARE
    v_goal_id UUID;
    v_template goal_templates%ROWTYPE;
BEGIN
    -- Fetch the template
    SELECT * INTO v_template FROM goal_templates WHERE id = p_template_id;
    
    -- Create the goal
    INSERT INTO goals (
        user_id, title, description, goal_type, specific_goal_type, 
        target_amount, start_date, end_date, is_recurring, recurrence_pattern
    )
    VALUES (
        p_user_id, v_template.title, v_template.description, v_template.goal_type, v_template.specific_goal_type,
        p_target_amount, p_start_date, p_end_date, v_template.is_recurring, v_template.default_recurrence_pattern
    )
    RETURNING id INTO v_goal_id;
    
    -- Create milestones from template
    INSERT INTO goal_milestones (goal_id, title, description, target_amount, due_date)
    SELECT 
        v_goal_id,
        gmt.title,
        gmt.description,
        (gmt.target_percentage / 100) * p_target_amount,
        p_start_date + (gmt.due_day * (p_end_date - p_start_date)::INT / 100)
    FROM goal_milestone_templates gmt
    WHERE gmt.goal_template_id = p_template_id;
    
    -- Log the creation in goal_history
    INSERT INTO goal_history (goal_id, changed_by, change_type, new_value)
    VALUES (v_goal_id, p_user_id, 'create_from_template', jsonb_build_object('template_id', p_template_id));
    
    RETURN v_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available goal templates
CREATE OR REPLACE FUNCTION get_goal_templates()
RETURNS TABLE (
    template_id UUID,
    title TEXT,
    description TEXT,
    goal_type TEXT,
    specific_goal_type TEXT,
    default_target_amount NUMERIC(20, 2),
    default_duration_days INT,
    is_recurring BOOLEAN,
    default_recurrence_pattern TEXT
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
        gt.default_recurrence_pattern
    FROM goal_templates gt
    ORDER BY gt.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get milestone templates for a goal template
CREATE OR REPLACE FUNCTION get_goal_milestone_templates(p_template_id UUID)
RETURNS TABLE (
    milestone_template_id UUID,
    title TEXT,
    description TEXT,
    target_percentage NUMERIC(5, 2),
    due_day INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gmt.id,
        gmt.title,
        gmt.description,
        gmt.target_percentage,
        gmt.due_day
    FROM goal_milestone_templates gmt
    WHERE gmt.goal_template_id = p_template_id
    ORDER BY gmt.due_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;