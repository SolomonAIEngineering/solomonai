-- Create the integrations table
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category integration_category NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_integration_per_team UNIQUE (team_id, type)
);

-- Add indexes
CREATE INDEX idx_integrations_team_id ON public.integrations(team_id);
CREATE INDEX idx_integrations_type ON public.integrations(type);
CREATE INDEX idx_integrations_category ON public.integrations(category);
CREATE INDEX idx_integrations_last_sync_at ON public.integrations(last_sync_at);
CREATE INDEX idx_integrations_sync_status ON public.integrations(sync_status);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Reset sync status when config is updated
    IF OLD.config <> NEW.config THEN
        NEW.sync_status = 'pending';
        NEW.last_sync_at = NULL;
        NEW.error_message = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_integration_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION update_integration_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.integrations TO authenticated;

-- Add comments for clarity
COMMENT ON TABLE public.integrations IS 'Stores information about various integrations that can be used with account rules';
COMMENT ON COLUMN public.integrations.type IS 'The specific integration service (e.g., "stripe", "plaid", "quickbooks")';
COMMENT ON COLUMN public.integrations.category IS 'The category of the integration (e.g., "payment_processing", "financial", "accounting")';
COMMENT ON COLUMN public.integrations.config IS 'JSON configuration for the integration (e.g., API keys, webhook URLs)';
COMMENT ON COLUMN public.integrations.last_sync_at IS 'Timestamp of the last successful synchronization';
COMMENT ON COLUMN public.integrations.sync_status IS 'Current sync status (e.g., pending, in_progress, completed, failed)';
COMMENT ON COLUMN public.integrations.error_message IS 'Error message if the last sync failed';

-- Create an enum type for integration categories
CREATE TYPE integration_category AS ENUM ('payment_processing', 'financial', 'messaging', 'file_storage', 'accounting', 'crm', 'analytics', 'erp');

-- Alter the integrations table to use the new enum type
ALTER TABLE public.integrations ALTER COLUMN category TYPE integration_category USING category::integration_category;

-- Insert example integrations including financial integrations and accounting systems
INSERT INTO public.integrations (team_id, name, type, category, config, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Stripe Payments', 'stripe', 'payment_processing', '{"api_key": "sk_test_example", "webhook_secret": "whsec_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Plaid Financial Data', 'plaid', 'financial', '{"client_id": "plaid_client_id_example", "secret": "plaid_secret_example", "env": "sandbox"}', true),
('00000000-0000-0000-0000-000000000001', 'Slack Notifications', 'slack', 'messaging', '{"webhook_url": "https://hooks.slack.com/services/EXAMPLE"}', true),
('00000000-0000-0000-0000-000000000001', 'Resend Email', 'resend', 'messaging', '{"api_key": "re_example_api_key"}', true),
('00000000-0000-0000-0000-000000000001', 'QuickBooks Online', 'quickbooks', 'accounting', '{"client_id": "quickbooks_client_id_example", "client_secret": "quickbooks_client_secret_example", "refresh_token": "quickbooks_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Xero', 'xero', 'accounting', '{"client_id": "xero_client_id_example", "client_secret": "xero_client_secret_example", "refresh_token": "xero_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'FreeAgent', 'freeagent', 'accounting', '{"client_id": "freeagent_client_id_example", "client_secret": "freeagent_client_secret_example", "refresh_token": "freeagent_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'FreshBooks', 'freshbooks', 'accounting', '{"client_id": "freshbooks_client_id_example", "client_secret": "freshbooks_client_secret_example", "refresh_token": "freshbooks_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Microsoft Dynamics 365', 'dynamics365', 'erp', '{"client_id": "dynamics365_client_id_example", "client_secret": "dynamics365_client_secret_example", "tenant_id": "dynamics365_tenant_id_example"}', true),
('00000000-0000-0000-0000-000000000001', 'NetSuite', 'netsuite', 'erp', '{"account_id": "netsuite_account_id_example", "consumer_key": "netsuite_consumer_key_example", "consumer_secret": "netsuite_consumer_secret_example", "token_id": "netsuite_token_id_example", "token_secret": "netsuite_token_secret_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Microsoft Dynamics 365 Finance', 'dynamics365finance', 'erp', '{"client_id": "dynamics365finance_client_id_example", "client_secret": "dynamics365finance_client_secret_example", "tenant_id": "dynamics365finance_tenant_id_example"}', true),
('00000000-0000-0000-0000-000000000001', 'MoneyBird', 'moneybird', 'accounting', '{"client_id": "moneybird_client_id_example", "client_secret": "moneybird_client_secret_example", "refresh_token": "moneybird_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Sage Business Cloud Accounting', 'sage_business_cloud', 'accounting', '{"client_id": "sage_client_id_example", "client_secret": "sage_client_secret_example", "refresh_token": "sage_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Sage Intacct', 'sage_intacct', 'erp', '{"company_id": "intacct_company_id_example", "user_id": "intacct_user_id_example", "user_password": "intacct_user_password_example", "sender_id": "intacct_sender_id_example", "sender_password": "intacct_sender_password_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Wave Financial', 'wave', 'accounting', '{"client_id": "wave_client_id_example", "client_secret": "wave_client_secret_example", "refresh_token": "wave_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Workday', 'workday', 'erp', '{"tenant_name": "workday_tenant_name_example", "client_id": "workday_client_id_example", "client_secret": "workday_client_secret_example", "refresh_token": "workday_refresh_token_example"}', true),
('00000000-0000-0000-0000-000000000001', 'Zoho Books', 'zoho_books', 'accounting', '{"client_id": "zoho_client_id_example", "client_secret": "zoho_client_secret_example", "refresh_token": "zoho_refresh_token_example", "organization_id": "zoho_organization_id_example"}', true);

-- Create a function to validate integration config based on type
CREATE OR REPLACE FUNCTION validate_integration_config()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.type
        WHEN 'stripe' THEN
            IF NOT (NEW.config ? 'api_key' AND NEW.config ? 'webhook_secret') THEN
                RAISE EXCEPTION 'Stripe integration requires api_key and webhook_secret';
            END IF;
        WHEN 'plaid' THEN
            IF NOT (NEW.config ? 'client_id' AND NEW.config ? 'secret' AND NEW.config ? 'env') THEN
                RAISE EXCEPTION 'Plaid integration requires client_id, secret, and env';
            END IF;
        WHEN 'slack' THEN
            IF NOT (NEW.config ? 'webhook_url') THEN
                RAISE EXCEPTION 'Slack integration requires webhook_url';
            END IF;
        WHEN 'resend' THEN
            IF NOT (NEW.config ? 'api_key') THEN
                RAISE EXCEPTION 'Resend integration requires api_key';
            END IF;
        WHEN 'quickbooks' THEN
            IF NOT (NEW.config ? 'client_id' AND NEW.config ? 'client_secret' AND NEW.config ? 'refresh_token') THEN
                RAISE EXCEPTION 'QuickBooks integration requires client_id, client_secret, and refresh_token';
            END IF;
        -- Add more cases for other integration types as needed
        ELSE
            RAISE NOTICE 'No specific validation for integration type: %', NEW.type;
    END CASE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate integration config before insert or update
CREATE TRIGGER validate_integration_config
BEFORE INSERT OR UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION validate_integration_config();