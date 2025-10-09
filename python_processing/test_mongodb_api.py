#!/usr/bin/env python3
"""
Test MongoDB API Integration
Tests that the backend API endpoints are correctly serving MongoDB data
"""

import requests
import json
import sys
from typing import Dict, Any

class MongoDBAPITester:
    """Test class for MongoDB API integration."""

    def __init__(self, base_url: str = "http://localhost:3000"):
        """Initialize the API tester."""
        self.base_url = base_url
        self.test_results = {}

    def test_api_endpoint(self, endpoint: str, description: str) -> Dict[str, Any]:
        """Test a single API endpoint."""
        try:
            print(f"[TEST] Testing {description}...")
            print(f"   URL: {self.base_url}{endpoint}")

            response = requests.get(f"{self.base_url}{endpoint}", timeout=10)

            if response.status_code == 200:
                data = response.json()

                # Validate response structure
                if isinstance(data, dict):
                    has_generated_at = 'generated_at' in data
                    has_data = any(key in data for key in ['sitc_sections', 'growth_data', 'performance_data', 'countries', 'total_export_value'])

                    result = {
                        'status': '✅ PASS',
                        'status_code': response.status_code,
                        'has_generated_at': has_generated_at,
                        'has_data': has_data,
                        'data_size': len(str(data)) if data else 0
                    }

                    print(f"   [OK] Response: {response.status_code} - {len(str(data))} characters")

                    if has_generated_at:
                        print(f"   [DATE] Generated at: {data.get('generated_at', 'Unknown')}")
                    if has_data:
                        print(f"   [DATA] Contains expected data fields")

                else:
                    result = {
                        'status': '✅ PASS',
                        'status_code': response.status_code,
                        'response_type': type(data).__name__,
                        'data_size': len(data) if isinstance(data, list) else 1
                    }
                    print(f"   [OK] Response: {response.status_code} - {type(data).__name__}")

            else:
                result = {
                    'status': '❌ FAIL',
                    'status_code': response.status_code,
                    'error': response.text[:200]
                }
                print(f"   [ERROR] Error: {response.status_code} - {response.text[:100]}")

        except requests.exceptions.RequestException as e:
            result = {
                'status': '❌ ERROR',
                'error': str(e)
            }
            print(f"   [ERROR] Request Error: {e}")
        except Exception as e:
            result = {
                'status': '❌ EXCEPTION',
                'error': str(e)
            }
            print(f"   [ERROR] Exception: {e}")

        return result

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests."""
        print("[START] Starting MongoDB API Integration Tests")
        print("=" * 50)

        # Test all export analysis endpoints
        endpoints = [
            ('/api/exports/sitc-analysis', 'Export Products by SITC Section'),
            ('/api/exports/growth-analysis', 'Export Growth by Quarter'),
            ('/api/exports/performance-analysis', 'Export Performance Over Time'),
            ('/api/exports/country-analysis', 'Detailed Country Analysis'),
            ('/api/exports/period-analysis/2024Q4', 'Period Analysis (Q4 2024)'),
            ('/api/exports/period-analysis/2023Q4', 'Period Analysis (Q3 2024)')
        ]

        for endpoint, description in endpoints:
            self.test_results[endpoint] = self.test_api_endpoint(endpoint, description)
            print()

        # Summary
        self.print_summary()
        return self.test_results

    def print_summary(self):
        """Print test summary."""
        print("=" * 50)
        print("[SUMMARY] TEST SUMMARY")
        print("=" * 50)

        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r.get('status') == '✅ PASS'])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")

        if failed_tests == 0:
            print("\n[SUCCESS] All tests passed! MongoDB API integration is working correctly.")
        else:
            print(f"\n[WARNING] {failed_tests} test(s) failed. Check the errors above.")

def main():
    """Main function to run API tests."""
    print("MongoDB API Integration Test")
    print("This script tests if your backend API is correctly serving MongoDB data")

    # Check if backend is running
    try:
        response = requests.get("http://localhost:3000/api/exports", timeout=5)
        if response.status_code != 200:
            print("[ERROR] Backend server is not responding correctly")
            print("   Make sure your backend server is running on http://localhost:3000")
            return
    except:
        print("[ERROR] Cannot connect to backend server")
        print("   Make sure your backend server is running on http://localhost:3000")
        return

    # Run tests
    tester = MongoDBAPITester()
    results = tester.run_all_tests()

    return results

if __name__ == "__main__":
    main()