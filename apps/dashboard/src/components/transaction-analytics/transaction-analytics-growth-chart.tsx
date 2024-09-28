"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@midday/ui/card"
import { ChartContainer } from "@midday/ui/chart"
import { cn } from "@midday/ui/cn"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

interface TransactionAnalyticsGrowthChartProps extends React.HTMLAttributes<HTMLDivElement> { 
    className?: string
}

export function TransactionAnalyticsGrowthChart({ className }: TransactionAnalyticsGrowthChartProps) {
    return (
        <Card className={cn("max-w-xs", className)}>
            <CardHeader>
                <CardTitle>Progress</CardTitle>
                <CardDescription>
                    You're average more steps a day this year than last year.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid auto-rows-min gap-2">
                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                        12,453
                        <span className="text-sm font-normal text-muted-foreground">
                            steps/day
                        </span>
                    </div>
                    <ChartContainer
                        config={{
                            steps: {
                                label: "Steps",
                                color: "hsl(var(--chart-1))",
                            },
                        }}
                        className="aspect-auto h-[32px] w-full"
                    >
                        <BarChart
                            accessibilityLayer
                            layout="vertical"
                            margin={{
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                            }}
                            data={[
                                {
                                    date: "2024",
                                    steps: 12435,
                                },
                            ]}
                        >
                            <Bar
                                dataKey="steps"
                                fill="var(--color-steps)"
                                radius={4}
                                barSize={32}
                            >
                                <LabelList
                                    position="insideLeft"
                                    dataKey="date"
                                    offset={8}
                                    fontSize={12}
                                    fill="white"
                                />
                            </Bar>
                            <YAxis dataKey="date" type="category" tickCount={1} hide />
                            <XAxis dataKey="steps" type="number" hide />
                        </BarChart>
                    </ChartContainer>
                </div>
                <div className="grid auto-rows-min gap-2">
                    <div className="flex items-baseline gap-1 text-2xl font-bold tabular-nums leading-none">
                        10,103
                        <span className="text-sm font-normal text-muted-foreground">
                            steps/day
                        </span>
                    </div>
                    <ChartContainer
                        config={{
                            steps: {
                                label: "Steps",
                                color: "hsl(var(--muted))",
                            },
                        }}
                        className="aspect-auto h-[32px] w-full"
                    >
                        <BarChart
                            accessibilityLayer
                            layout="vertical"
                            margin={{
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                            }}
                            data={[
                                {
                                    date: "2023",
                                    steps: 10103,
                                },
                            ]}
                        >
                            <Bar
                                dataKey="steps"
                                fill="var(--color-steps)"
                                radius={4}
                                barSize={32}
                            >
                                <LabelList
                                    position="insideLeft"
                                    dataKey="date"
                                    offset={8}
                                    fontSize={12}
                                    fill="hsl(var(--muted-foreground))"
                                />
                            </Bar>
                            <YAxis dataKey="date" type="category" tickCount={1} hide />
                            <XAxis dataKey="steps" type="number" hide />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}