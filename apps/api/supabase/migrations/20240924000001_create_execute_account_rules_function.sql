-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS execute_account_rules_trigger ON public.transactions;

-- Modify the execute_account_rules function to handle batches
CREATE OR REPLACE FUNCTION public.execute_account_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    transaction RECORD;
    condition_met BOOLEAN;
    action_result JSONB;
BEGIN
    -- Loop through all transactions in the batch
    -- TG_ARGV is an array of transaction IDs passed to this function
    FOR transaction IN SELECT * FROM public.transactions WHERE id = ANY(TG_ARGV::uuid[])
    LOOP
        -- For each transaction, check all applicable rules
        -- We only consider active rules for the specific bank account
        FOR rule IN SELECT * FROM public.account_rules WHERE account_id = transaction.bank_account_id AND is_active = true
        LOOP
            -- Evaluate the rule condition for the current transaction
            condition_met := public.evaluate_rule_condition(rule.condition, transaction);

            IF condition_met THEN
                -- If the condition is met, execute the rule action
                action_result := public.execute_rule_action(rule.action, transaction);
                
                -- Log the rule execution for auditing and analysis
                INSERT INTO public.rule_execution_logs (rule_id, transaction_id, action_result)
                VALUES (rule.id, transaction.id, action_result);
            END IF;
        END LOOP;
    END LOOP;

    RETURN NULL; -- Trigger functions must return NULL or a record
END;
$$ LANGUAGE plpgsql;

-- Create a function to collect transaction IDs for batch processing
CREATE OR REPLACE FUNCTION public.collect_transaction_ids()
RETURNS TRIGGER AS $$
DECLARE
    batch_size INTEGER := 100; -- Adjust this value based on your needs and system capabilities
BEGIN
    -- Create a temporary table to collect transaction IDs if it doesn't exist
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_transaction_batch (
        id UUID
    ) ON COMMIT DROP; -- This table will be automatically dropped at the end of the transaction

    -- Add the current transaction ID to the temporary table
    INSERT INTO temp_transaction_batch (id) VALUES (NEW.id);

    -- If we've reached the batch size, execute rules and clear the temp table
    IF (SELECT COUNT(*) FROM temp_transaction_batch) >= batch_size THEN
        -- Execute rules for the collected batch of transactions
        PERFORM public.execute_account_rules(ARRAY(SELECT id FROM temp_transaction_batch));
        -- Clear the temporary table for the next batch
        DELETE FROM temp_transaction_batch;
    END IF;

    RETURN NEW; -- Return the new row to continue the INSERT operation
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to collect transaction IDs after each insert
CREATE TRIGGER collect_transaction_ids_trigger
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.collect_transaction_ids();

-- Create a function to execute rules for remaining transactions on commit
CREATE OR REPLACE FUNCTION public.execute_remaining_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there are any remaining transactions in the temporary table
    IF EXISTS (SELECT 1 FROM temp_transaction_batch LIMIT 1) THEN
        -- Execute rules for the remaining transactions
        PERFORM public.execute_account_rules(ARRAY(SELECT id FROM temp_transaction_batch));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute rules for remaining transactions on commit
-- This ensures that all transactions are processed, even if the batch size wasn't reached
CREATE CONSTRAINT TRIGGER execute_remaining_rules_trigger
AFTER INSERT ON public.transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH STATEMENT
EXECUTE FUNCTION public.execute_remaining_rules();

-- Function to evaluate rule conditions
CREATE OR REPLACE FUNCTION public.evaluate_rule_condition(condition JSONB, transaction RECORD)
RETURNS BOOLEAN AS $$
DECLARE
    operator TEXT;
    result BOOLEAN;
