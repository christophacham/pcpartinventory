use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rust_decimal::Decimal;
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Component {
    pub id: Uuid,
    pub pc_id: Uuid,
    pub component_type: ComponentType,
    pub component_name: String,
    pub cost: Decimal,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "component_type", rename_all = "lowercase")]
pub enum ComponentType {
    Cpu,
    Gpu,
    Motherboard,
    Ram,
    Storage1,
    Storage2,
    Psu,
    Case,
    CpuCooler,
    Additional,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateComponentRequest {
    pub component_type: ComponentType,
    pub component_name: String,
    pub cost: Decimal,
    pub notes: Option<String>,
}