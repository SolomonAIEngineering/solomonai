-- SMS Notification Function using Twilio
CREATE OR REPLACE FUNCTION public.send_sms_notification(phone_number TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    twilio_account_sid TEXT;
    twilio_auth_token TEXT;
    twilio_phone_number TEXT;
    twilio_api_url TEXT;
    response JSONB;
BEGIN
    -- Fetch Twilio credentials from Supabase Vault
    -- These secrets should be set in the Supabase dashboard or via CLI
    twilio_account_sid := extensions.vault.get('twilio_account_sid');
    twilio_auth_token := extensions.vault.get('twilio_auth_token');
    twilio_phone_number := extensions.vault.get('twilio_phone_number');
    
    -- Construct the Twilio API URL using the account SID
    twilio_api_url := 'https://api.twilio.com/2010-04-01/Accounts/' || twilio_account_sid || '/Messages.json';

    -- Send HTTP POST request to Twilio API
    SELECT content INTO response
    FROM http((
        'POST',
        twilio_api_url,
        ARRAY[
            -- Set up Basic Authentication using account SID and auth token
            http_header('Authorization', 'Basic ' || encode(twilio_account_sid || ':' || twilio_auth_token, 'base64')),
            -- Set content type for form data
            http_header('Content-Type', 'application/x-www-form-urlencoded')
        ],
        -- Construct the request body with recipient, sender, and message content
        'To=' || phone_number || '&From=' || twilio_phone_number || '&Body=' || (payload->>'description'),
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;

-- Push Notification Function using Firebase Cloud Messaging (FCM)
CREATE OR REPLACE FUNCTION public.send_push_notification(device_token TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    fcm_server_key TEXT;
    fcm_api_url TEXT := 'https://fcm.googleapis.com/fcm/send';
    response JSONB;
BEGIN
    -- Fetch FCM server key from Supabase Vault
    -- This secret should be set in the Supabase dashboard or via CLI
    fcm_server_key := extensions.vault.get('fcm_server_key');

    -- Send HTTP POST request to FCM API
    SELECT content INTO response
    FROM http((
        'POST',
        fcm_api_url,
        ARRAY[
            -- Set Authorization header with FCM server key
            http_header('Authorization', 'key=' || fcm_server_key),
            -- Set content type to JSON
            http_header('Content-Type', 'application/json')
        ],
        -- Construct the FCM payload
        jsonb_build_object(
            'to', device_token,  -- Target device token
            'notification', jsonb_build_object(  -- Notification content
                'title', payload->>'title',
                'body', payload->>'description'
            ),
            'data', payload  -- Additional data payload
        )::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;

-- Discord Notification Function
CREATE OR REPLACE FUNCTION public.send_discord_notification(webhook_url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    response JSONB;
BEGIN
    -- Send HTTP POST request to Discord webhook URL
    SELECT content INTO response
    FROM http((
        'POST',
        webhook_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        -- Construct Discord message payload
        jsonb_build_object('content', payload->>'description')::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;

-- Telegram Notification Function
CREATE OR REPLACE FUNCTION public.send_telegram_notification(bot_token TEXT, chat_id TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    response JSONB;
    telegram_api_url TEXT;
BEGIN
    -- Construct Telegram API URL using the bot token
    telegram_api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';

    -- Send HTTP POST request to Telegram API
    SELECT content INTO response
    FROM http((
        'POST',
        telegram_api_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        -- Construct Telegram message payload
        jsonb_build_object(
            'chat_id', chat_id,
            'text', payload->>'description'
        )::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;

-- Microsoft Teams Notification Function
CREATE OR REPLACE FUNCTION public.send_teams_notification(webhook_url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    response JSONB;
BEGIN
    -- Send HTTP POST request to Microsoft Teams webhook URL
    SELECT content INTO response
    FROM http((
        'POST',
        webhook_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        -- Construct Teams message payload
        jsonb_build_object(
            'text', payload->>'description'
        )::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;

-- Zapier Webhook Function
CREATE OR REPLACE FUNCTION public.trigger_zapier_webhook(webhook_url TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    response JSONB;
BEGIN
    -- Send HTTP POST request to Zapier webhook URL
    SELECT content INTO response
    FROM http((
        'POST',
        webhook_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        -- Send the entire payload as-is
        payload::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
    
END;
$$ LANGUAGE plpgsql;

-- IFTTT Webhook Function
CREATE OR REPLACE FUNCTION public.trigger_ifttt_webhook(webhook_key TEXT, event_name TEXT, payload JSONB)
RETURNS JSONB AS $$
DECLARE
    response JSONB;
    ifttt_webhook_url TEXT;
BEGIN
    -- Construct IFTTT webhook URL using the provided key and event name
    ifttt_webhook_url := 'https://maker.ifttt.com/trigger/' || event_name || '/with/key/' || webhook_key;

    -- Send HTTP POST request to IFTTT webhook URL
    SELECT content INTO response
    FROM http((
        'POST',
        ifttt_webhook_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        -- Send the entire payload as-is
        payload::text,
        -- Set timeout to 5000ms (5 seconds)
        5000
    )::http_request);
    
    -- Return the API response
    RETURN response;
END;
$$ LANGUAGE plpgsql;