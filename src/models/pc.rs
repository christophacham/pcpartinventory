use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};
use rust_decimal::Decimal;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Pc {
    pub id: Uuid,
    pub pc_name: String,
    pub build_date: Option<NaiveDate>,
    pub list_date: Option<NaiveDate>,
    pub sale_date: Option<NaiveDate>,
    pub days_listed: Option<i32>,
    pub days_held: Option<i32>,
    pub buyer_id: Option<Uuid>,
    pub platform: Option<String>,
    pub platform_reference: Option<String>,
    pub intended_price: Option<Decimal>,
    pub actual_sale_price: Option<Decimal>,
    pub total_cost: Option<Decimal>,
    pub profit: Option<Decimal>,
    pub profit_percentage: Option<Decimal>,
    pub notes: Option<String>,
    pub status: PcStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "pc_status", rename_all = "lowercase")]
pub enum PcStatus {
    Building,
    Listed,
    Sold,
    Archived,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePcRequest {
    pub pc_name: String,
    pub build_date: Option<NaiveDate>,
    pub intended_price: Option<Decimal>,
    pub notes: Option<String>,
    pub components: Vec<super::component::CreateComponentRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePcRequest {
    pub pc_name: Option<String>,
    pub build_date: Option<NaiveDate>,
    pub list_date: Option<NaiveDate>,
    pub intended_price: Option<Decimal>,
    pub notes: Option<String>,
    pub status: Option<PcStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SellPcRequest {
    pub sale_date: NaiveDate,
    pub actual_sale_price: Decimal,
    pub buyer_id: Option<Uuid>,
    pub platform: Option<String>,
    pub platform_reference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PcWithComponents {
    #[serde(flatten)]
    pub pc: Pc,
    pub components: Vec<super::component::Component>,
}