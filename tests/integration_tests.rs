use actix_web::{test, web, App};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use pc_inventory_backend::{
    handlers::{pc_handlers, inventory_handlers, buyer_handlers},
    models::*,
    db,
};

async fn setup_test_db() -> PgPool {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:password@localhost:5432/pc_inventory_test".to_string());
    
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to test database");
    
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    
    // Clean up existing data
    sqlx::query!("TRUNCATE TABLE pc_components, pcs, buyers, parts_inventory RESTART IDENTITY CASCADE")
        .execute(&pool)
        .await
        .expect("Failed to clean test database");
    
    pool
}

fn create_test_app(pool: PgPool) -> actix_web::App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Response = actix_web::dev::ServiceResponse,
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    App::new()
        .app_data(web::Data::new(pool))
        .service(
            web::scope("/api")
                .service(
                    web::scope("/pcs")
                        .route("", web::get().to(pc_handlers::list_pcs))
                        .route("", web::post().to(pc_handlers::create_pc))
                        .route("/{id}", web::get().to(pc_handlers::get_pc))
                        .route("/{id}/sell", web::post().to(pc_handlers::sell_pc))
                )
                .service(
                    web::scope("/inventory")
                        .route("", web::get().to(inventory_handlers::list_parts))
                        .route("", web::post().to(inventory_handlers::create_part))
                )
                .service(
                    web::scope("/buyers")
                        .route("", web::get().to(buyer_handlers::list_buyers))
                        .route("", web::post().to(buyer_handlers::create_buyer))
                )
        )
}

