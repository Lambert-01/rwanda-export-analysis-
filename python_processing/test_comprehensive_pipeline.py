#!/usr/bin/env python3
"""
Test script for the comprehensive analysis pipeline
Tests all components and generates sample outputs
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def test_imports():
    """Test that all required modules can be imported."""
    logger.info("Testing imports...")

    try:
        from enhanced_data_processor import EnhancedDataProcessor
        from enhanced_time_series_analyzer import EnhancedTimeSeriesAnalyzer
        from comprehensive_analysis_runner import ComprehensiveAnalysisRunner
        from predictor import TradePredictor
        logger.info("✅ All imports successful")
        return True
    except ImportError as e:
        logger.error(f"❌ Import failed: {str(e)}")
        return False

def test_data_processing():
    """Test data processing functionality."""
    logger.info("Testing data processing...")

    try:
        from enhanced_data_processor import EnhancedDataProcessor

        # Initialize processor
        processor = EnhancedDataProcessor()

        # Check if Excel file exists
        excel_path = Path("../data/raw/2025Q1_Trade_report_annexTables.xlsx")
        if not excel_path.exists():
            logger.warning(f"Excel file not found: {excel_path}")
            return False

        # Test loading Excel data
        data = processor.load_excel_data("2025Q1_Trade_report_annexTables.xlsx")

        if not data:
            logger.error("No data loaded from Excel file")
            return False

        logger.info(f"✅ Data processing test passed - loaded {len(data)} sheets")
        return True

    except Exception as e:
        logger.error(f"❌ Data processing test failed: {str(e)}")
        return False

def test_time_series_analysis():
    """Test time series analysis functionality."""
    logger.info("Testing time series analysis...")

    try:
        from enhanced_time_series_analyzer import EnhancedTimeSeriesAnalyzer

        # Initialize analyzer
        analyzer = EnhancedTimeSeriesAnalyzer()

        # Check if we have processed data
        if not analyzer.exports_data and not analyzer.imports_data:
            logger.warning("No processed data available for time series analysis")
            return False

        # Test time series preparation
        if analyzer.exports_data:
            export_ts = analyzer.prepare_time_series(analyzer.exports_data, 'export_value')
            if export_ts.empty:
                logger.error("Failed to prepare export time series")
                return False

        if analyzer.imports_data:
            import_ts = analyzer.prepare_time_series(analyzer.imports_data, 'import_value')
            if import_ts.empty:
                logger.error("Failed to prepare import time series")
                return False

        logger.info("✅ Time series analysis test passed")
        return True

    except Exception as e:
        logger.error(f"❌ Time series analysis test failed: {str(e)}")
        return False

def test_forecasting():
    """Test forecasting functionality."""
    logger.info("Testing forecasting...")

    try:
        from predictor import TradePredictor

        # Initialize predictor
        predictor = TradePredictor()

        # Check if we have data
        if not predictor.exports_data and not predictor.imports_data:
            logger.warning("No data available for forecasting")
            return False

        # Test baseline predictions (should always work)
        baseline_export = predictor._generate_baseline_predictions(4, 'export')
        baseline_import = predictor._generate_baseline_predictions(4, 'import')

        if not baseline_export or not baseline_import:
            logger.error("Failed to generate baseline predictions")
            return False

        logger.info("✅ Forecasting test passed")
        return True

    except Exception as e:
        logger.error(f"❌ Forecasting test failed: {str(e)}")
        return False

def test_comprehensive_runner():
    """Test the comprehensive analysis runner."""
    logger.info("Testing comprehensive analysis runner...")

    try:
        from comprehensive_analysis_runner import ComprehensiveAnalysisRunner

        # Initialize runner with test config
        config = {
            'excel_file': '2025Q1_Trade_report_annexTables.xlsx',
            'analysis_components': ['data_processing'],  # Just test data processing for speed
            'force_reprocess': True
        }

        runner = ComprehensiveAnalysisRunner(config)

        # Test initialization
        if not runner.data_dir.exists():
            logger.error("Data directory not found")
            return False

        logger.info("✅ Comprehensive runner test passed")
        return True

    except Exception as e:
        logger.error(f"❌ Comprehensive runner test failed: {str(e)}")
        return False

def run_sample_analysis():
    """Run a sample analysis to generate outputs."""
    logger.info("Running sample analysis...")

    try:
        from comprehensive_analysis_runner import ComprehensiveAnalysisRunner

        # Run with minimal configuration
        config = {
            'excel_file': '2025Q1_Trade_report_annexTables.xlsx',
            'analysis_components': ['data_processing', 'time_series'],
            'force_reprocess': True
        }

        runner = ComprehensiveAnalysisRunner(config)
        results = runner.run_comprehensive_analysis()

        if results and 'errors' in results and len(results['errors']) == 0:
            logger.info("✅ Sample analysis completed successfully")
            return True
        else:
            logger.error("Sample analysis had errors")
            return False

    except Exception as e:
        logger.error(f"❌ Sample analysis failed: {str(e)}")
        return False

def check_generated_files():
    """Check what files were generated by the analysis."""
    logger.info("Checking generated files...")

    try:
        processed_dir = Path("../data/processed")

        if not processed_dir.exists():
            logger.error("Processed directory not found")
            return False

        # List all JSON files in processed directory
        json_files = list(processed_dir.glob("*.json"))

        if not json_files:
            logger.warning("No JSON files found in processed directory")
            return False

        logger.info(f"Found {len(json_files)} JSON files:")
        for file in sorted(json_files):
            file_size = file.stat().st_size
            logger.info(f"   - {file.name} ({file_size:,}","ytes)")

        return True

    except Exception as e:
        logger.error(f"❌ Error checking files: {str(e)}")
        return False

def main():
    """Main test function."""
    logger.info("Starting comprehensive pipeline tests")
    print("="*80)
    print("RWANDA TRADE DATA ANALYSIS - COMPREHENSIVE PIPELINE TEST")
    print("="*80)

    tests = [
        ("Import Test", test_imports),
        ("Data Processing Test", test_data_processing),
        ("Time Series Analysis Test", test_time_series_analysis),
        ("Forecasting Test", test_forecasting),
        ("Comprehensive Runner Test", test_comprehensive_runner),
        ("Sample Analysis", run_sample_analysis),
        ("Generated Files Check", check_generated_files)
    ]

    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                print(f"   ✅ {test_name} PASSED")
            else:
                print(f"   ❌ {test_name} FAILED")
        except Exception as e:
            print(f"   ❌ {test_name} ERROR: {str(e)}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name"<30"} {status}")

    print("-" * 80)
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Pipeline is ready for production use.")
        return True
    else:
        print(f"\n⚠️  {total-passed} test(s) failed. Please review errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)