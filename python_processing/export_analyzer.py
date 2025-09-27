import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import logging
from typing import Dict, List, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('export_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ExportAnalyzer:
    """Advanced analytics and insights for Rwanda export data."""

    def __init__(self, processed_data_dir: str = "data/processed"):
        """Initialize the export analyzer."""
        # Get the parent directory (project root) when running from python_processing
        project_root = Path(__file__).parent.parent
        self.processed_data_dir = project_root / processed_data_dir
        self.exports_data = []
        self.imports_data = []
        self.trade_balance_data = []

        # Load processed data
        self._load_processed_data()

        logger.info("ExportAnalyzer initialized")

    def _load_processed_data(self) -> None:
        """Load processed data from JSON files."""
        try:
            # Load exports
            exports_path = self.processed_data_dir / "exports_data.json"
            if exports_path.exists():
                with open(exports_path, 'r', encoding='utf-8') as f:
                    self.exports_data = json.load(f)

            # Load imports
            imports_path = self.processed_data_dir / "imports_data.json"
            if imports_path.exists():
                with open(imports_path, 'r', encoding='utf-8') as f:
                    self.imports_data = json.load(f)

            # Load trade balance
            balance_path = self.processed_data_dir / "trade_balance.json"
            if balance_path.exists():
                with open(balance_path, 'r', encoding='utf-8') as f:
                    self.trade_balance_data = json.load(f)

            logger.info(f"Loaded {len(self.exports_data)} export records, {len(self.imports_data)} import records")

        except Exception as e:
            logger.error(f"Error loading processed data: {str(e)}")
            raise

    def analyze_top_export_destinations(self, top_n: int = 5) -> List[Dict]:
        """Analyze top export destinations by value."""
        logger.info(f"Analyzing top {top_n} export destinations")

        if not self.exports_data:
            return []

        df = pd.DataFrame(self.exports_data)

        # Group by destination country and sum export values
        top_destinations = df.groupby('destination_country')['export_value'].sum().reset_index()
        top_destinations = top_destinations.nlargest(top_n, 'export_value')

        # Calculate percentages
        total_exports = top_destinations['export_value'].sum()
        top_destinations['percentage'] = (top_destinations['export_value'] / total_exports * 100).round(2)

        # Add growth analysis (compare with previous periods if available)
        top_destinations['growth_rate'] = 0.0  # Placeholder for growth calculation

        return top_destinations.to_dict('records')

    def analyze_top_import_sources(self, top_n: int = 5) -> List[Dict]:
        """Analyze top import sources by value."""
        logger.info(f"Analyzing top {top_n} import sources")

        if not self.imports_data:
            return []

        df = pd.DataFrame(self.imports_data)

        # Group by source country and sum import values
        top_sources = df.groupby('source_country')['import_value'].sum().reset_index()
        top_sources = top_sources.nlargest(top_n, 'import_value')

        # Calculate percentages
        total_imports = top_sources['import_value'].sum()
        top_sources['percentage'] = (top_sources['import_value'] / total_imports * 100).round(2)

        return top_sources.to_dict('records')

    def analyze_export_products(self, top_n: int = 10) -> List[Dict]:
        """Analyze top export products/commodities."""
        logger.info(f"Analyzing top {top_n} export products")

        if not self.exports_data:
            return []

        df = pd.DataFrame(self.exports_data)

        # Group by commodity and sum export values
        top_products = df.groupby('commodity')['export_value'].sum().reset_index()
        top_products = top_products.nlargest(top_n, 'export_value')

        # Calculate percentages
        total_exports = top_products['export_value'].sum()
        top_products['percentage'] = (top_products['export_value'] / total_exports * 100).round(2)

        # Add category classification (simplified)
        top_products['category'] = top_products['commodity'].apply(self._categorize_commodity)

        return top_products.to_dict('records')

    def analyze_quarterly_trends(self) -> Dict[str, Any]:
        """Analyze quarterly export and import trends."""
        logger.info("Analyzing quarterly trends")

        trends = {
            'export_trends': [],
            'import_trends': [],
            'balance_trends': [],
            'growth_rates': {}
        }

        if self.trade_balance_data:
            df = pd.DataFrame(self.trade_balance_data)

            # Sort by quarter
            df = df.sort_values('quarter').reset_index(drop=True)

            trends['export_trends'] = df[['quarter', 'export_value']].to_dict('records')
            trends['import_trends'] = df[['quarter', 'import_value']].to_dict('records')
            trends['balance_trends'] = df[['quarter', 'trade_balance']].to_dict('records')

            # Calculate growth rates
            if len(df) > 1:
                trends['growth_rates'] = {
                    'export_growth': (df['export_value'].iloc[-1] - df['export_value'].iloc[0]) / df['export_value'].iloc[0] * 100,
                    'import_growth': (df['import_value'].iloc[-1] - df['import_value'].iloc[0]) / df['import_value'].iloc[0] * 100,
                    'balance_improvement': 'positive' if df['trade_balance'].iloc[-1] > df['trade_balance'].iloc[0] else 'negative'
                }

        return trends

    def analyze_trade_balance(self) -> Dict[str, Any]:
        """Analyze trade balance and deficit/surplus patterns."""
        logger.info("Analyzing trade balance")

        analysis = {
            'current_balance': 0,
            'balance_type': 'balanced',
            'deficit_percentage': 0,
            'quarters_in_deficit': 0,
            'average_deficit': 0,
            'recommendations': []
        }

        if self.trade_balance_data:
            df = pd.DataFrame(self.trade_balance_data)

            # Current balance
            latest_balance = df['trade_balance'].iloc[-1] if not df.empty else 0
            analysis['current_balance'] = latest_balance
            analysis['balance_type'] = 'surplus' if latest_balance > 0 else 'deficit'

            # Calculate deficit metrics
            deficit_quarters = df[df['trade_balance'] < 0]
            analysis['quarters_in_deficit'] = len(deficit_quarters)
            analysis['deficit_percentage'] = (len(deficit_quarters) / len(df) * 100) if len(df) > 0 else 0
            analysis['average_deficit'] = deficit_quarters['trade_balance'].mean() if not deficit_quarters.empty else 0

            # Generate recommendations
            analysis['recommendations'] = self._generate_balance_recommendations(analysis)

        return analysis

    def analyze_market_opportunities(self) -> List[Dict]:
        """Identify potential market opportunities based on data analysis."""
        logger.info("Analyzing market opportunities")

        opportunities = []

        if not self.exports_data:
            return opportunities

        df = pd.DataFrame(self.exports_data)

        # Analyze growth potential by country
        country_growth = df.groupby('destination_country').agg({
            'export_value': ['sum', 'count'],
            'quarter': 'nunique'
        }).reset_index()

        country_growth.columns = ['country', 'total_exports', 'transaction_count', 'quarters_active']

        # Calculate opportunity scores (simplified)
        country_growth['opportunity_score'] = (
            country_growth['total_exports'] * 0.4 +
            country_growth['transaction_count'] * 0.3 +
            country_growth['quarters_active'] * 0.3
        )

        # Get top opportunities
        top_opportunities = country_growth.nlargest(5, 'opportunity_score')

        for _, row in top_opportunities.iterrows():
            opportunities.append({
                'country': row['country'],
                'current_exports': row['total_exports'],
                'opportunity_score': round(row['opportunity_score'], 2),
                'potential': 'High' if row['opportunity_score'] > country_growth['opportunity_score'].median() else 'Medium'
            })

        return opportunities

    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate a comprehensive analysis report."""
        logger.info("Generating comprehensive analysis report")

        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {},
            'top_destinations': self.analyze_top_export_destinations(),
            'top_sources': self.analyze_top_import_sources(),
            'top_products': self.analyze_export_products(),
            'quarterly_trends': self.analyze_quarterly_trends(),
            'trade_balance_analysis': self.analyze_trade_balance(),
            'market_opportunities': self.analyze_market_opportunities(),
            'recommendations': []
        }

        # Generate summary
        if self.trade_balance_data:
            df = pd.DataFrame(self.trade_balance_data)
            report['summary'] = {
                'total_exports': df['export_value'].sum(),
                'total_imports': df['import_value'].sum(),
                'current_balance': df['trade_balance'].iloc[-1] if not df.empty else 0,
                'quarters_analyzed': len(df),
                'export_growth_rate': report['quarterly_trends']['growth_rates'].get('export_growth', 0),
                'top_destination': report['top_destinations'][0]['destination_country'] if report['top_destinations'] else 'Unknown',
                'top_product': report['top_products'][0]['commodity'] if report['top_products'] else 'Unknown'
            }

        # Generate recommendations
        report['recommendations'] = self._generate_comprehensive_recommendations(report)

        return report

    def _categorize_commodity(self, commodity: str) -> str:
        """Categorize commodity into broader groups."""
        if pd.isna(commodity):
            return 'Unknown'

        commodity_lower = str(commodity).lower()

        categories = {
            'agricultural': ['coffee', 'tea', 'flowers', 'vegetables', 'fruits', 'tobacco', 'pyrethrum'],
            'mining': ['minerals', 'gold', 'coltan', 'wolframite', 'cassiterite', 'peat'],
            'manufacturing': ['textiles', 'garments', 'leather', 'cement', 'steel'],
            'services': ['tourism', 'ict', 'financial']
        }

        for category, keywords in categories.items():
            if any(keyword in commodity_lower for keyword in keywords):
                return category.title()

        return 'Other'

    def _generate_balance_recommendations(self, balance_analysis: Dict) -> List[str]:
        """Generate recommendations based on trade balance analysis."""
        recommendations = []

        if balance_analysis['balance_type'] == 'deficit':
            recommendations.append("Focus on increasing export volumes to reduce trade deficit")
            recommendations.append("Diversify export destinations to reduce dependency on key markets")
            recommendations.append("Promote value addition to agricultural and mineral products")

        if balance_analysis['deficit_percentage'] > 50:
            recommendations.append("Implement import substitution strategies for key commodities")
            recommendations.append("Strengthen export promotion agencies and trade facilitation")

        if balance_analysis['quarters_in_deficit'] > 2:
            recommendations.append("Review trade policies and tariff structures")
            recommendations.append("Invest in export-oriented industries and infrastructure")

        return recommendations

    def _generate_comprehensive_recommendations(self, report: Dict) -> List[str]:
        """Generate comprehensive recommendations based on full analysis."""
        recommendations = []

        summary = report.get('summary', {})

        # Export growth recommendations
        if summary.get('export_growth_rate', 0) < 5:
            recommendations.append("Accelerate export growth through targeted incentives and market access programs")

        # Product diversification
        top_products = report.get('top_products', [])
        if len(top_products) > 0 and top_products[0].get('percentage', 0) > 50:
            recommendations.append("Reduce dependency on primary commodities through product diversification")

        # Market diversification
        top_destinations = report.get('top_destinations', [])
        if len(top_destinations) > 0 and top_destinations[0].get('percentage', 0) > 40:
            recommendations.append("Diversify export markets to reduce risk and increase opportunities")

        # Trade balance
        balance_analysis = report.get('trade_balance_analysis', {})
        recommendations.extend(balance_analysis.get('recommendations', []))

        # Opportunities
        opportunities = report.get('market_opportunities', [])
        if opportunities:
            recommendations.append(f"Focus on high-potential markets like {opportunities[0]['country']}")

        return recommendations[:5]  # Limit to top 5 recommendations

    def save_analysis_report(self, report: Dict, filename: str = "analysis_report.json") -> None:
        """Save analysis report to JSON file."""
        filepath = self.processed_data_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Analysis report saved to {filepath}")

# Utility functions for external use
def load_analysis_report(processed_dir: str = "data/processed") -> Dict[str, Any]:
    """Load analysis report from JSON file."""
    filepath = Path(processed_dir) / "analysis_report.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def generate_export_insights(processed_dir: str = "data/processed") -> Dict[str, Any]:
    """Generate and return export insights."""
    analyzer = ExportAnalyzer(processed_dir)
    return analyzer.generate_comprehensive_report()

# Main execution function
def main():
    """Main function to run export analysis."""
    try:
        analyzer = ExportAnalyzer()
        report = analyzer.generate_comprehensive_report()
        analyzer.save_analysis_report(report)

        # Return JSON output instead of printing
        print(json.dumps(report, indent=2, default=str))

    except Exception as e:
        error_response = {
            "error": "Analysis failed",
            "message": str(e),
            "details": "An error occurred during export analysis"
        }
        print(json.dumps(error_response, indent=2))
        logger.error(f"Main analysis execution failed: {str(e)}")

if __name__ == "__main__":
    main()