#[actix_web::test]
async fn test_full_workflow_add_parts_build_pc_and_sell() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_test_app(pool.clone())).await;

    // Step 1: Add parts to inventory
    println!("🔧 Step 1: Adding parts to inventory");
    
    let cpu_request = json!({
        "component_type": "CPU",
        "component_name": "Intel i5-10400F",
        "buy_in_price": 702.0,
        "typical_sell_price": 900.0,
        "quantity_available": 1,
        "notes": "Good mid-range CPU"
    });
    
    let cpu_resp = test::TestRequest::post()
        .uri("/api/inventory")
        .set_json(&cpu_request)
        .send_request(&app)
        .await;
    
    assert_eq!(cpu_resp.status(), 201, "Failed to create CPU part");
    let cpu_part: InventoryPart = test::read_body_json(cpu_resp).await;
    println!("✅ Created CPU: {}", cpu_part.component_name);

    let gpu_request = json!({
        "component_type": "GPU", 
        "component_name": "RX 5700 XT Sapphire Pulse",
        "buy_in_price": 1022.0,
        "typical_sell_price": 1400.0,
        "quantity_available": 1,
        "notes": "Great 1440p GPU"
    });
    
    let gpu_resp = test::TestRequest::post()
        .uri("/api/inventory")
        .set_json(&gpu_request)
        .send_request(&app)
        .await;
    
    assert_eq!(gpu_resp.status(), 201, "Failed to create GPU part");
    let gpu_part: InventoryPart = test::read_body_json(gpu_resp).await;
    println!("✅ Created GPU: {}", gpu_part.component_name);

    // Add more components
    let components = vec![
        ("Motherboard", "B460M Aliexpress", 800.0),
        ("RAM", "32GB (2x16) DDR4", 630.0),
        ("Storage", "512GB PNY SSD", 339.0),
        ("PSU", "CX 650M", 596.0),
        ("Case", "Asus Prime AP201 mATX", 948.0),
    ];

    for (comp_type, comp_name, price) in components {
        let request = json!({
            "component_type": comp_type,
            "component_name": comp_name,
            "buy_in_price": price,
            "quantity_available": 1
        });
        
        let resp = test::TestRequest::post()
            .uri("/api/inventory")
            .set_json(&request)
            .send_request(&app)
            .await;
        
        assert_eq!(resp.status(), 201, "Failed to create {} part", comp_type);
        println!("✅ Created {}: {}", comp_type, comp_name);
    }

    // Step 2: Verify inventory
    println!("\n📦 Step 2: Verifying inventory");
    
    let inventory_resp = test::TestRequest::get()
        .uri("/api/inventory")
        .send_request(&app)
        .await;
    
    assert_eq!(inventory_resp.status(), 200);
    let inventory: Vec<InventoryPart> = test::read_body_json(inventory_resp).await;
    assert_eq!(inventory.len(), 7, "Should have 7 parts in inventory");
    println!("✅ Inventory contains {} parts", inventory.len());

    // Step 3: Create a buyer
    println!("\n👤 Step 3: Creating buyer");
    
    let buyer_request = json!({
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "12345678"
    });
    
    let buyer_resp = test::TestRequest::post()
        .uri("/api/buyers")
        .set_json(&buyer_request)
        .send_request(&app)
        .await;
    
    assert_eq!(buyer_resp.status(), 201, "Failed to create buyer");
    let buyer: Buyer = test::read_body_json(buyer_resp).await;
    println!("✅ Created buyer: {}", buyer.name);

    // Step 4: Build a PC with components
    println!("\n🖥️  Step 4: Building PC with components");
    
    let pc_request = json!({
        "pc_name": "Test Gaming Build",
        "build_date": "2024-01-15",
        "intended_price": 8000.0,
        "notes": "Test build for integration testing",
        "components": [
            {
                "component_type": "cpu",
                "component_name": "Intel i5-10400F", 
                "cost": 702.0,
                "notes": "Main processor"
            },
            {
                "component_type": "gpu",
                "component_name": "RX 5700 XT Sapphire Pulse",
                "cost": 1022.0,
                "notes": "Graphics card"
            },
            {
                "component_type": "motherboard",
                "component_name": "B460M Aliexpress",
                "cost": 800.0
            },
            {
                "component_type": "ram",
                "component_name": "32GB (2x16) DDR4",
                "cost": 630.0
            },
            {
                "component_type": "storage1",
                "component_name": "512GB PNY SSD",
                "cost": 339.0
            },
            {
                "component_type": "psu",
                "component_name": "CX 650M",
                "cost": 596.0
            },
            {
                "component_type": "case",
                "component_name": "Asus Prime AP201 mATX",
                "cost": 948.0
            }
        ]
    });
    
    let pc_resp = test::TestRequest::post()
        .uri("/api/pcs")
        .set_json(&pc_request)
        .send_request(&app)
        .await;
    
    assert_eq!(pc_resp.status(), 201, "Failed to create PC");
    let pc_with_components: PcWithComponents = test::read_body_json(pc_resp).await;
    
    println!("✅ Created PC: {}", pc_with_components.pc.pc_name);
    println!("   Components: {}", pc_with_components.components.len());
    
    // Verify total cost calculation
    let expected_total_cost = 702.0 + 1022.0 + 800.0 + 630.0 + 339.0 + 596.0 + 948.0;
    assert_eq!(
        pc_with_components.pc.total_cost.unwrap_or_default(),
        expected_total_cost,
        "Total cost should be automatically calculated"
    );
    println!("✅ Total cost calculated correctly: kr{}", expected_total_cost);

    // Step 5: Verify PC appears in listings
    println!("\n📋 Step 5: Verifying PC in listings");
    
    let pcs_resp = test::TestRequest::get()
        .uri("/api/pcs")
        .send_request(&app)
        .await;
    
    assert_eq!(pcs_resp.status(), 200);
    let pcs: Vec<Pc> = test::read_body_json(pcs_resp).await;
    assert_eq!(pcs.len(), 1, "Should have 1 PC in listings");
    assert_eq!(pcs[0].status, PcStatus::Building);
    println!("✅ PC appears in listings with status: {:?}", pcs[0].status);

    // Step 6: Get PC details with components
    println!("\n🔍 Step 6: Fetching PC details");
    
    let pc_details_resp = test::TestRequest::get()
        .uri(&format!("/api/pcs/{}", pc_with_components.pc.id))
        .send_request(&app)
        .await;
    
    assert_eq!(pc_details_resp.status(), 200);
    let pc_details: PcWithComponents = test::read_body_json(pc_details_resp).await;
    assert_eq!(pc_details.components.len(), 7, "Should have 7 components");
    println!("✅ Retrieved PC details with {} components", pc_details.components.len());

    // Step 7: Sell the PC
    println!("\n💰 Step 7: Selling the PC");
    
    let sell_request = json!({
        "sale_date": "2024-02-01",
        "actual_sale_price": 7500.0,
        "buyer_id": buyer.id,
        "platform": "Finn",
        "platform_reference": "Finn - 123456789"
    });
    
    let sell_resp = test::TestRequest::post()
        .uri(&format!("/api/pcs/{}/sell", pc_with_components.pc.id))
        .set_json(&sell_request)
        .send_request(&app)
        .await;
    
    assert_eq!(sell_resp.status(), 200, "Failed to sell PC");
    let sold_pc: Pc = test::read_body_json(sell_resp).await;
    
    assert_eq!(sold_pc.status, PcStatus::Sold);
    assert_eq!(sold_pc.actual_sale_price.unwrap(), 7500.0);
    assert_eq!(sold_pc.buyer_id, Some(buyer.id.parse().unwrap()));
    
    // Verify profit calculation
    let expected_profit = 7500.0 - expected_total_cost;
    assert_eq!(sold_pc.profit.unwrap(), expected_profit);
    
    // Verify profit percentage
    let expected_profit_percentage = (expected_profit / expected_total_cost) * 100.0;
    assert!((sold_pc.profit_percentage.unwrap() - expected_profit_percentage).abs() < 0.01);
    
    println!("✅ PC sold successfully!");
    println!("   Sale price: kr{}", sold_pc.actual_sale_price.unwrap());
    println!("   Profit: kr{}", sold_pc.profit.unwrap());
    println!("   Profit margin: {:.1}%", sold_pc.profit_percentage.unwrap());
    
    // Verify days calculation
    assert_eq!(sold_pc.days_held, Some(17)); // Jan 15 to Feb 1 = 17 days
    println!("✅ Days held calculated correctly: {} days", sold_pc.days_held.unwrap());

    // Step 8: Verify buyer's purchase history
    println!("\n📊 Step 8: Checking buyer purchase history");
    
    let buyer_purchases_resp = test::TestRequest::get()
        .uri(&format!("/api/buyers/{}/purchases", buyer.id))
        .send_request(&app)
        .await;
    
    assert_eq!(buyer_purchases_resp.status(), 200);
    let purchases: Vec<Pc> = test::read_body_json(buyer_purchases_resp).await;
    assert_eq!(purchases.len(), 1, "Buyer should have 1 purchase");
    assert_eq!(purchases[0].id, sold_pc.id);
    println!("✅ Buyer purchase history verified");

    println!("\n🎉 ALL TESTS PASSED! Full workflow completed successfully:");
    println!("   ✅ Added 7 parts to inventory");
    println!("   ✅ Created buyer");
    println!("   ✅ Built PC with automatic cost calculation");
    println!("   ✅ Sold PC with automatic profit/days calculation");
    println!("   ✅ Verified all database relationships and triggers");
}

