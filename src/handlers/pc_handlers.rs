use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Pc, CreatePcRequest, UpdatePcRequest, SellPcRequest, PcWithComponents, Component, PcStatus};
use crate::db::pc_queries;

pub async fn list_pcs(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match pc_queries::get_all_pcs(&pool).await {
        Ok(pcs) => Ok(HttpResponse::Ok().json(pcs)),
        Err(e) => {
            eprintln!("Error fetching PCs: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch PCs"
            })))
        }
    }
}

pub async fn get_pc(path: web::Path<Uuid>, pool: web::Data<PgPool>) -> Result<HttpResponse> {
    let pc_id = path.into_inner();
    
    match pc_queries::get_pc_with_components(&pool, pc_id).await {
        Ok(Some(pc)) => Ok(HttpResponse::Ok().json(pc)),
        Ok(None) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "PC not found"
        }))),
        Err(e) => {
            eprintln!("Error fetching PC: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch PC"
            })))
        }
    }
}

pub async fn create_pc(
    request: web::Json<CreatePcRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    match pc_queries::create_pc_with_components(&pool, request.into_inner()).await {
        Ok(pc) => Ok(HttpResponse::Created().json(pc)),
        Err(e) => {
            eprintln!("Error creating PC: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create PC"
            })))
        }
    }
}

pub async fn update_pc(
    path: web::Path<Uuid>,
    request: web::Json<UpdatePcRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    let pc_id = path.into_inner();
    
    match pc_queries::update_pc(&pool, pc_id, request.into_inner()).await {
        Ok(Some(pc)) => Ok(HttpResponse::Ok().json(pc)),
        Ok(None) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "PC not found"
        }))),
        Err(e) => {
            eprintln!("Error updating PC: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update PC"
            })))
        }
    }
}

pub async fn delete_pc(path: web::Path<Uuid>, pool: web::Data<PgPool>) -> Result<HttpResponse> {
    let pc_id = path.into_inner();
    
    match pc_queries::delete_pc(&pool, pc_id).await {
        Ok(true) => Ok(HttpResponse::NoContent().finish()),
        Ok(false) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "PC not found"
        }))),
        Err(e) => {
            eprintln!("Error deleting PC: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete PC"
            })))
        }
    }
}

pub async fn sell_pc(
    path: web::Path<Uuid>,
    request: web::Json<SellPcRequest>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse> {
    let pc_id = path.into_inner();
    
    match pc_queries::sell_pc(&pool, pc_id, request.into_inner()).await {
        Ok(Some(pc)) => Ok(HttpResponse::Ok().json(pc)),
        Ok(None) => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "PC not found"
        }))),
        Err(e) => {
            eprintln!("Error selling PC: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to sell PC"
            })))
        }
    }
}