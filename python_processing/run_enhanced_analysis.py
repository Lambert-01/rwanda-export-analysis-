#!/usr/bin/env python3
"""
Enhanced Analysis Runner for Rwanda Trade Data
Simple script to run the complete comprehensive analysis pipeline
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main function to run enhanced analysis."""
    print("🚀 RWANDA TRADE DATA - ENHANCED ANALYSIS PIPELINE")
    print("="*70)

    try:
        # Import the comprehensive analysis runner
        from comprehensive_analysis_runner import ComprehensiveAnalysisRunner

        # Configuration
        config = {
            'excel_file': '2025Q1_Trade_report_annexTables.xlsx',
            'analysis_components': ['data_processing', 'time_series', 'forecasting', 'reporting'],
            'force_reprocess': False,  # Set to True if you want to reprocess existing data
            'forecast_periods': 8
        }

        print(f"📊 Starting analysis with config: {config}")
        print(f"📁 Data directory: {config['excel_file']}")
        print(f"🔮 Forecast periods: {config['forecast_periods']}")
        print()

        # Initialize and run the analysis
        runner = ComprehensiveAnalysisRunner(config)

        # Run the complete pipeline
        results = runner.run_comprehensive_analysis()

        # Print summary
        runner.print_summary()

        # Success message
        print("\n🎉 ENHANCED ANALYSIS COMPLETED SUCCESSFULLY!")
        print("\n📋 Key Features Used:")
        print("   ✅ ARIMA & SARIMA Time Series Models")
        print("   ✅ Comprehensive Statistical Analysis")
        print("   ✅ Advanced Forecasting (Linear, RF, GB)")
        print("   ✅ Ensemble Forecasting Methods")
        print("   ✅ Trade Balance Analysis")
        print("   ✅ Risk Assessment")
        print("   ✅ Automated Recommendations")
        print("   ✅ JSON Output Generation")

        print("\n📁 Check the following files in data/processed/:")
        print("   - comprehensive_trade_analysis_*.json")
        print("   - enhanced_time_series_analysis_*.json")
        print("   - predictions.json")
        print("   - analysis_report.json")

        return True

    except FileNotFoundError as e:
        print(f"❌ File not found: {str(e)}")
        print("Please ensure the Excel file exists in data/raw/")
        return False

    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        print("Please install required packages:")
        print("pip install -r requirements_enhanced.txt")
        return False

    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        logger.error(f"Analysis execution failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)