#!/usr/bin/env python3
"""
Load Processed Rwanda Trade Data to MongoDB
Loads the processed JSON data files to MongoDB for the dashboard
"""

import json
import os
import glob
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import sys

def connect_to_mongodb():
    """Connect to MongoDB"""
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')

        # Test connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")

        return client

    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        return None

def load_json_file(filepath):
    """Load and return JSON data from file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"📖 Loaded {len(data)} records from {os.path.basename(filepath)}")
        return data
    except Exception as e:
        print(f"❌ Error loading {filepath}: {e}")
        return None

def clear_existing_data(db):
    """Clear existing trade data from MongoDB"""
    try:
        collections_to_clear = [
            'exports_quarterly',
            'imports_quarterly',
            'exports_destinations',
            'exports_products',
            'imports_sources',
            'trade_balance',
            'commodities'
        ]

        for collection_name in collections_to_clear:
            result = db[collection_name].delete_many({})
            print(f"🗑️ Cleared {result.deleted_count} documents from {collection_name}")

        print("✅ Existing data cleared")
        return True

    except Exception as e:
        print(f"❌ Error clearing existing data: {e}")
        return False

def load_exports_data(db, data):
    """Load exports data to MongoDB"""
    try:
        if not data:
            print("⚠️ No exports data to load")
            return True

        # Prepare data for insertion
        exports_quarterly = []
        exports_destinations = []

        for item in data:
            # Data for exports_quarterly collection
            exports_quarterly.append({
                'period': item.get('quarter'),
                'exports': item.get('export_value', 0),
                'destination_country': item.get('destination_country'),
                'data_source': item.get('data_source'),
                'trade_type': item.get('trade_type', 'export'),
                'created_at': datetime.now()
            })

            # Data for exports_destinations collection (aggregated)
            exports_destinations.append({
                'country': item.get('destination_country'),
                'period': item.get('quarter'),
                'value': item.get('export_value', 0),
                'data_source': item.get('data_source'),
                'created_at': datetime.now()
            })

        # Insert to MongoDB
        if exports_quarterly:
            result = db.exports_quarterly.insert_many(exports_quarterly)
            print(f"💾 Inserted {len(result.inserted_ids)} export records")

        if exports_destinations:
            result = db.exports_destinations.insert_many(exports_destinations)
            print(f"💾 Inserted {len(result.inserted_ids)} export destination records")

        return True

    except Exception as e:
        print(f"❌ Error loading exports data: {e}")
        return False

def load_imports_data(db, data):
    """Load imports data to MongoDB"""
    try:
        if not data:
            print("⚠️ No imports data to load")
            return True

        # Prepare data for insertion
        imports_quarterly = []
        imports_sources = []

        for item in data:
            # Data for imports_quarterly collection
            imports_quarterly.append({
                'period': item.get('quarter'),
                'imports': item.get('import_value', 0),
                'source_country': item.get('source_country'),
                'data_source': item.get('data_source'),
                'trade_type': item.get('trade_type', 'import'),
                'created_at': datetime.now()
            })

            # Data for imports_sources collection (aggregated)
            imports_sources.append({
                'country': item.get('source_country'),
                'period': item.get('quarter'),
                'value': item.get('import_value', 0),
                'data_source': item.get('data_source'),
                'created_at': datetime.now()
            })

        # Insert to MongoDB
        if imports_quarterly:
            result = db.imports_quarterly.insert_many(imports_quarterly)
            print(f"💾 Inserted {len(result.inserted_ids)} import records")

        if imports_sources:
            result = db.imports_sources.insert_many(imports_sources)
            print(f"💾 Inserted {len(result.inserted_ids)} import source records")

        return True

    except Exception as e:
        print(f"❌ Error loading imports data: {e}")
        return False

def load_trade_balance_data(db, data):
    """Load trade balance data to MongoDB"""
    try:
        if not data:
            print("⚠️ No trade balance data to load")
            return True

        # Prepare data for insertion
        trade_balance_records = []

        for item in data:
            trade_balance_records.append({
                'period': item.get('quarter'),
                'exports': item.get('export_value', 0),
                'imports': item.get('import_value', 0),
                'trade_balance': item.get('trade_balance', 0),
                'balance_type': item.get('balance_type', 'unknown'),
                'created_at': datetime.now()
            })

        # Insert to MongoDB
        if trade_balance_records:
            result = db.trade_balance.insert_many(trade_balance_records)
            print(f"💾 Inserted {len(result.inserted_ids)} trade balance records")

        return True

    except Exception as e:
        print(f"❌ Error loading trade balance data: {e}")
        return False

def load_commodities_data(db, data):
    """Load commodities data to MongoDB"""
    try:
        if not data:
            print("⚠️ No commodities data to load")
            return True

        # Prepare data for insertion
        commodities_records = []

        for item in data:
            commodities_records.append({
                'period': item.get('quarter'),
                'commodity': item.get('commodity'),
                'sitc_section': item.get('sitc_section'),
                'value': item.get('value', 0),
                'data_source': item.get('data_source'),
                'created_at': datetime.now()
            })

        # Insert to MongoDB
        if commodities_records:
            result = db.commodities.insert_many(commodities_records)
            print(f"💾 Inserted {len(result.inserted_ids)} commodity records")

        return True

    except Exception as e:
        print(f"❌ Error loading commodities data: {e}")
        return False

def create_indexes(db):
    """Create indexes for better query performance"""
    try:
        # Indexes for exports_quarterly
        db.exports_quarterly.create_index([('period', 1)])
        db.exports_quarterly.create_index([('destination_country', 1)])
        db.exports_quarterly.create_index([('data_source', 1)])

        # Indexes for imports_quarterly
        db.imports_quarterly.create_index([('period', 1)])
        db.imports_quarterly.create_index([('source_country', 1)])
        db.imports_quarterly.create_index([('data_source', 1)])

        # Indexes for trade_balance
        db.trade_balance.create_index([('period', 1)])
        db.trade_balance.create_index([('balance_type', 1)])

        # Indexes for commodities
        db.commodities.create_index([('period', 1)])
        db.commodities.create_index([('sitc_section', 1)])

        print("✅ Database indexes created")
        return True

    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        return False

def main():
    """Main function"""
    # Database connection
    client = connect_to_mongodb()
    if not client:
        sys.exit(1)

    db = client.rwanda_export_explorer

    # Data directories (relative to script location)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    processed_dir = os.path.join(project_root, "data", "processed")

    print("🚀 Starting data loading to MongoDB...")
    print(f"📁 Source directory: {processed_dir}")

    # Clear existing data
    print("🧹 Clearing existing data...")
    clear_existing_data(db)

    # Find all JSON files in processed directory
    json_files = glob.glob(os.path.join(processed_dir, "*_data.json"))

    if not json_files:
        print("❌ No JSON data files found in processed directory")
        sys.exit(1)

    print(f"📂 Found {len(json_files)} JSON files to process")

    # Process each JSON file
    for json_file in json_files:
        filename = os.path.basename(json_file)
        print(f"\n📖 Processing {filename}...")

        # Load JSON data
        data = load_json_file(json_file)
        if not data:
            continue

        # Route to appropriate loader based on filename
        if 'exports' in filename.lower():
            success = load_exports_data(db, data)
        elif 'imports' in filename.lower():
            success = load_imports_data(db, data)
        elif 'balance' in filename.lower():
            success = load_trade_balance_data(db, data)
        elif 'commodit' in filename.lower():
            success = load_commodities_data(db, data)
        else:
            print(f"⚠️ Unknown file type: {filename}")
            continue

        if not success:
            print(f"❌ Failed to load {filename}")
            continue

    # Create indexes
    print("\n🔍 Creating database indexes...")
    create_indexes(db)

    # Verify data loading
    print("\n📊 Verifying data loading...")
    collections = ['exports_quarterly', 'imports_quarterly', 'trade_balance', 'commodities']

    for collection_name in collections:
        count = db[collection_name].count_documents({})
        print(f"📈 {collection_name}: {count} documents")

    print("\n✅ Data loading completed successfully!")
    print("🌐 Dashboard should now display real data from MongoDB")

    # Close connection
    client.close()

if __name__ == "__main__":
    main()