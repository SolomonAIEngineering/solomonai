import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { FC, useMemo } from 'react';
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
                .map((item) => ({
                    ...item,
                    dateTime: new Date(item.date).getTime(),
                }))
                .filter((item) => !isNaN(item.dateTime))
                .sort((a, b) => a.dateTime - b.dateTime),
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

    const renderChart = () => {
        const commonProps = {
            data: formattedData,
            margin: { top: 20, right: 30, left: 20, bottom: 10 },
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
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-fit"
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

    return (
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
    );
};

export { AnalyticsChart };
