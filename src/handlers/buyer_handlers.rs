use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Buyer, CreateBuyerRequest};
use crate::db;

pub async fn list_buyers(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match db::get_all_buyers(&pool).await {
        Ok(buyers) => Ok(HttpResponse::Ok().json(buyers)),
        Err(e) => {
            eprintln!("Error fetching buyers: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch buyers"
            })))
        }
    }
}

pub async fn create_buyer(
    request: web::Json<CreateBuyerRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    match db::create_buyer(&pool, request.into_inner()).await {
        Ok(buyer) => Ok(HttpResponse::Created().json(buyer)),
        Err(e) => {
            eprintln!("Error creating buyer: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create buyer"
            })))
        }
    }
}

pub async fn buyer_purchases(path: web::Path<Uuid>, pool: web::Data<PgPool>) -> Result<HttpResponse> {
    let buyer_id = path.into_inner();
    
    match db::get_buyer_purchases(&pool, buyer_id).await {
        Ok(purchases) => Ok(HttpResponse::Ok().json(purchases)),
        Err(e) => {
            eprintln!("Error fetching buyer purchases: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch buyer purchases"
            })))
        }
    }
}