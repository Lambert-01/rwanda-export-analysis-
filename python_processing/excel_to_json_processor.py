#!/usr/bin/env python3
"""
Rwanda Trade Data Excel Processor
Processes Excel files and generates JSON data for the dashboard
"""

import pandas as pd
import json
import os
from datetime import datetime
import sys

def process_excel_file(excel_path, output_dir):
    """
    Process Excel file and generate structured JSON data
    """
    print(f"📊 Processing Excel file: {excel_path}")

    try:
        # Read all sheets from Excel file
        excel_file = pd.ExcelFile(excel_path)

        # Process different types of data
        exports_data = []
        imports_data = []
        reexports_data = []
        trade_balance_data = []
        commodities_data = []

        for sheet_name in excel_file.sheet_names:
            print(f"Processing sheet: {sheet_name}")
            df = pd.read_excel(excel_path, sheet_name=sheet_name)

            if sheet_name.lower().startswith('export') and 'country' in str(df.columns).lower():
                exports_data.extend(process_exports_sheet(df, sheet_name))
            elif sheet_name.lower().startswith('import') and 'country' in str(df.columns).lower():
                imports_data.extend(process_imports_sheet(df, sheet_name))
            elif sheet_name.lower().startswith('re') and 'export' in sheet_name.lower():
                reexports_data.extend(process_reexports_sheet(df, sheet_name))
            elif 'trade' in sheet_name.lower() and 'balance' in str(df.columns).lower():
                trade_balance_data.extend(process_trade_balance_sheet(df, sheet_name))
            elif any(word in sheet_name.lower() for word in ['commodity', 'sitc', 'product']):
                commodities_data.extend(process_commodities_sheet(df, sheet_name))

        # Generate summary statistics
        summary_stats = generate_summary_statistics(exports_data, imports_data, reexports_data)

        # Save processed data
        save_processed_data(output_dir, {
            'exports': exports_data,
            'imports': imports_data,
            'reexports': reexports_data,
            'trade_balance': trade_balance_data,
            'commodities': commodities_data,
            'summary': summary_stats
        })

        print(f"✅ Successfully processed {len(exports_data)} export records")
        print(f"✅ Successfully processed {len(imports_data)} import records")
        print(f"✅ Successfully processed {len(reexports_data)} re-export records")

        return True

    except Exception as e:
        print(f"❌ Error processing Excel file: {e}")
        return False

def process_exports_sheet(df, sheet_name):
    """Process exports sheet and extract country-wise data"""
    data = []

    # Find relevant columns
    quarter_cols = [col for col in df.columns if 'q' in str(col).lower() and any(q in str(col).lower() for q in ['2023', '2024', '2025'])]
    country_col = None

    # Identify country column
    for col in df.columns:
        if 'country' in str(col).lower() or 'destination' in str(col).lower():
            country_col = col
            break

    if not country_col:
        return data

    for _, row in df.iterrows():
        country = str(row[country_col]).strip()
        if country and country.lower() not in ['total', 'nan', 'nat']:
            for quarter_col in quarter_cols:
                try:
                    value = float(row[quarter_col]) if pd.notna(row[quarter_col]) else 0
                    if value > 0:
                        data.append({
                            'quarter': quarter_col,
                            'export_value': value,
                            'destination_country': country,
                            'data_source': '2025Q1',
                            'trade_type': 'export'
                        })
                except (ValueError, TypeError):
                    continue

    return data

def process_imports_sheet(df, sheet_name):
    """Process imports sheet and extract country-wise data"""
    data = []

    # Find relevant columns
    quarter_cols = [col for col in df.columns if 'q' in str(col).lower() and any(q in str(col).lower() for q in ['2023', '2024', '2025'])]
    country_col = None

    # Identify country column
    for col in df.columns:
        if 'country' in str(col).lower() or 'source' in str(col).lower():
            country_col = col
            break

    if not country_col:
        return data

    for _, row in df.iterrows():
        country = str(row[country_col]).strip()
        if country and country.lower() not in ['total', 'nan', 'nat']:
            for quarter_col in quarter_cols:
                try:
                    value = float(row[quarter_col]) if pd.notna(row[quarter_col]) else 0
                    if value > 0:
                        data.append({
                            'quarter': quarter_col,
                            'import_value': value,
                            'source_country': country,
                            'data_source': '2025Q1',
                            'trade_type': 'import'
                        })
                except (ValueError, TypeError):
                    continue

    return data

