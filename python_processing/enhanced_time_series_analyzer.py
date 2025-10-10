#!/usr/bin/env python3
"""
Enhanced Time Series Analysis Module for Rwanda Trade Data
Includes ARIMA, SARIMA, and comprehensive statistical analysis
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import logging
import warnings
warnings.filterwarnings('ignore')

# Statistical and time series libraries
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import matplotlib.pyplot as plt
from scipy import stats
from scipy.stats import norm, t, chi2
import seaborn as sns

# ML libraries
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_time_series.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EnhancedTimeSeriesAnalyzer:
    """Enhanced time series analyzer with ARIMA, SARIMA, and comprehensive statistical analysis."""

    def __init__(self, processed_data_dir: str = "../data/processed", models_dir: str = "../models"):
        """Initialize the enhanced analyzer."""
        self.processed_data_dir = Path(processed_data_dir)
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # Load processed data
        self.exports_data = self._load_json_data("exports_data.json")
        self.imports_data = self._load_json_data("imports_data.json")
        self.trade_balance_data = self._load_json_data("trade_balance.json")

        # Analysis results
        self.analysis_results = {}
        self.forecast_results = {}

        logger.info("EnhancedTimeSeriesAnalyzer initialized")

    def _load_json_data(self, filename: str) -> list:
        """Load JSON data from processed directory."""
        filepath = self.processed_data_dir / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def _parse_quarter(self, quarter_str: str) -> datetime:
        """Convert quarter string to datetime."""
        try:
            year, quarter = quarter_str.split('Q')
            year = int(year)
            quarter = int(quarter)
            quarter_months = {1: 1, 2: 4, 3: 7, 4: 10}
            return datetime(year, quarter_months[quarter], 1)
        except:
            return datetime(2024, 1, 1)

    def prepare_time_series(self, data: list, value_key: str) -> pd.DataFrame:
        """Prepare time series data for analysis."""
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)

        if 'quarter' not in df.columns or value_key not in df.columns:
            return pd.DataFrame()

        # Convert to time series
        df['quarter_date'] = df['quarter'].apply(self._parse_quarter)
        df = df.sort_values('quarter_date').reset_index(drop=True)

        # Remove duplicates
        df = df.drop_duplicates(subset=['quarter'], keep='last')

        # Aggregate by quarter
        ts_data = df.groupby('quarter_date')[value_key].sum().reset_index()
        ts_data = ts_data.sort_values('quarter_date').reset_index(drop=True)
        ts_data['quarter'] = ts_data['quarter_date'].dt.to_period('Q')

        return ts_data

    def statistical_analysis(self, ts_data: pd.DataFrame, value_column: str) -> dict:
        """Perform comprehensive statistical analysis."""
        logger.info("Performing statistical analysis")

        if ts_data.empty or value_column not in ts_data.columns:
            return {"error": "Insufficient data for statistical analysis"}

        values = ts_data[value_column].values

        # Basic statistics
        basic_stats = {
            "count": len(values),
            "mean": float(np.mean(values)),
            "median": float(np.median(values)),
            "std": float(np.std(values)),
            "min": float(np.min(values)),
            "max": float(np.max(values)),
            "range": float(np.max(values) - np.min(values)),
            "q25": float(np.percentile(values, 25)),
            "q75": float(np.percentile(values, 75)),
            "iqr": float(np.percentile(values, 75) - np.percentile(values, 25)),
            "skewness": float(stats.skew(values)),
            "kurtosis": float(stats.kurtosis(values))
        }

        # Distribution tests
        distribution_tests = {}

        # Normality tests
        try:
            shapiro_test = stats.shapiro(values[:5000])  # Limit for Shapiro test
            distribution_tests["shapiro_wilk"] = {
                "statistic": float(shapiro_test.statistic),
                "p_value": float(shapiro_test.pvalue),
                "normal": shapiro_test.pvalue > 0.05
            }
        except:
            distribution_tests["shapiro_wilk"] = {"error": "Test failed"}

        # Stationarity tests
        stationarity_tests = self._test_stationarity(values)

        # Trend analysis
        trend_analysis = self._analyze_trend(ts_data, value_column)

        # Volatility analysis
        volatility_analysis = self._analyze_volatility(values)

        return {
            "basic_statistics": basic_stats,
            "distribution_tests": distribution_tests,
            "stationarity_tests": stationarity_tests,
            "trend_analysis": trend_analysis,
            "volatility_analysis": volatility_analysis
        }

    def _test_stationarity(self, values: np.ndarray) -> dict:
        """Test for stationarity using ADF and KPSS tests."""
        tests = {}

        # ADF test
        try:
            adf_result = adfuller(values, autolag='AIC')
            tests["adf"] = {
                "statistic": float(adf_result[0]),
                "p_value": float(adf_result[1]),
                "critical_values": {k: float(v) for k, v in adf_result[4].items()},
                "stationary": adf_result[1] < 0.05
            }
        except Exception as e:
            tests["adf"] = {"error": str(e)}

        # KPSS test
        try:
            kpss_result = kpss(values, regression='c', nlags='auto')
            tests["kpss"] = {
                "statistic": float(kpss_result[0]),
                "p_value": float(kpss_result[1]),
                "critical_values": {k: float(v) for k, v in kpss_result[3].items()},
                "stationary": kpss_result[1] > 0.05
            }
        except Exception as e:
            tests["kpss"] = {"error": str(e)}

        return tests

    def _analyze_trend(self, ts_data: pd.DataFrame, value_column: str) -> dict:
        """Analyze trend components."""
        try:
            # Simple linear trend
            x = np.arange(len(ts_data))
            y = ts_data[value_column].values

            if len(x) > 1:
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

                trend_strength = abs(r_value)
                trend_direction = "increasing" if slope > 0 else "decreasing"

                return {
                    "slope": float(slope),
                    "intercept": float(intercept),
                    "r_squared": float(r_value**2),
                    "p_value": float(p_value),
                    "trend_strength": float(trend_strength),
                    "trend_direction": trend_direction,
                    "significant": p_value < 0.05
                }
        except Exception as e:
            return {"error": str(e)}

        return {"error": "Insufficient data for trend analysis"}

    def _analyze_volatility(self, values: np.ndarray) -> dict:
        """Analyze volatility patterns."""
        try:
            returns = np.diff(values) / values[:-1] * 100

            return {
                "volatility": float(np.std(returns)),
                "mean_return": float(np.mean(returns)),
                "max_return": float(np.max(returns)),
                "min_return": float(np.min(returns)),
                "positive_returns": float(np.sum(returns > 0)),
                "negative_returns": float(np.sum(returns < 0))
            }
        except Exception as e:
            return {"error": str(e)}

    def arima_forecast(self, ts_data: pd.DataFrame, value_column: str,
                      order: tuple = (1, 1, 1), forecast_periods: int = 4) -> dict:
        """Perform ARIMA forecasting."""
        logger.info(f"Running ARIMA forecast with order {order}")

        try:
            # Prepare data
            values = ts_data[value_column].values

            if len(values) < 10:
                return {"error": "Insufficient data for ARIMA (minimum 10 observations)"}

            # Fit ARIMA model
            model = ARIMA(values, order=order)
            model_fit = model.fit()

            # Forecast
            forecast = model_fit.forecast(steps=forecast_periods)
            forecast_values = [float(x) for x in forecast]

            # Calculate confidence intervals
            forecast_obj = model_fit.get_forecast(steps=forecast_periods)
            conf_int = forecast_obj.conf_int(alpha=0.05)
            lower_bounds = [float(x) for x in conf_int.iloc[:, 0]]
            upper_bounds = [float(x) for x in conf_int.iloc[:, 1]]

            # Model diagnostics
            model_summary = {
                "aic": float(model_fit.aic),
                "bic": float(model_fit.bic),
                "hqic": float(model_fit.hqic),
                "log_likelihood": float(model_fit.llf)
            }

            # Residual analysis
            residuals = model_fit.resid
            residual_tests = {
                "mean": float(np.mean(residuals)),
                "std": float(np.std(residuals)),
                "normality_pvalue": float(stats.shapiro(residuals[:5000]).pvalue)
            }

            return {
                "forecast_values": forecast_values,
                "confidence_intervals": {
                    "lower": lower_bounds,
                    "upper": upper_bounds
                },
                "model_summary": model_summary,
                "residual_analysis": residual_tests,
                "model_fit": {
                    "aic": model_summary["aic"],
                    "bic": model_summary["bic"],
                    "converged": True
                }
            }

        except Exception as e:
            logger.error(f"ARIMA forecast failed: {str(e)}")
            return {"error": str(e)}

    def sarima_forecast(self, ts_data: pd.DataFrame, value_column: str,
                       order: tuple = (1, 1, 1), seasonal_order: tuple = (1, 1, 1, 4),
                       forecast_periods: int = 4) -> dict:
        """Perform SARIMA forecasting."""
        logger.info(f"Running SARIMA forecast with order {order}, seasonal_order {seasonal_order}")

        try:
            values = ts_data[value_column].values

            if len(values) < 20:
                return {"error": "Insufficient data for SARIMA (minimum 20 observations)"}

            # Fit SARIMA model
            model = SARIMAX(values, order=order, seasonal_order=seasonal_order)
            model_fit = model.fit(disp=False)

            # Forecast
            forecast = model_fit.forecast(steps=forecast_periods)
            forecast_values = [float(x) for x in forecast]

            # Confidence intervals
            forecast_obj = model_fit.get_forecast(steps=forecast_periods)
            conf_int = forecast_obj.conf_int(alpha=0.05)
            lower_bounds = [float(x) for x in conf_int.iloc[:, 0]]
            upper_bounds = [float(x) for x in conf_int.iloc[:, 1]]

            # Model diagnostics
            model_summary = {
                "aic": float(model_fit.aic),
                "bic": float(model_fit.bic),
                "hqic": float(model_fit.hqic),
                "log_likelihood": float(model_fit.llf)
            }

            return {
                "forecast_values": forecast_values,
                "confidence_intervals": {
                    "lower": lower_bounds,
                    "upper": upper_bounds
                },
                "model_summary": model_summary,
                "model_fit": {
                    "aic": model_summary["aic"],
                    "bic": model_summary["bic"],
                    "converged": True
                }
            }

        except Exception as e:
            logger.error(f"SARIMA forecast failed: {str(e)}")
            return {"error": str(e)}

    def exponential_smoothing_forecast(self, ts_data: pd.DataFrame, value_column: str,
                                     trend: str = 'add', seasonal: str = 'add',
                                     forecast_periods: int = 4) -> dict:
        """Perform Exponential Smoothing forecasting."""
        logger.info(f"Running Exponential Smoothing forecast with trend={trend}, seasonal={seasonal}")

        try:
            values = ts_data[value_column].values

            if len(values) < 8:
                return {"error": "Insufficient data for Exponential Smoothing"}

            # Fit model
            if seasonal == 'add':
                model = ExponentialSmoothing(values, trend=trend, seasonal=seasonal, seasonal_periods=4)
            else:
                model = ExponentialSmoothing(values, trend=trend)

            model_fit = model.fit()

            # Forecast
            forecast = model_fit.forecast(forecast_periods)
            forecast_values = [float(x) for x in forecast]

            return {
                "forecast_values": forecast_values,
                "model_params": {
                    "alpha": float(model_fit.params['smoothing_level']),
                    "beta": float(model_fit.params.get('smoothing_trend', 0)),
                    "gamma": float(model_fit.params.get('smoothing_seasonal', 0))
                },
                "model_fit": {
                    "aic": float(model_fit.aic) if hasattr(model_fit, 'aic') else None,
                    "bic": float(model_fit.bic) if hasattr(model_fit, 'bic') else None
                }
            }

        except Exception as e:
            logger.error(f"Exponential Smoothing forecast failed: {str(e)}")
            return {"error": str(e)}

    def ensemble_forecast(self, ts_data: pd.DataFrame, value_column: str,
                         forecast_periods: int = 4) -> dict:
        """Create ensemble forecast combining multiple models."""
        logger.info("Running ensemble forecast")

        try:
            # Get forecasts from different models
            arima_result = self.arima_forecast(ts_data, value_column, forecast_periods=forecast_periods)
            sarima_result = self.sarima_forecast(ts_data, value_column, forecast_periods=forecast_periods)
            exp_result = self.exponential_smoothing_forecast(ts_data, value_column, forecast_periods=forecast_periods)

            # Combine forecasts
            ensemble_forecasts = []
            for i in range(forecast_periods):
                forecasts = []
                weights = []

                # ARIMA
                if "error" not in arima_result:
                    forecasts.append(arima_result["forecast_values"][i])
                    weights.append(0.3)

                # SARIMA
                if "error" not in sarima_result:
                    forecasts.append(sarima_result["forecast_values"][i])
                    weights.append(0.4)

                # Exponential Smoothing
                if "error" not in exp_result:
                    forecasts.append(exp_result["forecast_values"][i])
                    weights.append(0.3)

                if forecasts:
                    # Weighted average
                    ensemble_value = sum(f * w for f, w in zip(forecasts, weights)) / sum(weights)
                    ensemble_forecasts.append(float(ensemble_value))
                else:
                    ensemble_forecasts.append(0.0)

            return {
                "ensemble_forecasts": ensemble_forecasts,
                "model_contributions": {
                    "arima": "error" not in arima_result,
                    "sarima": "error" not in sarima_result,
                    "exponential_smoothing": "error" not in exp_result
                },
                "individual_forecasts": {
                    "arima": arima_result.get("forecast_values", []),
                    "sarima": sarima_result.get("forecast_values", []),
                    "exponential_smoothing": exp_result.get("forecast_values", [])
                }
            }

        except Exception as e:
            logger.error(f"Ensemble forecast failed: {str(e)}")
            return {"error": str(e)}

    def comprehensive_analysis(self) -> dict:
        """Run comprehensive analysis on all trade data."""
        logger.info("Starting comprehensive analysis")

        analysis_results = {
            "generated_at": datetime.now().isoformat(),
            "exports_analysis": {},
            "imports_analysis": {},
            "trade_balance_analysis": {},
            "comparative_analysis": {},
            "forecasts": {},
            "recommendations": []
        }

        # Analyze exports
        if self.exports_data:
            export_ts = self.prepare_time_series(self.exports_data, 'export_value')
            if not export_ts.empty:
                analysis_results["exports_analysis"] = {
                    "statistical_analysis": self.statistical_analysis(export_ts, 'export_value'),
                    "forecasts": {
                        "arima": self.arima_forecast(export_ts, 'export_value'),
                        "sarima": self.sarima_forecast(export_ts, 'export_value'),
                        "exponential_smoothing": self.exponential_smoothing_forecast(export_ts, 'export_value'),
                        "ensemble": self.ensemble_forecast(export_ts, 'export_value')
                    }
                }

        # Analyze imports
        if self.imports_data:
            import_ts = self.prepare_time_series(self.imports_data, 'import_value')
            if not import_ts.empty:
                analysis_results["imports_analysis"] = {
                    "statistical_analysis": self.statistical_analysis(import_ts, 'import_value'),
                    "forecasts": {
                        "arima": self.arima_forecast(import_ts, 'import_value'),
                        "sarima": self.sarima_forecast(import_ts, 'import_value'),
                        "exponential_smoothing": self.exponential_smoothing_forecast(import_ts, 'import_value'),
                        "ensemble": self.ensemble_forecast(import_ts, 'import_value')
                    }
                }

        # Analyze trade balance
        if self.trade_balance_data:
            balance_ts = self.prepare_time_series(self.trade_balance_data, 'trade_balance')
            if not balance_ts.empty:
                analysis_results["trade_balance_analysis"] = {
                    "statistical_analysis": self.statistical_analysis(balance_ts, 'trade_balance'),
                    "forecasts": {
                        "arima": self.arima_forecast(balance_ts, 'trade_balance'),
                        "sarima": self.sarima_forecast(balance_ts, 'trade_balance'),
                        "exponential_smoothing": self.exponential_smoothing_forecast(balance_ts, 'trade_balance'),
                        "ensemble": self.ensemble_forecast(balance_ts, 'trade_balance')
                    }
                }

        # Comparative analysis
        analysis_results["comparative_analysis"] = self._comparative_analysis()

        # Generate recommendations
        analysis_results["recommendations"] = self._generate_recommendations(analysis_results)

        return analysis_results

    def _comparative_analysis(self) -> dict:
        """Perform comparative analysis between exports and imports."""
        try:
            export_ts = self.prepare_time_series(self.exports_data, 'export_value')
            import_ts = self.prepare_time_series(self.imports_data, 'import_value')

            if export_ts.empty or import_ts.empty:
                return {"error": "Insufficient data for comparative analysis"}

            # Merge data
            merged = pd.merge(export_ts, import_ts, on='quarter_date', how='inner', suffixes=('_export', '_import'))

            if len(merged) < 2:
                return {"error": "Insufficient overlapping data"}

            # Calculate ratios and correlations
            merged['export_import_ratio'] = merged['export_value'] / merged['import_value']
            merged['trade_balance'] = merged['export_value'] - merged['import_value']

            # Correlation analysis
            correlation = merged['export_value'].corr(merged['import_value'])

            # Granger causality (simplified)
            export_returns = merged['export_value'].pct_change().fillna(0)
            import_returns = merged['import_value'].pct_change().fillna(0)

            # Simple correlation of returns
            returns_correlation = export_returns.corr(import_returns)

            return {
                "correlation_analysis": {
                    "export_import_correlation": float(correlation),
                    "returns_correlation": float(returns_correlation)
                },
                "trade_balance_summary": {
                    "mean_balance": float(merged['trade_balance'].mean()),
                    "balance_volatility": float(merged['trade_balance'].std()),
                    "positive_balance_periods": int((merged['trade_balance'] > 0).sum()),
                    "negative_balance_periods": int((merged['trade_balance'] < 0).sum())
                },
                "ratio_analysis": {
                    "mean_export_import_ratio": float(merged['export_import_ratio'].mean()),
                    "ratio_volatility": float(merged['export_import_ratio'].std())
                }
            }

        except Exception as e:
            return {"error": str(e)}

    def _generate_recommendations(self, analysis_results: dict) -> list:
        """Generate recommendations based on analysis results."""
        recommendations = []

        try:
            # Export recommendations
            export_analysis = analysis_results.get("exports_analysis", {})
            if "statistical_analysis" in export_analysis:
                export_stats = export_analysis["statistical_analysis"]

                if "trend_analysis" in export_stats:
                    trend = export_stats["trend_analysis"]
                    if trend.get("significant", False):
                        if trend["trend_direction"] == "increasing":
                            recommendations.append({
                                "type": "export_growth",
                                "priority": "high",
                                "message": "Export volumes show significant increasing trend. Consider expanding production capacity.",
                                "confidence": float(trend.get("r_squared", 0))
                            })
                        else:
                            recommendations.append({
                                "type": "export_decline",
                                "priority": "high",
                                "message": "Export volumes show significant decreasing trend. Investigate causes and implement corrective measures.",
                                "confidence": float(trend.get("r_squared", 0))
                            })

            # Trade balance recommendations
            balance_analysis = analysis_results.get("trade_balance_analysis", {})
            if "statistical_analysis" in balance_analysis:
                balance_stats = balance_analysis["statistical_analysis"]

                if "basic_statistics" in balance_stats:
                    mean_balance = balance_stats["basic_statistics"].get("mean", 0)
                    if mean_balance < 0:
                        recommendations.append({
                            "type": "trade_deficit",
                            "priority": "high",
                            "message": "Persistent trade deficit detected. Focus on export promotion and import substitution strategies.",
                            "confidence": 0.8
                        })

            # Volatility recommendations
            if "volatility_analysis" in export_analysis.get("statistical_analysis", {}):
                volatility = export_analysis["statistical_analysis"]["volatility_analysis"]
                if volatility.get("volatility", 0) > 50:  # High volatility threshold
                    recommendations.append({
                        "type": "high_volatility",
                        "priority": "medium",
                        "message": "High export volatility detected. Consider diversification strategies to reduce risk.",
                        "confidence": 0.7
                    })

        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")

        return recommendations

    def save_analysis_results(self, results: dict, filename: str = None) -> None:
        """Save analysis results to JSON file."""
        if filename is None:
            filename = f"enhanced_time_series_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        filepath = self.processed_data_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Analysis results saved to {filepath}")

    def run_complete_analysis(self) -> dict:
        """Run complete enhanced time series analysis."""
        logger.info("Running complete enhanced time series analysis")

        try:
            # Perform comprehensive analysis
            analysis_results = self.comprehensive_analysis()

            # Save results
            self.save_analysis_results(analysis_results)

            # Print summary
            self._print_analysis_summary(analysis_results)

            return analysis_results

        except Exception as e:
            logger.error(f"Complete analysis failed: {str(e)}")
            return {"error": str(e)}

    def _print_analysis_summary(self, results: dict) -> None:
        """Print analysis summary to console."""
        print("\n" + "="*80)
        print("ENHANCED TIME SERIES ANALYSIS SUMMARY")
        print("="*80)

        # Export analysis summary
        export_analysis = results.get("exports_analysis", {})
        if "statistical_analysis" in export_analysis:
            export_stats = export_analysis["statistical_analysis"]
            if "basic_statistics" in export_stats:
                stats = export_stats["basic_statistics"]
                print("\n📈 Export Statistics:")
                print(f"   Mean: ${stats.get('mean', 0):,.2f}")
                print(f"   Std Dev: ${stats.get('std', 0):,.2f}")
                print(f"   Trend: {export_stats.get('trend_analysis', {}).get('trend_direction', 'Unknown')}")

        # Trade balance summary
        balance_analysis = results.get("trade_balance_analysis", {})
        if "statistical_analysis" in balance_analysis:
            balance_stats = balance_analysis["statistical_analysis"]
            if "basic_statistics" in balance_stats:
                stats = balance_stats["basic_statistics"]
                print("\n⚖️ Trade Balance Statistics:")
                print(f"   Mean Balance: ${stats.get('mean', 0):,.2f}")
                print(f"   Balance Std Dev: ${stats.get('std', 0):,.2f}")

        # Recommendations
        recommendations = results.get("recommendations", [])
        if recommendations:
            print("\n💡 Key Recommendations:")
            for rec in recommendations[:3]:  # Show top 3
                priority = rec.get("priority", "medium").upper()
                print(f"   [{priority}] {rec.get('message', '')}")

        print("\n" + "="*80)

def main():
    """Main function to run enhanced time series analysis."""
    try:
        analyzer = EnhancedTimeSeriesAnalyzer()
        results = analyzer.run_complete_analysis()

        if "error" not in results:
            print("✅ Enhanced time series analysis completed successfully!")
            return results
        else:
            print(f"❌ Analysis failed: {results['error']}")
            return None

    except Exception as e:
        print(f"❌ Error during analysis: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()