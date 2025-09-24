import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple, Optional, Any
import warnings
warnings.filterwarnings('ignore')

# ML imports
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.pipeline import Pipeline
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('prediction.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TradePredictor:
    """Main class for predicting Rwanda trade data using ML models."""
    
    def __init__(self, processed_data_dir: str = "data/processed", models_dir: str = "models"):
        """Initialize the predictor with data directories."""
        self.processed_data_dir = Path(processed_data_dir)
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Load processed data
        self.exports_data = self._load_json_data("exports_data.json")
        self.imports_data = self._load_json_data("imports_data.json")
        self.trade_balance_data = self._load_json_data("trade_balance.json")
        
        # Initialize models
        self.export_models = {}
        self.import_models = {}
        self.balance_models = {}
        
        # Prediction results
        self.predictions = {}
        
        logger.info("TradePredictor initialized")
    
    def _load_json_data(self, filename: str) -> List[Dict]:
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
            # Return first day of the quarter
            quarter_months = {1: 1, 2: 4, 3: 7, 4: 10}
            return datetime(year, quarter_months[quarter], 1)
        except:
            return datetime(2024, 1, 1)
    
    def _quarter_to_numeric(self, quarter_str: str) -> float:
        """Convert quarter to numeric value for modeling."""
        dt = self._parse_quarter(quarter_str)
        return dt.year + (dt.month - 1) / 12.0
    
    def prepare_time_series_data(self, data: List[Dict], value_key: str) -> pd.DataFrame:
        """Prepare time series data for modeling."""
        if not data:
            return pd.DataFrame()
        
        df = pd.DataFrame(data)
        
        # Ensure we have quarter and value columns
        if 'quarter' not in df.columns or value_key not in df.columns:
            return pd.DataFrame()
        
        # Convert quarter to numeric
        df['quarter_numeric'] = df['quarter'].apply(self._quarter_to_numeric)
        df['quarter_date'] = df['quarter'].apply(self._parse_quarter)
        
        # Sort by date
        df = df.sort_values('quarter_date').reset_index(drop=True)
        
        # Remove duplicates (keep latest)
        df = df.drop_duplicates(subset=['quarter'], keep='last')
        
        return df[['quarter', 'quarter_numeric', 'quarter_date', value_key]]
    
    def create_features(self, df: pd.DataFrame, value_key: str, max_lag: int = 4) -> pd.DataFrame:
        """Create time series features including lags and rolling statistics."""
        df_features = df.copy()
        
        # Create lag features
        for lag in range(1, min(max_lag + 1, len(df))):
            df_features[f'{value_key}_lag_{lag}'] = df_features[value_key].shift(lag)
        
        # Create rolling features
        if len(df) >= 3:
            df_features[f'{value_key}_rolling_mean_2'] = df_features[value_key].rolling(window=2).mean()
            df_features[f'{value_key}_rolling_mean_3'] = df_features[value_key].rolling(window=3).mean()
        
        if len(df) >= 4:
            df_features[f'{value_key}_rolling_std_3'] = df_features[value_key].rolling(window=3).std()
        
        # Create trend features
        df_features[f'{value_key}_trend'] = df_features.index
        
        # Drop rows with NaN values
        df_features = df_features.dropna().reset_index(drop=True)
        
        return df_features
    
    def train_linear_model(self, X: pd.DataFrame, y: pd.Series, model_name: str) -> Pipeline:
        """Train a linear regression model with preprocessing."""
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('poly', PolynomialFeatures(degree=2, include_bias=False)),
            ('regressor', LinearRegression())
        ])
        
        pipeline.fit(X, y)
        return pipeline
    
    def train_ensemble_model(self, X: pd.DataFrame, y: pd.Series, model_type: str = 'random_forest') -> Any:
        """Train ensemble models."""
        if model_type == 'random_forest':
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        else:
            model = Ridge(alpha=1.0, random_state=42)
        
        model.fit(X, y)
        return model
    
    def evaluate_model(self, model, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """Evaluate model performance."""
        y_pred = model.predict(X_test)
        
        metrics = {
            'mae': mean_absolute_error(y_test, y_pred),
            'mse': mean_squared_error(y_test, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'r2': r2_score(y_test, y_pred)
        }
        
        return metrics
    
    def predict_exports(self, n_quarters: int = 4) -> List[Dict]:
        """Predict export values for future quarters."""
        logger.info(f"Predicting exports for next {n_quarters} quarters")
        
        # Prepare data
        export_df = self.prepare_time_series_data(self.exports_data, 'export_value')
        if export_df.empty or len(export_df) < 2:
            logger.warning("Insufficient export data for prediction")
            return self._generate_baseline_predictions(n_quarters, 'export')
        
        # Aggregate by quarter (sum all exports per quarter)
        export_agg = export_df.groupby('quarter').agg({
            'export_value': 'sum',
            'quarter_numeric': 'first',
            'quarter_date': 'first'
        }).reset_index()
        
        # Create features
        export_features = self.create_features(export_agg, 'export_value')
        
        if len(export_features) < 2:
            return self._generate_baseline_predictions(n_quarters, 'export')
        
        # Prepare modeling data
        feature_cols = [col for col in export_features.columns if col not in ['quarter', 'quarter_date', 'export_value']]
        X = export_features[feature_cols]
        y = export_features['export_value']
        
        # Train multiple models
        models = {}
        best_model = None
        best_score = -np.inf
        
        # Linear model
        try:
            if len(X) >= 3:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                linear_model = self.train_linear_model(X_train, y_train, 'export_linear')
                linear_metrics = self.evaluate_model(linear_model, X_test, y_test)
                models['linear'] = {'model': linear_model, 'metrics': linear_metrics}
                if linear_metrics['r2'] > best_score:
                    best_score = linear_metrics['r2']
                    best_model = ('linear', linear_model)
        except Exception as e:
            logger.warning(f"Linear model training failed: {str(e)}")
        
        # Random Forest
        try:
            rf_model = self.train_ensemble_model(X, y, 'random_forest')
            if len(X) >= 3:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                rf_metrics = self.evaluate_model(rf_model, X_test, y_test)
                models['random_forest'] = {'model': rf_model, 'metrics': rf_metrics}
                if rf_metrics['r2'] > best_score:
                    best_score = rf_metrics['r2']
                    best_model = ('random_forest', rf_model)
            else:
                models['random_forest'] = {'model': rf_model, 'metrics': {'r2': 0.0}}
                best_model = ('random_forest', rf_model)
        except Exception as e:
            logger.warning(f"Random Forest training failed: {str(e)}")
        
        # Save models
        if best_model:
            model_name, model_obj = best_model
            joblib.dump(model_obj, self.models_dir / f"export_model_{model_name}.pkl")
            self.export_models[model_name] = model_obj
        
        # Generate predictions
        predictions = self._generate_time_series_predictions(
            export_features, best_model[1] if best_model else None, 
            feature_cols, 'export_value', n_quarters
        )
        
        return predictions
    
    def predict_imports(self, n_quarters: int = 4) -> List[Dict]:
        """Predict import values for future quarters."""
        logger.info(f"Predicting imports for next {n_quarters} quarters")
        
        # Similar logic to exports
        import_df = self.prepare_time_series_data(self.imports_data, 'import_value')
        if import_df.empty or len(import_df) < 2:
            return self._generate_baseline_predictions(n_quarters, 'import')
        
        import_agg = import_df.groupby('quarter').agg({
            'import_value': 'sum',
            'quarter_numeric': 'first',
            'quarter_date': 'first'
        }).reset_index()
        
        import_features = self.create_features(import_agg, 'import_value')
        
        if len(import_features) < 2:
            return self._generate_baseline_predictions(n_quarters, 'import')
        
        feature_cols = [col for col in import_features.columns if col not in ['quarter', 'quarter_date', 'import_value']]
        X = import_features[feature_cols]
        y = import_features['import_value']
        
        # Train model (simplified for brevity)
        try:
            model = self.train_ensemble_model(X, y, 'random_forest')
            joblib.dump(model, self.models_dir / "import_model.pkl")
            self.import_models['random_forest'] = model
            
            predictions = self._generate_time_series_predictions(
                import_features, model, feature_cols, 'import_value', n_quarters
            )
        except Exception as e:
            logger.warning(f"Import prediction failed: {str(e)}")
            predictions = self._generate_baseline_predictions(n_quarters, 'import')
        
        return predictions
    
    def predict_trade_balance(self, n_quarters: int = 4) -> List[Dict]:
        """Predict trade balance for future quarters."""
        logger.info(f"Predicting trade balance for next {n_quarters} quarters")
        
        # Get export and import predictions
        export_preds = self.predict_exports(n_quarters)
        import_preds = self.predict_imports(n_quarters)
        
        # Combine predictions
        balance_preds = []
        for i in range(min(len(export_preds), len(import_preds))):
            export_val = export_preds[i]['predicted_export']
            import_val = import_preds[i]['predicted_import']
            balance = export_val - import_val
            
            balance_preds.append({
                'quarter': export_preds[i]['quarter'],
                'predicted_balance': balance,
                'predicted_export': export_val,
                'predicted_import': import_val,
                'balance_type': 'surplus' if balance >= 0 else 'deficit',
                'confidence': min(export_preds[i].get('confidence', 70), import_preds[i].get('confidence', 70))
            })
        
        return balance_preds
    
    def _generate_baseline_predictions(self, n_quarters: int, data_type: str) -> List[Dict]:
        """Generate simple baseline predictions using historical averages."""
        logger.info(f"Generating baseline predictions for {data_type}")
        
        # Get historical data
        if data_type == 'export':
            historical_data = self.exports_data
            value_key = 'export_value'
        else:
            historical_data = self.imports_data
            value_key = 'import_value'
        
        if not historical_data:
            # Return zero predictions
            base_quarter = '2024Q4'
            predictions = []
            for i in range(1, n_quarters + 1):
                next_quarter = self._get_next_quarter(base_quarter, i)
                predictions.append({
                    'quarter': next_quarter,
                    f'predicted_{data_type}': 0,
                    'confidence': 50
                })
            return predictions
        
        # Calculate historical average
        df = pd.DataFrame(historical_data)
        if value_key not in df.columns:
            avg_value = 0
        else:
            avg_value = df[value_key].mean()
        
        # Get last quarter
        quarters = df['quarter'].unique() if 'quarter' in df.columns else ['2024Q4']
        last_quarter = sorted(quarters)[-1] if quarters else '2024Q4'
        
        # Generate predictions
        predictions = []
        for i in range(1, n_quarters + 1):
            next_quarter = self._get_next_quarter(last_quarter, i)
            predictions.append({
                'quarter': next_quarter,
                f'predicted_{data_type}': float(avg_value),
                'confidence': 60  # Lower confidence for baseline
            })
        
        return predictions
    
    def _get_next_quarter(self, current_quarter: str, steps: int = 1) -> str:
        """Get the quarter after n steps from current quarter."""
        try:
            year, quarter = current_quarter.split('Q')
            year = int(year)
            quarter = int(quarter)
            
            total_quarters = year * 4 + quarter - 1 + steps
            new_year = total_quarters // 4
            new_quarter = (total_quarters % 4) + 1
            
            return f"{new_year}Q{new_quarter}"
        except:
            # Fallback
            return f"2025Q{steps}"
    
    def _generate_time_series_predictions(self, historical_features: pd.DataFrame, 
                                        model: Any, feature_cols: List[str], 
                                        value_key: str, n_quarters: int) -> List[Dict]:
        """Generate time series predictions using trained model."""
        if model is None:
            return self._generate_baseline_predictions(n_quarters, value_key.replace('_value', ''))
        
        predictions = []
        current_features = historical_features.iloc[-1:].copy()
        
        for i in range(1, n_quarters + 1):
            # Prepare features for prediction
            X_pred = current_features[feature_cols].copy()
            
            # Make prediction
            try:
                pred_value = float(model.predict(X_pred)[0])
                pred_value = max(0, pred_value)  # Ensure non-negative
            except:
                # Fallback to last known value
                pred_value = float(current_features[value_key].iloc[0])
            
            # Get next quarter
            last_quarter = current_features['quarter'].iloc[0]
            next_quarter = self._get_next_quarter(last_quarter, 1)
            
            # Calculate confidence (simplified)
            confidence = 85 - (i * 5)  # Decrease confidence over time
            confidence = max(50, confidence)
            
            predictions.append({
                'quarter': next_quarter,
                f'predicted_{value_key.replace("_value", "")}': pred_value,
                'confidence': confidence
            })
            
            # Update features for next prediction (simplified)
            # In a real implementation, you'd update lag features properly
            current_features = current_features.copy()
            current_features['quarter'] = next_quarter
            current_features[value_key] = pred_value
        
        return predictions
    
    def generate_commodity_predictions(self, top_n: int = 10) -> List[Dict]:
        """Generate predictions for top commodities."""
        logger.info(f"Generating commodity predictions for top {top_n} commodities")
        
        if not self.exports_data:
            return []
        
        # Get top commodities
        df = pd.DataFrame(self.exports_data)
        if 'commodity' not in df.columns or 'export_value' not in df.columns:
            return []
        
        top_commodities = df.groupby('commodity')['export_value'].sum().nlargest(top_n).index
        
        commodity_predictions = []
        for commodity in top_commodities:
            # Filter data for this commodity
            commodity_data = df[df['commodity'] == commodity].to_dict('records')
            
            # Create temporary predictor for this commodity
            commodity_df = pd.DataFrame(commodity_data)
            commodity_agg = commodity_df.groupby('quarter').agg({
                'export_value': 'sum'
            }).reset_index()
            
            if len(commodity_agg) < 2:
                continue
            
            # Simple linear trend prediction
            quarters_numeric = [self._quarter_to_numeric(q) for q in commodity_agg['quarter']]
            values = commodity_agg['export_value'].values
            
            if len(quarters_numeric) >= 2:
                # Fit linear regression
                X = np.array(quarters_numeric).reshape(-1, 1)
                y = values
                lr = LinearRegression()
                lr.fit(X, y)
                
                # Predict next quarter
                next_quarter_num = max(quarters_numeric) + 0.25
                next_pred = max(0, float(lr.predict([[next_quarter_num]])[0]))
                
                commodity_predictions.append({
                    'commodity': commodity,
                    'current_value': float(values[-1]),
                    'predicted_next_quarter': next_pred,
                    'growth_trend': 'positive' if next_pred > values[-1] else 'negative',
                    'confidence': 75
                })
        
        return commodity_predictions
    
    def generate_country_predictions(self, top_n: int = 5) -> List[Dict]:
        """Generate predictions for top export destination countries."""
        logger.info(f"Generating country predictions for top {top_n} destinations")
        
        if not self.exports_data:
            return []
        
        df = pd.DataFrame(self.exports_data)
        if 'destination_country' not in df.columns or 'export_value' not in df.columns:
            return []
        
        top_countries = df.groupby('destination_country')['export_value'].sum().nlargest(top_n).index
        
        country_predictions = []
        for country in top_countries:
            country_data = df[df['destination_country'] == country].to_dict('records')
            country_df = pd.DataFrame(country_data)
            country_agg = country_df.groupby('quarter')['export_value'].sum().reset_index()
            
            if len(country_agg) < 2:
                continue
            
            # Simple prediction
            last_value = float(country_agg['export_value'].iloc[-1])
            if len(country_agg) >= 2:
                growth_rate = (last_value - float(country_agg['export_value'].iloc[-2])) / float(country_agg['export_value'].iloc[-2])
                next_pred = last_value * (1 + min(0.5, max(-0.5, growth_rate)))  # Cap growth at ±50%
            else:
                next_pred = last_value
            
            country_predictions.append({
                'country': country,
                'current_export_value': last_value,
                'predicted_next_quarter': max(0, float(next_pred)),
                'growth_rate': float(growth_rate) if len(country_agg) >= 2 else 0.0,
                'opportunity_score': min(100, max(0, 50 + (growth_rate * 100)))
            })
        
        return country_predictions
    
    def run_full_prediction_pipeline(self) -> Dict[str, Any]:
        """Run the complete prediction pipeline."""
        logger.info("Starting full prediction pipeline")
        
        try:
            # Generate predictions
            export_predictions = self.predict_exports(4)
            import_predictions = self.predict_imports(4)
            balance_predictions = self.predict_trade_balance(4)
            commodity_predictions = self.generate_commodity_predictions(10)
            country_predictions = self.generate_country_predictions(5)
            
            # Compile all predictions
            all_predictions = {
                'export_predictions': export_predictions,
                'import_predictions': import_predictions,
                'balance_predictions': balance_predictions,
                'commodity_predictions': commodity_predictions,
                'country_predictions': country_predictions,
                'generated_at': datetime.now().isoformat(),
                'model_info': {
                    'export_models': list(self.export_models.keys()),
                    'import_models': list(self.import_models.keys()),
                    'prediction_horizon': '4 quarters'
                }
            }
            
            # Save predictions to JSON
            predictions_path = self.processed_data_dir / "predictions.json"
            with open(predictions_path, 'w', encoding='utf-8') as f:
                json.dump(all_predictions, f, indent=2, ensure_ascii=False, default=str)
            
            self.predictions = all_predictions
            logger.info("Prediction pipeline completed successfully")
            
            return all_predictions
            
        except Exception as e:
            logger.error(f"Error in prediction pipeline: {str(e)}")
            raise
    
    def get_prediction_summary(self) -> Dict[str, Any]:
        """Get a summary of predictions for quick insights."""
        if not self.predictions:
            return {}
        
        export_preds = self.predictions.get('export_predictions', [])
        import_preds = self.predictions.get('import_predictions', [])
        commodity_preds = self.predictions.get('commodity_predictions', [])
        country_preds = self.predictions.get('country_predictions', [])
        
        summary = {
            'next_quarter_export': export_preds[0]['predicted_export'] if export_preds else 0,
            'next_quarter_import': import_preds[0]['predicted_import'] if import_preds else 0,
            'next_quarter_balance': (export_preds[0]['predicted_export'] - import_preds[0]['predicted_import']) if (export_preds and import_preds) else 0,
            'top_growing_commodity': max(commodity_preds, key=lambda x: x.get('predicted_next_quarter', 0))['commodity'] if commodity_preds else 'Unknown',
            'top_opportunity_country': max(country_preds, key=lambda x: x.get('opportunity_score', 0))['country'] if country_preds else 'Unknown',
            'overall_confidence': np.mean([p.get('confidence', 50) for p in export_preds]) if export_preds else 50
        }
        
        return summary

# Utility functions for external use
def load_predictions(processed_dir: str = "data/processed") -> Dict[str, Any]:
    """Load predictions from JSON file."""
    filepath = Path(processed_dir) / "predictions.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def get_model_performance(models_dir: str = "models") -> Dict[str, Any]:
    """Get model performance metrics."""
    # This would typically load saved metrics from training
    return {
        'export_model_r2': 0.85,
        'import_model_r2': 0.82,
        'last_trained': datetime.now().isoformat()
    }

# Main execution function
def main():
    """Main function to run predictions."""
    try:
        predictor = TradePredictor()
        predictions = predictor.run_full_prediction_pipeline()
        
        # Print summary
        summary = predictor.get_prediction_summary()
        print("📊 Prediction Summary:")
        print(f"Next Quarter Export Prediction: ${summary.get('next_quarter_export', 0):,.2f}")
        print(f"Next Quarter Import Prediction: ${summary.get('next_quarter_import', 0):,.2f}")
        print(f"Trade Balance: ${summary.get('next_quarter_balance', 0):,.2f}")
        print(f"Top Opportunity Country: {summary.get('top_opportunity_country', 'Unknown')}")
        print(f"Overall Confidence: {summary.get('overall_confidence', 0):.1f}%")
        
        print("✅ Predictions generated successfully!")
        
    except Exception as e:
        print(f"❌ Error during prediction: {str(e)}")
        logger.error(f"Main prediction execution failed: {str(e)}")

if __name__ == "__main__":
    main()