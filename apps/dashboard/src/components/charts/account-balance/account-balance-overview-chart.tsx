import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/use-media-query";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

// Import the type definitions
import { AccountBalanceDataType } from "@/types/analytics/types";

interface AccountBalanceOverviewChartProps
  extends React.HTMLAttributes<HTMLDivElement> {
  data?: Array<AccountBalanceDataType>;
  className?: string;
  balance?: number;
  link?: string;
  title?: string;
  chartHeights?: {
    mediumScreen: number;
    smallScreen: number;
    default: number;
  };
  startDate?: Date;
  dataPoints?: number;
  gradientColors?: {
    startColor: string;
    endColor: string;
  };
}

const generateRandomData = (
  count: number,
  startDate: Date,
): Array<AccountBalanceDataType> => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(
      startDate.getFullYear(),
      startDate.getMonth() + i,
      1,
    ).toISOString(),
    balance: Math.random() * 20 - 10,
  }));
};

const AccountBalanceOverviewChart: React.FC<AccountBalanceOverviewChartProps> =
  React.memo(
    ({
      data,
      className,
      balance = 86924.02,
      link,
      title = "Account Balance Overview Over Time",
      chartHeights = {
        mediumScreen: 600,
        smallScreen: 300,
        default: 300,
      },
      startDate = new Date(2023, 0, 1),
      dataPoints = 16,
      gradientColors = {
        startColor: "#333",
        endColor: "#666",
      },
      ...rest
    }) => {
      const isMediumScreen = useMediaQuery("(min-width: 768px)");
      const isSmallScreen = useMediaQuery("(min-width: 640px)");

      const dataset = useMemo(
        () =>
          data && data.length > 0
            ? data
            : generateRandomData(dataPoints, startDate),
        [data, dataPoints, startDate],
      );

      const chartHeight = useMemo(() => {
        if (isMediumScreen) return chartHeights.mediumScreen;
        if (isSmallScreen) return chartHeights.smallScreen;
        return chartHeights.default;
      }, [isMediumScreen, isSmallScreen, chartHeights]);

      const tooltipContent = useCallback((props: any) => {
        const { payload, label } = props;
        if (payload && payload.length) {
          return (
            <div className="bg-black bg-opacity-80 text-white p-2 rounded">
              <p>Date: {new Date(label).toLocaleDateString()}</p>
              <p>
                Balance: {payload[0].value >= 0 ? "+" : "-"}$
                {Math.abs(payload[0].value).toFixed(2)}
              </p>
            </div>
          );
        }
        return null;
      }, []);

      const isEmptyData =
        data === undefined ||
        data?.length === 0 ||
        data?.every((item) => item.balance === 0);

      return (
        <Card
          className={cn(
            "backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg",
            className,
          )}
          {...rest}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {link && (
              <Link href={link}>
                <p className="text-md text-[#606060] hover:text-foreground hover:font-bold">
                  View More{" "}
                  <ArrowUpRightFromSquare size={16} className="inline ml-2" />
                </p>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {isEmptyData ? (
              <div
                className="text-2xl font-bold text-center text-gray-500 mt-4 flex items-center justify-center bg-background/20 rounded-2xl border"
                style={{ minHeight: chartHeight }}
              >
                No data available. Your data may still be syncing.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={dataset}>
                  <Tooltip content={tooltipContent} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={`url(#growthGradient)`}
                    fill={`url(#growthGradient)`}
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient
                      id="growthGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={gradientColors.startColor}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor={gradientColors.endColor}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      );
    },
  );

AccountBalanceOverviewChart.displayName = "AccountBalanceOverviewChart";

export { AccountBalanceOverviewChart };
