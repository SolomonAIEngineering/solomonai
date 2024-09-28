import { formatCurrency } from "@/utils/currency";
import { Tables } from "@midday/supabase/types";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@midday/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { ArrowDownIcon, ArrowUpIcon, BarChart3Icon, TrendingUpDown, TrendingUpIcon } from "lucide-react";
import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TransactionAnalyticsCharts } from "../transaction-analytics/transaction-analytics";
import { TransactionAnalyticsBreakdown } from "./transaction-analytics-breakdown";

type Transaction = Tables<"transactions">;

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  currency?: string;
}

interface AnalyticsResult {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  largestTransaction: Transaction | null;
  transactionCount: number;
  averageTransactionAmount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  // New analytics
  categoryCounts: Record<string, number>;
  methodCounts: Record<string, number>;
  currencyCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recurringTransactionsCount: number;
  manualTransactionsCount: number;
  averageBalance: number;
  mostFrequentMerchant: { name: string; count: number } | null;
}

const computeAnalytics = (transactions: Transaction[]): AnalyticsResult => {
  const initialAccumulator: AnalyticsResult = {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    largestTransaction: null,
    transactionCount: 0,
    averageTransactionAmount: 0,
    incomeTransactionCount: 0,
    expenseTransactionCount: 0,
    categoryCounts: {},
    methodCounts: {},
    currencyCounts: {},
    statusCounts: {},
    recurringTransactionsCount: 0,
    manualTransactionsCount: 0,
    averageBalance: 0,
    mostFrequentMerchant: null,
  };

  const merchantCounts: Record<string, number> = {};

  return transactions.reduce((acc, transaction) => {
    const amount = Math.abs(transaction.amount);
    const isIncome = transaction.amount > 0;

    // Update merchant counts
    if (transaction.merchant_name) {
      merchantCounts[transaction.merchant_name] =
        (merchantCounts[transaction.merchant_name] || 0) + 1;
    }

    // Update category counts
    if (transaction.category) {
      acc.categoryCounts[transaction.category] =
        (acc.categoryCounts[transaction.category] || 0) + 1;
    }

    // Update method counts
    acc.methodCounts[transaction.method] =
      (acc.methodCounts[transaction.method] || 0) + 1;

    // Update currency counts
    acc.currencyCounts[transaction.currency] =
      (acc.currencyCounts[transaction.currency] || 0) + 1;

    // Update status counts
    if (transaction.status) {
      acc.statusCounts[transaction.status] =
        (acc.statusCounts[transaction.status] || 0) + 1;
    }

    return {
      ...acc,
      totalIncome: isIncome ? acc.totalIncome + amount : acc.totalIncome,
      totalExpenses: !isIncome ? acc.totalExpenses + amount : acc.totalExpenses,
      netCashFlow: acc.netCashFlow + transaction.amount,
      largestTransaction:
        amount > Math.abs(acc.largestTransaction?.amount ?? 0)
          ? transaction
          : acc.largestTransaction,
      transactionCount: acc.transactionCount + 1,
      averageTransactionAmount: acc.averageTransactionAmount + amount,
      incomeTransactionCount: isIncome
        ? acc.incomeTransactionCount + 1
        : acc.incomeTransactionCount,
      expenseTransactionCount: !isIncome
        ? acc.expenseTransactionCount + 1
        : acc.expenseTransactionCount,
      recurringTransactionsCount: transaction.recurring
        ? acc.recurringTransactionsCount + 1
        : acc.recurringTransactionsCount,
      manualTransactionsCount: transaction.manual
        ? acc.manualTransactionsCount + 1
        : acc.manualTransactionsCount,
      averageBalance: acc.averageBalance + (transaction.balance || 0),
    };
  }, initialAccumulator);
};

export const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({
  transactions,
  currency = "USD",
}) => {
  const analytics = useMemo(
    () => computeAnalytics(transactions),
    [transactions],
  )
  const formatMoney = (amount: number) => formatCurrency(amount, currency)
  const averageAmount =
    analytics.transactionCount > 0
      ? analytics.averageTransactionAmount / analytics.transactionCount
      : 0

  const chartData = [
    { name: 'Income', value: analytics.totalIncome },
    { name: 'Expenses', value: analytics.totalExpenses },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <BarChart3Icon className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-3xl font-bold">Transaction Analytics</SheetTitle>
          <SheetDescription className="text-lg">
            Detailed analysis of your financial transactions
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {/* <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatMoney(value as number)} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer> */}
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <AnalyticsCard
                title="Net Cash Flow"
                value={formatMoney(analytics.netCashFlow)}
                icon={analytics.netCashFlow >= 0 ? <TrendingUpIcon className="text-green-500" /> : <TrendingUpIcon className="text-red-500" />}
                valueClassName={analytics.netCashFlow >= 0 ? "text-green-500" : "text-red-500"}
              />
              <AnalyticsCard
                title="Largest Transaction"
                value={analytics.largestTransaction ? formatMoney(Math.abs(analytics.largestTransaction.amount)) : "N/A"}
                subtext={analytics.largestTransaction?.description ?? "No transactions available"}
              />
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <AnalyticsCard
                title="Total Income"
                value={formatMoney(analytics.totalIncome)}
                icon={<ArrowUpIcon className="text-green-500" />}
              />
              <AnalyticsCard
                title="Total Expenses"
                value={formatMoney(analytics.totalExpenses)}
                icon={<ArrowDownIcon className="text-red-500" />}
              />
              <AnalyticsCard
                title="Transaction Count"
                value={analytics.transactionCount.toString()}
                subtext={`Income: ${analytics.incomeTransactionCount}, Expenses: ${analytics.expenseTransactionCount}`}
              />
              <AnalyticsCard
                title="Average Transaction"
                value={formatMoney(averageAmount)}
              />
              <AnalyticsCard
                title="Recurring Transactions"
                value={analytics.recurringTransactionsCount.toString()}
              />
              <AnalyticsCard
                title="Manual Transactions"
                value={analytics.manualTransactionsCount.toString()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

interface AnalyticsCardProps {
  title: string
  value: string
  subtext?: string
  valueClassName?: string
  icon?: React.ReactNode
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtext,
  valueClassName = "",
  icon,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </CardContent>
  </Card>
)