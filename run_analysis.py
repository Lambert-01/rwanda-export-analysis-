#!/usr/bin/env python3
"""
Rwanda Trade Data Analysis - Simple Analysis Runner
NISRA Statistical Datasets Analysis (2024Q4 & 2025Q1)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os
from datetime import datetime

print("Starting Rwanda Trade Data Analysis...")

def main():
    """Main analysis function"""

    # Create necessary directories
    os.makedirs('visualizations', exist_ok=True)
    os.makedirs('reports', exist_ok=True)
    print("Created output directories")

    # Load comprehensive analysis data
    print("Loading comprehensive analysis data...")
    try:
        with open('data/processed/comprehensive_analysis.json', 'r') as f:
            comprehensive_data = json.load(f)

        print("Loaded comprehensive analysis data")
        print(f"Quarters covered: {len(comprehensive_data['quarterly_aggregation']['exports'])}")
        print(f"Countries found: {len(comprehensive_data['country_aggregation']['export_destinations'])}")

        # Convert to DataFrames
        exports_df = pd.DataFrame(comprehensive_data['quarterly_aggregation']['exports'])
        imports_df = pd.DataFrame(comprehensive_data['quarterly_aggregation']['imports'])
        countries_df = pd.DataFrame(comprehensive_data['country_aggregation']['export_destinations'])

        print(f"Exports DataFrame shape: {exports_df.shape}")
        print(f"Imports DataFrame shape: {imports_df.shape}")
        print(f"Countries DataFrame shape: {countries_df.shape}")

        # Perform analysis
        perform_analysis(exports_df, imports_df, countries_df)

    except FileNotFoundError:
        print("Error: comprehensive_analysis.json not found")
        print("Please run the data processing pipeline first")
        return
    except Exception as e:
        print(f"Error loading data: {e}")
        return

def perform_analysis(exports_df, imports_df, countries_df):
    """Perform statistical analysis"""

    print("\nSTATISTICAL ANALYSIS")
    print("="*50)

    # 1. Basic Statistics
    print("\nBasic Statistics:")
    print("Exports:")
    print(exports_df.describe())
    print("\nImports:")
    print(imports_df.describe())

    # 2. Outlier Detection
    print("\nOUTLIER DETECTION")
    print("-"*30)

    # Simple outlier detection using IQR
    Q1 = exports_df['export_value'].quantile(0.25)
    Q3 = exports_df['export_value'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    outliers = exports_df[(exports_df['export_value'] < lower_bound) | (exports_df['export_value'] > upper_bound)]
    print(f"Outliers detected: {len(outliers)}")
    print(f"Outlier percentage: {len(outliers)/len(exports_df)*100:.2f}%")

    # 3. Correlation Analysis
    print("\nCORRELATION ANALYSIS")
    print("-"*30)

    # Merge data
    trade_df = pd.merge(exports_df, imports_df, on='quarter', suffixes=('_export', '_import'))
    trade_df['trade_balance'] = trade_df['export_value'] - trade_df['import_value']

    # Correlation
    correlation = trade_df[['export_value', 'import_value', 'trade_balance']].corr()
    print("Correlation Matrix:")
    print(correlation)

    # 4. Time Series Plot
    print("\nTIME SERIES ANALYSIS")
    print("-"*30)

    # Convert to time series
    trade_df['date'] = pd.to_datetime(trade_df['quarter'].str.replace('Q', '-Q'))
    ts_data = trade_df.set_index('date')[['export_value', 'import_value', 'trade_balance']]

    # Plot
    plt.figure(figsize=(12, 8))

    plt.subplot(3, 1, 1)
    ts_data['export_value'].plot(title='Export Values Over Time', color='blue')
    plt.ylabel('Export Value')
    plt.grid(True, alpha=0.3)

    plt.subplot(3, 1, 2)
    ts_data['import_value'].plot(title='Import Values Over Time', color='red')
    plt.ylabel('Import Value')
    plt.grid(True, alpha=0.3)

    plt.subplot(3, 1, 3)
    ts_data['trade_balance'].plot(title='Trade Balance Over Time', color='green')
    plt.ylabel('Trade Balance')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('visualizations/trade_time_series.png', dpi=300, bbox_inches='tight')
    print("Saved time series plot to visualizations/trade_time_series.png")

    # 5. Top Countries Analysis
    print("\nTOP COUNTRIES ANALYSIS")
    print("-"*30)

    top_exports = countries_df.nlargest(5, 'export_value')
    print("Top 5 Export Destinations:")
    for _, row in top_exports.iterrows():
        print(f"  {row['destination_country']}: ${row['export_value']:.2f}M")

    # 6. Summary Report
    print("\nSUMMARY REPORT")
    print("-"*30)

    summary = {
        'analysis_timestamp': datetime.now().isoformat(),
        'total_export_value': exports_df['export_value'].sum(),
        'total_import_value': imports_df['import_value'].sum(),
        'trade_balance': exports_df['export_value'].sum() - imports_df['import_value'].sum(),
        'export_destinations': len(countries_df),
        'quarters_analyzed': len(exports_df),
        'outliers_detected': len(outliers),
        'correlation_export_import': correlation.loc['export_value', 'import_value']
    }

    print(f"Total Export Value: ${summary['total_export_value']:.2f}M")
    print(f"Total Import Value: ${summary['total_import_value']:.2f}M")
    print(f"Trade Balance: ${summary['trade_balance']:.2f}M")
    print(f"Export Destinations: {summary['export_destinations']}")
    print(f"Quarters Analyzed: {summary['quarters_analyzed']}")
    print(f"Outliers Detected: {summary['outliers_detected']}")
    print(f"Export-Import Correlation: {summary['correlation_export_import']:.4f}")

    # Save summary
    with open('reports/analysis_summary.json', 'w') as f:
        json.dump(summary, f, indent=2, default=str)

    print("\nSaved summary to reports/analysis_summary.json")
    print("Analysis completed successfully!")

if __name__ == "__main__":
    main()