BEGIN
    operator := condition->>'operator';

    CASE operator
        WHEN 'and' THEN
            -- Evaluate all conditions, return false if any condition is false
            result := TRUE;
            FOR i IN 0..jsonb_array_length(condition->'conditions') - 1 LOOP
                result := result AND public.evaluate_rule_condition(condition->'conditions'->i, transaction);
                IF NOT result THEN
                    RETURN FALSE;
                END IF;
            END LOOP;
            RETURN result;
        WHEN 'or' THEN
            -- Evaluate conditions until one is true, or all are false
            result := FALSE;
            FOR i IN 0..jsonb_array_length(condition->'conditions') - 1 LOOP
                result := result OR public.evaluate_rule_condition(condition->'conditions'->i, transaction);
                IF result THEN
                    RETURN TRUE;
                END IF;
            END LOOP;
            RETURN result;
        WHEN 'not' THEN
            -- Negate the result of the inner condition
            RETURN NOT public.evaluate_rule_condition(condition->'condition', transaction);
        WHEN 'expense_over' THEN
            -- Check if the transaction is an expense over a certain amount
            RETURN transaction.amount < 0 AND ABS(transaction.amount) > (condition->>'value')::NUMERIC;
        WHEN 'income_over' THEN
            -- Check if the transaction is income over a certain amount
            RETURN transaction.amount > 0 AND transaction.amount > (condition->>'value')::NUMERIC;
        WHEN 'category_is' THEN
            -- Check if the transaction belongs to a specific category
            RETURN transaction.category_slug = condition->>'value';
        WHEN 'merchant_contains' THEN
            -- Check if the merchant name contains a specific string (case-insensitive)
            RETURN transaction.merchant_name ILIKE '%' || (condition->>'value') || '%';
        WHEN 'description_contains' THEN
            -- Check if the transaction description contains a specific string (case-insensitive)
            RETURN transaction.description ILIKE '%' || (condition->>'value') || '%';
        WHEN 'date_is' THEN
            -- Check if the transaction occurred on a specific date
            RETURN transaction.date::DATE = (condition->>'value')::DATE;
        WHEN 'date_after' THEN
            -- Check if the transaction occurred after a specific date
            RETURN transaction.date::DATE > (condition->>'value')::DATE;
        WHEN 'date_before' THEN
            -- Check if the transaction occurred before a specific date
            RETURN transaction.date::DATE < (condition->>'value')::DATE;
        ELSE
            -- Raise an exception for unknown operators
            RAISE EXCEPTION 'Unknown condition operator: %', operator;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to execute rule actions
CREATE OR REPLACE FUNCTION public.execute_rule_action(action JSONB, transaction RECORD)
RETURNS JSONB AS $$
DECLARE
    action_type TEXT;
    action_details JSONB;
    http_response JSONB;
    payload JSONB;
BEGIN
    action_type := action->>'type';
    action_details := action->'details';

    -- Prepare a generic payload with transaction details
    payload := jsonb_build_object(
        'transaction_id', transaction.id,
        'amount', transaction.amount,
        'currency', transaction.currency,
        'date', transaction.date,
        'description', transaction.description
    );

    -- Execute the appropriate action based on the action type
    CASE action_type
        WHEN 'notify_slack' THEN
            -- Send a notification to Slack
            http_response := public.send_slack_notification(action_details->>'webhook_url', payload);
        WHEN 'invoke_webhook' THEN
            -- Invoke a generic webhook
            http_response := public.invoke_webhook(action_details->>'url', payload);
        WHEN 'call_endpoint' THEN
            -- Call a specific endpoint with a specified HTTP method
            http_response := public.call_endpoint(action_details->>'url', action_details->>'method', payload);
        WHEN 'write_to_queue' THEN
            -- Write the payload to a message queue
            http_response := public.write_to_queue(action_details->>'queue_url', payload);
        -- Add more action types as needed
        ELSE
            -- Raise an exception for unknown action types
            RAISE EXCEPTION 'Unknown action type: %', action_type;
    END CASE;

    RETURN http_response;
END;
$$ LANGUAGE plpgsql;

-- Note: The following functions (send_slack_notification, invoke_webhook, call_endpoint, write_to_queue)
-- should be implemented separately to handle the actual HTTP requests or queue operations.

