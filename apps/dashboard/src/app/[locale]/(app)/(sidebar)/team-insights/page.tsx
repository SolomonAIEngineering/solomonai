import { AccountSummarySection } from "@/components/cash-flow/account-summary-section";
import { ExpenseTabsSection } from "@/components/cash-flow/expense-tabs-section";
import { IncomeTabsSection } from "@/components/cash-flow/income-tabs-section";
import { SpendingTabsSection } from "@/components/cash-flow/spending-tabs-section";
import { CashflowCharts } from "@/components/charts/cashflow-charts";
import { DailyExpensesChart } from "@/components/charts/team-insights/daily-expenses-chart/daily-expenses-chart";
import ConnectAccountServerWrapper from "@/components/connect-account-server-wrapper";
import { InboxViewSkeleton } from "@/components/inbox-skeleton";
import { ContentLayout } from "@/components/panel/content-layout";
import config from "@/config";
import { getDefaultDateRange } from "@/config/chart-date-range-default-picker";
import { Tier } from "@/config/tier";
import { Cookies } from "@/utils/constants";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { startOfMonth, startOfYear, subMonths } from "date-fns";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: `Team Insights | ${config.company}`,
};

type Props = {
    searchParams: { [key: string]: string | string[] | undefined };
};

const defaultValue = getDefaultDateRange("monthly", "expense");

export default async function CashFlowPage({ searchParams }: Props) {
    const user = await getUser();
    const accounts = await getTeamBankAccounts();
    const isEmpty = !accounts?.data?.length;
    const initialPeriod = cookies().has(Cookies.SpendingPeriod)
        ? JSON.parse(cookies().get(Cookies.SpendingPeriod)?.value ?? "{}")
        : {
            id: "this_year",
            from: startOfYear(new Date()).toISOString(),
            to: new Date().toISOString(),
        };

    const tier: Tier = user?.data?.tier ?? "free";

    const value = {
        ...(searchParams.from && { from: searchParams.from }),
        ...(searchParams.to && { to: searchParams.to }),
    };

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
                        {/** Expenses Section */}
                        {/** Income Section */}
                        <Tabs defaultValue="income" className="px-[2%]">
                            <TabsList className="w-fit">
                                <TabsTrigger value="income">Income</TabsTrigger>
                                <TabsTrigger value="expense">Expense</TabsTrigger>
                            </TabsList>
                            <TabsContent value="income">
                                <div className="md:min-h-full bg-background/10">
                                    <p>Income</p>
                                </div>
                            </TabsContent>
                            <TabsContent value="expense">
                                <div className="md:min-h-full bg-background/10">
                                    {/** daily expense */}
                                    <DailyExpensesChart currency="USD" className="border-none shadow-none"/>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* <div className="mt-4 flex flex-col gap-4">
                            <ExpenseTabsSection
                                isEmpty={isEmpty}
                                accounts={accounts as any}
                                user={user as any}
                                tier={tier}
                                value={value as any}
                                defaultValue={defaultValue}
                            />
                            <IncomeTabsSection
                                isEmpty={isEmpty}
                                accounts={accounts as any}
                                user={user as any}
                                tier={tier}
                                value={value as any}
                                defaultValue={getDefaultDateRange("monthly", "income")}
                            />
                            <SpendingTabsSection
                                isEmpty={isEmpty}
                                initialPeriod={initialPeriod}
                                currency={(searchParams.currency as string) ?? "USD"}
                            />
                        </div> */}
                        {/* <CashflowCharts
                            currency={(searchParams.currency as string) ?? "USD"}
                            disableAllCharts={true}
                            tier={tier}
                        /> */}
                    </div>
                </ConnectAccountServerWrapper>
            </ContentLayout>
        </Suspense>
    );
}