#[actix_web::test]
async fn test_inventory_management() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_test_app(pool.clone())).await;

    println!("🧪 Testing inventory management features");

    // Test creating duplicate parts (should succeed)
    let part_request = json!({
        "component_type": "GPU",
        "component_name": "RTX 3080",
        "buy_in_price": 5000.0,
        "typical_sell_price": 6000.0,
        "quantity_available": 2
    });

    let resp1 = test::TestRequest::post()
        .uri("/api/inventory")
        .set_json(&part_request)
        .send_request(&app)
        .await;
    
    assert_eq!(resp1.status(), 201);
    let part1: InventoryPart = test::read_body_json(resp1).await;

    let resp2 = test::TestRequest::post()
        .uri("/api/inventory")
        .set_json(&part_request)
        .send_request(&app)
        .await;
    
    assert_eq!(resp2.status(), 201);
    let part2: InventoryPart = test::read_body_json(resp2).await;

    assert_ne!(part1.id, part2.id, "Should create separate inventory entries");
    println!("✅ Can create multiple entries for same component");

    // Test low stock detection
    let low_stock_request = json!({
        "component_type": "RAM",
        "component_name": "16GB DDR4",
        "quantity_available": 0
    });

    let resp = test::TestRequest::post()
        .uri("/api/inventory")
        .set_json(&low_stock_request)
        .send_request(&app)
        .await;
    
    assert_eq!(resp.status(), 201);

    let low_stock_resp = test::TestRequest::get()
        .uri("/api/inventory/low-stock")
        .send_request(&app)
        .await;
    
    assert_eq!(low_stock_resp.status(), 200);
    let low_stock_parts: Vec<InventoryPart> = test::read_body_json(low_stock_resp).await;
    assert!(low_stock_parts.len() > 0, "Should detect low stock items");
    println!("✅ Low stock detection working");

    println!("🎉 Inventory management tests passed!");
}

