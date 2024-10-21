import { format, isValid, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';
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
import { formatAmount, getYAxisWidth, roundToNearestFactor } from "../../../lib/chart-utils";
import { generatePayloadArray } from "../../../lib/random/generator";
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
    ChartContainer as BaseChartContainer,
    ChartConfig,
    ChartTooltip,
    ChartTooltipContent,
} from '../../chart';
import { ChartContainer } from "./chart-container";

import { BiRightArrow } from 'react-icons/bi';
import { BarChartMultiDataPoint, ChartDataPoint } from '../../../types/chart';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../sheet';
import { useWrapperState } from "./chart-wrapper";

type ChartType = 'line' | 'bar' | 'area';

interface AnalyticsChartProps<T extends BarChartMultiDataPoint> {
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
    currency: string;
    height?: number;
    locale?: string;
    enableAssistantMode?: boolean;
    disabled?: boolean;
}

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

const AnalyticsChart = <T extends BarChartMultiDataPoint>({
    chartData: propData,
    title,
    description,
    footerDescription,
    dataKeys,
    colors,
    trendKey,
    yAxisFormatter,
    chartType,
    stacked = false,
    currency,
    height = 400,
    locale,
    enableAssistantMode,
    disabled = false,
}: AnalyticsChartProps<T>) => {
    const [drilldownData, setDrilldownData] = useState<T | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [aiModalOpenState, setAiModalOpenState] = useState<boolean>(false);
    const { isOpen, toggleOpen } = useWrapperState(aiModalOpenState);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const data = useMemo(() => {
        if (disabled) {
            return [];
        }
        return propData;
    }, [disabled, propData]);

    const [dataSet, setDataSet] = useState<T[]>(data.length > 0 ? data : []);

    useEffect(() => {
        setDataSet(data);
    }, [data]);

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
            dataSet
                .map((item) => {
                    const date = parseDate(item.date);
                    return {
                        ...item,
                        dateTime: date ? date.getTime() : null,
                    };
                })
                .filter((item) => item.dateTime !== null)
                .sort((a, b) => (a.dateTime ?? 0) - (b.dateTime ?? 0)),
        [dataSet],
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

    const getLabel = (value: number): string => {
        return formatAmount({
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
            currency,
            amount: value,
            locale,
        });
    };

    const maxYAxisValue = roundToNearestFactor(formattedData.map(item => Math.max(...dataKeys.map(key => Number(item[key])))));
    const yAxisLabelMaxValue: string = getLabel(maxYAxisValue);
    const yAxisWidth = getYAxisWidth(yAxisLabelMaxValue);

    const filterDataByDateRange = (dateRange: { from: Date; to: Date }) => {
        const { from, to } = dateRange;
        setDataSet(
            data.filter(({ date }) => {
                const itemDate = new Date(date);
                return itemDate >= from && itemDate <= to;
            }) as T[],
        );
    };

    const renderChart = () => {
        const commonProps = {
            data: formattedData,
            margin: { top: 20, right: 30, left: 20, bottom: 10 },
            onClick: handleDataPointClick,
        };

        const commonAxisProps = {
            stroke: "#888888",
            fontSize: 12,
            tickLine: false,
            axisLine: false,
            tick: {
                fill: "#606060",
                fontSize: 12,
                fontFamily: "var(--font-sans)",
            },
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                        <XAxis
                            {...commonAxisProps}
                            dataKey="date"
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            {...commonAxisProps}
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter || getLabel}
                            width={yAxisWidth}
                            tickMargin={10}
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
                            {...commonAxisProps}
                            dataKey="date"
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            {...commonAxisProps}
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter || getLabel}
                            width={yAxisWidth}
                            tickMargin={10}
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
                            {...commonAxisProps}
                            dataKey="date"
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={formatDate}
                        />
                        <YAxis
                            {...commonAxisProps}
                            domain={[minValue * 0.9, maxValue * 1.1]}
                            tickFormatter={yAxisFormatter || getLabel}
                            width={yAxisWidth}
                            tickMargin={10}
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
        if (isNaN(value)) return "N/A";
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
            default:
                return [
                    "Insufficient data to provide recommendations",
                    "Consider reviewing your data input for accuracy",
                    "Ensure all necessary financial information is being tracked",
                ];
        }
    };

    // get the earliest and latest dates in the data
    const sortedData = data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const earliestDate = sortedData[0]?.date
        ? new Date(sortedData[0].date)
        : undefined;
    const latestDate = sortedData[sortedData.length - 1]?.date
        ? new Date(sortedData[sortedData.length - 1]!.date)
        : undefined;

    return (
        <ChartContainer<T>
            data={data}
            dataSet={dataSet}
            setDataSet={setDataSet}
            height={height}
            earliestDate={earliestDate ?? new Date()}
            latestDate={latestDate ?? new Date()}
            filterDataByDateRange={filterDataByDateRange}
            enableAssistantMode={enableAssistantMode}
            disabled={disabled}
        >
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
                            <BaseChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {renderChart()}
                                </ResponsiveContainer>
                            </BaseChartContainer>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-1 justify-between items-start gap-2 text-sm">
                           
                        <div className="flex gap-2 font-medium leading-none">
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
                            {footerDescription && (
                                <div className="leading-none text-muted-foreground">{footerDescription}</div>
                            )}
                        </div>
                        
                        <Button variant="ghost" onClick={() => setIsSheetOpen(true)} className='text-sm'>
                            View More
                            <BiRightArrow className="inline ml-1" />
                        </Button>
                    </CardFooter>
                </Card>

                <DetailedAnalyticsSheet<T>
                    isOpen={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    formattedData={formattedData}
                    dataKeys={dataKeys}
                    getLabel={getLabel}
                />
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
                                                {key as string}: {isNaN(value) ? 'N/A' : (yAxisFormatter ? yAxisFormatter(value) : getLabel(Number(value.toFixed(2))))}
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
        </ChartContainer>
    );
};

