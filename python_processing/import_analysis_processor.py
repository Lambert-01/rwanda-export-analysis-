#!/usr/bin/env python3
"""
Rwanda Import Analysis Processor
Generates specific import analysis data for frontend display
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
        logging.FileHandler('import_analysis_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ImportAnalysisProcessor:
    """Processor for generating specific import analysis data for frontend."""

    def __init__(self, processed_data_dir: str = "../data/processed"):
        """Initialize the import analysis processor."""
        self.processed_data_dir = Path(processed_data_dir)
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)

        # Load existing data
        self.imports_data = []
        self.combined_imports_data = []
        self.comprehensive_analysis = {}

        self._load_existing_data()
        logger.info("ImportAnalysisProcessor initialized")

    def _load_existing_data(self):
        """Load existing processed data."""
        try:
            # Load imports data
            imports_file = self.processed_data_dir / "2025q1_imports_data.json"
            if imports_file.exists():
                with open(imports_file, 'r', encoding='utf-8') as f:
                    self.imports_data = json.load(f)
                logger.info(f"Loaded {len(self.imports_data)} import records")

            # Load combined imports data
            combined_imports_file = self.processed_data_dir / "combined_imports_data.json"
            if combined_imports_file.exists():
                with open(combined_imports_file, 'r', encoding='utf-8') as f:
                    self.combined_imports_data = json.load(f)
                logger.info(f"Loaded {len(self.combined_imports_data)} combined import records")

            # Load comprehensive analysis
            comprehensive_file = self.processed_data_dir / "comprehensive_analysis.json"
            if comprehensive_file.exists():
                with open(comprehensive_file, 'r', encoding='utf-8') as f:
                    self.comprehensive_analysis = json.load(f)
                logger.info("Loaded comprehensive analysis data")

        except Exception as e:
            logger.error(f"Error loading existing data: {str(e)}")

    def generate_import_sources_analysis(self) -> Dict[str, Any]:
        """Generate Import Sources analysis."""
        logger.info("Generating Import Sources analysis")

        if not self.imports_data:
            logger.warning("No imports data available")
            return {}

        # Group by source country and sum values
        source_analysis = {}

        for record in self.imports_data:
            source_country = record.get('source_country', 'Unknown')
            import_value = float(record.get('import_value', 0))

            if source_country not in source_analysis:
                source_analysis[source_country] = {
                    'source_country': source_country,
                    'total_value': 0,
                    'quarters': {},
                    'quarter_count': 0
                }

            source_analysis[source_country]['total_value'] += import_value
            source_analysis[source_country]['quarter_count'] += 1

            quarter = record.get('quarter', 'Unknown')
            if quarter not in source_analysis[source_country]['quarters']:
                source_analysis[source_country]['quarters'][quarter] = 0
            source_analysis[source_country]['quarters'][quarter] += import_value

        # Convert to desired format
        result = []
        for country, data in source_analysis.items():
            country_info = {
                'source_country': country,
                'total_value': round(data['total_value'], 2),
                'quarter_count': data['quarter_count'],
                'quarterly_values': data['quarters']
            }
            result.append(country_info)

        # Sort by total value descending
        result.sort(key=lambda x: x['total_value'], reverse=True)

        return {
            'generated_at': datetime.now().isoformat(),
            'total_sources': len(result),
            'import_sources': result
        }

    def generate_period_import_sources_analysis(self, target_period: str = "2024Q4") -> Dict[str, Any]:
        """Generate Import Sources analysis for a specific period."""
        logger.info(f"Generating Import Sources analysis for period: {target_period}")

        if not self.imports_data:
            logger.warning("No imports data available")
            return {}

        # Filter data for target period
        period_data = [record for record in self.imports_data if record.get('quarter') == target_period]

        if not period_data:
            logger.warning(f"No data found for period: {target_period}")
            return {}

        # Group by source country for the specific period
        period_source_analysis = {}

        for record in period_data:
            source_country = record.get('source_country', 'Unknown')
            import_value = float(record.get('import_value', 0))

            if source_country not in period_source_analysis:
                period_source_analysis[source_country] = {
                    'source_country': source_country,
                    'total_value': 0,
                    'quarter': target_period
                }

            period_source_analysis[source_country]['total_value'] += import_value

        # Convert to desired format
        result = []
        for country, data in period_source_analysis.items():
            country_info = {
                'source_country': country,
                'total_value': round(data['total_value'], 2),
                'quarter': target_period
            }
            result.append(country_info)

        # Sort by total value descending
        result.sort(key=lambda x: x['total_value'], reverse=True)

        return {
            'generated_at': datetime.now().isoformat(),
            'target_period': target_period,
            'total_import_value': round(sum(item['total_value'] for item in result), 2),
            'import_sources': result
        }

    def generate_import_growth_analysis(self) -> Dict[str, Any]:
        """Generate Import Growth by Quarter analysis."""
        logger.info("Generating Import Growth by Quarter analysis")

        if not self.imports_data:
            logger.warning("No imports data available")
            return {}

        # Group by quarter and calculate totals
        quarterly_totals = {}
        for record in self.imports_data:
            quarter = record.get('quarter', 'Unknown')
            import_value = float(record.get('import_value', 0))

            if quarter not in quarterly_totals:
                quarterly_totals[quarter] = 0
            quarterly_totals[quarter] += import_value

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
                'import_value': round(current_value, 2),
                'growth_rate': round(growth_rate, 2),
                'growth_amount': round(growth_amount, 2),
                'is_positive_growth': growth_rate >= 0
            })

        return {
            'generated_at': datetime.now().isoformat(),
            'quarters_analyzed': len(growth_data),
            'total_import_value': round(sum(item['import_value'] for item in growth_data), 2),
            'growth_data': growth_data
        }

    def generate_import_performance_analysis(self) -> Dict[str, Any]:
        """Generate Import Performance Over Time analysis."""
        logger.info("Generating Import Performance Over Time analysis")

        if not self.imports_data:
            logger.warning("No imports data available")
            return {}

        # Group by quarter and calculate various metrics
        quarterly_metrics = {}

        for record in self.imports_data:
            quarter = record.get('quarter', 'Unknown')
            import_value = float(record.get('import_value', 0))
            source_country = record.get('source_country', 'Unknown')

            if quarter not in quarterly_metrics:
                quarterly_metrics[quarter] = {
                    'total_value': 0,
                    'countries': set(),
                    'top_sources': {},
                    'source_breakdown': {}
                }

            quarterly_metrics[quarter]['total_value'] += import_value
            quarterly_metrics[quarter]['countries'].add(source_country)

            # Track top sources
            if source_country not in quarterly_metrics[quarter]['top_sources']:
                quarterly_metrics[quarter]['top_sources'][source_country] = 0
            quarterly_metrics[quarter]['top_sources'][source_country] += import_value

        # Convert to desired format
        performance_data = []
        sorted_quarters = sorted(quarterly_metrics.keys())

        for quarter in sorted_quarters:
            data = quarterly_metrics[quarter]

            # Get top 5 sources for this quarter
            top_sources = sorted(
                data['top_sources'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            quarter_info = {
                'quarter': quarter,
                'total_value': round(data['total_value'], 2),
                'unique_countries': len(data['countries']),
                'top_sources': [
                    {'country': country, 'value': round(value, 2)}
                    for country, value in top_sources
                ],
                'avg_value_per_country': round(data['total_value'] / len(data['countries']), 2) if data['countries'] else 0
            }
            performance_data.append(quarter_info)

        return {
            'generated_at': datetime.now().isoformat(),
            'quarters_analyzed': len(performance_data),
            'total_period_value': round(sum(item['total_value'] for item in performance_data), 2),
            'performance_data': performance_data
        }

    def generate_detailed_source_analysis(self) -> Dict[str, Any]:
        """Generate Detailed Import Analysis by Source Country with specific table format."""
        logger.info("Generating Detailed Import Analysis by Source Country")

        if not self.imports_data:
            logger.warning("No imports data available")
            return {}

        # Group by source country and calculate metrics
        source_analysis = {}

        for record in self.imports_data:
            source_country = record.get('source_country', 'Unknown')
            import_value = float(record.get('import_value', 0))
            quarter = record.get('quarter', 'Unknown')

            if source_country not in source_analysis:
                source_analysis[source_country] = {
                    'source_country': source_country,
                    'total_value_2022_2025': 0,
                    'quarterly_values': {},
                    'quarters_present': set()
                }

            source_analysis[source_country]['total_value_2022_2025'] += import_value
            source_analysis[source_country]['quarters_present'].add(quarter)

            if quarter not in source_analysis[source_country]['quarterly_values']:
                source_analysis[source_country]['quarterly_values'][quarter] = 0
            source_analysis[source_country]['quarterly_values'][quarter] += import_value

        # Calculate additional metrics for each source country
        detailed_analysis = []

        for source_data in source_analysis.values():
            source_country = source_data['source_country']

            # Get Q4 2024 value
            q4_2024_value = source_data['quarterly_values'].get('2024Q4', 0)

            # Calculate share percentage (relative to total imports)
            total_all_imports = sum(s['total_value_2022_2025'] for s in source_analysis.values())
            share_percentage = (source_data['total_value_2022_2025'] / total_all_imports * 100) if total_all_imports > 0 else 0

            # Calculate growth rate (comparing latest available quarter to previous)
            sorted_quarters = sorted(source_data['quarterly_values'].keys())
            if len(sorted_quarters) >= 2:
                latest_quarter = sorted_quarters[-1]
                previous_quarter = sorted_quarters[-2]
                latest_value = source_data['quarterly_values'][latest_quarter]
                previous_value = source_data['quarterly_values'][previous_quarter]

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

            source_info = {
                'rank': 0,  # Will be set after sorting
                'source_country': source_country,
                'total_value_2022_2025': round(source_data['total_value_2022_2025'], 2),
                'q4_2024_value': round(q4_2024_value, 2),
                'share_percentage': round(share_percentage, 2),
                'growth_rate': round(growth_rate, 2),
                'trend': trend,
                'trend_class': trend_class,
                'quarters_count': len(source_data['quarters_present']),
                'quarterly_breakdown': source_data['quarterly_values']
            }

            detailed_analysis.append(source_info)

        # Sort by total value descending and assign ranks
        detailed_analysis.sort(key=lambda x: x['total_value_2022_2025'], reverse=True)

        for i, source_info in enumerate(detailed_analysis):
            source_info['rank'] = i + 1

        return {
            'generated_at': datetime.now().isoformat(),
            'total_sources': len(detailed_analysis),
            'total_import_value': round(sum(source['total_value_2022_2025'] for source in detailed_analysis), 2),
            'sources': detailed_analysis
        }

    def generate_all_analyses(self) -> Dict[str, Any]:
        """Generate all required analyses and save to JSON files."""
        logger.info("Generating all import analyses")

        analyses = {}

        # Generate each analysis
        analyses['import_sources'] = self.generate_import_sources_analysis()
        analyses['period_sources_q4_2024'] = self.generate_period_import_sources_analysis("2024Q4")
        analyses['import_growth_by_quarter'] = self.generate_import_growth_analysis()
        analyses['import_performance_over_time'] = self.generate_import_performance_analysis()
        analyses['detailed_source_analysis'] = self.generate_detailed_source_analysis()

        # Save each analysis to separate JSON file
        for analysis_name, analysis_data in analyses.items():
            if analysis_data:
                filename = f"import_{analysis_name}.json"
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
                'total_import_records': len(self.imports_data),
                'date_range': f"{min(r.get('quarter', 'Unknown') for r in self.imports_data)} to {max(r.get('quarter', 'Unknown') for r in self.imports_data)}" if self.imports_data else 'No data'
            }
        }

        summary_filepath = self.processed_data_dir / "import_analyses_summary.json"
        with open(summary_filepath, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"All analyses saved to {self.processed_data_dir}")
        return analyses

def main():
    """Main function to run import analysis processing."""
    try:
        processor = ImportAnalysisProcessor()
        results = processor.generate_all_analyses()

        print("SUCCESS: Import analysis processing completed successfully!")
        print(f"ANALYSES: Generated {len(results)} analysis files")
        print(f"DATA: Processed {len(processor.imports_data)} import records")
        print(f"SAVE: Saved results to: {processor.processed_data_dir}")

        return results

    except Exception as e:
        print(f"❌ Error during import analysis processing: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()