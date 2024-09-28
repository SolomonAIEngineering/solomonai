import { TransactionSchema } from "@midday/supabase/types"
import { cn } from "@midday/ui/cn"
import { TransactionAnalyticsActiveEnergyChart } from "./transaction-analytics-active-energy-chart"
import { TransactionAnalyticsActivityRingsChart } from "./transaction-analytics-activity-rings-chart"
import { TransactionAnalyticsGrowthChart } from "./transaction-analytics-growth-chart"
import { TransactionAnalyticsMerchantChart } from "./transaction-analytics-merchant-chart"
import { TransactionAnalyticsProgressChart } from "./transaction-analytics-progress-chart"
import { TransactionAnalyticsSleepChart } from "./transaction-analytics-sleep-chart"
import { TransactionAnalyticsStepsChart } from "./transaction-analytics-steps-chart"

interface TransactionAnalyticsProps extends React.HTMLAttributes<HTMLDivElement> { 
    className?: string
    transactions: Array<TransactionSchema>
}

export function TransactionAnalyticsCharts({ className, transactions }: TransactionAnalyticsProps) {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex flex-row gap-4">
                <TransactionAnalyticsActivityRingsChart className="w-full" />
                <TransactionAnalyticsActiveEnergyChart className="w-full" />
                <TransactionAnalyticsSleepChart className="w-full" />
                <TransactionAnalyticsGrowthChart className="w-full" />
                <TransactionAnalyticsMerchantChart className="w-full" />
                <TransactionAnalyticsProgressChart className="w-full" />
                <TransactionAnalyticsStepsChart className="w-full" />
            </div>
        </div>
    )
}