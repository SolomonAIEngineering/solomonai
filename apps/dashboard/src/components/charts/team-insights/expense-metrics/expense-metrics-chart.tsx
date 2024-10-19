"use client";

import { getBackendClient } from "@/utils/backend";
import { getUser } from "@midday/supabase/cached-queries";
import { DataPoint, ZoomableChart } from "@midday/ui/charts/base/zoomable-chart";
import { GetExpenseMetricsProfileTypeEnum, GetExpenseMetricsRequest } from "@solomon-ai/client-typescript-sdk";
import { format, startOfMonth, subMonths } from 'date-fns';
import React, { Suspense, useMemo } from 'react';

interface ExpenseMetricsChartProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    from?: string;
    to?: string;
    pageNumber?: string;
    pageSize?: string;
    currency: string;
}

const useExpenseMetrics = (userId: string, pageNumber: string, pageSize: string) => {
    return useMemo(async () => {
        const c = getBackendClient();
        const request: GetExpenseMetricsRequest = {
            userId,
            pageNumber: pageNumber,
            pageSize: pageSize,
            profileType: GetExpenseMetricsProfileTypeEnum.Business
        };
        return await c.financialServiceApi.getExpenseMetrics(request);
    }, [userId, pageNumber, pageSize]);
};

const transformExpenseData = (expenseMetrics: any[]): DataPoint[] => {
    return expenseMetrics?.map((expense) => ({
        date: expense.month ? format(new Date(expense.month), 'yyyy-MM-dd') : '',
        events: expense.totalExpenses ?? 0
    })) || [];
};

const ExpenseMetricsChartContent: React.FC<ExpenseMetricsChartProps> = async ({
    className,
    from,
    to,
    currency,
    pageNumber = "1",
    pageSize = "150"
}) => {
    const today = new Date();
    const defaultFrom = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
    const defaultTo = format(today, 'yyyy-MM-dd');
    const effectiveFrom = from || defaultFrom;
    const effectiveTo = to || defaultTo;

    const user = await getUser();
    if (!user || !user.data?.id) return null;

    const userId = user.data.id;
    const res = await useExpenseMetrics(userId, pageNumber, pageSize);

    if (!res.expenseMetrics) return null;

    const data = transformExpenseData(res.expenseMetrics);
    const hasData = data.length > 0;

    return (
        <ZoomableChart
            data={hasData ? data : [{ date: effectiveFrom, events: 0 }, { date: effectiveTo, events: 0 }]}
            dataNameKey="expenses"
            height={500}
            footerDescription={hasData ? "Total expenses" : "No expense data available for the selected period"}
            chartType="area"
            description={hasData ? "Daily expenses" : "No expenses recorded"}
            title={`Daily Expenses (${format(new Date(effectiveFrom), 'MMM d, yyyy')} - ${format(new Date(effectiveTo), 'MMM d, yyyy')})`}
            className={!hasData ? "opacity-50" : className}
        />
    );
};

const ExpenseMetricsChart: React.FC<ExpenseMetricsChartProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <p>Loading expenses chart...</p>
            </div>
        }>
            <ExpenseMetricsChartContent {...props} />
        </Suspense>
    );
};

export { ExpenseMetricsChart };
