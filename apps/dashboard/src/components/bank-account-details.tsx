"use client";

import {
  BankAccountSchema,
  BankConnectionSchema,
  TransactionSchema,
} from "@midday/supabase/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { cn } from "@midday/ui/cn";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import { AccountBalanceGrowthRateChart } from "./charts/account-balance/account-balance-growth-rate-chart";
import { AccountBalanceOverview } from "./charts/account-balance/account-balance-overview-chart";
import { AccountBalanceSummaryCharts } from "./charts/account-balance/account-balance-summary-charts";
import { FormatAmount } from "./format-amount";
import { TransactionsFilterHelper } from "./similar-transactions";

interface BankAccountDetailsProps {
  bankAccount: BankAccountSchema;
  bankConnection?: BankConnectionSchema;
  userName: string;
  isLoading?: boolean;
  transactions?: TransactionSchema[];
  transactionsLoading: boolean;
}

export function BankAccountDetails({
  bankAccount,
  bankConnection,
  userName,
  isLoading = false,
  transactions,
  transactionsLoading,
}: BankAccountDetailsProps) {
  // Remove the useEffect and useState hooks for transactions
  const viewMoreLink = `/financial-accounts/${bankAccount.account_id}`;
  return (
    <div className="overflow-y-auto scrollbar-hide h-full">
      <div className="flex justify-between mb-8">
        <div className="flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-between mt-1 mb-6">
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px] rounded-full" />
              </div>
              <Skeleton className="w-[10%] h-[14px] rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {bankConnection?.name && (
                <span className="text-[#606060] text-xs">
                  {bankConnection.name}
                </span>
              )}
              <span className="text-[#606060] text-xs select-text">
                {bankAccount.type}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="mt-6 mb-3 select-text">
              {isLoading ? (
                <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
              ) : (
                bankAccount.name
              )}
            </h2>
            <Link href={viewMoreLink}>
              <p className="text-md text-[#606060] hover:text-[#090202] hover:font-bold">
                View More <ArrowUpRightFromSquare size={16} className="inline ml-2" />
              </p>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span className={cn("text-4xl font-mono select-text")}>
                  <FormatAmount
                    amount={bankAccount.balance ?? 0}
                    currency={bankAccount.currency ?? "USD"}
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["details", "connection", "transactions"]}
      >
        <AccordionItem value="details">
          <AccordionTrigger>Account Details</AccordionTrigger>
          <AccordionContent className="select-text">
            <p>
              <strong>Account Number:</strong> {bankAccount.account_id}
            </p>
            <p>
              <strong>Currency:</strong> {bankAccount.currency}
            </p>
            <p>
              <strong>Account Holder:</strong> {userName}
            </p>
          </AccordionContent>
        </AccordionItem>

        {bankConnection && (
          <AccordionItem value="connection">
            <AccordionTrigger>Bank Connection</AccordionTrigger>
            <AccordionContent className="select-text">
              <p>
                <strong>Bank Name:</strong> {bankConnection.name}
              </p>
              <p>
                <strong>Status:</strong> {bankConnection.status}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {/** Account balance over time for the account of interest */}
        <div className="py-[2%]">
          <AccountBalanceSummaryCharts link={viewMoreLink}/>
        </div>

        {transactions && transactions.length > 0 && (
          <AccordionItem value="transactions" className="h-[calc(100vh-400px)]">
            <AccordionTrigger>Recent Transactions</AccordionTrigger>
            <AccordionContent className="h-full">
              {transactionsLoading ? (
                <Skeleton className="w-full h-[100px]" />
              ) : (
                <div className="h-full">
                  <TransactionsFilterHelper
                    transactions={transactions}
                    title={`${bankAccount.name}`}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
