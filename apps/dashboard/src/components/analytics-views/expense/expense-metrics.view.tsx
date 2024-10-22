"use client";

import { formatCategoryName } from "@/utils/utils";
import { AnalyticsChart } from "@midday/ui/charts/base/analytics-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { CategoryMonthlyExpenditure, ExpenseMetrics, MonthlyExpenditure } from "@solomon-ai/client-typescript-sdk";
import { useMemo, useState } from "react";

interface ExpenseMetricsViewProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    userId: string;
    currency: string;
    expenseMetrics?: Array<ExpenseMetrics>;
    monthlyExpenseMetrics?: Array<MonthlyExpenditure>;
    expenseMetricsCategories?: Array<CategoryMonthlyExpenditure>;
}

const ExpenseMetricsView: React.FC<ExpenseMetricsViewProps> = ({ className, userId, currency, expenseMetrics, monthlyExpenseMetrics, expenseMetricsCategories }) => {
    // format all data into positive values (only use abs)
    if (expenseMetrics) {
        expenseMetrics.forEach((item) => {
            item.totalExpenses = Math.abs(item.totalExpenses || 0);
        });
    }

    if (monthlyExpenseMetrics) {
        monthlyExpenseMetrics.forEach((item) => {
            item.totalSpending = Math.abs(item.totalSpending || 0);
        });
    }

    if (expenseMetricsCategories) {
        expenseMetricsCategories.forEach((item) => {
            item.totalSpending = Math.abs(item.totalSpending || 0);
        });
    }

    return (
        <div className="space-y-6">
            {/* Render your metrics here using the data */}
            <ExpenseMetricsOverTime expenseMetrics={expenseMetrics} currency={currency}/>
        </div>
    )
}


interface ExpenseMetricsOverTimeProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    expenseMetrics?: Array<ExpenseMetrics>;
    currency: string;
    disabled?: boolean;
}

const ExpenseMetricsOverTime: React.FC<ExpenseMetricsOverTimeProps> = ({
    className,
    expenseMetrics,
    currency,
    disabled = false
}) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = useMemo(() => {
        if (!expenseMetrics) return ['All'];
        return ['All', ...new Set(expenseMetrics.map(metric => metric.personalFinanceCategoryPrimary).filter(Boolean))];
    }, [expenseMetrics]);
    
    const dataKeys = ["expense"];

    // Filter the expense metrics based on the selected category
    const filteredExpenseMetrics = useMemo(() => {
        if (!expenseMetrics) return [];
        if (selectedCategory === 'All') return expenseMetrics;
        return expenseMetrics.filter(metric => metric.personalFinanceCategoryPrimary === selectedCategory);
    }, [expenseMetrics, selectedCategory]);

    // now we check if the filtered expense metrics data and if not we return a div stating no data exists for this
    if (!filteredExpenseMetrics || filteredExpenseMetrics.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No data available for this category</p>
            </div>
        );
    }

    const chartData = filteredExpenseMetrics.map((item) => {
        const year = parseInt(item.month?.toString().slice(0, 4) || "");
        const month = parseInt(item.month?.toString().slice(4, 6) || "") - 1; // JavaScript months are 0-indexed
        const date = new Date(year, month);
        return {
            date: date.toISOString().slice(0, 7), // Format as "YYYY-MM"
            expense: item.totalExpenses || 0
        };
    });

    const expansiveChartData = filteredExpenseMetrics
        .map((item) => ({
            date: new Date(parseInt(item.month?.toString().slice(0, 4) || ""), parseInt(item.month?.toString().slice(4, 6) || "") - 1),
            totalExpense: item.totalExpenses || 0
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((item, index, array) => ({
            date: item.date.toISOString().slice(0, 7), // Format as "YYYY-MM"
            growthRate: index > 0 
                ? ((item.totalExpense - (array[index - 1]?.totalExpense || 0)) / (array[index - 1]?.totalExpense || 1)) * 100 
                : 0
        }));

    const expansiveChartDataKeys = Object.keys(expansiveChartData[0] || {}).filter(key => key !== "date");


    return (
        <div className="space-y-6 flex flex-col gap-2">
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger className="w-[180px] mb-4 rounded-2xl">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground">
                    {categories.map((category) => (
                        <SelectItem key={category} value={category as string}>
                            {formatCategoryName(category as string)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            <div className="flex flex-col w-full space-y-16">
                <div className="md:min-h-[650px] w-full">
                    <AnalyticsChart
                        chartData={chartData}
                        title={`Expense Over Time - ${formatCategoryName(selectedCategory)}`}
                        description={`Net expense over time in ${currency} for ${formatCategoryName(selectedCategory)}`}
                        dataKeys={dataKeys as any}
                        colors={["#333"]}
                        trendKey="expense"
                        chartType="area"
                        currency={currency}
                        height={400}
                        enableAssistantMode={false}
                        disabled={disabled}
                    />
                </div>

                <div className="md:min-h-[650px] w-full">
                    <AnalyticsChart
                        chartData={expansiveChartData}
                        title={`Expense Growth Rate - ${formatCategoryName(selectedCategory)}`}
                        description={`Month-over-month expense growth rate for ${formatCategoryName(selectedCategory)}`}
                        dataKeys={["growthRate"]}
                        colors={["#333"]}
                        trendKey="growthRate"
                        chartType="line"
                        currency={currency}
                        height={400}
                        enableAssistantMode={false}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    )
}

export { ExpenseMetricsView };
