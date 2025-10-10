#!/usr/bin/env python3
"""
Comprehensive Analysis Runner for Rwanda Trade Data
Orchestrates enhanced data processing, time series analysis, forecasting, and reporting
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Import our custom modules
from enhanced_data_processor import EnhancedDataProcessor
from enhanced_time_series_analyzer import EnhancedTimeSeriesAnalyzer
from predictor import TradePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('comprehensive_analysis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveAnalysisRunner:
    """Comprehensive analysis runner that orchestrates all analysis components."""

    def __init__(self, config: dict = None):
        """Initialize the comprehensive analysis runner."""
        self.config = self._get_default_config()
        if config:
            self.config.update(config)

        self.data_dir = Path(self.config['data_dir'])
        self.processed_dir = Path(self.config['processed_dir'])
        self.models_dir = Path(self.config['models_dir'])

        # Ensure directories exist
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # Analysis components
        self.data_processor = None
        self.time_series_analyzer = None
        self.predictor = None

        # Results
        self.results = {
            'execution_start': None,
            'execution_end': None,
            'stages_completed': [],
            'errors': [],
            'summary': {}
        }

        logger.info("ComprehensiveAnalysisRunner initialized")

    def _get_default_config(self) -> dict:
        """Get default configuration."""
        project_root = Path(__file__).parent.parent
        return {
            'data_dir': str(project_root / 'data'),
            'processed_dir': str(project_root / 'data' / 'processed'),
            'models_dir': str(project_root / 'models'),
            'excel_file': '2025Q1_Trade_report_annexTables.xlsx',
            'force_reprocess': False,
            'analysis_components': ['data_processing', 'time_series', 'forecasting', 'reporting'],
            'forecast_periods': 8,
            'confidence_level': 0.95
        }

    def run_comprehensive_analysis(self) -> dict:
        """Run the complete comprehensive analysis pipeline."""
        logger.info("Starting comprehensive analysis pipeline")
        self.results['execution_start'] = datetime.now().isoformat()

        try:
            # Stage 1: Enhanced Data Processing
            if 'data_processing' in self.config['analysis_components']:
                self._run_enhanced_data_processing()

            # Stage 2: Time Series Analysis
            if 'time_series' in self.config['analysis_components']:
                self._run_time_series_analysis()

            # Stage 3: Advanced Forecasting
            if 'forecasting' in self.config['analysis_components']:
                self._run_advanced_forecasting()

            # Stage 4: Comprehensive Reporting
            if 'reporting' in self.config['analysis_components']:
                self._generate_comprehensive_report()

            self.results['execution_end'] = datetime.now().isoformat()
            self.results['summary'] = self._generate_execution_summary()

            logger.info("Comprehensive analysis completed successfully")
            return self.results

        except Exception as e:
            error_msg = f"Comprehensive analysis failed: {str(e)}"
            logger.error(error_msg)
            self.results['errors'].append(error_msg)
            self.results['execution_end'] = datetime.now().isoformat()
            raise

    def _run_enhanced_data_processing(self) -> None:
        """Run enhanced data processing."""
        logger.info("Stage 1: Enhanced Data Processing")

        try:
            self.data_processor = EnhancedDataProcessor(
                raw_data_dir=str(self.data_dir / "raw"),
                processed_data_dir=str(self.processed_dir)
            )

            # Process the Excel file
            results = self.data_processor.process_multiple_files([self.config['excel_file']])

            self.results['stages_completed'].append('data_processing')
            self.results['data_processing_results'] = results

            logger.info("Enhanced data processing completed")

        except Exception as e:
            logger.error(f"Enhanced data processing failed: {str(e)}")
            raise

    def _run_time_series_analysis(self) -> None:
        """Run enhanced time series analysis."""
        logger.info("Stage 2: Enhanced Time Series Analysis")

        try:
            self.time_series_analyzer = EnhancedTimeSeriesAnalyzer(
                processed_data_dir=str(self.processed_dir),
                models_dir=str(self.models_dir)
            )

            # Run complete analysis
            analysis_results = self.time_series_analyzer.run_complete_analysis()

            self.results['stages_completed'].append('time_series_analysis')
            self.results['time_series_results'] = analysis_results

            logger.info("Time series analysis completed")

        except Exception as e:
            logger.error(f"Time series analysis failed: {str(e)}")
            self.results['errors'].append(f"Time Series: {str(e)}")

    def _run_advanced_forecasting(self) -> None:
        """Run advanced forecasting with multiple models."""
        logger.info("Stage 3: Advanced Forecasting")

        try:
            self.predictor = TradePredictor(
                processed_data_dir=str(self.processed_dir),
                models_dir=str(self.models_dir)
            )

            # Run full prediction pipeline
            predictions = self.predictor.run_full_prediction_pipeline()

            self.results['stages_completed'].append('forecasting')
            self.results['forecasting_results'] = predictions

            logger.info("Advanced forecasting completed")

        except Exception as e:
            logger.error(f"Advanced forecasting failed: {str(e)}")
            self.results['errors'].append(f"Forecasting: {str(e)}")

    def _generate_comprehensive_report(self) -> None:
        """Generate comprehensive analysis report."""
        logger.info("Stage 4: Comprehensive Reporting")

        try:
            # Compile all results into a comprehensive report
            comprehensive_report = {
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "analysis_type": "comprehensive_trade_analysis",
                    "data_sources": [self.config['excel_file']],
                    "analysis_components": self.config['analysis_components'],
                    "forecast_horizon": self.config['forecast_periods']
                },
                "data_processing_summary": self.results.get('data_processing_results', {}),
                "time_series_analysis": self.results.get('time_series_results', {}),
                "forecasting_results": self.results.get('forecasting_results', {}),
                "execution_summary": self.results.get('summary', {}),
                "key_insights": self._extract_key_insights(),
                "recommendations": self._compile_recommendations()
            }

            # Save comprehensive report
            report_filename = f"comprehensive_trade_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            report_path = self.processed_dir / report_filename

            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(comprehensive_report, f, indent=2, ensure_ascii=False, default=str)

            self.results['comprehensive_report_path'] = str(report_path)
            self.results['stages_completed'].append('reporting')

            logger.info(f"Comprehensive report saved to {report_path}")

        except Exception as e:
            logger.error(f"Comprehensive reporting failed: {str(e)}")
            self.results['errors'].append(f"Reporting: {str(e)}")

    def _extract_key_insights(self) -> dict:
        """Extract key insights from all analysis results."""
        insights = {
            "data_quality": {},
            "trend_analysis": {},
            "forecast_insights": {},
            "risk_assessment": {}
        }

        try:
            # Data quality insights
            if self.results.get('data_processing_results'):
                dp_results = self.results['data_processing_results']
                if 'summary' in dp_results:
                    summary = dp_results['summary']
                    insights["data_quality"] = {
                        "total_records": summary.get('total_records_extracted', 0),
                        "quarters_covered": len(summary.get('quarters_covered', [])),
                        "countries_analyzed": len(summary.get('countries_found', [])),
                        "data_completeness": "High" if summary.get('total_records_extracted', 0) > 100 else "Medium"
                    }

            # Trend analysis insights
            if self.results.get('time_series_results'):
                ts_results = self.results['time_series_results']

                # Export trends
                if 'exports_analysis' in ts_results:
                    export_analysis = ts_results['exports_analysis']
                    if 'statistical_analysis' in export_analysis:
                        trend = export_analysis['statistical_analysis'].get('trend_analysis', {})
                        insights["trend_analysis"]["exports"] = {
                            "direction": trend.get('trend_direction', 'Unknown'),
                            "strength": trend.get('trend_strength', 0),
                            "significance": trend.get('significant', False)
                        }

                # Trade balance trends
                if 'trade_balance_analysis' in ts_results:
                    balance_analysis = ts_results['trade_balance_analysis']
                    if 'statistical_analysis' in balance_analysis:
                        balance_stats = balance_analysis['statistical_analysis'].get('basic_statistics', {})
                        insights["trend_analysis"]["trade_balance"] = {
                            "mean_balance": balance_stats.get('mean', 0),
                            "balance_volatility": balance_stats.get('std', 0),
                            "balance_trend": "negative" if balance_stats.get('mean', 0) < 0 else "positive"
                        }

            # Forecast insights
            if self.results.get('forecasting_results'):
                forecast_results = self.results['forecasting_results']

                # Export forecast
                if 'export_predictions' in forecast_results:
                    export_preds = forecast_results['export_predictions']
                    if export_preds:
                        next_export = export_preds[0].get('predicted_export', 0)
                        insights["forecast_insights"]["next_quarter_export"] = next_export

                # Trade balance forecast
                if 'balance_predictions' in forecast_results:
                    balance_preds = forecast_results['balance_predictions']
                    if balance_preds:
                        next_balance = balance_preds[0].get('predicted_balance', 0)
                        insights["forecast_insights"]["next_quarter_balance"] = next_balance

            # Risk assessment
            insights["risk_assessment"] = self._assess_risks()

        except Exception as e:
            logger.error(f"Error extracting insights: {str(e)}")
            insights["error"] = str(e)

        return insights

    def _assess_risks(self) -> dict:
        """Assess risks based on analysis results."""
        risks = {
            "overall_risk_level": "Medium",
            "risk_factors": [],
            "risk_scores": {}
        }

        try:
            # Volatility risk
            if self.results.get('time_series_results'):
                ts_results = self.results['time_series_results']

                if 'exports_analysis' in ts_results:
                    volatility = ts_results['exports_analysis'].get('statistical_analysis', {}).get('volatility_analysis', {})
                    if volatility.get('volatility', 0) > 50:
                        risks["risk_factors"].append("High export volatility detected")
                        risks["risk_scores"]["volatility"] = "High"

            # Trade deficit risk
            if self.results.get('time_series_results'):
                balance_analysis = self.results['time_series_results'].get('trade_balance_analysis', {})
                if 'statistical_analysis' in balance_analysis:
                    mean_balance = balance_analysis['statistical_analysis'].get('basic_statistics', {}).get('mean', 0)
                    if mean_balance < -100000:  # Large deficit threshold
                        risks["risk_factors"].append("Significant trade deficit")
                        risks["risk_scores"]["trade_deficit"] = "High"

            # Data quality risk
            if len(self.results.get('errors', [])) > 2:
                risks["risk_factors"].append("Multiple analysis errors detected")
                risks["risk_scores"]["data_quality"] = "Medium"

            # Determine overall risk level
            high_risk_count = sum(1 for score in risks["risk_scores"].values() if score == "High")
            if high_risk_count >= 2:
                risks["overall_risk_level"] = "High"
            elif high_risk_count == 1:
                risks["overall_risk_level"] = "Medium"
            else:
                risks["overall_risk_level"] = "Low"

        except Exception as e:
            risks["error"] = str(e)

        return risks

    def _compile_recommendations(self) -> list:
        """Compile recommendations from all analysis components."""
        recommendations = []

        try:
            # Get recommendations from time series analysis
            if self.results.get('time_series_results'):
                ts_recommendations = self.results['time_series_results'].get('recommendations', [])
                recommendations.extend(ts_recommendations)

            # Add forecasting-based recommendations
            if self.results.get('forecasting_results'):
                forecast_recs = self._generate_forecast_recommendations()
                recommendations.extend(forecast_recs)

            # Add data-driven recommendations
            if self.results.get('data_processing_results'):
                data_recs = self._generate_data_recommendations()
                recommendations.extend(data_recs)

            # Sort by priority
            priority_order = {"high": 3, "medium": 2, "low": 1}
            recommendations.sort(key=lambda x: priority_order.get(x.get('priority', 'medium'), 0), reverse=True)

        except Exception as e:
            logger.error(f"Error compiling recommendations: {str(e)}")
            recommendations.append({
                "type": "error",
                "priority": "medium",
                "message": f"Error compiling recommendations: {str(e)}",
                "confidence": 0.5
            })

        return recommendations

    def _generate_forecast_recommendations(self) -> list:
        """Generate recommendations based on forecasting results."""
        recommendations = []

        try:
            if self.results.get('forecasting_results'):
                forecasts = self.results['forecasting_results']

                # Export forecast recommendations
                if 'export_predictions' in forecasts:
                    export_preds = forecasts['export_predictions']
                    if export_preds:
                        next_export = export_preds[0].get('predicted_export', 0)
                        confidence = export_preds[0].get('confidence', 50)

                        if next_export > 500000:  # High export threshold
                            recommendations.append({
                                "type": "export_opportunity",
                                "priority": "high",
                                "message": f"Strong export growth forecasted (${next_export:,.0f}). Consider expanding production capacity.",
                                "confidence": confidence / 100
                            })

                # Trade balance forecast recommendations
                if 'balance_predictions' in forecasts:
                    balance_preds = forecasts['balance_predictions']
                    if balance_preds:
                        next_balance = balance_preds[0].get('predicted_balance', 0)

                        if next_balance < -200000:  # Large deficit threshold
                            recommendations.append({
                                "type": "trade_deficit_risk",
                                "priority": "high",
                                "message": f"Significant trade deficit forecasted (${next_balance:,.0f}). Implement import substitution strategies.",
                                "confidence": 0.8
                            })

        except Exception as e:
            logger.error(f"Error generating forecast recommendations: {str(e)}")

        return recommendations

    def _generate_data_recommendations(self) -> list:
        """Generate recommendations based on data processing results."""
        recommendations = []

        try:
            if self.results.get('data_processing_results'):
                dp_results = self.results['data_processing_results']

                if 'summary' in dp_results:
                    summary = dp_results['summary']
                    records_count = summary.get('total_records_extracted', 0)

                    if records_count < 50:
                        recommendations.append({
                            "type": "data_collection",
                            "priority": "medium",
                            "message": "Limited data available. Consider expanding data collection to improve analysis accuracy.",
                            "confidence": 0.7
                        })

        except Exception as e:
            logger.error(f"Error generating data recommendations: {str(e)}")

        return recommendations

    def _generate_execution_summary(self) -> dict:
        """Generate execution summary."""
        duration = None
        if self.results['execution_start'] and self.results['execution_end']:
            start = datetime.fromisoformat(self.results['execution_start'])
            end = datetime.fromisoformat(self.results['execution_end'])
            duration = (end - start).total_seconds()

        return {
            "total_duration_seconds": duration,
            "stages_completed": len(self.results['stages_completed']),
            "errors_count": len(self.results['errors']),
            "analysis_timestamp": datetime.now().isoformat(),
            "configuration": self.config
        }

    def print_summary(self) -> None:
        """Print comprehensive analysis summary."""
        print("\n" + "="*100)
        print("RWANDA TRADE DATA - COMPREHENSIVE ANALYSIS SUMMARY")
        print("="*100)

        # Execution info
        summary = self.results.get('summary', {})
        if summary:
            print("⏱️  Execution Summary:")
            print(f"   Duration: {summary.get('total_duration_seconds', 0):.2f} seconds")
            print(f"   Stages Completed: {summary.get('stages_completed', 0)}")
            print(f"   Errors: {summary.get('errors_count', 0)}")

        # Data quality
        insights = self._extract_key_insights()
        data_quality = insights.get('data_quality', {})
        if data_quality:
            print("\n📊 Data Quality:")
            print(f"   Records: {data_quality.get('total_records', 0):,}")
            print(f"   Quarters: {data_quality.get('quarters_covered', 0)}")
            print(f"   Countries: {data_quality.get('countries_analyzed', 0)}")
            print(f"   Completeness: {data_quality.get('data_completeness', 'Unknown')}")

        # Trend analysis
        trend_analysis = insights.get('trend_analysis', {})
        if trend_analysis:
            print("\n📈 Trend Analysis:")
            export_trend = trend_analysis.get('exports', {})
            if export_trend:
                print(f"   Export Trend: {export_trend.get('direction', 'Unknown').upper()}")
                print(f"   Trend Strength: {export_trend.get('strength', 0):.3f}")
            balance_trend = trend_analysis.get('trade_balance', {})
            if balance_trend:
                print(f"   Trade Balance: {balance_trend.get('balance_trend', 'Unknown').upper()}")
                print(f"   Mean Balance: ${balance_trend.get('mean_balance', 0):,.0f}")

        # Forecast insights
        forecast_insights = insights.get('forecast_insights', {})
        if forecast_insights:
            print("\n🔮 Forecast Insights:")
            next_export = forecast_insights.get('next_quarter_export', 0)
            if next_export > 0:
                print(f"   Next Quarter Export: ${next_export:,.0f}")
            next_balance = forecast_insights.get('next_quarter_balance', 0)
            if next_balance != 0:
                print(f"   Next Quarter Balance: ${next_balance:,.0f}")

        # Risk assessment
        risk_assessment = insights.get('risk_assessment', {})
        if risk_assessment:
            print("\n⚠️  Risk Assessment:")
            print(f"   Overall Risk Level: {risk_assessment.get('overall_risk_level', 'Unknown')}")
            risk_factors = risk_assessment.get('risk_factors', [])
            if risk_factors:
                print("   Risk Factors:")
                for factor in risk_factors:
                    print(f"     - {factor}")

        # Recommendations
        recommendations = self._compile_recommendations()
        if recommendations:
            print("\n💡 Top Recommendations:")
            for i, rec in enumerate(recommendations[:3], 1):
                priority = rec.get('priority', 'medium').upper()
                print(f"   {i}. [{priority}] {rec.get('message', '')}")

        # Files generated
        if self.results.get('comprehensive_report_path'):
            print("\n💾 Files Generated:")
            print(f"   Comprehensive Report: {self.results['comprehensive_report_path']}")

        print("\n" + "="*100)

def main():
    """Main function to run comprehensive analysis."""
    try:
        runner = ComprehensiveAnalysisRunner()
        results = runner.run_comprehensive_analysis()
        runner.print_summary()

        print("✅ Comprehensive analysis completed successfully!")
        return results

    except Exception as e:
        print(f"❌ Error during comprehensive analysis: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()