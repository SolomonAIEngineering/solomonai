import { AccountType, BankProviders } from "@midday/supabase/types";

type BankAccountWithConnection = {
  id: string;
  team_id: string;
  account_id: string;
  type: AccountType;
  bank_connection: {
    id: string;
    provider: BankProviders;
    access_token: string;
    last_cursor_sync: string;
  };
};
export type { BankAccountWithConnection };
