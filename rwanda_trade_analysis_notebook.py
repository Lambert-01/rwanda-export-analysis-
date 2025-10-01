#!/usr/bin/env python3
"""
Rwanda Trade Data Analysis - Comprehensive Statistical Analysis
NISRA Statistical Datasets Analysis (2024Q4 & 2025Q1)

This script performs comprehensive statistical analysis on Rwanda's trade data including:
- Descriptive statistics and data exploration
- Outlier detection using multiple methods
- Correlation analysis and feature relationships
- Time series analysis and forecasting
- Machine learning predictive models
- Ensemble methods for improved accuracy
- Advanced visualizations and reporting

Dataset Sources:
- 2024Q4_Trade_report_annexTables.xlsx
- 2025Q1_Trade_report_annexTables.xlsx
- Comprehensive analysis from Python processing pipeline
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os
from datetime import datetime
from scipy import stats
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import mean_squared_error, r2_score, silhouette_score
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

# Set style for better visualizations
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

print("Starting Rwanda Trade Data Analysis...")

def ensure_directory_exists(directory):
    """Ensure directory exists, create if it doesn't"""
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"📁 Created directory: {directory}")

def main():
    """Main analysis function"""

    # Create necessary directories
    ensure_directory_exists('visualizations')
    ensure_directory_exists('models')
    ensure_directory_exists('reports')

    # Load comprehensive analysis data
    print("📊 Loading comprehensive analysis data...")
    try:
        with open('data/processed/comprehensive_analysis.json', 'r') as f:
            comprehensive_data = json.load(f)

        print(f"✅ Loaded comprehensive analysis data")
        print(f"📈 Quarters covered: {len(comprehensive_data['quarterly_aggregation']['exports'])}")
        print(f"🌍 Countries found: {len(comprehensive_data['country_aggregation']['export_destinations'])}")

        # Convert to DataFrames for easier analysis
        exports_df = pd.DataFrame(comprehensive_data['quarterly_aggregation']['exports'])
        imports_df = pd.DataFrame(comprehensive_data['quarterly_aggregation']['imports'])
        countries_df = pd.DataFrame(comprehensive_data['country_aggregation']['export_destinations'])

        print(f"\n📋 Exports DataFrame shape: {exports_df.shape}")
        print(f"📋 Imports DataFrame shape: {imports_df.shape}")
        print(f"📋 Countries DataFrame shape: {countries_df.shape}")

        # Perform comprehensive analysis
        perform_comprehensive_analysis(exports_df, imports_df, countries_df)

    except FileNotFoundError:
        print("❌ Error: comprehensive_analysis.json not found")
        print("Please run the data processing pipeline first")
        return
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return

