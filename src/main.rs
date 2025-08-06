use actix_web::{web, App, HttpServer, Result, HttpResponse, middleware::Logger};
use actix_cors::Cors;
use sqlx::PgPool;
use dotenv::dotenv;
use std::env;

pub mod models;
pub mod handlers;
pub mod db;

use handlers::{pc_handlers, inventory_handlers, buyer_handlers, report_handlers};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("🚀 Server starting on http://localhost:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    .service(
                        web::scope("/pcs")
                            .route("", web::get().to(pc_handlers::list_pcs))
                            .route("", web::post().to(pc_handlers::create_pc))
                            .route("/{id}", web::get().to(pc_handlers::get_pc))
                            .route("/{id}", web::put().to(pc_handlers::update_pc))
                            .route("/{id}", web::delete().to(pc_handlers::delete_pc))
                            .route("/{id}/sell", web::post().to(pc_handlers::sell_pc))
                    )
                    .service(
                        web::scope("/inventory")
                            .route("", web::get().to(inventory_handlers::list_parts))
                            .route("", web::post().to(inventory_handlers::create_part))
                            .route("/{id}", web::put().to(inventory_handlers::update_part))
                            .route("/{id}", web::delete().to(inventory_handlers::delete_part))
                            .route("/low-stock", web::get().to(inventory_handlers::low_stock))
                    )
                    .service(
                        web::scope("/buyers")
                            .route("", web::get().to(buyer_handlers::list_buyers))
                            .route("", web::post().to(buyer_handlers::create_buyer))
                            .route("/{id}/purchases", web::get().to(buyer_handlers::buyer_purchases))
                    )
                    .service(
                        web::scope("/reports")
                            .route("/monthly", web::get().to(report_handlers::monthly_summary))
                            .route("/profit-analysis", web::get().to(report_handlers::profit_analysis))
                    )
            )
            .route("/health", web::get().to(health_check))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}

async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "pc-inventory-backend"
    })))
}