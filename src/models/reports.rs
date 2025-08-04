use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MonthlySummary {
    pub month_year: String,
    pub total_sales: Option<Decimal>,
    pub total_profit: Option<Decimal>,
    pub pcs_sold: i64,
    pub average_days_held: Option<Decimal>,
    pub average_profit_margin: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ProfitAnalysis {
    pub component_type: String,
    pub avg_cost: Option<Decimal>,
    pub total_usage: i64,
    pub avg_profit_contribution: Option<Decimal>,
}