use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;

use crate::models::{InventoryPart, CreateInventoryPartRequest, UpdateInventoryPartRequest};

pub async fn get_all_parts(pool: &PgPool) -> Result<Vec<InventoryPart>> {
    let parts = sqlx::query_as!(
        InventoryPart,
        r#"
        SELECT 
            id, component_type, component_name, buy_in_price, typical_sell_price,
            quantity_available as "quantity_available!", notes, purchase_link, 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        FROM parts_inventory 
        ORDER BY component_type, component_name
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(parts)
}

pub async fn create_part(pool: &PgPool, request: CreateInventoryPartRequest) -> Result<InventoryPart> {
    let part = sqlx::query_as!(
        InventoryPart,
        r#"
        INSERT INTO parts_inventory (
            id, component_type, component_name, buy_in_price, typical_sell_price,
            quantity_available, notes, purchase_link
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
            id, component_type, component_name, buy_in_price, typical_sell_price,
            quantity_available as "quantity_available!", notes, purchase_link, 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        Uuid::new_v4(),
        request.component_type,
        request.component_name,
        request.buy_in_price,
        request.typical_sell_price,
        request.quantity_available.unwrap_or(0),
        request.notes,
        request.purchase_link
    )
    .fetch_one(pool)
    .await?;
    
    Ok(part)
}

pub async fn update_part(pool: &PgPool, part_id: Uuid, request: UpdateInventoryPartRequest) -> Result<Option<InventoryPart>> {
    let part = sqlx::query_as!(
        InventoryPart,
        r#"
        UPDATE parts_inventory SET
            component_name = COALESCE($2, component_name),
            buy_in_price = COALESCE($3, buy_in_price),
            typical_sell_price = COALESCE($4, typical_sell_price),
            quantity_available = COALESCE($5, quantity_available),
            notes = COALESCE($6, notes),
            purchase_link = COALESCE($7, purchase_link),
            updated_at = NOW()
        WHERE id = $1
        RETURNING 
            id, component_type, component_name, buy_in_price, typical_sell_price,
            quantity_available as "quantity_available!", notes, purchase_link, 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        part_id,
        request.component_name,
        request.buy_in_price,
        request.typical_sell_price,
        request.quantity_available,
        request.notes,
        request.purchase_link
    )
    .fetch_optional(pool)
    .await?;
    
    Ok(part)
}

pub async fn delete_part(pool: &PgPool, part_id: Uuid) -> Result<bool> {
    let result = sqlx::query!(
        "DELETE FROM parts_inventory WHERE id = $1",
        part_id
    )
    .execute(pool)
    .await?;
    
    Ok(result.rows_affected() > 0)
}

pub async fn get_low_stock_parts(pool: &PgPool, threshold: i32) -> Result<Vec<InventoryPart>> {
    let parts = sqlx::query_as!(
        InventoryPart,
        r#"
        SELECT 
            id, component_type, component_name, buy_in_price, typical_sell_price,
            quantity_available as "quantity_available!", notes, purchase_link, 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        FROM parts_inventory 
        WHERE quantity_available <= $1
        ORDER BY quantity_available ASC, component_type, component_name
        "#,
        threshold
    )
    .fetch_all(pool)
    .await?;
    
    Ok(parts)
}