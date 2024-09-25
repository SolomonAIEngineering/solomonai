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
            http_response := public.send_email_notification(integration.config->>'email', payload);
        WHEN 'sms' THEN
            http_response := public.send_sms_notification(integration.config->>'phone_number', payload);
        WHEN 'push_notification' THEN
            http_response := public.send_push_notification(integration.config->>'device_token', payload);
        WHEN 'discord' THEN
            http_response := public.send_discord_notification(integration.config->>'webhook_url', payload);
        WHEN 'telegram' THEN
            http_response := public.send_telegram_notification(
                integration.config->>'bot_token', 
                integration.config->>'chat_id', 
                payload
            );
        WHEN 'microsoft_teams' THEN
            http_response := public.send_teams_notification(integration.config->>'webhook_url', payload);
        WHEN 'zapier' THEN
            http_response := public.trigger_zapier_webhook(integration.config->>'webhook_url', payload);
        WHEN 'ifttt' THEN
            http_response := public.trigger_ifttt_webhook(
                integration.config->>'webhook_key', 
                integration.config->>'event_name', 
                payload
            );
        ELSE
            RAISE EXCEPTION 'Unknown integration type: %', integration.type;
    END CASE;

    RETURN http_response;
END;
$$ LANGUAGE plpgsql;

-- Update the execute_account_rules function to use the new execute_rule_action signature
CREATE OR REPLACE FUNCTION public.execute_account_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    condition_met BOOLEAN;
    action_result JSONB;
BEGIN
    FOR rule IN SELECT * FROM public.account_rules WHERE account_id = NEW.bank_account_id AND is_active = true
    LOOP
        condition_met := public.evaluate_rule_condition(rule.condition, NEW);

        IF condition_met THEN
            action_result := public.execute_rule_action(rule.id, NEW);
            
            -- Log the rule execution
            INSERT INTO public.rule_execution_logs (rule_id, transaction_id, action_result)
            VALUES (rule.id, NEW.id, action_result);
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;