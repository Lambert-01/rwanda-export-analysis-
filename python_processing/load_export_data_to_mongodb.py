#!/usr/bin/env python3
"""
Load Export Analysis Data to MongoDB
Loads the generated JSON files into MongoDB for frontend consumption
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mongodb_loader.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MongoDBLoader:
    """Loader for export analysis data to MongoDB."""

    def __init__(self, mongodb_uri: str = "mongodb://localhost:27017/rwanda_trade"):
        """Initialize MongoDB loader."""
        self.mongodb_uri = mongodb_uri
        self.client = None
        self.db = None

        try:
            self.client = MongoClient(mongodb_uri)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client.get_database("rwanda_trade")
            logger.info("[SUCCESS] Connected to MongoDB successfully")
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {e}")
            raise

    def load_export_analysis_data(self, data_dir: str = "../data/processed") -> Dict[str, Any]:
        """Load all export analysis JSON files to MongoDB."""
        data_path = Path(data_dir)
        results = {}

        # Files to load
        files_to_load = {
            'export_sitc_products': 'export_sitc_products.json',
            'export_growth_by_quarter': 'export_growth_by_quarter.json',
            'export_performance_over_time': 'export_performance_over_time.json',
            'export_period_products_q4_2024': 'export_period_products_q4_2024.json',
            'export_detailed_country_analysis': 'export_detailed_country_analysis.json'
        }

        # Also load raw export data for proper aggregation
        raw_exports_file = data_path / "2025q1_exports_data.json"
        if raw_exports_file.exists():
            try:
                logger.info(f"[FILE] Loading raw exports data into MongoDB collection: exports")
                with open(raw_exports_file, 'r', encoding='utf-8') as f:
                    raw_exports_data = json.load(f)

                # Add metadata to each document
                for doc in raw_exports_data:
                    doc['_loaded_at'] = datetime.now()
                    doc['_source_file'] = "2025q1_exports_data.json"
                    doc['_collection'] = "exports"

                # Insert into MongoDB
                collection = self.db['exports']
                collection.delete_many({})
                if raw_exports_data:
                    collection.insert_many(raw_exports_data)
                    logger.info(f"[SUCCESS] Loaded {len(raw_exports_data)} raw export documents")
                else:
                    logger.info("[SUCCESS] No raw export data to load")
            except Exception as e:
                logger.error(f"[ERROR] Error loading raw exports data: {e}")

        for collection_name, filename in files_to_load.items():
            filepath = data_path / filename

            if filepath.exists():
                try:
                    logger.info(f"[FILE] Loading {filename} into MongoDB collection: {collection_name}")

                    # Load JSON data
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    # Add metadata
                    if isinstance(data, dict):
                        data['_loaded_at'] = datetime.now()
                        data['_source_file'] = filename
                        data['_collection'] = collection_name

                    # Insert into MongoDB
                    collection = self.db[collection_name]

                    # Clear existing data for this collection
                    collection.delete_many({})

                    if isinstance(data, list):
                        if data:  # Only insert if list is not empty
                            collection.insert_many(data)
                            results[collection_name] = len(data)
                        else:
                            results[collection_name] = 0
                    else:
                        collection.insert_one(data)
                        results[collection_name] = 1

                    logger.info(f"[SUCCESS] Loaded {results[collection_name]} documents into {collection_name}")

                except Exception as e:
                    logger.error(f"❌ Error loading {filename}: {e}")
                    results[collection_name] = 0
            else:
                logger.warning(f"⚠️ File not found: {filepath}")
                results[collection_name] = 0

        return results

    def load_re_exports_data(self, data_dir: str = "../data/processed") -> Dict[str, Any]:
        """Load re-exports data to MongoDB."""
        data_path = Path(data_dir)
        filepath = data_path / "combined_re_exports_data.json"

        if not filepath.exists():
            logger.warning(f"⚠️ Re-exports file not found: {filepath}")
            return {"re_exports": 0}

        try:
            logger.info("[FILE] Loading re-exports data into MongoDB")

            # Load JSON data
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Add metadata to each document
            for doc in data:
                doc['_loaded_at'] = datetime.now()
                doc['_source_file'] = "combined_re_exports_data.json"
                doc['_collection'] = "re_exports"

            # Insert into MongoDB
            collection = self.db['re_exports']

            # Clear existing data
            collection.delete_many({})

            if data:  # Only insert if list is not empty
                collection.insert_many(data)
                result_count = len(data)
            else:
                result_count = 0

            logger.info(f"[SUCCESS] Loaded {result_count} re-export documents")
            return {"re_exports": result_count}

        except Exception as e:
            logger.error(f"❌ Error loading re-exports data: {e}")
            return {"re_exports": 0}

    def verify_data_in_mongodb(self) -> Dict[str, Any]:
        """Verify that data was loaded correctly into MongoDB."""
        verification = {}

        collections_to_check = [
            'export_sitc_products',
            'export_growth_by_quarter',
            'export_performance_over_time',
            'export_period_products_q4_2024',
            'export_detailed_country_analysis',
            're_exports'
        ]

        for collection_name in collections_to_check:
            try:
                collection = self.db[collection_name]
                count = collection.count_documents({})
                verification[collection_name] = count

                # Get sample document
                sample = collection.find_one()
                if sample:
                    verification[f"{collection_name}_sample"] = {
                        'keys': list(sample.keys())[:5],  # First 5 keys
                        'has_loaded_at': '_loaded_at' in sample,
                        'document_type': type(sample).__name__
                    }

            except Exception as e:
                logger.error(f"❌ Error verifying {collection_name}: {e}")
                verification[collection_name] = 0

        return verification

    def close_connection(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("[DISCONNECT] MongoDB connection closed")

def main():
    """Main function to load data to MongoDB."""
    try:
        # MongoDB connection URI - adjust as needed
        mongodb_uri = "mongodb://localhost:27017/rwanda_trade"

        loader = MongoDBLoader(mongodb_uri)

        print("[START] Starting data load to MongoDB...")

        # Load export analysis data
        export_results = loader.load_export_analysis_data()
        print(f"[DATA] Export analysis data loaded: {export_results}")

        # Load re-exports data
        reexport_results = loader.load_re_exports_data()
        print(f"[DATA] Re-exports data loaded: {reexport_results}")

        # Verify data
        verification = loader.verify_data_in_mongodb()
        print(f"[VERIFY] Data verification: {verification}")

        # Summary
        total_loaded = sum(count for collection, count in verification.items() if not collection.endswith('_sample'))
        print(f"[SUCCESS] Successfully loaded {total_loaded} documents to MongoDB")

        loader.close_connection()
        return {
            'export_analysis': export_results,
            're_exports': reexport_results,
            'verification': verification,
            'total_documents': total_loaded
        }

    except Exception as e:
        print(f"❌ Error during MongoDB loading: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()