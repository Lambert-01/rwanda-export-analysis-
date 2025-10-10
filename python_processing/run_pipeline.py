#!/usr/bin/env python3
"""
Rwanda trade analysis system- Data Processing Pipeline Runner
Orchestrates the complete data processing, analysis, and prediction pipeline.
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
import argparse
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from data_processor import DataProcessor
from predictor import TradePredictor
from export_analyzer import ExportAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PipelineRunner:
    """Main pipeline orchestrator for Rwanda trade data processing."""

    def __init__(self, config: dict = None):
        """Initialize the pipeline runner with configuration."""
        default_config = self._get_default_config()
        self.config = {**default_config, **(config or {})}
        self.data_dir = Path(self.config['data_dir'])
        self.processed_dir = Path(self.config['processed_dir'])
        self.models_dir = Path(self.config['models_dir'])

        # Ensure directories exist
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # Pipeline components
        self.processor = None
        self.predictor = None
        self.analyzer = None

        # Results tracking
        self.results = {
            'pipeline_start': None,
            'pipeline_end': None,
            'stages_completed': [],
            'errors': [],
            'data_stats': {},
            'predictions_generated': False,
            'analysis_completed': False
        }

        logger.info("PipelineRunner initialized")

    def _get_default_config(self) -> dict:
        """Get default pipeline configuration."""
        # Paths relative to the project root (parent of python_processing)
        project_root = Path(__file__).parent.parent
        import os
        return {
            'data_dir': str(project_root / 'data'),
            'processed_dir': os.getenv('DATA_PROCESSED_PATH', str(project_root / 'data' / 'processed')),
            'models_dir': os.getenv('MODELS_DIR', str(project_root / 'models')),
            'excel_filename': os.getenv('EXCEL_FILE_PATH', '2025Q1_Trade_report_annexTables.xlsx') or '2025Q1_Trade_report_annexTables.xlsx',
            'prediction_quarters': int(os.getenv('PREDICTION_QUARTERS', '4')),
            'analysis_top_n': int(os.getenv('ANALYSIS_TOP_N', '10')),
            'force_reprocess': os.getenv('FORCE_REPROCESS', 'false').lower() == 'true',
            'skip_predictions': os.getenv('SKIP_PREDICTIONS', 'false').lower() == 'true',
            'skip_analysis': os.getenv('SKIP_ANALYSIS', 'false').lower() == 'true'
        }

    def run_full_pipeline(self) -> dict:
        """Run the complete data processing pipeline."""
        logger.info("Starting Rwanda trade analysis systemData Pipeline")
        self.results['pipeline_start'] = datetime.now().isoformat()

        try:
            # Stage 1: Data Processing
            self._run_data_processing()

            # Stage 2: Predictions (optional)
            if not self.config.get('skip_predictions', False):
                self._run_predictions()

            # Stage 3: Analysis
            if not self.config.get('skip_analysis', False):
                self._run_analysis()

            # Stage 4: Generate Summary Report
            self._generate_summary_report()

            self.results['pipeline_end'] = datetime.now().isoformat()
            logger.info("Pipeline completed successfully!")

            return self.results

        except Exception as e:
            error_msg = f"Pipeline failed: {str(e)}"
            logger.error(f"{error_msg}")
            self.results['errors'].append(error_msg)
            self.results['pipeline_end'] = datetime.now().isoformat()
            raise

    def _run_data_processing(self) -> None:
        """Run data processing stage."""
        logger.info("Stage 1: Data Processing")

        try:
            self.processor = DataProcessor(
                raw_data_dir=str(self.data_dir / "raw"),
                processed_data_dir=str(self.processed_dir)
            )

            # Check if we need to reprocess
            if self.config.get('force_reprocess', False) or not self._processed_data_exists():
                self.processor.process_all_data()

                # Validate processed data
                is_valid = self.processor.validate_data()
                if not is_valid:
                    raise ValueError("Data validation failed")

            # Update results
            self.results['stages_completed'].append('data_processing')
            self.results['data_stats'] = {
                'exports_count': len(self.processor.exports_data),
                'imports_count': len(self.processor.imports_data),
                'balance_records': len(self.processor.trade_balance_data),
                'quarters_processed': len(self.processor.metadata.get('data_quarters', set())),
                'commodities_count': len(self.processor.metadata.get('commodities', set())),
                'countries_count': len(self.processor.metadata.get('countries', set()))
            }

            logger.info(f"Data processing completed: {self.results['data_stats']}")

        except Exception as e:
            logger.error(f"Data processing failed: {str(e)}")
            raise

    def _run_predictions(self) -> None:
        """Run prediction stage."""
        logger.info("Stage 2: AI Predictions")

        try:
            self.predictor = TradePredictor(
                processed_data_dir=str(self.processed_dir),
                models_dir=str(self.models_dir)
            )

            predictions = self.predictor.run_full_prediction_pipeline()

            self.results['stages_completed'].append('predictions')
            self.results['predictions_generated'] = True
            self.results['prediction_summary'] = self.predictor.get_prediction_summary()

            logger.info("Predictions generated successfully")

        except Exception as e:
            logger.error(f"Predictions failed: {str(e)}")
            # Don't fail the entire pipeline for prediction errors
            self.results['errors'].append(f"Predictions: {str(e)}")

    def _run_analysis(self) -> None:
        """Run analysis stage."""
        logger.info("Stage 3: Export Analysis")

        try:
            self.analyzer = ExportAnalyzer(processed_data_dir=str(self.processed_dir))

            analysis_report = self.analyzer.generate_comprehensive_report()
            self.analyzer.save_analysis_report(analysis_report)

            self.results['stages_completed'].append('analysis')
            self.results['analysis_completed'] = True
            self.results['analysis_summary'] = {
                'total_exports': analysis_report.get('summary', {}).get('total_exports', 0),
                'current_balance': analysis_report.get('summary', {}).get('current_balance', 0),
                'top_destination': analysis_report.get('summary', {}).get('top_destination', 'Unknown'),
                'top_product': analysis_report.get('summary', {}).get('top_product', 'Unknown'),
                'recommendations_count': len(analysis_report.get('recommendations', []))
            }

            logger.info("Analysis completed successfully")

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            # Don't fail the entire pipeline for analysis errors
            self.results['errors'].append(f"Analysis: {str(e)}")

    def _generate_summary_report(self) -> None:
        """Generate a summary report of the pipeline execution."""
        logger.info("Generating Summary Report")

        summary = {
            'execution_info': {
                'start_time': self.results['pipeline_start'],
                'end_time': self.results['pipeline_end'],
                'duration_seconds': self._calculate_duration(),
                'stages_completed': self.results['stages_completed'],
                'errors': self.results['errors']
            },
            'data_summary': self.results.get('data_stats', {}),
            'predictions_summary': self.results.get('prediction_summary', {}),
            'analysis_summary': self.results.get('analysis_summary', {}),
            'files_generated': self._get_generated_files(),
            'config': self.config
        }

        # Save summary report
        summary_path = self.processed_dir / "pipeline_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Summary report saved to {summary_path}")

        # Print summary to console
        self._print_summary(summary)

    def _processed_data_exists(self) -> bool:
        """Check if processed data files already exist."""
        required_files = [
            self.processed_dir / "exports_data.json",
            self.processed_dir / "imports_data.json",
            self.processed_dir / "trade_balance.json"
        ]
        return all(f.exists() for f in required_files)

    def _calculate_duration(self) -> float:
        """Calculate pipeline execution duration in seconds."""
        if not self.results['pipeline_start'] or not self.results['pipeline_end']:
            return 0

        start = datetime.fromisoformat(self.results['pipeline_start'])
        end = datetime.fromisoformat(self.results['pipeline_end'])
        return (end - start).total_seconds()

    def _get_generated_files(self) -> list:
        """Get list of files generated by the pipeline."""
        generated_files = []

        # Data files
        data_files = [
            "exports_data.json",
            "imports_data.json",
            "trade_balance.json",
            "metadata.json"
        ]
        for file in data_files:
            if (self.processed_dir / file).exists():
                generated_files.append(f"data/processed/{file}")

        # Prediction files
        if self.results.get('predictions_generated'):
            pred_files = [
                "predictions.json"
            ]
            for file in pred_files:
                if (self.processed_dir / file).exists():
                    generated_files.append(f"data/processed/{file}")

        # Analysis files
        if self.results.get('analysis_completed'):
            analysis_files = [
                "analysis_report.json"
            ]
            for file in analysis_files:
                if (self.processed_dir / file).exists():
                    generated_files.append(f"data/processed/{file}")

        # Summary
        if (self.processed_dir / "pipeline_summary.json").exists():
            generated_files.append("data/processed/pipeline_summary.json")

        return generated_files

    def _print_summary(self, summary: dict) -> None:
        """Print pipeline summary to console."""
        print("\n" + "="*60)
        print("RWANDA EXPORT EXPLORER - PIPELINE SUMMARY")
        print("="*60)

        exec_info = summary['execution_info']
        print(f"Duration: {exec_info['duration_seconds']:.2f} seconds")
        print(f"Stages Completed: {', '.join(exec_info['stages_completed'])}")

        if exec_info['errors']:
            print(f"Errors: {len(exec_info['errors'])}")
            for error in exec_info['errors']:
                print(f"   - {error}")

        data_summary = summary.get('data_summary', {})
        if data_summary:
            print(f"\nData Processed:")
            print(f"   - Exports: {data_summary.get('exports_count', 0)} records")
            print(f"   - Imports: {data_summary.get('imports_count', 0)} records")
            print(f"   - Countries: {data_summary.get('countries_count', 0)}")
            print(f"   - Commodities: {data_summary.get('commodities_count', 0)}")

        pred_summary = summary.get('predictions_summary', {})
        if pred_summary:
            print(f"\nNext Quarter Predictions:")
            print(f"   - Export: ${pred_summary.get('next_quarter_export', 0):,.2f}")
            print(f"   - Import: ${pred_summary.get('next_quarter_import', 0):,.2f}")
            print(f"   - Balance: ${pred_summary.get('next_quarter_balance', 0):,.2f}")

        analysis_summary = summary.get('analysis_summary', {})
        if analysis_summary:
            print(f"\nKey Insights:")
            print(f"   - Total Exports: ${analysis_summary.get('total_exports', 0):,.2f}")
            print(f"   - Trade Balance: ${analysis_summary.get('current_balance', 0):,.2f}")
            print(f"   - Top Destination: {analysis_summary.get('top_destination', 'Unknown')}")
            print(f"   - Top Product: {analysis_summary.get('top_product', 'Unknown')}")

        files = summary.get('files_generated', [])
        if files:
            print(f"\nFiles Generated: {len(files)}")
            for file in files:
                print(f"   - {file}")

        print("="*60)

def main():
    """Main entry point for the pipeline."""
    parser = argparse.ArgumentParser(description='Rwanda trade analysis systemData Pipeline')
    parser.add_argument('--force-reprocess', action='store_true',
                       help='Force reprocessing of raw data')
    parser.add_argument('--skip-predictions', action='store_true',
                       help='Skip AI predictions stage')
    parser.add_argument('--skip-analysis', action='store_true',
                       help='Skip analysis stage')
    parser.add_argument('--config', type=str,
                       help='Path to custom config JSON file')

    args = parser.parse_args()

    # Load custom config if provided
    config = None
    if args.config and Path(args.config).exists():
        with open(args.config, 'r') as f:
            config = json.load(f)

    # Override config with command line args
    if config is None:
        config = {}
    config.update({
        'force_reprocess': args.force_reprocess,
        'skip_predictions': args.skip_predictions,
        'skip_analysis': args.skip_analysis
    })

    try:
        runner = PipelineRunner(config)
        results = runner.run_full_pipeline()

        # Exit with success
        sys.exit(0)

    except Exception as e:
        logger.error(f"Pipeline execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()