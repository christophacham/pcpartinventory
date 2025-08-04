use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{InventoryPart, CreateInventoryPartRequest, UpdateInventoryPartRequest};
use crate::db;

pub async fn list_parts(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match db::get_all_parts(&pool).await {
        Ok(parts) => Ok(HttpResponse::Ok().json(parts)),
        Err(e) => {
            eprintln!("Error fetching parts: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch parts"
            })))
        }
    }
}

pub async fn create_part(
    request: web::Json<CreateInventoryPartRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    match db::create_part(&pool, request.into_inner()).await {
        Ok(part) => Ok(HttpResponse::Created().json(part)),
        Err(e) => {
            eprintln!("Error creating part: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create part"
            })))
        }
    }
}

pub async fn update_part(
    path: web::Path<Uuid>,
    request: web::Json<UpdateInventoryPartRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    let part_id = path.into_inner();
    
    match db::update_part(&pool, part_id, request.into_inner()).await {
        Ok(Some(part)) => Ok(HttpResponse::Ok().json(part)),
        Ok(None) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Part not found"
        }))),
        Err(e) => {
            eprintln!("Error updating part: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update part"
            })))
        }
    }
}

pub async fn low_stock(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match db::get_low_stock_parts(&pool, 5).await {
        Ok(parts) => Ok(HttpResponse::Ok().json(parts)),
        Err(e) => {
            eprintln!("Error fetching low stock parts: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch low stock parts"
            })))
        }
    }
}