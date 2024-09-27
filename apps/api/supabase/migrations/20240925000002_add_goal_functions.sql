CREATE OR REPLACE FUNCTION get_user_goals(p_user_id UUID)
RETURNS TABLE (
    goal_id UUID,
    title TEXT,
    goal_type TEXT,
    target_amount NUMERIC(20, 2),
    current_amount NUMERIC(20, 2),
    progress_percentage NUMERIC(5, 2),
    start_date DATE,
    end_date DATE,
    status TEXT,
    health_score NUMERIC(5, 2),
    is_recurring BOOLEAN
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
        g.status,
        g.health_score,
        g.is_recurring
    FROM goals g
    WHERE g.user_id = p_user_id
    ORDER BY g.end_date, g.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get goal milestones
CREATE OR REPLACE FUNCTION get_goal_milestones(p_goal_id UUID)
RETURNS TABLE (
    milestone_id UUID,
    title TEXT,
    target_amount NUMERIC(20, 2),
    due_date DATE,
    is_completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.target_amount,
        m.due_date,
        m.is_completed
    FROM goal_milestones m
    WHERE m.goal_id = p_goal_id
    ORDER BY m.due_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update milestone status
CREATE OR REPLACE FUNCTION update_milestone_status(
    p_milestone_id UUID,
    p_is_completed BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE goal_milestones
    SET is_completed = p_is_completed,
        updated_at = NOW()
    WHERE id = p_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get goal collaborators
CREATE OR REPLACE FUNCTION get_goal_collaborators(p_goal_id UUID)
RETURNS TABLE (
    collaborator_id UUID,
    user_id UUID,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.role
    FROM goal_collaborators c
    WHERE c.goal_id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's achievements
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
    achievement_id UUID,
    achievement_type TEXT,
    description TEXT,
    earned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.achievement_type,
        a.description,
        a.earned_at
    FROM goal_achievements a
    WHERE a.user_id = p_user_id
    ORDER BY a.earned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task status
CREATE OR REPLACE FUNCTION update_task_status(
    p_task_id UUID,
    p_is_completed BOOLEAN
) RETURNS VOID AS $$
BEGIN
    UPDATE goal_tasks
    SET is_completed = p_is_completed,
        updated_at = NOW()
    WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get goal notifications
CREATE OR REPLACE FUNCTION get_user_goal_notifications(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
    notification_id UUID,
    goal_id UUID,
    message TEXT,
    type TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.goal_id,
        n.message,
        n.type,
        n.is_read,
        n.created_at
    FROM goal_notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE goal_notifications
    SET is_read = TRUE
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get goal history
CREATE OR REPLACE FUNCTION get_goal_history(p_goal_id UUID)
RETURNS TABLE (
    history_id UUID,
    changed_by UUID,
    change_type TEXT,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.changed_by,
        h.change_type,
        h.old_value,
        h.new_value,
        h.changed_at
    FROM goal_history h
    WHERE h.goal_id = p_goal_id
    ORDER BY h.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;