def process_reexports_sheet(df, sheet_name):
    """Process re-exports sheet and extract country-wise data"""
    data = []

    # Find relevant columns
    quarter_cols = [col for col in df.columns if 'q' in str(col).lower() and any(q in str(col).lower() for q in ['2023', '2024', '2025'])]
    country_col = None

    # Identify country column
    for col in df.columns:
        if 'country' in str(col).lower() or 'destination' in str(col).lower():
            country_col = col
            break

    if not country_col:
        return data

    for _, row in df.iterrows():
        country = str(row[country_col]).strip()
        if country and country.lower() not in ['total', 'nan', 'nat']:
            for quarter_col in quarter_cols:
                try:
                    value = float(row[quarter_col]) if pd.notna(row[quarter_col]) else 0
                    if value > 0:
                        data.append({
                            'quarter': quarter_col,
                            'export_value': value,
                            'destination_country': country,
                            'data_source': '2025Q1',
                            'trade_type': 'reexport'
                        })
                except (ValueError, TypeError):
                    continue

    return data

def process_trade_balance_sheet(df, sheet_name):
    """Process trade balance data"""
    data = []

    # Find relevant columns
    quarter_cols = [col for col in df.columns if 'q' in str(col).lower() and any(q in str(col).lower() for q in ['2023', '2024', '2025'])]

    for _, row in df.iterrows():
        for quarter_col in quarter_cols:
            try:
                export_val = float(row.get('Exports', 0)) if pd.notna(row.get('Exports', 0)) else 0
                import_val = float(row.get('Imports', 0)) if pd.notna(row.get('Imports', 0)) else 0
                balance = export_val - import_val

                data.append({
                    'quarter': quarter_col,
                    'export_value': export_val,
                    'import_value': import_val,
                    'trade_balance': balance,
                    'balance_type': 'surplus' if balance > 0 else 'deficit'
                })
            except (ValueError, TypeError):
                continue

    return data

def process_commodities_sheet(df, sheet_name):
    """Process commodities data"""
    data = []

    # Find relevant columns
    quarter_cols = [col for col in df.columns if 'q' in str(col).lower() and any(q in str(col).lower() for q in ['2023', '2024', '2025'])]

    for _, row in df.iterrows():
        commodity = str(row.get('COMMODITY DESCRIPTION', row.get('SITC SECTION', 'Unknown'))).strip()
        if commodity and commodity.lower() not in ['total', 'nan', 'nat']:
            for quarter_col in quarter_cols:
                try:
                    value = float(row[quarter_col]) if pd.notna(row[quarter_col]) else 0
                    if value > 0:
                        data.append({
                            'quarter': quarter_col,
                            'value': value,
                            'commodity': commodity,
                            'sitc_section': str(row.get('SITC SECTION', 'Unknown')),
                            'data_source': '2025Q1'
                        })
                except (ValueError, TypeError):
                    continue

    return data

def generate_summary_statistics(exports_data, imports_data, reexports_data):
    """Generate summary statistics from processed data"""
    summary = {
        'total_exports': sum(item.get('export_value', 0) for item in exports_data),
        'total_imports': sum(item.get('import_value', 0) for item in imports_data),
        'total_reexports': sum(item.get('export_value', 0) for item in reexports_data),
        'export_countries': len(set(item.get('destination_country', '') for item in exports_data)),
        'import_countries': len(set(item.get('source_country', '') for item in imports_data)),
        'quarters_covered': len(set(item.get('quarter', '') for item in exports_data + imports_data)),
        'data_points': len(exports_data) + len(imports_data) + len(reexports_data)
    }

    return summary

def save_processed_data(output_dir, data_dict):
    """Save processed data to JSON files"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Save individual data types
    for data_type, data in data_dict.items():
        if data_type != 'summary' and data:
            filename = f"{timestamp}_{data_type}_data.json"
            filepath = os.path.join(output_dir, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"💾 Saved {len(data)} {data_type} records to {filename}")

    # Save summary
    summary_filepath = os.path.join(output_dir, f"{timestamp}_summary.json")
    with open(summary_filepath, 'w', encoding='utf-8') as f:
        json.dump(data_dict.get('summary', {}), f, indent=2, ensure_ascii=False)

    print(f"📊 Summary saved to {summary_filepath}")

def main():
    """Main function"""
    # File paths (relative to script location)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    excel_path = os.path.join(project_root, "data", "raw", "2025Q1_Trade_report_annexTables.xlsx")
    output_dir = os.path.join(project_root, "data", "processed")

    # Check if file exists
    if not os.path.exists(excel_path):
        print(f"❌ Excel file not found: {excel_path}")
        print("📁 Looking for files in data/raw directory:")
        raw_dir = os.path.join(project_root, "data", "raw")
        if os.path.exists(raw_dir):
            for file in os.listdir(raw_dir):
                print(f"   - {file}")
        else:
            print(f"❌ Data directory not found: {raw_dir}")
        return False

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Starting Rwanda Trade Data Processing...")
    print(f"📁 Input file: {excel_path}")
    print(f"📁 Output directory: {output_dir}")

    # Process the Excel file
    success = process_excel_file(excel_path, output_dir)

    if success:
        print("✅ Processing completed successfully!")
        print(f"📊 Processed data saved to: {output_dir}")
    else:
        print("❌ Processing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()