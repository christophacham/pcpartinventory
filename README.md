# PC Inventory Tracker

A modern full-stack web application for tracking PC builds, sales, and inventory management. Transforms an Excel-based workflow into a sophisticated web application with real-time calculations and reporting.

## Features

- 🖥️ **PC Build Management** - Track builds from conception to sale
- 📦 **Parts Inventory** - Manage component stock and pricing
- 👥 **Customer Management** - Track buyers and purchase history  
- 📊 **Automatic Calculations** - Profit, margins, days held/listed
- 📈 **Reports & Analytics** - Monthly summaries and profit analysis
- 🔄 **Real-time Updates** - Excel-like formula calculations in the database

## Tech Stack

- **Backend**: Rust + Actix-Web + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with automatic triggers
- **Containerization**: Docker + Docker Compose
- **Message Bus**: Dapr (optional)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.8+ (for data import)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd pcpartinventory
cp .env.example .env
```

### 2. Start Services

```bash
# Start all services
docker-compose up --build

# Or start individually
docker-compose up postgres redis  # Start databases first
docker-compose up backend         # Start API server
docker-compose up frontend        # Start web interface
```

### 3. Import Existing Excel Data

```bash
# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Run import script (ensure Excel file is in root directory)
python import_excel_data.py
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/health

## Database Schema

The application replicates Excel functionality with intelligent database design:

### Core Tables

- **`pcs`** - PC builds with automatic profit/days calculations
- **`pc_components`** - Components used in each build
- **`parts_inventory`** - Available parts with pricing
- **`buyers`** - Customer information
- **`monthly_summary`** - Aggregated sales data

### Automatic Calculations

Database triggers automatically calculate:
- Total cost (sum of components)
- Profit (sale price - total cost)  
- Profit percentage
- Days held (sale date - build date)
- Days listed (sale date - list date)

## API Endpoints

### PC Management
- `GET /api/pcs` - List all PCs
- `POST /api/pcs` - Create PC with components
- `GET /api/pcs/{id}` - Get PC details
- `POST /api/pcs/{id}/sell` - Mark PC as sold

### Inventory
- `GET /api/inventory` - List parts
- `POST /api/inventory` - Add new part
- `GET /api/inventory/low-stock` - Low stock alerts

### Buyers & Reports
- `GET /api/buyers` - List customers
- `GET /api/reports/monthly` - Monthly sales
- `GET /api/reports/profit-analysis` - Profit breakdown

## Testing

### Run Integration Tests

```bash
# Ensure test database exists
docker-compose up postgres

# Run comprehensive tests
cargo test

# Or run specific test
cargo test test_full_workflow_add_parts_build_pc_and_sell
```

### Test Coverage

Tests verify:
- ✅ Complete workflow: Parts → PC → Sale
- ✅ Automatic calculations (cost, profit, days)
- ✅ Database triggers and relationships
- ✅ Inventory management
- ✅ Error handling and edge cases

## Development

### Project Structure

```
├── src/                    # Rust backend
│   ├── handlers/          # API endpoints
│   ├── models/            # Data structures
│   ├── db/                # Database queries
│   └── main.rs            # Server entry point
├── frontend/src/          # Next.js frontend
│   ├── app/               # Pages (App Router)
│   ├── components/        # UI components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── migrations/            # Database migrations
├── scripts/               # Data import scripts
└── tests/                 # Integration tests
```

### Key Features Implementation

1. **Excel-like Intelligence**: Database triggers replicate formula calculations
2. **Real-time Updates**: Component changes trigger PC total recalculation  
3. **Smart Relationships**: Foreign keys ensure data integrity
4. **Automatic Status**: Building → Listed → Sold workflow
5. **Comprehensive Logging**: Full audit trail of changes

## Data Migration

The system imports existing Excel data:

- **PRICE GUIDE** sheet → `parts_inventory` table
- **MAIN TRACKER** sheet → `pcs` + `pc_components` tables
- **Buyer information** → `buyers` table
- **Formulas preserved** → Database triggers

## Deployment

### Production Setup

1. Update environment variables in `.env`
2. Configure PostgreSQL with persistent storage
3. Set up SSL/TLS for HTTPS
4. Configure reverse proxy (nginx)
5. Set up backups and monitoring

### Security Considerations

- Input validation on all endpoints
- SQL injection prevention via sqlx
- CORS configuration
- Rate limiting (recommended)
- Environment variable security

## Contributing

1. Follow Kent Beck style commits
2. Run tests before committing
3. Use conventional commit messages
4. Update documentation for new features

## License

[Add your license here]