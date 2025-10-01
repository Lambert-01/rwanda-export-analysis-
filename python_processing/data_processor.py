import os
import json
import pandas as pd
import numpy as np
import logging
import re
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
        logging.FileHandler('data_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataProcessor:
    """Main class for processing Rwanda trade data from raw sources."""
    
    def __init__(self, raw_data_dir: str = None, processed_data_dir: str = None):
        """Initialize the data processor with directory paths."""
        import os
        # Use environment variables if provided, otherwise use defaults
        self.raw_data_dir = Path(raw_data_dir or os.getenv('DATA_RAW_PATH', "data/raw"))
        self.processed_data_dir = Path(processed_data_dir or os.getenv('DATA_PROCESSED_PATH', "data/processed"))
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize data containers
        self.exports_data = []
        self.imports_data = []
        self.re_exports_data = []
        self.trade_balance_data = []
        
        # Metadata tracking
        self.metadata = {
            "processed_at": datetime.now().isoformat(),
            "source_files": [],
            "data_quarters": set(),
            "commodities": set(),
            "countries": set()
        }
        
        logger.info("DataProcessor initialized")
    
    def load_excel_data(self, filename: str = "2024Q4_Trade_report_annexTables.xlsx") -> Dict[str, pd.DataFrame]:
        """
        Load and parse the Excel file containing trade data.
        Handles multiple sheets for exports, imports, and re-exports.
        """
        filepath = self.raw_data_dir / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Excel file not found: {filepath}")
        
        logger.info(f"Loading Excel data from {filepath}")
        self.metadata["source_files"].append(str(filepath))
        
        # Read all sheets
        try:
            excel_file = pd.ExcelFile(filepath)
            sheets = excel_file.sheet_names
            logger.info(f"Found sheets: {sheets}")
            
            data_sheets = {}
            for sheet in sheets:
                df = pd.read_excel(filepath, sheet_name=sheet, header=None)
                data_sheets[sheet] = df
                logger.debug(f"Loaded sheet {sheet} with shape {df.shape}")
            
            return data_sheets
            
        except Exception as e:
            logger.error(f"Error loading Excel file: {str(e)}")
            raise
    
    def extract_quarterly_exports(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract and clean quarterly export data from Excel sheet.
        Handles the specific NISR Excel format with quarters as columns.
        """
        logger.info("Extracting quarterly export data")

        # Check if this is the expected NISR format
        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small, returning empty")
            return pd.DataFrame()

        # Check for expected header pattern
        header_row = 4  # Row 4 (0-indexed) should contain "Year and Period"
        if pd.isna(df.iloc[header_row, 0]) or 'Year and Period' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected header pattern not found")
            return pd.DataFrame()

        # Extract quarter columns (columns 1-12 for 2022Q1 to 2024Q4)
        quarter_columns = list(range(1, 13))  # Columns 1-12
        quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']

        # Extract data starting from row 7 (countries start here)
        data_rows = []
        for row_idx in range(7, len(df)):  # Start from row 7
            row_data = df.iloc[row_idx]
            country_name = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None

            if not country_name or country_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            # Extract values for each quarter
            for col_idx, quarter in zip(quarter_columns, quarters):
                value = row_data.iloc[col_idx]

                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:  # Only include positive values
                            data_rows.append({
                                'quarter': quarter,
                                'export_value': numeric_value,
                                'commodity': 'Total Exports',  # Country-level data
                                'destination_country': clean_country_name(country_name)
                            })
                    except (ValueError, TypeError):
                        continue

        # Convert to DataFrame
        if not data_rows:
            logger.warning("No valid data rows extracted")
            return pd.DataFrame()

        standardized = pd.DataFrame(data_rows)

        # Clean and standardize values
        standardized['export_value'] = pd.to_numeric(standardized['export_value'], errors='coerce').fillna(0)
        standardized['quarter'] = standardized['quarter'].astype(str)
        standardized['commodity'] = standardized['commodity'].astype(str)
        standardized['destination_country'] = standardized['destination_country'].astype(str)

        # Update metadata
        self.metadata["data_quarters"].update(standardized['quarter'].unique())
        self.metadata["commodities"].update(standardized['commodity'].unique())
        self.metadata["countries"].update(standardized['destination_country'].unique())

        logger.info(f"Extracted {len(standardized)} export records")
        return standardized
    
    def extract_quarterly_imports(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract and clean quarterly import data from Excel sheet.
        Handles the specific NISR Excel format with quarters as columns.
        """
        logger.info("Extracting quarterly import data")

        # Check if this is the expected NISR format
        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small, returning empty")
            return pd.DataFrame()

        # Check for expected header pattern
        header_row = 4  # Row 4 (0-indexed) should contain "Year and Period"
        if pd.isna(df.iloc[header_row, 0]) or 'Year and Period' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected header pattern not found")
            return pd.DataFrame()

        # Extract quarter columns (columns 1-12 for 2022Q1 to 2024Q4)
        quarter_columns = list(range(1, 13))  # Columns 1-12
        quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']

        # Extract data starting from row 7 (countries start here)
        data_rows = []
        for row_idx in range(7, len(df)):  # Start from row 7
            row_data = df.iloc[row_idx]
            country_name = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None

            if not country_name or country_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            # Extract values for each quarter
            for col_idx, quarter in zip(quarter_columns, quarters):
                value = row_data.iloc[col_idx]

                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:  # Only include positive values
                            data_rows.append({
                                'quarter': quarter,
                                'import_value': numeric_value,
                                'commodity': 'Total Imports',  # Country-level data
                                'source_country': clean_country_name(country_name)
                            })
                    except (ValueError, TypeError):
                        continue

        # Convert to DataFrame
        if not data_rows:
            logger.warning("No valid data rows extracted")
            return pd.DataFrame()

        standardized = pd.DataFrame(data_rows)

        # Clean and standardize values
        standardized['import_value'] = pd.to_numeric(standardized['import_value'], errors='coerce').fillna(0)
        standardized['quarter'] = standardized['quarter'].astype(str)
        standardized['commodity'] = standardized['commodity'].astype(str)
        standardized['source_country'] = standardized['source_country'].astype(str)

        self.metadata["data_quarters"].update(standardized['quarter'].unique())
        self.metadata["commodities"].update(standardized['commodity'].unique())
        self.metadata["countries"].update(standardized['source_country'].unique())

        logger.info(f"Extracted {len(standardized)} import records")
        return standardized
    
    def extract_re_exports(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract re-export data if available."""
        logger.info("Extracting re-export data")
        # Simplified implementation - similar to exports
        return pd.DataFrame()  # Placeholder
    
    def calculate_trade_balance(self, exports_df: pd.DataFrame, imports_df: pd.DataFrame) -> pd.DataFrame:
        """Calculate trade balance by quarter."""
        logger.info("Calculating trade balance")
        
        # Aggregate by quarter
        export_agg = exports_df.groupby('quarter')['export_value'].sum().reset_index()
        import_agg = imports_df.groupby('quarter')['import_value'].sum().reset_index()
        
        # Merge and calculate balance
        balance_df = pd.merge(export_agg, import_agg, on='quarter', how='outer').fillna(0)
        balance_df['trade_balance'] = balance_df['export_value'] - balance_df['import_value']
        balance_df['balance_type'] = balance_df['trade_balance'].apply(
            lambda x: 'surplus' if x >= 0 else 'deficit'
        )
        
        # Calculate growth rates
        balance_df = balance_df.sort_values('quarter').reset_index(drop=True)
        balance_df['export_growth'] = balance_df['export_value'].pct_change().fillna(0)
        balance_df['import_growth'] = balance_df['import_value'].pct_change().fillna(0)
        balance_df['balance_growth'] = balance_df['trade_balance'].pct_change().fillna(0)
        
        return balance_df
    
    def process_all_data(self) -> None:
        """Main method to process all raw data files."""
        logger.info("Starting full data processing pipeline")

        try:
            # Load Excel data
            logger.info("Loading Excel data...")
            excel_data = self.load_excel_data()
            logger.info(f"Loaded {len(excel_data)} sheets from Excel")
            
            # Process each relevant sheet
            exports_df = None
            imports_df = None
            
            for sheet_name, df in excel_data.items():
                logger.info(f"Processing sheet: {sheet_name} with shape {df.shape}")
                if sheet_name == 'ExportCountry':
                    logger.info("Extracting export country data")
                    country_exports = self.extract_quarterly_exports(df)
                    logger.info(f"Extracted {len(country_exports)} country export records")
                    # For country sheets, the entity is destination_country
                    if not country_exports.empty:
                        if exports_df is None:
                            exports_df = country_exports
                        else:
                            exports_df = pd.concat([exports_df, country_exports], ignore_index=True)

                elif sheet_name == 'ImportCountry':
                    country_imports = self.extract_quarterly_imports(df)
                    # For country sheets, the entity is source_country
                    if not country_imports.empty:
                        if imports_df is None:
                            imports_df = country_imports
                        else:
                            imports_df = pd.concat([imports_df, country_imports], ignore_index=True)

                # Skip commodity sheets for now as they have different structure
                # elif sheet_name == 'ExportsCommodity':
                #     commodity_exports = self.extract_commodity_exports(df)
                #     if not commodity_exports.empty:
                #         if exports_df is None:
                #             exports_df = commodity_exports
                #         else:
                #             exports_df = pd.concat([exports_df, commodity_exports], ignore_index=True)

                # elif sheet_name == 'ImportsCommodity':
                #     commodity_imports = self.extract_commodity_imports(df)
                #     if not commodity_imports.empty:
                #         if imports_df is None:
                #             imports_df = commodity_imports
                #         else:
                #             imports_df = pd.concat([imports_df, commodity_imports], ignore_index=True)

                elif sheet_name in ['ReexportsCountry', 'ReexportsCommodity']:
                    re_exports_df = self.extract_re_exports(df)
                    self.re_exports_data = re_exports_df.to_dict('records')
            
            # Handle case where no data was extracted
            if exports_df is None:
                exports_df = pd.DataFrame({
                    'quarter': ['2024Q4'],
                    'export_value': [0],
                    'commodity': ['Unknown'],
                    'destination_country': ['Unknown']
                })
            
            if imports_df is None:
                imports_df = pd.DataFrame({
                    'quarter': ['2024Q4'],
                    'import_value': [0],
                    'commodity': ['Unknown'],
                    'source_country': ['Unknown']
                })
            
            # Calculate trade balance
            balance_df = self.calculate_trade_balance(exports_df, imports_df)
            
            # Store processed data
            self.exports_data = exports_df.to_dict('records')
            self.imports_data = imports_df.to_dict('records')
            self.trade_balance_data = balance_df.to_dict('records')
            
            # Save to JSON files
            self.save_processed_data()
            
            logger.info("Data processing completed successfully")
            
        except Exception as e:
            logger.error(f"Error in data processing pipeline: {str(e)}")
            raise
    
    def save_processed_data(self) -> None:
        """Save processed data to JSON files."""
        logger.info("Saving processed data to JSON files")
        
        # Save exports data
        exports_path = self.processed_data_dir / "exports_data.json"
        with open(exports_path, 'w', encoding='utf-8') as f:
            json.dump(self.exports_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Save imports data
        imports_path = self.processed_data_dir / "imports_data.json"
        with open(imports_path, 'w', encoding='utf-8') as f:
            json.dump(self.imports_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Save trade balance data
        balance_path = self.processed_data_dir / "trade_balance.json"
        with open(balance_path, 'w', encoding='utf-8') as f:
            json.dump(self.trade_balance_data, f, indent=2, ensure_ascii=False, default=str)
        
        # Save metadata
        metadata_path = self.processed_data_dir / "metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"Saved processed data to {self.processed_data_dir}")
    
    def validate_data(self) -> bool:
        """Validate processed data for consistency and quality."""
        logger.info("Validating processed data")
        
        validation_results = {
            'exports_not_empty': len(self.exports_data) > 0,
            'imports_not_empty': len(self.imports_data) > 0,
            'quarters_consistent': len(self.metadata["data_quarters"]) > 0,
            'values_non_negative': True,
            'countries_present': len(self.metadata["countries"]) > 0
        }
        
        # Check for negative values (should not happen in trade data)
        if self.exports_data:
            exports_values = [record.get('export_value', 0) for record in self.exports_data]
            validation_results['values_non_negative'] = all(v >= 0 for v in exports_values)
        
        if self.imports_data:
            imports_values = [record.get('import_value', 0) for record in self.imports_data]
            validation_results['values_non_negative'] = validation_results['values_non_negative'] and all(v >= 0 for v in imports_values)
            imports_values = [record.get('import_value', 0) for record in self.imports_data]
            validation_results['values_non_negative'] = validation_results['values_non_negative'] and all(v >= 0 for v in imports_values)
        
        # Log validation results
        for check, result in validation_results.items():
            if not result:
                logger.warning(f"Validation failed: {check}")
            else:
                logger.info(f"Validation passed: {check}")
        
        return all(validation_results.values())

# Additional utility functions for data processing
def clean_country_name(country: str) -> str:
    """Clean and standardize country names."""
    if pd.isna(country) or country == 'Unknown':
        return 'Unknown'

    country = str(country).strip()

    # Handle specific country name mappings from the Excel data
    country_mapping = {
        'United Arab Emirates': 'United Arab Emirates',
        'Congo, The Democratic Republic Of': 'Democratic Republic of the Congo',
        'China': 'China',
        'Luxembourg': 'Luxembourg',
        'United Kingdom': 'United Kingdom',
        'United States': 'United States',
        'Uganda': 'Uganda',
        'India': 'India',
        'Hong Kong': 'Hong Kong',
        'Netherlands': 'Netherlands',
        'Italy': 'Italy',
        'Belgium': 'Belgium',
        'Singapore': 'Singapore',
        'Pakistan': 'Pakistan',
        'Thailand': 'Thailand',
        'Congo': 'Congo',
        'Ethiopia': 'Ethiopia',
        'South Sudan': 'South Sudan',
        'Germany': 'Germany',
        'Turkey': 'Turkey',
        'Tanzania, United Republic Of': 'Tanzania',
        'Kenya': 'Kenya',
        'Burundi': 'Burundi',
        'South Africa': 'South Africa',
        'Japan': 'Japan',
        'Egypt': 'Egypt',
        'Cameroon': 'Cameroon',
        'France': 'France',
        'Saudi Arabia': 'Saudi Arabia',
        'Russian Federation': 'Russia',
        'Burkina Faso': 'Burkina Faso',
        'Malaysia': 'Malaysia',
        'Greece': 'Greece',
        'Ghana': 'Ghana',
        'Qatar': 'Qatar',
        'Sudan': 'Sudan',
        'Zambia': 'Zambia'
    }

    # Direct mapping first
    if country in country_mapping:
        return country_mapping[country]

    # Handle variations and clean up
    country = re.sub(r'[^a-zA-Z\\s]', '', country)  # Remove special characters
    country = country.strip()

    # Try to match with cleaned version
    country_lower = country.lower()
    for key, value in country_mapping.items():
        if key.lower() == country_lower or key.lower().replace(',', '').replace('the', '').strip() == country_lower:
            return value

    # If no match found, return the cleaned original
    return country.title() if country else 'Unknown'

def clean_commodity_name(commodity: str) -> str:
    """Clean and standardize commodity names."""
    if pd.isna(commodity) or commodity == 'Unknown':
        return 'Unknown'
    
    commodity = str(commodity).strip()
    # Remove HS codes and extra formatting
    commodity = re.sub(r'\\d{4,6}', '', commodity)  # Remove HS codes
    commodity = re.sub(r'[^a-zA-Z0-9\\s]', ' ', commodity)  # Keep alphanumeric and spaces
    commodity = re.sub(r'\\s+', ' ', commodity).strip()  # Clean whitespace
    
    return commodity.title() if commodity else 'Unknown'

def extract_quarter_from_date(date_str: str) -> str:
    """Extract quarter from various date formats."""
    if pd.isna(date_str):
        return 'Unknown'
    
    date_str = str(date_str).lower()
    
    # Handle direct quarter format
    if 'q' in date_str and any(q in date_str for q in ['q1', 'q2', 'q3', 'q4']):
        # Extract year and quarter
        year_match = re.search(r'(\\d{4})', date_str)
        quarter_match = re.search(r'q([1-4])', date_str)
        if year_match and quarter_match:
            return f"{year_match.group(1)}Q{quarter_match.group(1)}"
    
    # Handle month/year format
    try:
        if '/' in date_str or '-' in date_str:
            # Parse as date
            date_obj = pd.to_datetime(date_str)
            quarter = (date_obj.month - 1) // 3 + 1
            return f"{date_obj.year}Q{quarter}"
    except:
        pass
    
    return '2024Q4'  # Default

def aggregate_by_top_countries(data: List[Dict], country_key: str, value_key: str, top_n: int = 10) -> List[Dict]:
    """Aggregate data by top N countries."""
    df = pd.DataFrame(data)
    if df.empty:
        return []
    aggregated = df.groupby(country_key)[value_key].sum().reset_index()
    aggregated = aggregated.nlargest(top_n, value_key)
    return aggregated.to_dict('records')

def aggregate_by_commodity(data: List[Dict], commodity_key: str, value_key: str, top_n: int = 20) -> List[Dict]:
    """Aggregate data by top N commodities."""
    df = pd.DataFrame(data)
    if df.empty:
        return []
    aggregated = df.groupby(commodity_key)[value_key].sum().reset_index()
    aggregated = aggregated.nlargest(top_n, value_key)
    return aggregated.to_dict('records')

def calculate_quarterly_growth(data: List[Dict], quarter_key: str, value_key: str) -> List[Dict]:
    """Calculate quarter-over-quarter growth rates."""
    df = pd.DataFrame(data)
    if df.empty:
        return []
    # Sort by quarter
    df = df.sort_values(quarter_key).reset_index(drop=True)
    # Calculate growth
    df['growth_rate'] = df[value_key].pct_change().fillna(0)
    df['growth_amount'] = df[value_key].diff().fillna(0)
    return df.to_dict('records')

# Data quality functions
def detect_outliers(data: List[Dict], value_key: str, threshold: float = 3.0) -> List[Dict]:
    """Detect outliers using Z-score method."""
    df = pd.DataFrame(data)
    if df.empty or len(df) < 2:
        return []
    values = df[value_key]
    z_scores = np.abs((values - values.mean()) / values.std())
    outliers = df[z_scores > threshold]
    return outliers.to_dict('records')

def calculate_data_completeness(data: List[Dict]) -> Dict[str, float]:
    """Calculate completeness percentage for each field."""
    if not data:
        return {}
    df = pd.DataFrame(data)
    total_records = len(df)
    completeness = {}
    for column in df.columns:
        non_null_count = df[column].notna().sum()
        completeness[column] = (non_null_count / total_records) * 100
    return completeness

# Export utility functions for external use
def load_processed_exports(processed_dir: str = "data/processed") -> List[Dict]:
    """Load processed exports data from JSON."""
    filepath = Path(processed_dir) / "exports_data.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def load_processed_imports(processed_dir: str = "data/processed") -> List[Dict]:
    """Load processed imports data from JSON."""
    filepath = Path(processed_dir) / "imports_data.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def load_trade_balance(processed_dir: str = "data/processed") -> List[Dict]:
    """Load trade balance data from JSON."""
    filepath = Path(processed_dir) / "trade_balance.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

# Main execution function
def main():
    """Main function to run data processing."""
    try:
        processor = DataProcessor()
        processor.process_all_data()
        
        # Validate the processed data
        is_valid = processor.validate_data()
        if is_valid:
            print("✅ Data processing completed successfully!")
        else:
            print("⚠️  Data processing completed with validation warnings.")
            
    except Exception as e:
        print(f"❌ Error during data processing: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")

if __name__ == "__main__":
    main()