interface DetailedAnalyticsSheetProps<T extends BarChartMultiDataPoint> {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    formattedData: T[];
    dataKeys: (keyof T)[];
    getLabel: (value: number) => string;
}

const DetailedAnalyticsSheet = <T extends BarChartMultiDataPoint>({
    isOpen,
    onOpenChange,
    formattedData,
    dataKeys,
    getLabel,
}: DetailedAnalyticsSheetProps<T>) => {
    const getDataSummary = () => {
        const summary = dataKeys.reduce((acc, key) => {
            const values = formattedData.map(item => Number(item[key]));
            acc[key as string] = {
                min: Math.min(...values),
                max: Math.max(...values),
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                total: values.reduce((sum, val) => sum + val, 0),
            };
            return acc;
        }, {} as Record<string, { min: number; max: number; average: number; total: number }>);
        return summary;
    };

    const getTopPerformers = () => {
        return dataKeys.map(key => {
            const sorted = [...formattedData].sort((a, b) => Number(b[key]) - Number(a[key]));
            return {
                key,
                topDays: sorted.slice(0, 5).map(item => ({
                    date: formatDate(item.date),
                    value: Number(item[key]),
                })),
            };
        });
    };

    const getGrowthRate = () => {
        return dataKeys.map(key => {
            const firstValue = Number(formattedData[0]?.[key] ?? 0);
            const lastValue = Number(formattedData[formattedData.length - 1]?.[key] ?? 0);
            const growthRate = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
            return { key, growthRate };
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[100vw]">
                <SheetHeader>
                    <SheetTitle>Detailed Analytics</SheetTitle>
                    <SheetDescription>
                        In-depth analysis of your financial data
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold mb-2">Data Summary</h3>
                        {Object.entries(getDataSummary()).map(([key, summary]) => (
                            <div key={key} className="mb-4">
                                <h4 className="font-medium">{key}</h4>
                                <p>Min: {getLabel(summary.min)}</p>
                                <p>Max: {getLabel(summary.max)}</p>
                                <p>Average: {getLabel(summary.average)}</p>
                                <p>Total: {getLabel(summary.total)}</p>
                            </div>
                        ))}
                    </section>
                    <section>
                        <h3 className="text-lg font-semibold mb-2">Top Performers</h3>
                        {getTopPerformers().map(({ key, topDays }) => (
                            <div key={String(key)} className="mb-4">
                                <h4 className="font-medium">{String(key)}</h4>
                                <ul>
                                    {topDays.map((day, index) => (
                                        <li key={index}>
                                            {day.date}: {getLabel(day.value)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </section>
                    <section>
                        <h3 className="text-lg font-semibold mb-2">Growth Rates</h3>
                        {getGrowthRate().map(({ key, growthRate }) => (
                            <div key={String(key)} className="mb-2">
                                <span className="font-medium">{String(key)}:</span>{' '}
                                {growthRate.toFixed(2)}%
                                {growthRate > 0 ? (
                                    <TrendingUp className="inline ml-1 text-[#2DB78A] h-4 w-4" />
                                ) : (
                                    <TrendingDown className="inline ml-1 text-[#E2366F] h-4 w-4" />
                                )}
                            </div>
                        ))}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export { AnalyticsChart };
