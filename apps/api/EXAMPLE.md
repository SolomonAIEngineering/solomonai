-- Example usage:
COMMENT ON FUNCTION public.evaluate_rule_condition(JSONB, RECORD) IS '
This function evaluates complex rule conditions. Here are some examples of how to use it:

1. Complex rule combining multiple conditions:
{
    "operator": "and",
    "conditions": [
        {
            "operator": "expense_over",
            "value": 100
        },
        {
            "operator": "or",
            "conditions": [
                {
                    "operator": "category_is",
                    "value": "dining"
                },
                {
                    "operator": "category_is",
                    "value": "entertainment"
                }
            ]
        }
    ]
}
This rule checks for expenses over $100 in either the dining or entertainment categories.

2. Rule with date range and merchant name condition:
{
    "operator": "and",
    "conditions": [
        {
            "operator": "merchant_contains",
            "value": "Netflix"
        },
        {
            "operator": "date_after",
            "value": "2024-01-01"
        },
        {
            "operator": "date_before",
            "value": "2024-12-31"
        }
    ]
}
This rule checks for transactions with a merchant name containing "Netflix" within the year 2024.

3. Negation example:
{
    "operator": "and",
    "conditions": [
        {
            "operator": "expense_over",
            "value": 50
        },
        {
            "operator": "not",
            "condition": {
                "operator": "category_is",
                "value": "groceries"
            }
        }
    ]
}
This rule checks for expenses over $50 that are not in the groceries category.

To use these conditions, insert them into the `condition` column of the `account_rules` table along with the desired action.
';

COMMENT ON FUNCTION public.execute_rule_action(JSONB, RECORD) IS '
This function executes actions based on the rule definition. Here are some examples of how to define actions:

1. Notify Slack:
{
    "type": "notify_slack",
    "details": {
        "webhook_url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
    }
}

2. Invoke a webhook:
{
    "type": "invoke_webhook",
    "details": {
        "url": "https://api.example.com/webhook"
    }
}

3. Call an endpoint:
{
    "type": "call_endpoint",
    "details": {
        "url": "https://api.example.com/custom-endpoint",
        "method": "POST"
    }
}

4. Write to a queue:
{
    "type": "write_to_queue",
    "details": {
        "queue_url": "https://sqs.example.com/my-queue"
    }
}

To use these actions, insert them into the `action` column of the `account_rules` table along with the desired condition.
';