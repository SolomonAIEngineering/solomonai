import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const lifetimeValueModelling: IntegrationConfig = {
  name: "Lifetime Value (LTV) Analysis",
  id: "lifetime-value-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Calculate the total expected revenue from a customer over their lifetime.",
  description:
    "Lifetime Value (LTV) Analysis measures the total revenue a business can expect from a customer over the entire relationship. It's crucial for businesses to understand customer value relative to acquisition costs.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "average_revenue",
      label: "Average Revenue per Customer",
      description: "Enter the average revenue per customer per period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "customer_lifespan",
      label: "Customer Lifespan",
      description: "Enter the average customer lifespan in periods",
      type: "number",
      required: true,
      value: 1,
      min: 1,
    },
    {
      id: "gross_margin",
      label: "Gross Margin",
      description: "Enter your gross margin as a decimal (e.g., 0.3 for 30%)",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "time_period",
      label: "Time Period",
      description: "Select the time period for the analysis",
      type: "select",
      required: true,
      value: "monthly",
      options: ["monthly", "quarterly", "annually"],
    },
  ],
  config: {
    resultFields: [
      { id: "lifetime_value", label: "Lifetime Value (LTV)" },
      { id: "total_revenue", label: "Total Revenue" },
      { id: "gross_profit", label: "Gross Profit" },
    ],
  },
  equation: {
    formula:
      "LTV = Average Revenue per Customer × Customer Lifespan × Gross Margin",
    variables: {
      "Average Revenue per Customer": {
        label: "Average Revenue per Customer",
        description: "Average revenue generated by a customer in one period",
        unit: "currency",
      },
      "Customer Lifespan": {
        label: "Customer Lifespan",
        description:
          "Average number of periods a customer remains with the business",
        unit: "periods",
      },
      "Gross Margin": {
        label: "Gross Margin",
        description: "Gross margin as a decimal",
        unit: "percentage",
      },
    },
    calculate: (variables) => {
      const averageRevenue = variables["Average Revenue per Customer"] ?? 0;
      const customerLifespan = variables["Customer Lifespan"] ?? 1;
      const grossMargin = variables["Gross Margin"] ?? 0;

      const totalRevenue = averageRevenue * customerLifespan;
      const lifetimeValue = totalRevenue * grossMargin;
      const grossProfit = lifetimeValue;

      return {
        lifetime_value: lifetimeValue,
        total_revenue: totalRevenue,
        gross_profit: grossProfit,
      };
    },
  },
  model_type: ModelType.FinancialModel,
  api_version: "v1.0.0",
  is_public: false,
  tags: ["analysis", "financial", "projection"],
  integration_type: undefined,
  webhook_url: "https://gateway.solomon-ai-platform.com",
  supported_features: undefined,
  last_sync_at: new Date().toISOString(),
  sync_status: undefined,
  auth_method: "none",
};

export default lifetimeValueModelling;
