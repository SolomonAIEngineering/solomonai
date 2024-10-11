import { Database } from "@midday/supabase/types";
import type { TransactionsSchema as EngineTransaction } from "@solomon-ai/financial-engine-sdk/resources/transactions";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BATCH_LIMIT } from "../constants/constants";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";
import { uniqueLog } from "../utils/log";
import { processBatch } from "../utils/process";
import { getClassification, Transaction, transformTransaction } from "../utils/transform";
import { sendTransactionsNotificationSubTask } from "./send-transaction-sync-notification";
import { updateBankConnectionStatus } from "./update-bank-connection-status";

async function syncTransactionsSubTask(
  io: IOWithIntegrations<{ supabase: Supabase<Database, "public", any> }>,
  accountsData: Array<BankAccountWithConnection> | null,
  taskKeyPrefix: string
): Promise<{ success: boolean }> {
  const supabase = io.supabase.client;
  let allNewTransactions: Transaction[] = [];

  return io.runTask(
    `${taskKeyPrefix.toLowerCase()}-sync-transactions-subtask-${Date.now()}`,
    async () => {
      if (!accountsData) {
        await uniqueLog(io, "info", "No accounts to process");
        return { success: true };
      }

      await Promise.all(accountsData.map(processAccount));
      await sendNotificationsIfNeeded();

      return { success: true };
    },
    { name: "Sync Transactions Sub Task" }
  );

  async function processAccount(account: BankAccountWithConnection) {
    await logAccountInfo(account);
    const transactions = await fetchTransactions(account);
    const formattedTransactions = await transformTransactions(transactions, account);
    await updateAccountBalance(account);
    await processTransactionBatches(formattedTransactions, account);
  }

  async function logAccountInfo(account: BankAccountWithConnection) {
    await uniqueLog(io, "info", `Processing account: ${account.id}`);
    await uniqueLog(io, "info", `Account type: ${account.type}`);
    const accountType = getClassification(account.type);
    await uniqueLog(io, "info", `Classified account type: ${accountType}`);
  }

  async function fetchTransactions(account: BankAccountWithConnection) {
    await uniqueLog(io, "info", `Fetching transactions for account ${account.id}`);
    const accountType = getClassification(account.type);
    const transactions = await engine.transactions.list({
      provider: account.bank_connection.provider,
      accountId: account.account_id,
      accountType: accountType as "depository" | "credit" | "other_asset" | "loan" | "other_liability" | undefined,
      accessToken: account.bank_connection?.access_token,
      latest: "true",
    });
    await uniqueLog(io, "info", `Retrieved ${transactions.data?.length || 0} transactions for account ${account.id} (Type: ${accountType})`);
    return transactions.data || [];
  }

  async function transformTransactions(transactions: any[], account: BankAccountWithConnection) {
    await uniqueLog(io, "info", `Transforming transactions for account ${account.id}`);
    const formattedTransactions = transactions.map((transaction) =>
      transformTransaction({
        transaction,
        teamId: account.team_id,
        bankAccountId: account.id,
      })
    );
    await uniqueLog(io, "info", `Transformed ${formattedTransactions.length} transactions`);
    return formattedTransactions;
  }

  async function updateAccountBalance(account: BankAccountWithConnection) {
    await uniqueLog(io, "info", `Fetching balance for account ${account.id}`);
    const balance = await engine.accounts.balance({
      provider: account.bank_connection.provider,
      id: account.account_id,
      accessToken: account.bank_connection?.access_token,
    });
    await uniqueLog(io, "info", `Retrieved balance for account ${account.id}: ${balance.data?.amount}`);

    if (balance.data?.amount) {
      await supabase
        .from("bank_accounts")
        .update({ balance: balance.data.amount })
        .eq("id", account.id);
      await uniqueLog(io, "info", `Balance updated for account ${account.id}`);

      await updateBankConnectionStatus(io, account.bank_connection?.id, "connected", taskKeyPrefix, null);
    }
  }

  async function processTransactionBatches(formattedTransactions: Transaction[], account: BankAccountWithConnection) {
    await uniqueLog(io, "info", `Processing transactions in batches for account ${account.id}`);
    await processBatch(formattedTransactions, BATCH_LIMIT, async (batch) => {
      await uniqueLog(io, "info", `Processing batch of ${batch.length} transactions for account ${account.id}`);
      const { error } = await supabase
        .from("transactions")
        .upsert(batch as any, {
          onConflict: "internal_id",
          ignoreDuplicates: true,
        });
      if (error) {
        console.error(`Error upserting transactions for account ${account.id}:`, error);
      } else {
        await uniqueLog(io, "info", `Successfully upserted ${batch.length} transactions for account ${account.id}`);
        allNewTransactions = allNewTransactions.concat(batch);
      }
      return batch;
    });
    await uniqueLog(io, "info", `Finished processing all batches for account ${account.id}`);
  }

  async function sendNotificationsIfNeeded() {
    if (allNewTransactions.length > 0 && accountsData) {
      await sendTransactionsNotificationSubTask(
        io,
        allNewTransactions as Array<EngineTransaction.Data>,
        accountsData[0]?.team_id ?? '',
        taskKeyPrefix
      );
    }
  }
}

export { syncTransactionsSubTask };
