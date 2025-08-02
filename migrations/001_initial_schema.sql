-- Create custom types
CREATE TYPE pc_status AS ENUM ('building', 'listed', 'sold', 'archived');
CREATE TYPE component_type AS ENUM ('cpu', 'gpu', 'motherboard', 'ram', 'storage1', 'storage2', 'psu', 'case', 'cpu_cooler', 'additional');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create buyers table first (referenced by pcs)
CREATE TABLE buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parts_inventory table
CREATE TABLE parts_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    buy_in_price DECIMAL(10,2),
    typical_sell_price DECIMAL(10,2),
    quantity_available INTEGER DEFAULT 0,
    notes TEXT,
    purchase_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pcs table
CREATE TABLE pcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pc_name VARCHAR(255) NOT NULL UNIQUE,
    build_date DATE,
    list_date DATE,
    sale_date DATE,
    days_listed INTEGER,
    days_held INTEGER,
    buyer_id UUID REFERENCES buyers(id),
    platform VARCHAR(50),
    platform_reference VARCHAR(100),
    intended_price DECIMAL(10,2),
    actual_sale_price DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    profit DECIMAL(10,2),
    profit_percentage DECIMAL(5,2),
    notes TEXT,
    status pc_status DEFAULT 'building',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pc_components table
CREATE TABLE pc_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pc_id UUID NOT NULL REFERENCES pcs(id) ON DELETE CASCADE,
    component_type component_type NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    notes TEXT
);

-- Create monthly_summary table
CREATE TABLE monthly_summary (
    month_year VARCHAR(7) PRIMARY KEY,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_profit DECIMAL(10,2) DEFAULT 0,
    pcs_sold INTEGER DEFAULT 0,
    average_days_held DECIMAL(5,2),
    average_profit_margin DECIMAL(5,2)
);

-- Create indexes for better performance
CREATE INDEX idx_pcs_status ON pcs(status);
CREATE INDEX idx_pcs_build_date ON pcs(build_date);
CREATE INDEX idx_pcs_sale_date ON pcs(sale_date);
CREATE INDEX idx_pcs_buyer_id ON pcs(buyer_id);
CREATE INDEX idx_pc_components_pc_id ON pc_components(pc_id);
CREATE INDEX idx_pc_components_type ON pc_components(component_type);
CREATE INDEX idx_parts_inventory_type ON parts_inventory(component_type);
CREATE INDEX idx_parts_inventory_name ON parts_inventory(component_name);

-- Function to calculate days between dates
CREATE OR REPLACE FUNCTION calculate_days_difference(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF start_date IS NULL OR end_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN (end_date - start_date);
END;
$$ LANGUAGE plpgsql;

-- Function to update PC calculations
CREATE OR REPLACE FUNCTION update_pc_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total cost from components
    SELECT COALESCE(SUM(cost), 0) INTO NEW.total_cost
    FROM pc_components 
    WHERE pc_id = NEW.id;
    
    -- Calculate profit if sale price exists
    IF NEW.actual_sale_price IS NOT NULL AND NEW.total_cost IS NOT NULL THEN
        NEW.profit = NEW.actual_sale_price - NEW.total_cost;
        
        -- Calculate profit percentage
        IF NEW.total_cost > 0 THEN
            NEW.profit_percentage = (NEW.profit / NEW.total_cost) * 100;
        END IF;
    END IF;
    
    -- Calculate days held
    NEW.days_held = calculate_days_difference(NEW.build_date, NEW.sale_date);
    
    -- Calculate days listed
    NEW.days_listed = calculate_days_difference(NEW.list_date, NEW.sale_date);
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate PC totals when components change
CREATE OR REPLACE FUNCTION recalculate_pc_totals()
RETURNS TRIGGER AS $$
DECLARE
    pc_record RECORD;
BEGIN
    -- Get the PC ID (handle both INSERT/UPDATE and DELETE)
    IF TG_OP = 'DELETE' THEN
        -- For DELETE, use OLD.pc_id
        SELECT * INTO pc_record FROM pcs WHERE id = OLD.pc_id;
    ELSE
        -- For INSERT/UPDATE, use NEW.pc_id
        SELECT * INTO pc_record FROM pcs WHERE id = NEW.pc_id;
    END IF;
    
    -- Update the PC record to trigger calculations
    UPDATE pcs SET updated_at = NOW() WHERE id = pc_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_pc_calculations
    BEFORE UPDATE ON pcs
    FOR EACH ROW
    EXECUTE FUNCTION update_pc_calculations();

CREATE TRIGGER trigger_recalc_on_component_change
    AFTER INSERT OR UPDATE OR DELETE ON pc_components
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_pc_totals();

-- Trigger to update parts_inventory timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parts_inventory_updated_at
    BEFORE UPDATE ON parts_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();