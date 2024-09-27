-- Create goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL,
    specific_goal_type TEXT CHECK (specific_goal_type IN ('revenue', 'expense_reduction', 'profit_margin', 'cash_flow', 'savings_investment', 'debt_repayment')),
    target_amount NUMERIC(20, 2) NOT NULL,
    current_amount NUMERIC(20, 2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern TEXT,
    parent_goal_id UUID REFERENCES goals(id),
    health_score NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for status
ALTER TABLE goals
ADD CONSTRAINT check_goal_status
CHECK (status IN ('active', 'completed', 'failed', 'on_hold'));

-- Create goal_milestones table
CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(20, 2) NOT NULL,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_tasks table
CREATE TABLE goal_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority INT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_collaborators table
CREATE TABLE goal_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (goal_id, user_id)
);

-- Create goal_notifications table
CREATE TABLE goal_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_achievements table
CREATE TABLE goal_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_history table for tracking changes
CREATE TABLE goal_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    change_type TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_specific_goal_type ON goals(specific_goal_type);
CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
CREATE INDEX idx_goal_tasks_goal_id ON goal_tasks(goal_id);
CREATE INDEX idx_goal_collaborators_goal_id ON goal_collaborators(goal_id);
CREATE INDEX idx_goal_collaborators_user_id ON goal_collaborators(user_id);
CREATE INDEX idx_goal_notifications_user_id ON goal_notifications(user_id);
CREATE INDEX idx_goal_achievements_user_id ON goal_achievements(user_id);
CREATE INDEX idx_goal_history_goal_id ON goal_history(goal_id);

-- Create goal_templates table
CREATE TABLE goal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL,
    specific_goal_type TEXT CHECK (specific_goal_type IN ('revenue', 'expense_reduction', 'profit_margin', 'cash_flow', 'savings_investment', 'debt_repayment')),
    default_target_amount NUMERIC(20, 2),
    default_duration_days INT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    default_recurrence_pattern TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_milestone_templates table
CREATE TABLE goal_milestone_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_template_id UUID REFERENCES goal_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_percentage NUMERIC(5, 2) NOT NULL,
    due_day INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_goal_templates_goal_type ON goal_templates(goal_type);
CREATE INDEX idx_goal_templates_specific_goal_type ON goal_templates(specific_goal_type);
CREATE INDEX idx_goal_milestone_templates_goal_template_id ON goal_milestone_templates(goal_template_id);