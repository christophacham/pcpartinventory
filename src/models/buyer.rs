use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Buyer {
    pub id: Uuid,
    pub name: String,
    pub contact: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBuyerRequest {
    pub name: String,
    pub contact: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
}