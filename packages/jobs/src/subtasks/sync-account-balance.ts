import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";

async function updateBankAccountBalance(
    io: IOWithIntegrations<{
        supabase: Supabase<Database, "public", any>;
    }>,
    account: BankAccountWithConnection,
    taskKeyPrefix: string
): Promise<null> {
    console.log("Starting manual sync job");
    const supabase = io.supabase.client;

    const data = await io.runTask(
        `${taskKeyPrefix}-update-bank-account-balance`,
        async () => {
            const balance = await engine.accounts.balance({
                provider: account.bank_connection.provider,
                id: account.account_id,
                accessToken: account.bank_connection?.access_token,
            });

            if (balance.data?.amount) {
                await io.supabase.client
                    .from("bank_accounts")
                    .update({ balance: balance.data.amount })
                    .eq("id", account.id);
                console.log(`Updated balance for account ID: ${account.id}`);
            }
        },
        { name: "Updating bank account balance" }
    );

    return null;
}

export { updateBankAccountBalance };