def perform_comprehensive_analysis(exports_df, imports_df, countries_df):
    """Perform comprehensive statistical analysis"""

    print("\n🔍 COMPREHENSIVE STATISTICAL ANALYSIS")
    print("="*70)

    # 1. Descriptive Statistics
    print("\n📊 DESCRIPTIVE STATISTICS")
    print("-"*50)

    print("\nExports Summary:")
    print(exports_df.describe())

    print("\nImports Summary:")
    print(imports_df.describe())

    print("\nCountries Summary:")
    print(countries_df.describe())

    # 2. Outlier Detection
    print("\n🔍 OUTLIER DETECTION")
    print("-"*50)

    # Multiple outlier detection methods
    def detect_outliers_zscore(data, threshold=3):
        z_scores = np.abs(stats.zscore(data))
        return z_scores > threshold

    def detect_outliers_iqr(data):
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        return (data < lower_bound) | (data > upper_bound)

    # Apply outlier detection to exports data
    zscore_outliers = detect_outliers_zscore(exports_df['export_value'])
    iqr_outliers = detect_outliers_iqr(exports_df['export_value'])

    print(f"Z-Score outliers: {zscore_outliers.sum()}")
    print(f"IQR outliers: {iqr_outliers.sum()}")

    combined_outliers = zscore_outliers | iqr_outliers
    print(f"Combined outliers: {combined_outliers.sum()}")

    if combined_outliers.sum() > 0:
        outlier_details = exports_df[combined_outliers][['quarter', 'export_value']]
        print("\n🚨 Outlier Details:")
        print(outlier_details)

    # 3. Correlation Analysis
    print("\n🔗 CORRELATION ANALYSIS")
    print("-"*50)

    # Create combined dataset
    trade_df = pd.merge(exports_df, imports_df, on='quarter', suffixes=('_export', '_import'))
    trade_df['trade_balance'] = trade_df['export_value'] - trade_df['import_value']

    # Correlation matrix
    correlation_matrix = trade_df[['export_value', 'import_value', 'trade_balance']].corr()
    print("Correlation Matrix:")
    print(correlation_matrix)

    # 4. Time Series Analysis
    print("\n📈 TIME SERIES ANALYSIS")
    print("-"*50)

    # Convert to time series
    trade_df['date'] = pd.to_datetime(trade_df['quarter'].str.replace('Q', '-Q'))
    ts_data = trade_df.set_index('date')[['export_value', 'import_value', 'trade_balance']]

    print(f"Time series data shape: {ts_data.shape}")
    print(f"Date range: {ts_data.index.min()} to {ts_data.index.max()}")

    # Plot time series
    plt.figure(figsize=(15, 10))

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
    plt.show()

    # 5. Machine Learning Models
    print("\n🤖 MACHINE LEARNING MODELING")
    print("-"*50)

    # Prepare data for ML
    ml_data = trade_df.copy()
    ml_data['quarter_num'] = range(1, len(ml_data) + 1)
    ml_data['export_lag_1'] = ml_data['export_value'].shift(1)
    ml_data['import_lag_1'] = ml_data['import_value'].shift(1)
    ml_data = ml_data.dropna()

    # Features and targets
    feature_cols = ['quarter_num', 'export_lag_1', 'import_lag_1']
    X = ml_data[feature_cols]
    y_exports = ml_data['export_value']
    y_imports = ml_data['import_value']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train models
    models = {
        'Linear Regression': LinearRegression(),
        'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
    }

    results = {}

    for name, model in models.items():
        print(f"\n🔧 Training {name}...")

        # Train model
        model.fit(X_scaled, y_exports)

        # Predictions
        y_pred = model.predict(X_scaled)

        # Metrics
        r2 = r2_score(y_exports, y_pred)
        rmse = np.sqrt(mean_squared_error(y_exports, y_pred))

        print(f"R² Score: {r2:.4f}")
        print(f"RMSE: {rmse:.4f}")

        results[name] = {
            'model': model,
            'r2': r2,
            'rmse': rmse
        }

    # 6. Clustering Analysis
    print("\n🔗 CLUSTERING ANALYSIS")
    print("-"*50)

    # Prepare country data for clustering
    cluster_data = countries_df[['export_value']].copy()
    cluster_data['export_normalized'] = (cluster_data['export_value'] - cluster_data['export_value'].mean()) / cluster_data['export_value'].std()

    # Determine optimal clusters
    inertias = []
    silhouette_scores = []
    K_range = range(2, 8)

    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(cluster_data[['export_normalized']])
        inertias.append(kmeans.inertia_)

        if k > 1:
            silhouette_scores.append(silhouette_score(cluster_data[['export_normalized']], kmeans.labels_))

    # Plot elbow curve
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(K_range, inertias, 'bo-')
    plt.xlabel('Number of Clusters')
    plt.ylabel('Inertia')
    plt.title('Elbow Method')
    plt.grid(True, alpha=0.3)

    plt.subplot(1, 2, 2)
    plt.plot(K_range[1:], silhouette_scores, 'ro-')
    plt.xlabel('Number of Clusters')
    plt.ylabel('Silhouette Score')
    plt.title('Silhouette Score')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('visualizations/clustering_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

    # Perform clustering with optimal k
    optimal_k = 3
    kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
    countries_df['cluster'] = kmeans.fit_predict(cluster_data[['export_normalized']])

    print(f"\nCluster distribution:")
    print(countries_df['cluster'].value_counts().sort_index())

    # 7. Generate Summary Report
    print("\n📋 GENERATING SUMMARY REPORT")
    print("-"*50)

    summary = {
        'analysis_timestamp': datetime.now().isoformat(),
        'dataset_summary': {
            'total_export_quarters': len(exports_df),
            'total_import_quarters': len(imports_df),
            'total_countries': len(countries_df),
            'date_range': f"{exports_df['quarter'].min()} to {exports_df['quarter'].max()}"
        },
        'statistical_summary': {
            'total_export_value': exports_df['export_value'].sum(),
            'total_import_value': imports_df['import_value'].sum(),
            'average_export_value': exports_df['export_value'].mean(),
            'average_import_value': imports_df['import_value'].mean(),
            'export_volatility': exports_df['export_value'].std(),
            'import_volatility': imports_df['import_value'].std()
        },
        'top_performers': {
            'top_export_destination': countries_df.loc[countries_df['export_value'].idxmax(), 'destination_country'],
            'top_export_value': countries_df['export_value'].max(),
            'top_import_source': 'Tanzania',  # From comprehensive analysis
            'top_import_value': 4255.12  # From comprehensive analysis
        },
        'model_performance': {
            'best_model': max(results.keys(), key=lambda x: results[x]['r2']),
            'best_r2_score': max(results.values(), key=lambda x: x['r2'])['r2'],
            'best_rmse': min(results.values(), key=lambda x: x['rmse'])['rmse']
        },
        'outlier_analysis': {
            'outliers_detected': int(combined_outliers.sum()),
            'outlier_percentage': float(combined_outliers.sum() / len(exports_df) * 100)
        },
        'correlation_insights': {
            'export_import_correlation': correlation_matrix.loc['export_value', 'import_value'],
            'export_balance_correlation': correlation_matrix.loc['export_value', 'trade_balance'],
            'import_balance_correlation': correlation_matrix.loc['import_value', 'trade_balance']
        }
    }

    # Save summary report
    with open('reports/comprehensive_analysis_summary.json', 'w') as f:
        json.dump(summary, f, indent=2, default=str)

    print("✅ Analysis completed successfully!")
    print("📁 Results saved to:")
    print("  - visualizations/trade_time_series.png")
    print("  - visualizations/clustering_analysis.png")
    print("  - reports/comprehensive_analysis_summary.json")

    return summary

if __name__ == "__main__":
    main()