#[actix_web::test]
async fn test_edge_cases_and_validation() {
    let pool = setup_test_db().await;
    let app = test::init_service(create_test_app(pool.clone())).await;

    println!("🧪 Testing edge cases and validation");

    // Test creating PC with no components
    let empty_pc_request = json!({
        "pc_name": "Empty PC",
        "components": []
    });

    let resp = test::TestRequest::post()
        .uri("/api/pcs")
        .set_json(&empty_pc_request)
        .send_request(&app)
        .await;
    
    assert_eq!(resp.status(), 201, "Should allow PC with no components");
    let pc: PcWithComponents = test::read_body_json(resp).await;
    assert_eq!(pc.pc.total_cost.unwrap_or_default(), 0.0);
    println!("✅ Can create PC with no components");

    // Test selling non-existent PC
    let fake_id = Uuid::new_v4();
    let sell_request = json!({
        "sale_date": "2024-01-01",
        "actual_sale_price": 1000.0
    });

    let resp = test::TestRequest::post()
        .uri(&format!("/api/pcs/{}/sell", fake_id))
        .set_json(&sell_request)
        .send_request(&app)
        .await;
    
    assert_eq!(resp.status(), 404, "Should return 404 for non-existent PC");
    println!("✅ Proper error handling for non-existent resources");

    // Test negative costs (should still work but be unusual)
    let negative_cost_pc = json!({
        "pc_name": "Negative Cost PC",
        "components": [{
            "component_type": "cpu",
            "component_name": "Free CPU",
            "cost": -100.0,
            "notes": "Someone paid us to take it"
        }]
    });

    let resp = test::TestRequest::post()
        .uri("/api/pcs")
        .set_json(&negative_cost_pc)
        .send_request(&app)
        .await;
    
    assert_eq!(resp.status(), 201, "Should allow negative costs");
    let pc: PcWithComponents = test::read_body_json(resp).await;
    assert_eq!(pc.pc.total_cost.unwrap(), -100.0);
    println!("✅ Handles negative costs correctly");

    println!("🎉 Edge case tests passed!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_all_integration_tests() {
        println!("🚀 Starting comprehensive integration tests...\n");
        
        // Run tests sequentially to avoid database conflicts
        test_full_workflow_add_parts_build_pc_and_sell().await;
        test_inventory_management().await;
        test_edge_cases_and_validation().await;
        
        println!("\n🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
        println!("The PC Inventory system is working correctly with:");
        println!("  ✅ Full workflow from parts → PC → sale");
        println!("  ✅ Automatic calculations (cost, profit, days)");
        println!("  ✅ Database triggers and relationships");
        println!("  ✅ Inventory management");
        println!("  ✅ Error handling and edge cases");
    }
}