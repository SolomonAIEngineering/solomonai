-- Add integration_id column to account_rules
ALTER TABLE public.account_rules
ADD COLUMN integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL;

-- Create an index for the new column
CREATE INDEX idx_account_rules_integration_id ON public.account_rules(integration_id);

-- Update the action column to store additional action-specific details
ALTER TABLE public.account_rules
ALTER COLUMN action TYPE JSONB USING jsonb_build_object('type', action->>'type', 'details', action->'details');

-- Add new columns for rule management
ALTER TABLE public.account_rules
ADD COLUMN priority INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN last_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trigger_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX idx_account_rules_priority ON public.account_rules(priority);
CREATE INDEX idx_account_rules_is_active ON public.account_rules(is_active);
CREATE INDEX idx_account_rules_last_triggered_at ON public.account_rules(last_triggered_at);

-- Add comments for clarity
COMMENT ON COLUMN public.account_rules.integration_id IS 'References the integration to be used when the rule conditions are met';
COMMENT ON COLUMN public.account_rules.action IS 'Stores the action type and any additional action-specific details';
COMMENT ON COLUMN public.account_rules.priority IS 'Determines the order in which rules are evaluated (higher numbers have higher priority)';
COMMENT ON COLUMN public.account_rules.is_active IS 'Indicates whether the rule is currently active and should be evaluated';
COMMENT ON COLUMN public.account_rules.last_triggered_at IS 'Timestamp of when the rule was last triggered';
COMMENT ON COLUMN public.account_rules.trigger_count IS 'Number of times the rule has been triggered';

-- Create a function to update last_triggered_at and trigger_count
CREATE OR REPLACE FUNCTION update_rule_trigger_info()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_triggered_at = NOW();
    NEW.trigger_count = NEW.trigger_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a rule is triggered
CREATE TRIGGER update_rule_trigger_info
BEFORE UPDATE OF last_triggered_at ON public.account_rules
FOR EACH ROW
WHEN (OLD.last_triggered_at IS DISTINCT FROM NEW.last_triggered_at)
EXECUTE FUNCTION update_rule_trigger_info();

-- Create a function to validate rule configuration
CREATE OR REPLACE FUNCTION validate_account_rule()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure that the action type is valid
    IF NOT (NEW.action->>'type' IN ('notify', 'transfer', 'categorize')) THEN
        RAISE EXCEPTION 'Invalid action type: %', NEW.action->>'type';
    END IF;

    -- Validate action details based on the action type
    CASE NEW.action->>'type'
        WHEN 'notify' THEN
            IF NOT (NEW.action->'details' ? 'message') THEN
                RAISE EXCEPTION 'Notify action requires a message';
            END IF;
        WHEN 'transfer' THEN
            IF NOT (NEW.action->'details' ? 'to_account' AND NEW.action->'details' ? 'amount') THEN
                RAISE EXCEPTION 'Transfer action requires to_account and amount';
            END IF;
        WHEN 'categorize' THEN
            IF NOT (NEW.action->'details' ? 'category') THEN
                RAISE EXCEPTION 'Categorize action requires a category';
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate rule configuration before insert or update
CREATE TRIGGER validate_account_rule
BEFORE INSERT OR UPDATE ON public.account_rules
FOR EACH ROW
EXECUTE FUNCTION validate_account_rule();