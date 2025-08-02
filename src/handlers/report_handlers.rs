use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;

use crate::db::report_queries;

pub async fn monthly_summary(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match report_queries::get_monthly_summary(&pool).await {
        Ok(summary) => Ok(HttpResponse::Ok().json(summary)),
        Err(e) => {
            eprintln!("Error fetching monthly summary: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch monthly summary"
            })))
        }
    }
}

pub async fn profit_analysis(pool: web::Data<PgPool>) -> Result<HttpResponse> {
    match report_queries::get_profit_analysis(&pool).await {
        Ok(analysis) => Ok(HttpResponse::Ok().json(analysis)),
        Err(e) => {
            eprintln!("Error fetching profit analysis: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch profit analysis"
            })))
        }
    }
}