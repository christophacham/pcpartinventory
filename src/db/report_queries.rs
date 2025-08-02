use sqlx::PgPool;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlySummary {
    pub month_year: String,
    pub total_sales: Option<Decimal>,
    pub total_profit: Option<Decimal>,
    pub pcs_sold: i64,
    pub average_days_held: Option<Decimal>,
    pub average_profit_margin: Option<Decimal>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfitAnalysis {
    pub component_type: String,
    pub avg_cost: Option<Decimal>,
    pub total_usage: i64,
    pub avg_profit_contribution: Option<Decimal>,
}

pub async fn get_monthly_summary(pool: &PgPool) -> Result<Vec<MonthlySummary>> {
    let summary = sqlx::query_as!(
        MonthlySummary,
        r#"
        SELECT 
            TO_CHAR(sale_date, 'YYYY-MM') as month_year,
            SUM(actual_sale_price) as total_sales,
            SUM(profit) as total_profit,
            COUNT(*) as pcs_sold,
            AVG(days_held::decimal) as average_days_held,
            AVG(profit_percentage) as average_profit_margin
        FROM pcs 
        WHERE sale_date IS NOT NULL
        GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
        ORDER BY month_year DESC
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(summary)
}

pub async fn get_profit_analysis(pool: &PgPool) -> Result<Vec<ProfitAnalysis>> {
    let analysis = sqlx::query_as!(
        ProfitAnalysis,
        r#"
        SELECT 
            component_type::text as component_type,
            AVG(cost) as avg_cost,
            COUNT(*) as total_usage,
            AVG(cost) as avg_profit_contribution
        FROM pc_components
        GROUP BY component_type
        ORDER BY avg_cost DESC
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(analysis)
}