"use client";

import {
    AccountBalanceDataType,
    AccountBalanceGrowthRateDataType,
    TimeseriesDataType,
} from "@/types/analytics/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { AccountBalanceHistory } from "@solomon-ai/client-typescript-sdk";
import { TemplatizedChart } from "../template/chart-template";
import { MergedAccountChart } from "../template/merged-chart-template";
import { AccountBalanceGrowthRateChart } from "./account-balance-growth-rate-chart";
import { AccountBalanceOverviewChart } from "./account-balance-overview-chart";

interface AccountBalanceSummaryChartsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  link?: string;
  accountId?: string;
  historicalAccountBalance: Array<AccountBalanceHistory>;
}

const AccountBalanceSummaryCharts: React.FC<
  AccountBalanceSummaryChartsProps
> = ({ className, link, accountId, historicalAccountBalance }) => {
  // given the account balance history, we can calculate the balance growth rate
  // and display it in a chart
  const growthRate: Array<AccountBalanceGrowthRateDataType> =
    historicalAccountBalance.map((balance, index) => {
      const currentBalance = balance.balance ?? 0;
      const previousBalance =
        historicalAccountBalance[index - 1]?.balance ?? currentBalance;
      const growthRate =
        previousBalance !== 0
          ? (currentBalance - previousBalance) / previousBalance
          : 0;
      return {
        date: balance.time?.toISOString() ?? "",
        growthRate,
      };
    });

    // transform the account balance history data to the format expected by the chart
    const balanceData: Array<AccountBalanceDataType> =
    historicalAccountBalance.map((balance) => ({
      date: balance.time?.toISOString() ?? "",
      balance: balance.balance ?? 0,
    }));

    const timeSeriesData: Array<TimeseriesDataType> = historicalAccountBalance.map((balance) => ({
        date: balance.time?.toISOString() ?? "",
        value: balance.balance ?? 0,
    }));

  return (
    <>
      <Tabs defaultValue="balance" className={className}>
        <TabsList className="w-fit">
          <TabsTrigger value="balance" className="rounded-2xl">
            Balance
          </TabsTrigger>
          <TabsTrigger value="balance-growth-rate" className="rounded-2xl">
            Balance Growth Rate
          </TabsTrigger>
        </TabsList>
        <TabsContent value="balance">
            <AccountBalanceOverviewChart className="border-none shadow-none" link={link} data={balanceData}/>
          {/* <TemplatizedChart<AccountBalanceDataType>
            data={balanceData}
            title="Account Balance Over Time"
            dataKey="balance"
            xAxisKey="date"
            chartType="bar"
            dataId="balanceChartGradient"
            // colorScheme={{
            //     stroke: "url(#balanceChartGradient)",
            //     fill: "url(#balanceChartGradient)"
            // }}
            tooltipFormatter={(value, name) => [
              `$${value.toFixed(2)}`,
              "Balance",
            ]}
            className="border-none shadow-none"
          /> */}
            <MergedAccountChart
                title="Custom Growth Rate"
                data={timeSeriesData}
                dataKey="growthRate"
                valueSuffix="%"
                tooltipLabel="Growth Rate"
                chartHeights={{ mediumScreen: 600, smallScreen: 450, default: 400 }}
                gradientColors={{ startColor: "#333", endColor: "#666" }}
                className="border-none shadow-none"
            />
        </TabsContent>
        <TabsContent value="balance-growth-rate">
          <AccountBalanceGrowthRateChart
            data={growthRate}
            balance={100000}
            link={link}
            title="Account Balance Growth Over Time"
            chartHeights={{
              mediumScreen: 600,
              smallScreen: 400,
              default: 300,
            }}
            gradientColors={{
              startColor: "url(#growthGradient)",
              endColor: "url(#growthGradient)",
            }}
            className="border-none shadow-none"
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export { AccountBalanceSummaryCharts };
