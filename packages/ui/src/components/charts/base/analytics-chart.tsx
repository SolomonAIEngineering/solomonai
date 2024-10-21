import { format, isValid, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { FC, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '../../button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../../card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '../../chart';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../dialog';

export interface ChartDataPoint {
    date: string;
    [key: string]: number | string;
}

type ChartType = 'line' | 'bar' | 'area';

interface AnalyticsChartProps<T extends ChartDataPoint> {
    chartData: T[];
    title: string;
    description: string;
    footerDescription?: string;
    dataKeys: (keyof T)[];
    colors: string[];
    trendKey: keyof T;
    yAxisFormatter?: (value: number) => string;
    chartType: ChartType;
    stacked?: boolean;
}

// Utility function to parse dates

const parseDate = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isValid(date) ? date : null;
};

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = parseDate(dateString);
    return date ? format(date, 'MMM d, yyyy') : 'Invalid Date';
};

const AnalyticsChart = <T extends ChartDataPoint>({
    chartData,
    title,
    description,
    footerDescription,
    dataKeys,
    colors,
    trendKey,
    yAxisFormatter = (value) => `$${value.toFixed(2)}`,
    chartType,
    stacked = false,
}: AnalyticsChartProps<T>) => {
    const [drilldownData, setDrilldownData] = useState<T | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        dataKeys.forEach((key, index) => {
            config[key as string] = {
                label: key as string,
                color: colors[index] || `hsl(var(--chart-${index + 1}))`,
            };
        });
        return config;
    }, [dataKeys, colors]);

    const formattedData = useMemo(
        () =>
            chartData
                .map((item) => {
                    const date = parseDate(item.date);
                    return {
                        ...item,
                        dateTime: date ? date.getTime() : null,
                    };
                })
                .filter((item) => item.dateTime !== null)
                .sort((a, b) => (a.dateTime ?? 0) - (b.dateTime ?? 0)),
        [chartData],
    );

    const [minValue, maxValue] = useMemo(() => {
        const allValues = formattedData.flatMap((item) =>
            dataKeys.map((key) => Number(item[key])),
        );
        return [Math.min(...allValues), Math.max(...allValues)];
    }, [formattedData, dataKeys]);

    const percentageChange = useMemo(() => {
        if (formattedData.length < 2) return 0;
        const firstValue = Number(formattedData[0]?.[trendKey] ?? 0);
        const lastValue = Number(formattedData[formattedData.length - 1]?.[trendKey] ?? 0);
        return firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
    }, [formattedData, trendKey]);

    const isTrendingUp = percentageChange > 0;

    const handleDataPointClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            setDrilldownData(data.activePayload[0].payload);
            setIsDialogOpen(true);
        }
    };

    const formatDate = (dateString: string) => {
        const date = parseDate(dateString);
        return date ? format(date, 'MMM d, yyyy') : 'Invalid Date';
    };

    const renderChart = () => {
        const commonProps = {
            data: formattedData,
            margin: { top: 20, right: 30, left: 20, bottom: 10 },
            onClick: handleDataPointClick,
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={formatDate}
                                />
                            }
                        />
                        {dataKeys.map((key, index) => (
                            <Bar
                                key={key as string}
                                dataKey={key as string}
                                fill={colors[index] || `hsl(var(--chart-${index + 1}))`}
                                stackId={stacked ? "stack" : undefined}
                            />
                        ))}
                    </BarChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={formatDate}
                                />
                            }
                        />
                        {dataKeys.map((key, index) => (
                            <Area
                                key={key as string}
                                type="monotone"
                                dataKey={key as string}
                                fill={colors[index] || `hsl(var(--chart-${index + 1}))`}
                                stroke={colors[index] || `hsl(var(--chart-${index + 1}))`}
                                fillOpacity={0.3}
                                stackId={stacked ? "stack" : undefined}
                            />
                        ))}
                    </AreaChart>
                );
            default:
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={formatDate}
                                />
                            }
                        />
                        {dataKeys.map((key, index) => (
                            <Line
                                key={key as string}
                                type="monotone"
                                dataKey={key as string}
                                stroke={colors[index] || `hsl(var(--chart-${index + 1}))`}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    const getActivityLevel = (value: number) => {
        if (value > maxValue * 0.8) return "High";
        if (value > maxValue * 0.5) return "Moderate";
        return "Low";
    };

    const getRecommendations = (value: number) => {
        const activityLevel = getActivityLevel(value);
        switch (activityLevel) {
            case "High":
                return [
                    "Review your high number of transactions for any unnecessary spending",
                    "Consider setting up automated savings for excess funds",
                    "Look into rewards programs that benefit frequent transactions",
                ];
            case "Moderate":
                return [
                    "Analyze your spending patterns to identify areas for potential savings",
                    "Review your budget to ensure it aligns with your current spending",
                    "Consider setting financial goals based on your consistent activity",
                ];
            case "Low":
                return [
                    "Review your budget to ensure all necessary expenses are accounted for",
                    "Look for opportunities to increase your savings or investments",
                    "Explore ways to diversify your income or increase cash flow",
                ];
        }
    };

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                    <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:p-6">
                    <div className="aspect-auto h-[400px] w-full">
                        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="font-medium leading-none">
                        {isTrendingUp ? (
                            <>
                                Trending up by{' '}
                                <span className="text-[#2DB78A]">{percentageChange.toFixed(2)}% </span>{' '}
                                this period <TrendingUp className="inline text-[#2DB78A] h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Trending down by{' '}
                                <span className="text-[#E2366F]">{Math.abs(percentageChange).toFixed(2)}% </span>{' '}
                                this period <TrendingDown className="inline text-[#E2366F] h-4 w-4" />
                            </>
                        )}
                    </div>
                    {footerDescription && (
                        <div className="leading-none text-muted-foreground">{footerDescription}</div>
                    )}
                </CardFooter>
            </Card>

            {/* Drilldown Dialog */}
            {drilldownData && (
                <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(false)}>
                    <DialogContent className="sm:max-w-[600px] p-[2%]">
                        <DialogHeader>
                            <DialogTitle>Detailed Insights</DialogTitle>
                            <DialogDescription>
                                Analysis for {formatDate(drilldownData.date)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                            {dataKeys.map((key) => {
                                const value = Number(drilldownData[key]);
                                return (
                                    <div key={key as string}>
                                        <h3 className="text-lg font-semibold">
                                            {key as string}: {isNaN(value) ? 'N/A' : yAxisFormatter(value)}
                                        </h3>
                                        <p>Activity Level: {getActivityLevel(value)}</p>
                                    </div>
                                );
                            })}
                            <div>
                                <h4 className="font-semibold">Recommendations:</h4>
                                <ul className="list-disc pl-5">
                                    {getRecommendations(Number(drilldownData[trendKey]) || 0).map(
                                        (rec, index) => (
                                            <li key={index}>{rec}</li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export { AnalyticsChart };
