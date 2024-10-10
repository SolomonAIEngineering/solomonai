import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BATCH_LIMIT } from "../constants/constants";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";

async function syncTransactionsSubTask(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  accountsData: Array<BankAccountWithConnection> | null,
  taskKeyPrefix: string
) {
  const supabase = io.supabase.client;

  const response = await io.runTask(
    `${taskKeyPrefix.toLocaleLowerCase()}-sync-transactions-subtask-${Date.now()}`,
    async () => {
      const promises = accountsData?.map(async (account) => {
        console.log(`Processing account: ${account.id}`);
        console.log(`Account type: ${account.type}`);

        const accountType = getClassification(account.type);
        console.log(`Classified account type: ${accountType}`);

        // Fetch transactions for the account
        console.log(`Fetching transactions for account ${account.id}`);
        const transactions = await engine.transactions.list({
          provider: account.bank_connection.provider,
          accountId: account.account_id,
          accountType: accountType as
            | "depository"
            | "credit"
            | "other_asset"
            | "loan"
            | "other_liability"
            | undefined,
          accessToken: account.bank_connection?.access_token,
          latest: "true",
        });
        console.log(
          `Retrieved ${transactions.data?.length || 0} transactions for account ${account.id} (Type: ${accountType})`
        );

        // Transform transactions
        console.log(`Transforming transactions for account ${account.id}`);
        const formattedTransactions = transactions.data?.map((transaction) => {
          return transformTransaction({
            transaction,
            teamId: account.team_id,
            bankAccountId: account.id,
          });
        });
        console.log(
          `Transformed ${formattedTransactions?.length || 0} transactions`
        );

        // Fetch and update account balance
        console.log(`Fetching balance for account ${account.id}`);
        const balance = await engine.accounts.balance({
          provider: account.bank_connection.provider,
          id: account.account_id,
          accessToken: account.bank_connection?.access_token,
        });
        console.log(
          `Retrieved balance for account ${account.id}: ${balance.data?.amount}`
        );

        if (balance.data?.amount) {
          console.log(`Updating balance for account ${account.id}`);
          await supabase
            .from("bank_accounts")
            .update({
              balance: balance.data.amount,
            })
            .eq("id", account.id);
          console.log(`Balance updated for account ${account.id}`);
        }

        // Process transactions in batches
        console.log(
          `Processing transactions in batches for account ${account.id}`
        );
        await processBatch(
          formattedTransactions,
          BATCH_LIMIT,
          async (batch) => {
            console.log(
              `Processing batch of ${batch.length} transactions for account ${account.id}`
            );
            const { data, error } = await supabase
              .from("transactions")
              .upsert(batch as any, {
                onConflict: "internal_id",
                ignoreDuplicates: true,
              });
            if (error) {
              console.error(
                `Error upserting transactions for account ${account.id}:`,
                error
              );
            } else {
              console.log(
                `Successfully upserted ${batch?.length || 0} transactions for account ${account.id}`
              );
            }
            return batch;
          }
        );
        console.log(
          `Finished processing all batches for account ${account.id}`
        );
      });

      if (promises) {
        console.log("Waiting for all account processing to complete");
        await Promise.all(promises);
        console.log("All accounts processed successfully");
      }

      return {
        success: true,
      };
    },
    { name: "Sync Transactions Sub Task" }
  );

  return response;
}

export { syncTransactionsSubTask };
