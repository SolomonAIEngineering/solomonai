import { Database } from "@midday/supabase/types";
import { RequestOptions } from "@solomon-ai/financial-engine-sdk/core.mjs";
import type { TransactionsSchema as EngineTransaction, TransactionRecurringParams } from "@solomon-ai/financial-engine-sdk/resources/transactions";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";
import { uniqueLog } from "../utils/log";
import { getClassification, Transaction } from "../utils/transform";
import { sendTransactionsNotificationSubTask } from "./send-transaction-sync-notification";
import { updateBankConnectionStatus } from "./update-bank-connection-status";

/**
 * Synchronizes transactions for multiple bank accounts.
 *
 * This function performs the following operations for each bank account:
 * 1. Fetches transactions from the banking provider
 * 2. Transforms the transactions into a format suitable for storage
 * 3. Fetches and updates the account balance
 * 4. Upserts the transformed transactions into the database
 *
 * @param io - An object containing integration clients, including Supabase
 * @param accountsData - An array of bank accounts with their connection details
 * @param taskKeyPrefix - A prefix used to generate unique task keys
 *
 * @returns A promise that resolves to an object indicating the success of the operation
 *
 * @throws Will throw an error if there are issues with fetching transactions,
 *         updating account balances, or upserting transactions
 *
 * @example
 * const result = await syncRecurringTransactionsSubTask(io, accountsData, 'daily');
 * if (result.success) {
 *   console.log('Transactions synchronized successfully');
 * }
 */
async function syncRecurringTransactionsSubTask(
    io: IOWithIntegrations<{
        supabase: Supabase<Database, "public", any>;
    }>,
    accountsData: Array<BankAccountWithConnection> | null,
    taskKeyPrefix: string
): Promise<{ success: boolean }> {
    const supabase = io.supabase.client;
    let allNewTransactions: Transaction[] = [];

    const response = await io.runTask(
        `${taskKeyPrefix.toLocaleLowerCase()}-sync-recurring-transactions-subtask-${Date.now()}`,
        async () => {
            const promises = accountsData?.map(async (account) => {
                await uniqueLog(
                    io,
                    "info", `Processing account: ${account.id}`);
                await uniqueLog(
                    io,
                    "info", `Account type: ${account.type}`);

                const accountType = getClassification(account.type);
                await uniqueLog(
                    io,
                    "info", `Classified account type: ${accountType}`);

                // Fetch transactions for the account
                await uniqueLog(
                    io,
                    "info", `Fetching transactions for account ${account.id}`);
                const params: TransactionRecurringParams = {
                    accountId: account.account_id,
                    accessToken: account.bank_connection?.access_token,
                    provider: "plaid",
                }
                const requestOptions: RequestOptions = {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    maxRetries: 3,
                    timeout: 5000,
                };
                const transactions = await engine.transactions.recurring(params, requestOptions);
                await uniqueLog(
                    io,
                    "info",
                    `Retrieved ${transactions.inflow?.length || 0} transactions for account ${account.id} (Type: ${accountType})`
                );

                await uniqueLog(
                    io,
                    "info",
                    `recurring transactions: ${JSON.stringify(transactions)}`
                );

                // Fetch and update account balance
                await uniqueLog(
                    io,
                    "info", `Fetching balance for account ${account.id}`);
                const balance = await engine.accounts.balance({
                    provider: account.bank_connection.provider,
                    id: account.account_id,
                    accessToken: account.bank_connection?.access_token,
                });
                await uniqueLog(
                    io,
                    "info",
                    `Retrieved balance for account ${account.id}: ${balance.data?.amount}`
                );

                if (balance.data?.amount) {
                    await uniqueLog(
                        io,
                        "info", `Updating balance for account ${account.id}`);
                    await supabase
                        .from("bank_accounts")
                        .update({
                            balance: balance.data.amount,
                        })
                        .eq("id", account.id);
                    await uniqueLog(
                        io,
                        "info", `Balance updated for account ${account.id}`);

                    // Update bank connection status to connected
                    await updateBankConnectionStatus(
                        io,
                        account.bank_connection?.id,
                        "connected",
                        taskKeyPrefix,
                        null
                    );
                }

                await uniqueLog(
                    io,
                    "info",
                    `Finished processing all batches for account ${account.id}`
                );
            });

            if (promises) {
                await uniqueLog(
                    io,
                    "info", "Waiting for all account processing to complete");
                await Promise.all(promises);
                await uniqueLog(
                    io,
                    "info", "All accounts processed successfully");
            }

            // Send notification for all new transactions
            if (allNewTransactions.length > 0) {
                await sendTransactionsNotificationSubTask(
                    io,
                    allNewTransactions as Array<EngineTransaction.Data>,
                    accountsData?.[0]?.team_id as string,
                    taskKeyPrefix);
            }

            return {
                success: true,
            };
        },
        { name: "Sync Transactions Sub Task" }
    );

    return response;
}

export { syncRecurringTransactionsSubTask };
