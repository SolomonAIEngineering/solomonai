-- Function to send Slack notifications
CREATE OR REPLACE FUNCTION public.send_slack_notification(webhook_url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT INTO result
        content,
        status_code,
        headers
    FROM
        net.http_post(
            url := webhook_url,
            body := payload::TEXT,
            headers := '{"Content-Type": "application/json"}'
        );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to invoke webhooks
CREATE OR REPLACE FUNCTION public.invoke_webhook(url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT INTO result
        content,
        status_code,
        headers
    FROM
        net.http_post(
            url := url,
            body := payload::TEXT,
            headers := '{"Content-Type": "application/json"}'
        );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to call an endpoint
CREATE OR REPLACE FUNCTION public.call_endpoint(url TEXT, method TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    CASE upper(method)
        WHEN 'GET' THEN
            SELECT INTO result
                content,
                status_code,
                headers
            FROM
                net.http_get(
                    url := url || '?' || array_to_string(array(SELECT key || '=' || value FROM jsonb_each_text(payload)), '&')
                );
        WHEN 'POST' THEN
            SELECT INTO result
                content,
                status_code,
                headers
            FROM
                net.http_post(
                    url := url,
                    body := payload::TEXT,
                    headers := '{"Content-Type": "application/json"}'
                );
        WHEN 'PUT' THEN
            SELECT INTO result
                content,
                status_code,
                headers
            FROM
                net.http_put(
                    url := url,
                    body := payload::TEXT,
                    headers := '{"Content-Type": "application/json"}'
                );
        ELSE
            RAISE EXCEPTION 'Unsupported HTTP method: %', method;
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to write to a queue (simulated with an HTTP POST request)
CREATE OR REPLACE FUNCTION public.write_to_queue(queue_url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- This is a simplified implementation. In a real-world scenario,
    -- you might use a specific queue service API or a different method
    -- to write to a queue. Here, we're simulating it with an HTTP POST.
    SELECT INTO result
        content,
        status_code,
        headers
    FROM
        net.http_post(
            url := queue_url,
            body := payload::TEXT,
            headers := '{"Content-Type": "application/json"}'
        );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to send email notifications using Resend
CREATE OR REPLACE FUNCTION public.send_email_notification(config JSONB, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    email_payload JSONB;
BEGIN
    -- Construct the email payload
    email_payload := jsonb_build_object(
        'from', config->>'from_email',
        'to', config->>'to_email',
        'subject', 'Transaction Alert',
        'html', format(
            '<p>A transaction matching your rule has occurred:</p><pre>%s</pre>',
            payload::text
        )
    );

    -- Send the email using Resend's API
    SELECT INTO result
        content,
        status_code,
        headers
    FROM
        net.http_post(
            url := 'https://api.resend.com/emails',
            body := email_payload::TEXT,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (config->>'api_key')
            )
        );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the execute_rule_action function to include email notifications
CREATE OR REPLACE FUNCTION public.execute_rule_action(rule_id UUID, transaction RECORD)
RETURNS JSONB AS $$
DECLARE
    rule RECORD;
    integration RECORD;
    action_type TEXT;
    action_details JSONB;
    http_response JSONB;
    payload JSONB;
BEGIN
    -- Fetch the rule and associated integration
    SELECT * INTO rule FROM public.account_rules WHERE id = rule_id;
    SELECT * INTO integration FROM public.integrations WHERE id = rule.integration_id;

    IF integration IS NULL THEN
        RAISE EXCEPTION 'No integration found for rule %', rule_id;
    END IF;

    action_type := rule.action->>'type';
    action_details := rule.action->'details';

    -- Prepare a generic payload
    payload := jsonb_build_object(
        'transaction_id', transaction.id,
        'amount', transaction.amount,
        'currency', transaction.currency,
        'date', transaction.date,
        'description', transaction.description
    );

    -- Add any action-specific details to the payload
    payload := payload || action_details;

    CASE integration.type
        WHEN 'slack' THEN
            http_response := public.send_slack_notification(integration.config->>'webhook_url', payload);
        WHEN 'webhook' THEN
            http_response := public.invoke_webhook(integration.config->>'url', payload);
        WHEN 'email' THEN
            http_response := public.send_email_notification(integration.config, payload);
        WHEN 'queue' THEN
            http_response := public.write_to_queue(integration.config->>'queue_url', payload);
        ELSE
            RAISE EXCEPTION 'Unknown integration type: %', integration.type;
    END CASE;

    RETURN http_response;
END;
$$ LANGUAGE plpgsql;

-- Create a table to log rule executions
CREATE TABLE public.rule_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES public.account_rules(id),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id),
    action_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_rule_execution_logs_rule_id ON public.rule_execution_logs(rule_id);
CREATE INDEX idx_rule_execution_logs_transaction_id ON public.rule_execution_logs(transaction_id);

GRANT ALL ON public.rule_execution_logs TO authenticated;

-- -- Add a comment to the integrations table with examples of different integration types
-- COMMENT ON TABLE public.integrations IS 'Stores information about downstream services or webhooks that can be notified when rules apply. 
-- Examples of integrations:

-- 1. Slack integration:
-- INSERT INTO public.integrations (team_id, name, type, config)
-- VALUES (
--     ''your-team-id-here'',
--     ''Team Slack Notification'',
--     ''slack'',
--     ''{"webhook_url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"}''
-- );

-- 2. Email integration using Resend:
-- INSERT INTO public.integrations (team_id, name, type, config)
-- VALUES (
--     ''your-team-id-here'',
--     ''Resend Email Notification'',
--     ''email'',
--     ''{"api_key": "re_123456789", "from_email": "alerts@yourdomain.com", "to_email": "recipient@example.com"}''
-- );

-- 3. Custom webhook integration:
-- INSERT INTO public.integrations (team_id, name, type, config)
-- VALUES (
--     ''your-team-id-here'',
--     ''Custom Webhook'',
--     ''webhook'',
--     ''{"url": "https://api.example.com/webhook"}''
-- );

-- 4. Queue integration:
-- INSERT INTO public.integrations (team_id, name, type, config)
-- VALUES (
--     ''your-team-id-here'',
--     ''Message Queue'',
--     ''queue'',
--     ''{"queue_url": "https://sqs.example.com/my-queue"}''
-- );';
--
-- -- Create an email integration
-- INSERT INTO public.integrations (team_id, name, type, config)
-- VALUES (
--     '123e4567-e89b-12d3-a456-426614174000', -- team_id
--     'Transaction Alert Email',
--     'email',
--     '{"api_key": "re_123456789", "from_email": "alerts@yourdomain.com", "to_email": "recipient@example.com"}'
-- );

-- -- Create a rule using the email integration
-- INSERT INTO public.account_rules (team_id, account_id, name, description, condition, action, integration_id)
-- VALUES (
--     '123e4567-e89b-12d3-a456-426614174000', -- team_id
--     '123e4567-e89b-12d3-a456-426614174001', -- account_id
--     'High Expense Email Alert',
--     'Send an email when an expense over $1000 occurs',
--     '{"operator": "expense_over", "value": 1000}',
--     '{"type": "notify", "details": {"custom_message": "A high expense has occurred!"}}',
--     (SELECT id FROM public.integrations WHERE name = 'Transaction Alert Email' AND team_id = '123e4567-e89b-12d3-a456-426614174000')
-- );