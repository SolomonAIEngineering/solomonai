import { AccountType, BankProviders, ConnectionStatus } from "@midday/supabase/types";
import FinancialEngine from "@solomon-ai/financial-engine-sdk";
import { eventTrigger } from "@trigger.dev/sdk";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { engine } from "../utils/engine";
import { parseAPIError } from "../utils/error";
import { processBatch } from "../utils/process";
import { getClassification, transformTransaction } from "../utils/transform";

const BATCH_LIMIT = 500;

 type BankAccountWithConnection = {
  id: string;
  team_id: string;
  account_id: string;
  type: AccountType;
  bank_connection: {
    id: string;
    provider: BankProviders;
    access_token: string;
  };
};

client.defineJob({
  id: Jobs.TRANSACTIONS_MANUAL_SYNC,
  name: "Transactions - Manual Sync",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_MANUAL_SYNC,
    schema: z.object({
      connectionId: z.string(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  /**
   * Performs a manual synchronization of transactions for a given team and connection.
   *
   * @param payload - The job payload containing teamId and connectionId.
   * @param io - The I/O object providing access to integrations like Supabase.
   *
   * This function does the following:
   * 1. Retrieves enabled bank accounts for the given team and connection.
   * 2. For each account:
   *    - Fetches the latest transactions
   *    - Retrieves and updates the account balance
   *    - Processes and upserts transactions in batches
   * 3. Handles any errors during processing
   * 4. Updates the bank connection status
   * 5. Revalidates various data tags
   *
   * @throws {Error} If any error occurs during processing
   */
  run: async (payload, io) => {
    console.log("Starting manual sync job");
    const supabase = io.supabase.client;

    const { teamId, connectionId } = payload;
    console.log(
      `Processing for teamId: ${teamId}, connectionId: ${connectionId}`,
    );

    // Fetch enabled bank accounts
    console.log("Fetching enabled bank accounts");
    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select(
        "id, team_id, account_id, type, bank_connection:bank_connection_id(id, provider, access_token)",
      )
      .eq("bank_connection_id", connectionId)
      .eq("team_id", teamId)
      .eq("enabled", true)
      .returns<BankAccountWithConnection[]>();

    console.log(`Found ${accountsData?.length || 0} enabled bank accounts`);

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
        accountType: accountType as "depository" | "credit" | "other_asset" | "loan" | "other_liability" | undefined,
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
      console.log(`Transformed ${formattedTransactions?.length || 0} transactions`);

      // Fetch and update account balance
      console.log(`Fetching balance for account ${account.id}`);
      const balance = await engine.accounts.balance({
        provider: account.bank_connection.provider,
        id: account.account_id,
        accessToken: account.bank_connection?.access_token,
      });
      console.log(
        `Retrieved balance for account ${account.id}: ${balance.data?.amount}`,
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
      console.log(`Processing transactions in batches for account ${account.id}`);
      await processBatch(formattedTransactions, BATCH_LIMIT, async (batch) => {
        console.log(
          `Processing batch of ${batch.length} transactions for account ${account.id}`,
        );
        const { data, error } = await supabase.from("transactions").upsert(batch as any, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        });
        if (error) {
          console.error(`Error upserting transactions for account ${account.id}:`, error);
        } else {
          console.log(`Successfully upserted ${batch?.length || 0} transactions for account ${account.id}`);
        }
        return batch;
      });
      console.log(`Finished processing all batches for account ${account.id}`);
    });

    try {
      if (promises) {
        console.log("Waiting for all account processing to complete");
        await Promise.all(promises);
        console.log("All accounts processed successfully");
      }
    } catch (error) {
      console.error("Error occurred during processing:", error);
      if (error instanceof FinancialEngine.APIError) {
        const parsedError = parseAPIError(error);
        console.log("Parsed API error:", parsedError);

        // Function to check if a status is allowed
        const isAllowedStatus = (status: string): status is ConnectionStatus => {
          return ["disconnected", "connected", "unknown"].includes(status) || status === null || status === undefined;
        };

        // Determine the status to use
        const status: ConnectionStatus = isAllowedStatus(parsedError.code) ? parsedError.code : "unknown";

        console.log(`Updating bank connection status to ${status}`);
        await io.supabase.client
          .from("bank_connections")
          .update({
            status: status,
            error_details: parsedError.message,
          })
          .eq("id", connectionId);
        console.log("Bank connection status updated due to error");
      }

      throw new Error(error instanceof Error ? error.message : String(error));
    }

    // Update bank connection status
    console.log("Updating bank connection status to 'connected'");
    await io.supabase.client
      .from("bank_connections")
      .update({
        last_accessed: new Date().toISOString(),
        status: "connected",
        error_details: null,
      })
      .eq("id", connectionId);
    console.log("Bank connection status updated successfully");

    // Revalidate data tags
    console.log("Revalidating tags");
    const tagsToRevalidate = [
      `bank_connections_${teamId}`,
      `transactions_${teamId}`,
      `spending_${teamId}`,
      `metrics_${teamId}`,
      `bank_accounts_${teamId}`,
      `insights_${teamId}`,
      `expenses_${teamId}`,
    ];
    tagsToRevalidate.forEach(tag => {
      console.log(`Revalidating tag: ${tag}`);
      revalidateTag(tag);
    });
    console.log("All tags revalidated");

    console.log("Manual sync job completed successfully");
  },
});