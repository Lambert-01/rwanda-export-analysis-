#!/usr/bin/env python3
"""
Process Single Rwanda Trade Data File
Processes only the 2025Q1 file that exists in the user's data/raw directory
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_data_processor import EnhancedDataProcessor

def main():
    """Process the single 2025Q1 file."""
    try:
        print("🔍 Checking for available Excel files...")

        # Initialize processor
        processor = EnhancedDataProcessor()

        # Check what files exist
        raw_dir = processor.raw_data_dir
        print(f"📁 Looking in directory: {raw_dir}")

        excel_files = [f for f in os.listdir(raw_dir) if f.endswith('.xlsx')]
        print(f"📋 Found Excel files: {excel_files}")

        if not excel_files:
            print("❌ No Excel files found!")
            return

        # Process only the files that exist
        results = processor.process_multiple_files(excel_files)

        print("✅ Processing completed successfully!")
        print(f"📊 Records extracted: {results['combined_analysis']['summary']['total_records_extracted']}")
        print(f"🌍 Countries found: {len(results['combined_analysis']['summary']['countries_found'])}")
        print(f"📅 Quarters covered: {len(results['combined_analysis']['summary']['quarters_covered'])}")

        return results

    except Exception as e:
        print(f"❌ Error during processing: {str(e)}")
        return None

if __name__ == "__main__":
    main()