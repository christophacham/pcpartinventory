use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct InventoryPart {
    pub id: Uuid,
    pub component_type: String,
    pub component_name: String,
    pub buy_in_price: Option<Decimal>,
    pub typical_sell_price: Option<Decimal>,
    pub quantity_available: i32,
    pub notes: Option<String>,
    pub purchase_link: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInventoryPartRequest {
    pub component_type: String,
    pub component_name: String,
    pub buy_in_price: Option<Decimal>,
    pub typical_sell_price: Option<Decimal>,
    pub quantity_available: Option<i32>,
    pub notes: Option<String>,
    pub purchase_link: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInventoryPartRequest {
    pub component_name: Option<String>,
    pub buy_in_price: Option<Decimal>,
    pub typical_sell_price: Option<Decimal>,
    pub quantity_available: Option<i32>,
    pub notes: Option<String>,
    pub purchase_link: Option<String>,
}