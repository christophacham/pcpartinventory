#!/usr/bin/env python3
"""
Excel Data Import Script for PC Inventory System

Imports existing Excel data into PostgreSQL database:
- Parts inventory from PRICE GUIDE sheet
- PC builds from MAIN TRACKER sheet  
- Buyers from sales data
"""

import psycopg2
import pandas as pd
from datetime import datetime
import uuid
import sys
import os
from decimal import Decimal

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'pc_inventory',
    'user': 'postgres',
    'password': 'password'
}

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def import_parts_inventory(conn, df_prices):
    """Import parts from PRICE GUIDE sheet"""
    cursor = conn.cursor()
    
    print("Importing parts inventory...")
    
    for _, row in df_prices.iterrows():
        if pd.isna(row['Component Type']) or pd.isna(row['Component']):
            continue
            
        part_id = str(uuid.uuid4())
        component_type = str(row['Component Type']).lower()
        component_name = str(row['Component'])
        buy_in_price = float(row['Buy In (kr)']) if not pd.isna(row['Buy In (kr)']) else None
        typical_sell_price = float(row['Typical Sell Price (kr)']) if not pd.isna(row['Typical Sell Price (kr)']) else None
        notes = str(row['Notes']) if not pd.isna(row['Notes']) else None
        purchase_link = str(row['Link']) if not pd.isna(row['Link']) else None
        
        # Determine quantity based on notes
        quantity = 1
        if notes and 'incoming' in notes.lower():
            quantity = 0
        elif notes and any(word in notes.lower() for word in ['unused', 'laying around', 'server']):
            quantity = 1
        
        cursor.execute("""
            INSERT INTO parts_inventory 
            (id, component_type, component_name, buy_in_price, typical_sell_price, 
             quantity_available, notes, purchase_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (part_id, component_type, component_name, buy_in_price, 
              typical_sell_price, quantity, notes, purchase_link))
    
    conn.commit()
    print(f"Imported {cursor.rowcount} parts to inventory")

def import_buyers(conn, df_pcs):
    """Import buyers from PC sales data"""
    cursor = conn.cursor()
    
    print("Importing buyers...")
    
    buyers = {}
    for _, row in df_pcs.iterrows():
        if pd.isna(row['Buyer Name']):
            continue
            
        buyer_name = str(row['Buyer Name'])
        buyer_contact = str(row['Buyer Contact']) if not pd.isna(row['Buyer Contact']) else None
        
        if buyer_name not in buyers:
            buyer_id = str(uuid.uuid4())
            buyers[buyer_name] = buyer_id
            
            cursor.execute("""
                INSERT INTO buyers (id, name, contact)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (buyer_id, buyer_name, buyer_contact))
    
    conn.commit()
    print(f"Imported {len(buyers)} buyers")
    return buyers

def parse_date(date_str):
    """Parse date string to proper format"""
    if pd.isna(date_str):
        return None
    
    try:
        # Handle different date formats
        if isinstance(date_str, str):
            # Try DD-MM-YYYY format first
            return datetime.strptime(date_str, "%d-%m-%Y").date()
        else:
            # Pandas datetime
            return date_str.date()
    except:
        return None

def parse_currency(value):
    """Parse currency string to decimal"""
    if pd.isna(value):
        return None
    
    if isinstance(value, str):
        # Remove 'kr' and convert to float
        clean_value = value.replace('kr', '').replace(',', '').strip()
        try:
            return float(clean_value)
        except:
            return None
    
    return float(value) if not pd.isna(value) else None

