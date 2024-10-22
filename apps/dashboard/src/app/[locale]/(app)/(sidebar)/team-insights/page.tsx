import { ExpenseMetricsServer } from "@/components/analytics-views/expense/expense-metrics.server";
import { AccountSummarySection } from "@/components/cash-flow/account-summary-section";
import { DailyExpensesChart } from "@/components/charts/team-insights/daily-expenses-chart/daily-expenses-chart";
import { ExpenseMetricsChart } from "@/components/charts/team-insights/expense-metrics/expense-metrics-chart";
import { IncomeMetricsChart } from "@/components/charts/team-insights/income-metrics/income-metrics-chart";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { DateRangeSelector } from "@/components/date-range-selector";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { ContentLayout } from "@/components/panel/content-layout";
import config from "@/config";
import { getDefaultDateRange } from "@/config/chart-date-range-default-picker";
import { Tier } from "@/config/tier";
import { formatCategoryName, formatDate } from "@/utils/utils";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { startOfYear } from "date-fns";
import type { Metadata } from "next";
import { Suspense } from "react";
import { searchParamsCache } from "./search-params";

export const metadata: Metadata = {
    title: `Team Insights | ${config.company}`,
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

const defaultValue = getDefaultDateRange("monthly", "expense");

export default async function CashFlowPage({ searchParams }: Props) {
    const { from, to, currency, page, pageSize } = searchParamsCache.parse(searchParams);

    const user = await getUser();
    const accounts = await getTeamBankAccounts();
    const isEmpty = !accounts?.data?.length;

    const tier: Tier = user?.data?.tier ?? "free";
    const userId = user?.data?.id as string;

    const effectiveFrom = from || defaultValue.from;
    const effectiveTo = to || defaultValue.to;
    const effectiveCurrency = currency || "USD";
    const effectivePage = page || "1";
    const effectivePageSize = pageSize || "50";

    // TODO: load the financial context from local memory and popuplate a synopsis of insights for the user

    return (
        <Suspense fallback={<InboxViewSkeleton ascending />}>
            <ContentLayout title="Team Insights">
                <ConnectAccountServerWrapper>
                    <div className="mt-5">
                        <AccountSummarySection
                            user={user}
                            isEmpty={isEmpty}
                            tier={tier}
                            name={user?.data?.full_name ?? "Solomon AI User"}
                            description="Team Financial Insights"
                            detailedDescription="A breakdown of finances and insights relevant to your team"
                            className="border-none shadow-none"
                        />
                    </div>
                </ConnectAccountServerWrapper>
            </ContentLayout>
        </Suspense>
    );
}
