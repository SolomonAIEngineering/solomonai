-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the account_rules table
CREATE TABLE public.account_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    cooldown_period INTERVAL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to the account_rules table
ALTER TABLE public.account_rules ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.account_rules ADD COLUMN parent_rule_id UUID REFERENCES public.account_rules(id);
ALTER TABLE public.account_rules ADD COLUMN rule_type TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE public.account_rules ADD COLUMN tags TEXT[];
ALTER TABLE public.account_rules ADD COLUMN metadata JSONB;
ALTER TABLE public.account_rules ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.account_rules ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Create a new index for efficient querying of active rules
CREATE INDEX idx_account_rules_active_date ON public.account_rules (is_active, start_date, end_date);

-- Create a function to check if a rule is currently active
CREATE OR REPLACE FUNCTION is_rule_active(rule_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_active BOOLEAN;
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT 
        ar.is_active,
        ar.start_date,
        ar.end_date
    INTO
        is_active,
        start_date,
        end_date
    FROM 
        public.account_rules ar
    WHERE 
        ar.id = rule_id;

    RETURN is_active 
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Create a view for active rules
CREATE VIEW public.active_account_rules AS
SELECT *
FROM public.account_rules
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
  AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP);

-- Grant necessary permissions
GRANT SELECT ON public.active_account_rules TO authenticated;

-- Add indexes
CREATE INDEX idx_account_rules_team_id ON public.account_rules(team_id);
CREATE INDEX idx_account_rules_account_id ON public.account_rules(account_id);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_account_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_account_rule_updated_at
BEFORE UPDATE ON public.account_rules
FOR EACH ROW
EXECUTE FUNCTION update_account_rule_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.account_rules TO authenticated;

-- Create the rule_templates table
CREATE TABLE public.rule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    condition_template JSONB NOT NULL,
    action_template JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add a column to account_rules to reference the template
ALTER TABLE public.account_rules ADD COLUMN template_id UUID REFERENCES public.rule_templates(id);

-- Create an index on the template_id column
CREATE INDEX idx_account_rules_template_id ON public.account_rules(template_id);

-- Create a function to automatically update the updated_at column for rule_templates
CREATE OR REPLACE FUNCTION update_rule_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function for rule_templates
CREATE TRIGGER update_rule_template_updated_at
BEFORE UPDATE ON public.rule_templates
FOR EACH ROW
EXECUTE FUNCTION update_rule_template_updated_at();

-- Grant necessary permissions for rule_templates
GRANT ALL ON public.rule_templates TO authenticated;

-- Create a function to create a rule from a template
CREATE OR REPLACE FUNCTION create_rule_from_template(
    p_team_id UUID,
    p_account_id UUID,
    p_template_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_condition_params JSONB DEFAULT '{}',
    p_action_params JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_template rule_templates;
    v_condition JSONB;
    v_action JSONB;
    v_new_rule_id UUID;
BEGIN
    -- Fetch the template
    SELECT * INTO v_template FROM public.rule_templates WHERE id = p_template_id;
    
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Apply parameters to condition and action templates
    v_condition := v_template.condition_template || p_condition_params;
    v_action := v_template.action_template || p_action_params;
    
    -- Create the new rule
    INSERT INTO public.account_rules (
        team_id, account_id, name, description, condition, action, template_id
    ) VALUES (
        p_team_id, p_account_id, p_name, COALESCE(p_description, v_template.description),
        v_condition, v_action, p_template_id
    ) RETURNING id INTO v_new_rule_id;
    
    RETURN v_new_rule_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_rule_from_template TO authenticated;

-- Insert default rule templates with thresholds
INSERT INTO public.rule_templates (name, description, condition_template, action_template, metadata) VALUES
(
    'Large Transaction Alert',
    'Notify when a transaction exceeds a specified amount',
    '{"type": "transaction_amount", "operator": ">", "value": "1000"}',
    '{"type": "notify", "method": "email", "recipient": "{{email}}", "message": "Large transaction of {{amount}} detected"}',
    '{"category": "transaction_monitoring", "complexity": "simple", "default_threshold": "1000"}'
),
(
    'Recurring Payment Detection',
    'Identify recurring payments of a specific amount',
    '{"type": "recurring_transaction", "amount": "{{amount}}", "frequency": "{{frequency}}"}',
    '{"type": "tag_transaction", "tag": "recurring_payment"}',
    '{"category": "transaction_categorization", "complexity": "medium"}'
),
(
    'Suspicious Activity Alert',
    'Notify of multiple high-value transactions in a short period',
    '{"type": "multiple_transactions", "amount_threshold": "500", "count_threshold": "3", "time_period": "24 hours"}',
    '{"type": "notify", "method": "sms", "recipient": "{{phone}}", "message": "Suspicious activity detected on your account"}',
    '{"category": "fraud_detection", "complexity": "high", "default_amount_threshold": "500", "default_count_threshold": "3", "default_time_period": "24 hours"}'
),
(
    'Low Balance Warning',
    'Alert when account balance falls below a specified threshold',
    '{"type": "account_balance", "operator": "<", "value": "100"}',
    '{"type": "notify", "method": "push", "message": "Your account balance is low"}',
    '{"category": "account_management", "complexity": "simple", "default_threshold": "100"}'
),
(
    'Overdraft Prevention',
    'Transfer funds from savings when checking account is low',
    '{"type": "account_balance", "operator": "<", "value": "50"}',
    '{"type": "transfer", "from_account": "{{savings_id}}", "to_account": "{{checking_id}}", "amount": "100"}',
    '{"category": "account_management", "complexity": "medium", "default_threshold": "50", "default_transfer_amount": "100"}'
),
(
    'Merchant Category Code (MCC) Tracking',
    'Tag transactions based on their MCC',
    '{"type": "transaction_mcc", "code": "{{mcc_code}}"}',
    '{"type": "tag_transaction", "tag": "{{category_tag}}"}',
    '{"category": "transaction_categorization", "complexity": "medium"}'
),
(
    'Foreign Transaction Alert',
    'Notify of transactions occurring in foreign countries',
    '{"type": "transaction_location", "country": "not_home_country"}',
    '{"type": "notify", "method": "email", "recipient": "{{email}}", "message": "Foreign transaction detected in {{country}}"}',
    '{"category": "fraud_detection", "complexity": "medium"}'
),
(
    'Inactive Account Alert',
    'Notify when an account has been inactive for a specified period',
    '{"type": "account_inactivity", "days": "90"}',
    '{"type": "notify", "method": "email", "recipient": "{{email}}", "message": "Your account has been inactive for {{inactive_days}} days"}',
    '{"category": "account_management", "complexity": "simple", "default_inactive_days": "90"}'
),
(
    'High Frequency Transaction Alert',
    'Notify when there are too many transactions in a short period',
    '{"type": "transaction_frequency", "count": "10", "time_period": "1 hour"}',
    '{"type": "notify", "method": "email", "recipient": "{{email}}", "message": "High frequency of transactions detected: {{count}} in {{period}}"}',
    '{"category": "transaction_monitoring", "complexity": "medium", "default_count": "10", "default_time_period": "1 hour"}'
),
(
    'Large Cash Withdrawal Alert',
    'Notify when a large cash withdrawal occurs',
    '{"type": "transaction_type", "transaction_type": "cash_withdrawal", "amount": ">", "value": "500"}',
    '{"type": "notify", "method": "sms", "recipient": "{{phone}}", "message": "Large cash withdrawal of {{amount}} detected"}',
    '{"category": "fraud_detection", "complexity": "simple", "default_threshold": "500"}'
);