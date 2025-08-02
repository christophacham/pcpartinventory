use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;

use crate::models::{Buyer, CreateBuyerRequest, Pc, PcStatus};

pub async fn get_all_buyers(pool: &PgPool) -> Result<Vec<Buyer>> {
    let buyers = sqlx::query_as!(
        Buyer,
        r#"
        SELECT id, name, contact, email, phone, created_at
        FROM buyers 
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(buyers)
}

pub async fn create_buyer(pool: &PgPool, request: CreateBuyerRequest) -> Result<Buyer> {
    let buyer = sqlx::query_as!(
        Buyer,
        r#"
        INSERT INTO buyers (id, name, contact, email, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, contact, email, phone, created_at
        "#,
        Uuid::new_v4(),
        request.name,
        request.contact,
        request.email,
        request.phone
    )
    .fetch_one(pool)
    .await?;
    
    Ok(buyer)
}

pub async fn get_buyer_purchases(pool: &PgPool, buyer_id: Uuid) -> Result<Vec<Pc>> {
    let purchases = sqlx::query_as!(
        Pc,
        r#"
        SELECT 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status: PcStatus", created_at, updated_at
        FROM pcs 
        WHERE buyer_id = $1
        ORDER BY sale_date DESC
        "#,
        buyer_id
    )
    .fetch_all(pool)
    .await?;
    
    Ok(purchases)
}