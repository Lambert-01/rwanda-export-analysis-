#!/usr/bin/env python3
"""
Rwanda Export Analysis Processor
Generates specific export analysis data for frontend display
"""

import os
import json
import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('export_analysis_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ExportAnalysisProcessor:
    """Processor for generating specific export analysis data for frontend."""

    def __init__(self, processed_data_dir: str = "../data/processed"):
        """Initialize the export analysis processor."""
        self.processed_data_dir = Path(processed_data_dir)
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)

        # Load existing data
        self.exports_data = []
        self.combined_exports_data = []
        self.comprehensive_analysis = {}

        self._load_existing_data()
        logger.info("ExportAnalysisProcessor initialized")

    def _load_existing_data(self):
        """Load existing processed data."""
        try:
            # Load exports data
            exports_file = self.processed_data_dir / "2025q1_exports_data.json"
            if exports_file.exists():
                with open(exports_file, 'r', encoding='utf-8') as f:
                    self.exports_data = json.load(f)
                logger.info(f"Loaded {len(self.exports_data)} export records")

            # Load combined exports data
            combined_exports_file = self.processed_data_dir / "combined_exports_data.json"
            if combined_exports_file.exists():
                with open(combined_exports_file, 'r', encoding='utf-8') as f:
                    self.combined_exports_data = json.load(f)
                logger.info(f"Loaded {len(self.combined_exports_data)} combined export records")

            # Load comprehensive analysis
            comprehensive_file = self.processed_data_dir / "comprehensive_analysis.json"
            if comprehensive_file.exists():
                with open(comprehensive_file, 'r', encoding='utf-8') as f:
                    self.comprehensive_analysis = json.load(f)
                logger.info("Loaded comprehensive analysis data")

        except Exception as e:
            logger.error(f"Error loading existing data: {str(e)}")

    def generate_export_products_sitc_analysis(self) -> Dict[str, Any]:
        """Generate Export Products by SITC Section analysis."""
        logger.info("Generating Export Products by SITC Section analysis")

        if not self.exports_data:
            logger.warning("No exports data available")
            return {}

        # Group by SITC section and sum values
        sitc_analysis = {}

        for record in self.exports_data:
            sitc_section = record.get('sitc_section', 'Unknown')
            export_value = float(record.get('export_value', 0))

            if sitc_section not in sitc_analysis:
                sitc_analysis[sitc_section] = {
                    'sitc_section': sitc_section,
                    'total_value': 0,
                    'quarters': {},
                    'commodities': set()
                }

            sitc_analysis[sitc_section]['total_value'] += export_value
            sitc_analysis[sitc_section]['commodities'].add(record.get('commodity_name', 'Unknown'))

            quarter = record.get('quarter', 'Unknown')
            if quarter not in sitc_analysis[sitc_section]['quarters']:
                sitc_analysis[sitc_section]['quarters'][quarter] = 0
            sitc_analysis[sitc_section]['quarters'][quarter] += export_value

        # Convert to desired format
        result = []
        sitc_names = {
            '0': 'Food and live animals',
            '1': 'Beverages and tobacco',
            '2': 'Crude materials, inedible, except fuels',
            '3': 'Mineral fuels, lubricants and related materials',
            '4': 'Animals and vegetable oils, fats & waxes',
            '5': 'Chemicals & related products',
            '6': 'Manufactured goods classified chiefly by material',
            '7': 'Machinery and transport equipment',
            '8': 'Miscellaneous manufactured articles',
            '9': 'Other commodities & transactions'
        }

        for section_code, data in sitc_analysis.items():
            section_info = {
                'sitc_section': section_code,
                'section_name': sitc_names.get(section_code, f'SITC Section {section_code}'),
                'total_value': round(data['total_value'], 2),
                'commodity_count': len(data['commodities']),
                'quarterly_values': data['quarters']
            }
            result.append(section_info)

        # Sort by total value descending
        result.sort(key=lambda x: x['total_value'], reverse=True)

        return {
            'generated_at': datetime.now().isoformat(),
            'total_sections': len(result),
            'sitc_sections': result
        }

    def generate_period_export_products_analysis(self, target_period: str = "2024Q4") -> Dict[str, Any]:
        """Generate Export Products analysis for a specific period."""
        logger.info(f"Generating Export Products analysis for period: {target_period}")

        if not self.exports_data:
            logger.warning("No exports data available")
            return {}

        # Filter data for target period
        period_data = [record for record in self.exports_data if record.get('quarter') == target_period]

        if not period_data:
            logger.warning(f"No data found for period: {target_period}")
            return {}

        # Group by SITC section for the specific period
        period_sitc_analysis = {}

        for record in period_data:
            sitc_section = record.get('sitc_section', 'Unknown')
            export_value = float(record.get('export_value', 0))
            commodity_name = record.get('commodity_name', 'Unknown')

            if sitc_section not in period_sitc_analysis:
                period_sitc_analysis[sitc_section] = {
                    'sitc_section': sitc_section,
                    'total_value': 0,
                    'commodities': {}
                }

            period_sitc_analysis[sitc_section]['total_value'] += export_value

            if commodity_name not in period_sitc_analysis[sitc_section]['commodities']:
                period_sitc_analysis[sitc_section]['commodities'][commodity_name] = 0
            period_sitc_analysis[sitc_section]['commodities'][commodity_name] += export_value

        # Convert to desired format
        sitc_names = {
            '0': 'Food and live animals',
            '1': 'Beverages and tobacco',
            '2': 'Crude materials, inedible, except fuels',
            '3': 'Mineral fuels, lubricants and related materials',
            '4': 'Animals and vegetable oils, fats & waxes',
            '5': 'Chemicals & related products',
            '6': 'Manufactured goods classified chiefly by material',
            '7': 'Machinery and transport equipment',
            '8': 'Miscellaneous manufactured articles',
            '9': 'Other commodities & transactions'
        }

        result = []
        for section_code, data in period_sitc_analysis.items():
            # Get top commodities for this section
            top_commodities = sorted(
                data['commodities'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]  # Top 10 commodities

            section_info = {
                'sitc_section': section_code,
                'section_name': sitc_names.get(section_code, f'SITC Section {section_code}'),
                'total_value': round(data['total_value'], 2),
                'commodity_count': len(data['commodities']),
                'top_commodities': [
                    {'name': commodity, 'value': round(value, 2)}
                    for commodity, value in top_commodities
                ]
            }
            result.append(section_info)

        # Sort by total value descending
        result.sort(key=lambda x: x['total_value'], reverse=True)

        return {
            'generated_at': datetime.now().isoformat(),
            'target_period': target_period,
            'total_export_value': round(sum(item['total_value'] for item in result), 2),
            'sitc_sections': result
        }

    def generate_export_growth_analysis(self) -> Dict[str, Any]:
        """Generate Export Growth by Quarter analysis."""
        logger.info("Generating Export Growth by Quarter analysis")

        if not self.exports_data:
            logger.warning("No exports data available")
            return {}

        # Group by quarter and calculate totals
        quarterly_totals = {}
        for record in self.exports_data:
            quarter = record.get('quarter', 'Unknown')
            export_value = float(record.get('export_value', 0))

            if quarter not in quarterly_totals:
                quarterly_totals[quarter] = 0
            quarterly_totals[quarter] += export_value

        # Sort quarters chronologically
        sorted_quarters = sorted(quarterly_totals.keys())

        # Calculate growth rates
        growth_data = []
        for i, quarter in enumerate(sorted_quarters):
            current_value = quarterly_totals[quarter]

            if i == 0:
                # First quarter has no previous quarter for comparison
                growth_rate = 0
                growth_amount = 0
            else:
                previous_value = quarterly_totals[sorted_quarters[i-1]]
                if previous_value > 0:
                    growth_rate = ((current_value - previous_value) / previous_value) * 100
                    growth_amount = current_value - previous_value
                else:
                    growth_rate = 0
                    growth_amount = current_value

            growth_data.append({
                'quarter': quarter,
                'export_value': round(current_value, 2),
                'growth_rate': round(growth_rate, 2),
                'growth_amount': round(growth_amount, 2),
                'is_positive_growth': growth_rate >= 0
            })

        return {
            'generated_at': datetime.now().isoformat(),
            'quarters_analyzed': len(growth_data),
            'total_export_value': round(sum(item['export_value'] for item in growth_data), 2),
            'growth_data': growth_data
        }

    def generate_export_performance_analysis(self) -> Dict[str, Any]:
        """Generate Export Performance Over Time analysis."""
        logger.info("Generating Export Performance Over Time analysis")

        if not self.exports_data:
            logger.warning("No exports data available")
            return {}

        # Group by quarter and calculate various metrics
        quarterly_metrics = {}

        for record in self.exports_data:
            quarter = record.get('quarter', 'Unknown')
            export_value = float(record.get('export_value', 0))
            destination_country = record.get('destination_country', 'Unknown')
            sitc_section = record.get('sitc_section', 'Unknown')

            if quarter not in quarterly_metrics:
                quarterly_metrics[quarter] = {
                    'total_value': 0,
                    'countries': set(),
                    'sitc_sections': set(),
                    'top_destinations': {},
                    'sitc_breakdown': {}
                }

            quarterly_metrics[quarter]['total_value'] += export_value
            quarterly_metrics[quarter]['countries'].add(destination_country)
            quarterly_metrics[quarter]['sitc_sections'].add(sitc_section)

            # Track top destinations
            if destination_country not in quarterly_metrics[quarter]['top_destinations']:
                quarterly_metrics[quarter]['top_destinations'][destination_country] = 0
            quarterly_metrics[quarter]['top_destinations'][destination_country] += export_value

            # Track SITC breakdown
            if sitc_section not in quarterly_metrics[quarter]['sitc_breakdown']:
                quarterly_metrics[quarter]['sitc_breakdown'][sitc_section] = 0
            quarterly_metrics[quarter]['sitc_breakdown'][sitc_section] += export_value

        # Convert to desired format
        performance_data = []
        sorted_quarters = sorted(quarterly_metrics.keys())

        for quarter in sorted_quarters:
            data = quarterly_metrics[quarter]

            # Get top 5 destinations for this quarter
            top_destinations = sorted(
                data['top_destinations'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            # Get SITC breakdown
            sitc_breakdown = [
                {'section': section, 'value': round(value, 2)}
                for section, value in data['sitc_breakdown'].items()
            ]
            sitc_breakdown.sort(key=lambda x: x['value'], reverse=True)

            quarter_info = {
                'quarter': quarter,
                'total_value': round(data['total_value'], 2),
                'unique_countries': len(data['countries']),
                'unique_sitc_sections': len(data['sitc_sections']),
                'top_destinations': [
                    {'country': country, 'value': round(value, 2)}
                    for country, value in top_destinations
                ],
                'sitc_breakdown': sitc_breakdown,
                'avg_value_per_country': round(data['total_value'] / len(data['countries']), 2) if data['countries'] else 0
            }
            performance_data.append(quarter_info)

        return {
            'generated_at': datetime.now().isoformat(),
            'quarters_analyzed': len(performance_data),
            'total_period_value': round(sum(item['total_value'] for item in performance_data), 2),
            'performance_data': performance_data
        }

    def generate_detailed_country_analysis(self) -> Dict[str, Any]:
        """Generate Detailed Export Analysis by Country with specific table format."""
        logger.info("Generating Detailed Export Analysis by Country")

        if not self.exports_data:
            logger.warning("No exports data available")
            return {}

        # Group by country and calculate metrics
        country_analysis = {}

        for record in self.exports_data:
            country = record.get('destination_country', 'Unknown')
            export_value = float(record.get('export_value', 0))
            quarter = record.get('quarter', 'Unknown')

            if country not in country_analysis:
                country_analysis[country] = {
                    'country': country,
                    'total_value_2022_2025': 0,
                    'quarterly_values': {},
                    'quarters_present': set()
                }

            country_analysis[country]['total_value_2022_2025'] += export_value
            country_analysis[country]['quarters_present'].add(quarter)

            if quarter not in country_analysis[country]['quarterly_values']:
                country_analysis[country]['quarterly_values'][quarter] = 0
            country_analysis[country]['quarterly_values'][quarter] += export_value

        # Calculate additional metrics for each country
        detailed_analysis = []

        for country_data in country_analysis.values():
            country = country_data['country']

            # Get Q4 2024 value
            q4_2024_value = country_data['quarterly_values'].get('2024Q4', 0)

            # Calculate share percentage (relative to total exports)
            total_all_exports = sum(c['total_value_2022_2025'] for c in country_analysis.values())
            share_percentage = (country_data['total_value_2022_2025'] / total_all_exports * 100) if total_all_exports > 0 else 0

            # Calculate growth rate (comparing latest available quarter to previous)
            sorted_quarters = sorted(country_data['quarterly_values'].keys())
            if len(sorted_quarters) >= 2:
                latest_quarter = sorted_quarters[-1]
                previous_quarter = sorted_quarters[-2]
                latest_value = country_data['quarterly_values'][latest_quarter]
                previous_value = country_data['quarterly_values'][previous_quarter]

                if previous_value > 0:
                    growth_rate = ((latest_value - previous_value) / previous_value) * 100
                else:
                    growth_rate = 0
            else:
                growth_rate = 0

            # Determine trend
            if growth_rate > 5:
                trend = "Strong Growth"
                trend_class = "success"
            elif growth_rate > 0:
                trend = "Moderate Growth"
                trend_class = "info"
            elif growth_rate == 0:
                trend = "Stable"
                trend_class = "warning"
            else:
                trend = "Declining"
                trend_class = "danger"

            country_info = {
                'rank': 0,  # Will be set after sorting
                'country': country,
                'total_value_2022_2025': round(country_data['total_value_2022_2025'], 2),
                'q4_2024_value': round(q4_2024_value, 2),
                'share_percentage': round(share_percentage, 2),
                'growth_rate': round(growth_rate, 2),
                'trend': trend,
                'trend_class': trend_class,
                'quarters_count': len(country_data['quarters_present']),
                'quarterly_breakdown': country_data['quarterly_values']
            }

            detailed_analysis.append(country_info)

        # Sort by total value descending and assign ranks
        detailed_analysis.sort(key=lambda x: x['total_value_2022_2025'], reverse=True)

        for i, country_info in enumerate(detailed_analysis):
            country_info['rank'] = i + 1

        return {
            'generated_at': datetime.now().isoformat(),
            'total_countries': len(detailed_analysis),
            'total_export_value': round(sum(country['total_value_2022_2025'] for country in detailed_analysis), 2),
            'countries': detailed_analysis
        }

    def generate_all_analyses(self) -> Dict[str, Any]:
        """Generate all required analyses and save to JSON files."""
        logger.info("Generating all export analyses")

        analyses = {}

        # Generate each analysis
        analyses['sitc_products'] = self.generate_export_products_sitc_analysis()
        analyses['period_products_q4_2024'] = self.generate_period_export_products_analysis("2024Q4")
        analyses['growth_by_quarter'] = self.generate_export_growth_analysis()
        analyses['performance_over_time'] = self.generate_export_performance_analysis()
        analyses['detailed_country_analysis'] = self.generate_detailed_country_analysis()

        # Save each analysis to separate JSON file
        for analysis_name, analysis_data in analyses.items():
            if analysis_data:
                filename = f"export_{analysis_name}.json"
                filepath = self.processed_data_dir / filename

                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(analysis_data, f, indent=2, ensure_ascii=False, default=str)

                logger.info(f"Saved {analysis_name} analysis to {filepath}")

        # Create a summary file
        summary = {
            'generated_at': datetime.now().isoformat(),
            'analyses_generated': list(analyses.keys()),
            'total_analyses': len(analyses),
            'data_summary': {
                'total_export_records': len(self.exports_data),
                'date_range': f"{min(r.get('quarter', 'Unknown') for r in self.exports_data)} to {max(r.get('quarter', 'Unknown') for r in self.exports_data)}" if self.exports_data else 'No data'
            }
        }

        summary_filepath = self.processed_data_dir / "export_analyses_summary.json"
        with open(summary_filepath, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"All analyses saved to {self.processed_data_dir}")
        return analyses

def main():
    """Main function to run export analysis processing."""
    try:
        processor = ExportAnalysisProcessor()
        results = processor.generate_all_analyses()

        print("SUCCESS: Export analysis processing completed successfully!")
        print(f"ANALYSES: Generated {len(results)} analysis files")
        print(f"DATA: Processed {len(processor.exports_data)} export records")
        print(f"SAVE: Saved results to: {processor.processed_data_dir}")

        return results

    except Exception as e:
        print(f"❌ Error during export analysis processing: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()