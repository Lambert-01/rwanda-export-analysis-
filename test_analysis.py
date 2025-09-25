#!/usr/bin/env python3
"""
Rwanda Export Explorer - Analysis Validation Test Suite
Tests and validates the comprehensive trade data analysis
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class AnalysisValidator:
    """
    Comprehensive validation suite for Rwanda trade data analysis
    """

    def __init__(self):
        """
        Initialize the validator
        """
        self.test_results = []
        self.errors = []
        self.warnings = []
        self.output_dir = "data/processed/test_results/"

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        print("🧪 Analysis Validator initialized")
        print(f"📁 Test results directory: {self.output_dir}")

    def log_test_result(self, test_name, status, message, details=None):
        """
        Log test result

        Parameters:
        - test_name: Name of the test
        - status: 'PASS', 'FAIL', or 'WARN'
        - message: Brief message
        - details: Detailed information
        """
        result = {
            'test_name': test_name,
            'status': status,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }

        self.test_results.append(result)

        if status == 'PASS':
            print(f"✅ {test_name}: {message}")
        elif status == 'FAIL':
            print(f"❌ {test_name}: {message}")
            self.errors.append(result)
        elif status == 'WARN':
            print(f"⚠️ {test_name}: {message}")
            self.warnings.append(result)

    def validate_file_structure(self):
        """
        Test 1: Validate file structure and required files
        """
        print("\n🔍 Testing file structure...")

        # Check required files
        required_files = [
            "data/raw/2024Q4_Trade_report_annexTables.xlsx",
            "comprehensive_rwanda_trade_analysis.ipynb",
            "excel_analyzer.py",
            "visualization_generator.py",
            "requirements.txt"
        ]

        for file_path in required_files:
            if os.path.exists(file_path):
                self.log_test_result(
                    f"File Check: {file_path}",
                    "PASS",
                    f"File exists: {file_path}"
                )
            else:
                self.log_test_result(
                    f"File Check: {file_path}",
                    "FAIL",
                    f"Required file missing: {file_path}"
                )

        # Check directories
        required_dirs = [
            "data/raw",
            "data/processed",
            "data/processed/visualizations"
        ]

        for dir_path in required_dirs:
            if os.path.exists(dir_path):
                self.log_test_result(
                    f"Directory Check: {dir_path}",
                    "PASS",
                    f"Directory exists: {dir_path}"
                )
            else:
                self.log_test_result(
                    f"Directory Check: {dir_path}",
                    "WARN",
                    f"Directory missing (will be created): {dir_path}"
                )

    def validate_excel_data(self):
        """
        Test 2: Validate Excel data loading and structure
        """
        print("\n📊 Testing Excel data validation...")

        excel_file = "data/raw/2024Q4_Trade_report_annexTables.xlsx"

        if not os.path.exists(excel_file):
            self.log_test_result(
                "Excel Data Validation",
                "FAIL",
                "Excel file not found - cannot proceed with data validation"
            )
            return

        try:
            # Load Excel file
            sheets = pd.read_excel(excel_file, sheet_name=None)

            # Check number of sheets
            expected_sheets = 12
            actual_sheets = len(sheets)

            if actual_sheets >= expected_sheets:
                self.log_test_result(
                    "Sheet Count Validation",
                    "PASS",
                    f"Found {actual_sheets} sheets (expected >= {expected_sheets})"
                )
            else:
                self.log_test_result(
                    "Sheet Count Validation",
                    "WARN",
                    f"Found {actual_sheets} sheets (expected {expected_sheets})"
                )

            # Check required sheets
            required_sheets = [
                'Graph Overall', 'Graph EAC', 'EAC', 'Total trade with the World',
                'Regional blocks', 'Trade by continents', 'ExportCountry',
                'ImportCountry', 'ReexportsCountry', 'ExportsCommodity',
                'ImportsCommodity', 'ReexportsCommodity'
            ]

            missing_sheets = []
            for sheet in required_sheets:
                if sheet in sheets:
                    # Check if sheet has data
                    df = sheets[sheet]
                    if df.empty or df.shape[0] < 5:
                        self.log_test_result(
                            f"Sheet Data Check: {sheet}",
                            "WARN",
                            f"Sheet {sheet} has insufficient data ({df.shape[0]} rows)"
                        )
                    else:
                        self.log_test_result(
                            f"Sheet Data Check: {sheet}",
                            "PASS",
                            f"Sheet {sheet} has {df.shape[0]} rows, {df.shape[1]} columns"
                        )
                else:
                    missing_sheets.append(sheet)

            if missing_sheets:
                self.log_test_result(
                    "Required Sheets Check",
                    "FAIL",
                    f"Missing required sheets: {', '.join(missing_sheets)}"
                )
            else:
                self.log_test_result(
                    "Required Sheets Check",
                    "PASS",
                    "All required sheets present"
                )

        except Exception as e:
            self.log_test_result(
                "Excel Loading Test",
                "FAIL",
                f"Error loading Excel file: {str(e)}"
            )

    def validate_data_quality(self):
        """
        Test 3: Validate data quality and consistency
        """
        print("\n🔍 Testing data quality...")

        excel_file = "data/raw/2024Q4_Trade_report_annexTables.xlsx"

        if not os.path.exists(excel_file):
            return

        try:
            sheets = pd.read_excel(excel_file, sheet_name=None)

            # Check for missing values in key sheets
            key_sheets = ['Graph Overall', 'ExportCountry', 'ImportCountry']

            for sheet_name in key_sheets:
                if sheet_name in sheets:
                    df = sheets[sheet_name]

                    # Check for missing values
                    missing_count = df.isnull().sum().sum()
                    total_cells = df.shape[0] * df.shape[1]

                    if missing_count == 0:
                        self.log_test_result(
                            f"Data Completeness: {sheet_name}",
                            "PASS",
                            f"No missing values in {sheet_name}"
                        )
                    else:
                        missing_pct = (missing_count / total_cells) * 100
                        self.log_test_result(
                            f"Data Completeness: {sheet_name}",
                            "WARN",
                            f"{missing_count} missing values ({missing_pct:.1f}%) in {sheet_name}"
                        )

                    # Check for negative values where not expected
                    numeric_cols = df.select_dtypes(include=[np.number]).columns
                    negative_values = {}

                    for col in numeric_cols:
                        if col.lower() not in ['growth_qoq', 'growth_yoy', 'trade_balance']:
                            negative_count = (df[col] < 0).sum()
                            if negative_count > 0:
                                negative_values[col] = negative_count

                    if negative_values:
                        self.log_test_result(
                            f"Data Validation: {sheet_name}",
                            "WARN",
                            f"Unexpected negative values in {sheet_name}: {negative_values}"
                        )
                    else:
                        self.log_test_result(
                            f"Data Validation: {sheet_name}",
                            "PASS",
                            f"No unexpected negative values in {sheet_name}"
                        )

        except Exception as e:
            self.log_test_result(
                "Data Quality Test",
                "FAIL",
                f"Error during data quality validation: {str(e)}"
            )

    def validate_analysis_output(self):
        """
        Test 4: Validate analysis output files
        """
        print("\n📋 Testing analysis output validation...")

        # Check for analysis results file
        results_file = "data/processed/excel_analysis_results.json"

        if os.path.exists(results_file):
            try:
                with open(results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)

                # Validate structure
                required_keys = [
                    'trade_overview', 'top_countries', 'commodities',
                    'insights', 'regional_analysis', 'metadata'
                ]

                missing_keys = []
                for key in required_keys:
                    if key not in results:
                        missing_keys.append(key)

                if missing_keys:
                    self.log_test_result(
                        "Analysis Results Structure",
                        "FAIL",
                        f"Missing keys in analysis results: {missing_keys}"
                    )
                else:
                    self.log_test_result(
                        "Analysis Results Structure",
                        "PASS",
                        "Analysis results have correct structure"
                    )

                # Check metadata
                if 'metadata' in results:
                    metadata = results['metadata']
                    required_metadata = ['analysis_date', 'data_source', 'quarters_analyzed']

                    for meta_key in required_metadata:
                        if meta_key in metadata:
                            self.log_test_result(
                                f"Metadata Check: {meta_key}",
                                "PASS",
                                f"Metadata {meta_key} present"
                            )
                        else:
                            self.log_test_result(
                                f"Metadata Check: {meta_key}",
                                "WARN",
                                f"Metadata {meta_key} missing"
                            )

            except json.JSONDecodeError:
                self.log_test_result(
                    "Analysis Results JSON",
                    "FAIL",
                    "Analysis results file is not valid JSON"
                )
            except Exception as e:
                self.log_test_result(
                    "Analysis Results Loading",
                    "FAIL",
                    f"Error loading analysis results: {str(e)}"
                )
        else:
            self.log_test_result(
                "Analysis Results File",
                "WARN",
                "Analysis results file not found (run analysis first)"
            )

    def validate_visualization_files(self):
        """
        Test 5: Validate visualization output files
        """
        print("\n🎨 Testing visualization files...")

        viz_dir = "data/processed/visualizations/"

        if not os.path.exists(viz_dir):
            self.log_test_result(
                "Visualization Directory",
                "WARN",
                "Visualization directory not found"
            )
            return

        # Check for expected visualization files
        expected_viz = [
            "overall_trade_dashboard.html",
            "regional_analysis_dashboard.html",
            "commodity_analysis_dashboard.html",
            "country_analysis_dashboard.html",
            "trend_analysis_dashboard.html",
            "insights_dashboard.html"
        ]

        found_files = []
        missing_files = []

        for viz_file in expected_viz:
            viz_path = os.path.join(viz_dir, viz_file)
            if os.path.exists(viz_path):
                found_files.append(viz_file)
            else:
                missing_files.append(viz_file)

        if found_files:
            self.log_test_result(
                "Visualization Files Found",
                "PASS",
                f"Found {len(found_files)} visualization files"
            )

        if missing_files:
            self.log_test_result(
                "Missing Visualization Files",
                "WARN",
                f"Missing {len(missing_files)} visualization files: {', '.join(missing_files[:3])}"
            )

    def validate_dependencies(self):
        """
        Test 6: Validate Python dependencies
        """
        print("\n📦 Testing dependencies...")

        required_packages = [
            'pandas', 'numpy', 'matplotlib', 'seaborn',
            'plotly', 'openpyxl', 'scikit-learn', 'json5'
        ]

        missing_packages = []

        for package in required_packages:
            try:
                __import__(package)
                self.log_test_result(
                    f"Dependency Check: {package}",
                    "PASS",
                    f"Package {package} is available"
                )
            except ImportError:
                missing_packages.append(package)
                self.log_test_result(
                    f"Dependency Check: {package}",
                    "FAIL",
                    f"Package {package} is missing"
                )

        if missing_packages:
            self.log_test_result(
                "Dependencies Installation",
                "FAIL",
                f"Missing packages: {', '.join(missing_packages)}. Run: pip install -r requirements.txt"
            )
        else:
            self.log_test_result(
                "Dependencies Check",
                "PASS",
                "All required packages are installed"
            )

    def run_performance_test(self):
        """
        Test 7: Run basic performance test
        """
        print("\n⚡ Testing performance...")

        import time

        excel_file = "data/raw/2024Q4_Trade_report_annexTables.xlsx"

        if not os.path.exists(excel_file):
            self.log_test_result(
                "Performance Test",
                "WARN",
                "Cannot run performance test - Excel file not found"
            )
            return

        try:
            start_time = time.time()

            # Load Excel file
            sheets = pd.read_excel(excel_file, sheet_name=None)

            # Process data
            total_cells = sum(df.shape[0] * df.shape[1] for df in sheets.values())

            end_time = time.time()
            load_time = end_time - start_time

            # Check performance
            if load_time < 10:
                self.log_test_result(
                    "Data Loading Performance",
                    "PASS",
                    f"Loaded {len(sheets)} sheets ({total_cells} cells) in {load_time:.2f}s"
                )
            elif load_time < 30:
                self.log_test_result(
                    "Data Loading Performance",
                    "WARN",
                    f"Slow loading: {load_time:.2f}s for {total_cells} cells"
                )
            else:
                self.log_test_result(
                    "Data Loading Performance",
                    "FAIL",
                    f"Very slow loading: {load_time:.2f}s - consider optimization"
                )

        except Exception as e:
            self.log_test_result(
                "Performance Test",
                "FAIL",
                f"Performance test failed: {str(e)}"
            )

    def generate_test_report(self):
        """
        Generate comprehensive test report
        """
        print("\n📋 Generating test report...")

        # Calculate summary statistics
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.test_results if r['status'] == 'WARN'])

        # Create report
        report = {
            'test_summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'warnings': warning_tests,
                'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
                'test_timestamp': datetime.now().isoformat()
            },
            'test_results': self.test_results,
            'errors': self.errors,
            'warnings': self.warnings,
            'recommendations': []
        }

        # Generate recommendations
        if failed_tests > 0:
            report['recommendations'].append({
                'priority': 'High',
                'issue': f'{failed_tests} critical test(s) failed',
                'action': 'Review and fix failed tests before proceeding with analysis'
            })

        if warning_tests > 0:
            report['recommendations'].append({
                'priority': 'Medium',
                'issue': f'{warning_tests} warning(s) detected',
                'action': 'Review warnings and consider improvements'
            })

        if passed_tests == total_tests:
            report['recommendations'].append({
                'priority': 'Info',
                'issue': 'All tests passed',
                'action': 'Analysis environment is ready for use'
            })

        # Save report
        report_file = f"{self.output_dir}analysis_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)

        print(f"✅ Test report saved to: {report_file}")

        return report

    def run_all_tests(self):
        """
        Run complete test suite
        """
        print("🚀 Starting Comprehensive Analysis Validation")
        print("=" * 60)

        # Run all tests
        self.validate_file_structure()
        self.validate_excel_data()
        self.validate_data_quality()
        self.validate_analysis_output()
        self.validate_visualization_files()
        self.validate_dependencies()
        self.run_performance_test()

        # Generate report
        report = self.generate_test_report()

        # Print summary
        print("\n" + "=" * 60)
        print("🧪 VALIDATION COMPLETE")
        print("=" * 60)

        summary = report['test_summary']
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   Passed: {summary['passed']}")
        print(f"   Failed: {summary['failed']}")
        print(f"   Warnings: {summary['warnings']}")
        print(f"   Success Rate: {summary['success_rate']:.1f}%")

        if summary['failed'] > 0:
            print(f"\n❌ CRITICAL ISSUES FOUND:")
            for error in self.errors:
                print(f"   • {error['test_name']}: {error['message']}")

        if summary['warnings'] > 0:
            print(f"\n⚠️ WARNINGS DETECTED:")
            for warning in self.warnings[:5]:  # Show first 5 warnings
                print(f"   • {warning['test_name']}: {warning['message']}")

        print(f"\n📋 Recommendations:")
        for rec in report['recommendations']:
            print(f"   [{rec['priority']}] {rec['issue']}")
            print(f"        → {rec['action']}")

        # Overall assessment
        if summary['success_rate'] >= 90:
            print(f"\n🎉 VALIDATION RESULT: EXCELLENT")
            print(f"   Analysis environment is ready for production use")
        elif summary['success_rate'] >= 70:
            print(f"\n✅ VALIDATION RESULT: GOOD")
            print(f"   Analysis environment is functional with minor issues")
        elif summary['success_rate'] >= 50:
            print(f"\n⚠️ VALIDATION RESULT: NEEDS ATTENTION")
            print(f"   Analysis environment requires fixes before full use")
        else:
            print(f"\n❌ VALIDATION RESULT: CRITICAL ISSUES")
            print(f"   Analysis environment needs significant fixes")

        print("=" * 60)

        return report

def main():
    """
    Main function to run the validation test suite
    """
    print("Rwanda Export Explorer - Analysis Validation Suite")
    print("=" * 60)

    validator = AnalysisValidator()
    report = validator.run_all_tests()

    return report

if __name__ == "__main__":
    main()