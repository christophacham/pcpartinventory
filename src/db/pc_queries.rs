use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;

use crate::models::{Pc, PcWithComponents, CreatePcRequest, UpdatePcRequest, SellPcRequest, Component, PcStatus};

pub async fn get_all_pcs(pool: &PgPool) -> Result<Vec<Pc>> {
    let pcs = sqlx::query_as!(
        Pc,
        r#"
        SELECT 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status!: PcStatus", 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        FROM pcs 
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;
    
    Ok(pcs)
}

pub async fn get_pc_with_components(pool: &PgPool, pc_id: Uuid) -> Result<Option<PcWithComponents>> {
    let pc = sqlx::query_as!(
        Pc,
        r#"
        SELECT 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status!: PcStatus", 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        FROM pcs 
        WHERE id = $1
        "#,
        pc_id
    )
    .fetch_optional(pool)
    .await?;
    
    if let Some(pc) = pc {
        let components = sqlx::query_as!(
            Component,
            r#"
            SELECT 
                id, pc_id, component_name, cost, notes,
                component_type as "component_type: crate::models::ComponentType"
            FROM pc_components 
            WHERE pc_id = $1
            ORDER BY component_type
            "#,
            pc_id
        )
        .fetch_all(pool)
        .await?;
        
        Ok(Some(PcWithComponents { pc, components }))
    } else {
        Ok(None)
    }
}

pub async fn create_pc_with_components(pool: &PgPool, request: CreatePcRequest) -> Result<PcWithComponents> {
    let mut tx = pool.begin().await?;
    
    // Create the PC
    let pc_id = Uuid::new_v4();
    let pc = sqlx::query_as!(
        Pc,
        r#"
        INSERT INTO pcs (id, pc_name, build_date, intended_price, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status!: PcStatus", 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        pc_id,
        request.pc_name,
        request.build_date,
        request.intended_price,
        request.notes
    )
    .fetch_one(&mut *tx)
    .await?;
    
    // Create components
    let mut components = Vec::new();
    for comp_req in request.components {
        let component = sqlx::query_as!(
            Component,
            r#"
            INSERT INTO pc_components (id, pc_id, component_type, component_name, cost, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING 
                id, pc_id, component_name, cost, notes,
                component_type as "component_type: crate::models::ComponentType"
            "#,
            Uuid::new_v4(),
            pc_id,
            comp_req.component_type as crate::models::ComponentType,
            comp_req.component_name,
            comp_req.cost,
            comp_req.notes
        )
        .fetch_one(&mut *tx)
        .await?;
        
        components.push(component);
    }
    
    tx.commit().await?;
    
    Ok(PcWithComponents { pc, components })
}

pub async fn update_pc(pool: &PgPool, pc_id: Uuid, request: UpdatePcRequest) -> Result<Option<Pc>> {
    let pc = sqlx::query_as!(
        Pc,
        r#"
        UPDATE pcs SET
            pc_name = COALESCE($2, pc_name),
            build_date = COALESCE($3, build_date),
            list_date = COALESCE($4, list_date),
            intended_price = COALESCE($5, intended_price),
            notes = COALESCE($6, notes),
            status = COALESCE($7, status),
            updated_at = NOW()
        WHERE id = $1
        RETURNING 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status!: PcStatus", 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        pc_id,
        request.pc_name,
        request.build_date,
        request.list_date,
        request.intended_price,
        request.notes,
        request.status as Option<PcStatus>
    )
    .fetch_optional(pool)
    .await?;
    
    Ok(pc)
}

pub async fn sell_pc(pool: &PgPool, pc_id: Uuid, request: SellPcRequest) -> Result<Option<Pc>> {
    let pc = sqlx::query_as!(
        Pc,
        r#"
        UPDATE pcs SET
            sale_date = $2,
            actual_sale_price = $3,
            buyer_id = $4,
            platform = $5,
            platform_reference = $6,
            status = 'sold',
            updated_at = NOW()
        WHERE id = $1
        RETURNING 
            id, pc_name, build_date, list_date, sale_date, days_listed, days_held,
            buyer_id, platform, platform_reference, intended_price, actual_sale_price,
            total_cost, profit, profit_percentage, notes,
            status as "status!: PcStatus", 
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        pc_id,
        request.sale_date,
        request.actual_sale_price,
        request.buyer_id,
        request.platform,
        request.platform_reference
    )
    .fetch_optional(pool)
    .await?;
    
    Ok(pc)
}

pub async fn delete_pc(pool: &PgPool, pc_id: Uuid) -> Result<bool> {
    let result = sqlx::query!(
        "DELETE FROM pcs WHERE id = $1",
        pc_id
    )
    .execute(pool)
    .await?;
    
    Ok(result.rows_affected() > 0)
}