def import_pcs_and_components(conn, df_pcs, buyers):
    """Import PCs and their components from MAIN TRACKER sheet"""
    cursor = conn.cursor()
    
    print("Importing PCs and components...")
    
    component_types_map = {
        'CPU': 'cpu',
        'GPU': 'gpu', 
        'Motherboard': 'motherboard',
        'MB': 'motherboard',
        'RAM': 'ram',
        'Storage 1': 'storage1',
        'Storage 2': 'storage2',
        'PSU': 'psu',
        'Case': 'case',
        'CPU Cooler': 'cpu_cooler',
        'Cooler': 'cpu_cooler',
        'Additional Parts': 'additional'
    }
    
    for _, row in df_pcs.iterrows():
        if pd.isna(row['PC ID']):
            continue
            
        pc_id = str(uuid.uuid4())
        pc_name = str(row['PC ID'])
        build_date = parse_date(row['Build Date'])
        list_date = parse_date(row['List Date']) 
        sale_date = parse_date(row['Sale Date'])
        
        buyer_id = None
        if not pd.isna(row['Buyer Name']):
            buyer_name = str(row['Buyer Name'])
            buyer_id = buyers.get(buyer_name)
        
        platform = str(row['Platform (Finn/Other)']) if not pd.isna(row['Platform (Finn/Other)']) else None
        intended_price = parse_currency(row['Intended Price']) if 'Intended Price' in row else None
        actual_sale_price = parse_currency(row['Actual Sale Price']) if not pd.isna(row.get('Actual Sale Price')) else None
        notes = str(row['Notes']) if not pd.isna(row.get('Notes')) else None
        
        # Determine status
        status = 'building'
        if sale_date:
            status = 'sold'
        elif list_date:
            status = 'listed'
        
        # Insert PC
        cursor.execute("""
            INSERT INTO pcs 
            (id, pc_name, build_date, list_date, sale_date, buyer_id, platform, 
             intended_price, actual_sale_price, notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (pc_id, pc_name, build_date, list_date, sale_date, buyer_id, 
              platform, intended_price, actual_sale_price, notes, status))
        
        # Insert components
        components_added = 0
        for comp_type, db_type in component_types_map.items():
            comp_name_col = comp_type
            comp_cost_col = f"{comp_type} Cost"
            
            if comp_name_col in row and comp_cost_col in row:
                comp_name = str(row[comp_name_col]) if not pd.isna(row[comp_name_col]) else None
                comp_cost = parse_currency(row[comp_cost_col])
                
                if comp_name and comp_cost and comp_cost > 0:
                    component_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO pc_components 
                        (id, pc_id, component_type, component_name, cost)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (component_id, pc_id, db_type, comp_name, comp_cost))
                    components_added += 1
        
        print(f"Imported PC '{pc_name}' with {components_added} components")
    
    conn.commit()
    print("Completed PC and component import")

def main():
    """Main import function"""
    print("Starting Excel data import...")
    
    # Check if Excel file exists
    excel_file = "PC_Sales_Tracker.xlsx"
    if not os.path.exists(excel_file):
        print(f"Error: {excel_file} not found")
        sys.exit(1)
    
    try:
        # Read Excel sheets
        print("Reading Excel file...")
        
        # Read all sheets
        excel_data = pd.read_excel(excel_file, sheet_name=None, engine='openpyxl')
        
        # Find the sheets by content rather than exact name
        price_guide_sheet = None
        main_tracker_sheet = None
        
        for sheet_name, df in excel_data.items():
            if 'Component Type' in df.columns and 'Buy In' in str(df.columns):
                price_guide_sheet = df
                print(f"Found price guide data in sheet: {sheet_name}")
            elif 'PC ID' in df.columns and 'Build Date' in df.columns:
                main_tracker_sheet = df  
                print(f"Found main tracker data in sheet: {sheet_name}")
        
        if price_guide_sheet is None:
            print("Warning: Could not find price guide sheet")
        if main_tracker_sheet is None:
            print("Warning: Could not find main tracker sheet")
            
        # Connect to database
        conn = connect_db()
        print("Connected to database")
        
        try:
            # Import data in order
            if price_guide_sheet is not None:
                import_parts_inventory(conn, price_guide_sheet)
            
            if main_tracker_sheet is not None:
                buyers = import_buyers(conn, main_tracker_sheet)
                import_pcs_and_components(conn, main_tracker_sheet, buyers)
            
            print("✅ Excel data import completed successfully!")
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error during import: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()