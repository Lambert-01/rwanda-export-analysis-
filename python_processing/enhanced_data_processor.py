#!/usr/bin/env python3
"""
Rwanda trade analysis system- Enhanced Data Processor
Processes multiple Excel files and all sheets for comprehensive trade data analysis
"""

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
        logging.FileHandler('enhanced_data_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EnhancedDataProcessor:
    """Enhanced data processor for multiple Excel files and comprehensive sheet analysis."""

    def __init__(self, raw_data_dir: str = "../data/raw", processed_data_dir: str = "../data/processed"):
        """Initialize the enhanced data processor."""
        self.raw_data_dir = Path(raw_data_dir)
        self.processed_data_dir = Path(processed_data_dir)
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)

        # Initialize data containers for 2025Q1 file only
        self.data_2025q1 = {
            "exports_data": [],
            "imports_data": [],
            "re_exports_data": [],
            "commodity_exports": [],
            "commodity_imports": [],
            "commodity_re_exports": []
        }

        # Combined data for analysis
        self.combined_data = {
            "exports_data": [],
            "imports_data": [],
            "re_exports_data": [],
            "trade_balance_data": []
        }

        # Sheet-by-sheet analysis results
        self.sheet_analysis = {}

        # Metadata tracking
        self.metadata = {
            "processed_at": datetime.now().isoformat(),
            "source_files": [],
            "data_quarters": set(),
            "commodities": set(),
            "countries": set(),
            "files_processed": {},
            "sheets_processed": {}
        }

        logger.info("EnhancedDataProcessor initialized")

    def process_multiple_files(self, files_to_process: List[str] = None) -> Dict[str, Any]:
        """Process multiple Excel files comprehensively."""
        if files_to_process is None:
            # Check if 2025Q1 file exists
            filename = "2025Q1_Trade_report_annexTables.xlsx"
            filepath = self.raw_data_dir / filename

            if filepath.exists():
                files_to_process = [filename]
                logger.info(f"Found file: {filename}")
            else:
                raise FileNotFoundError(f"Required file not found: {filepath}")

        if not files_to_process:
            raise FileNotFoundError("No Excel files found in the raw data directory")

        logger.info(f"Processing {len(files_to_process)} Excel files")

        all_results = {}

        for filename in files_to_process:
            logger.info(f"Processing file: {filename}")
            file_results = self.process_single_file(filename)
            all_results[filename] = file_results

            # Update metadata
            self.metadata["files_processed"][filename] = {
                "processed_at": datetime.now().isoformat(),
                "sheets_found": len(file_results.get("sheets", {})),
                "data_extracted": file_results.get("data_summary", {})
            }

        # Combine data from all files
        self._combine_all_data()

        # Generate comprehensive analysis
        analysis_results = self._generate_comprehensive_analysis()

        # Save all results
        self._save_all_results()

        return {
            "files_processed": all_results,
            "combined_analysis": analysis_results,
            "metadata": self.metadata
        }

    def process_single_file(self, filename: str) -> Dict[str, Any]:
        """Process a single Excel file and all its sheets."""
        filepath = self.raw_data_dir / filename

        if not filepath.exists():
            raise FileNotFoundError(f"Excel file not found: {filepath}")

        logger.info(f"Loading Excel file: {filename}")
        self.metadata["source_files"].append(str(filepath))

        # Load all sheets
        excel_data = self.load_excel_data(filename)

        file_results = {
            "filename": filename,
            "sheets": {},
            "data_summary": {},
            "analysis_by_sheet": {}
        }

        # Process each sheet based on its type
        for sheet_name, df in excel_data.items():
            logger.info(f"Processing sheet: {sheet_name}")

            sheet_analysis = self.analyze_sheet_structure(df, sheet_name)
            file_results["sheets"][sheet_name] = sheet_analysis

            # Extract data based on sheet type
            if sheet_name == 'ExportCountry':
                export_data = self.extract_country_exports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["exports_data"].extend(export_data)
                else:
                    self.data_2025q1["exports_data"].extend(export_data)

            elif sheet_name == 'ImportCountry':
                import_data = self.extract_country_imports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["imports_data"].extend(import_data)
                else:
                    self.data_2025q1["imports_data"].extend(import_data)

            elif sheet_name == 'ReexportsCountry':
                reexport_data = self.extract_country_reexports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["re_exports_data"].extend(reexport_data)
                else:
                    self.data_2025q1["re_exports_data"].extend(reexport_data)

            elif sheet_name == 'ExportsCommodity':
                commodity_export_data = self.extract_commodity_exports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["commodity_exports"].extend(commodity_export_data)
                else:
                    self.data_2025q1["commodity_exports"].extend(commodity_export_data)

            elif sheet_name == 'ImportsCommodity':
                commodity_import_data = self.extract_commodity_imports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["commodity_imports"].extend(commodity_import_data)
                else:
                    self.data_2025q1["commodity_imports"].extend(commodity_import_data)

            elif sheet_name == 'ReexportsCommodity':
                commodity_reexport_data = self.extract_commodity_reexports(df, '2024Q4' if '2024' in filename else '2025Q1')
                if '2024' in filename:
                    self.data_2024q4["commodity_re_exports"].extend(commodity_reexport_data)
                else:
                    self.data_2025q1["commodity_re_exports"].extend(commodity_reexport_data)

        # Generate file-level summary
        file_results["data_summary"] = self._generate_file_summary(filename)
        self.metadata["sheets_processed"][filename] = list(excel_data.keys())

        return file_results

    def load_excel_data(self, filename: str) -> Dict[str, pd.DataFrame]:
        """Load and parse the Excel file with all sheets."""
        filepath = self.raw_data_dir / filename

        try:
            excel_file = pd.ExcelFile(filepath)
            sheets = excel_file.sheet_names
            logger.info(f"Found {len(sheets)} sheets: {sheets}")

            data_sheets = {}
            for sheet in sheets:
                df = pd.read_excel(filepath, sheet_name=sheet, header=None)
                data_sheets[sheet] = df
                logger.debug(f"Loaded sheet {sheet} with shape {df.shape}")

            return data_sheets

        except Exception as e:
            logger.error(f"Error loading Excel file: {str(e)}")
            raise

    def analyze_sheet_structure(self, df: pd.DataFrame, sheet_name: str) -> Dict[str, Any]:
        """Analyze the structure of a single sheet."""
        analysis = {
            "sheet_name": sheet_name,
            "shape": df.shape,
            "memory_usage": df.memory_usage(deep=True).sum(),
            "data_types": self._analyze_data_types(df),
            "header_analysis": self._analyze_headers(df),
            "content_preview": self._get_content_preview(df),
            "potential_data_structure": self._infer_data_structure(df, sheet_name)
        }

        return analysis

    def _analyze_data_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data types in the dataframe."""
        try:
            str_df = df.astype(str)
            analysis = {"numeric_columns": 0, "text_columns": 0, "mixed_columns": 0, "empty_columns": 0}

            for col in str_df.columns:
                col_data = str_df[col]
                numeric_pattern = r'^-?\d+\.?\d*$'
                numeric_mask = col_data.str.match(numeric_pattern)
                empty_mask = col_data.isin(['nan', 'None', ''])

                numeric_count = numeric_mask.sum()
                empty_count = empty_mask.sum()
                total_count = len(col_data)

                if empty_count == total_count:
                    analysis["empty_columns"] += 1
                elif numeric_count == total_count - empty_count:
                    analysis["numeric_columns"] += 1
                elif numeric_count == 0:
                    analysis["text_columns"] += 1
                else:
                    analysis["mixed_columns"] += 1

            return analysis
        except Exception as e:
            return {"error": str(e)}

    def _analyze_headers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze potential header rows."""
        try:
            analysis = {"potential_header_rows": []}

            for i, row in df.iterrows():
                text_count = 0
                total_count = 0

                for cell in row:
                    if pd.notna(cell):
                        total_count += 1
                        if isinstance(cell, str) and len(str(cell).strip()) > 3:
                            text_count += 1

                if total_count > 0:
                    text_ratio = text_count / total_count
                    if text_ratio > 0.7:
                        analysis["potential_header_rows"].append({
                            "row_index": int(i),
                            "text_ratio": text_ratio,
                            "sample_content": str(row.iloc[0])[:50] if pd.notna(row.iloc[0]) else ""
                        })

            return analysis
        except Exception as e:
            return {"error": str(e)}

    def _get_content_preview(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get a preview of the content."""
        try:
            preview = {
                "first_few_values": [],
                "unique_values_count": {},
                "potential_data_starts": []
            }

            for col in df.columns:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    preview["first_few_values"].extend([str(x) for x in col_data.head(3).tolist()])

                preview["unique_values_count"][f"col_{col}"] = df[col].nunique()

            # Look for where actual data might start
            for i, row in df.iterrows():
                non_empty_count = row.notna().sum()
                if non_empty_count > df.shape[1] * 0.5:
                    preview["potential_data_starts"].append({
                        "row_index": int(i),
                        "filled_cells": int(non_empty_count)
                    })

            return preview
        except Exception as e:
            return {"error": str(e)}

    def _infer_data_structure(self, df: pd.DataFrame, sheet_name: str) -> Dict[str, Any]:
        """Infer the data structure based on sheet name and content."""
        structure = {
            "likely_data_type": "unknown",
            "quarter_columns": [],
            "country_column": None,
            "value_columns": []
        }

        # Infer based on sheet name
        if 'Export' in sheet_name and 'Country' in sheet_name:
            structure["likely_data_type"] = "country_exports"
            structure["country_column"] = 0
            structure["quarter_columns"] = list(range(1, 13))
        elif 'Import' in sheet_name and 'Country' in sheet_name:
            structure["likely_data_type"] = "country_imports"
            structure["country_column"] = 0
            structure["quarter_columns"] = list(range(1, 13))
        elif 'Export' in sheet_name and 'Commodity' in sheet_name:
            structure["likely_data_type"] = "commodity_exports"
        elif 'Import' in sheet_name and 'Commodity' in sheet_name:
            structure["likely_data_type"] = "commodity_imports"

        return structure

    def extract_country_exports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract country-level export data."""
        logger.info("Extracting country export data")

        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small for country exports")
            return []

        # Check for expected header pattern
        header_row = 4
        if pd.isna(df.iloc[header_row, 0]) or 'Year and Period' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected header pattern not found")
            return []

        # Define quarters based on file
        if '2024' in quarter_prefix:
            quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
        else:  # 2025Q1
            quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        quarter_columns = list(range(1, len(quarters) + 1))
        data_rows = []

        for row_idx in range(7, len(df)):
            row_data = df.iloc[row_idx]
            country_name = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None

            if not country_name or country_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            for col_idx, quarter in zip(quarter_columns[:len(quarters)], quarters):
                if col_idx >= len(row_data):
                    break

                value = row_data.iloc[col_idx]
                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:
                            data_rows.append({
                                'quarter': quarter,
                                'export_value': numeric_value,
                                'destination_country': clean_country_name(country_name),
                                'data_source': quarter_prefix
                            })
                    except (ValueError, TypeError):
                        continue

        logger.info(f"Extracted {len(data_rows)} country export records")
        return data_rows

    def extract_country_imports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract country-level import data."""
        logger.info("Extracting country import data")

        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small for country imports")
            return []

        # Check for expected header pattern
        header_row = 4
        if pd.isna(df.iloc[header_row, 0]) or 'Year and Period' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected header pattern not found")
            return []

        # Define quarters based on file
        if '2024' in quarter_prefix:
            quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
        else:  # 2025Q1
            quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        quarter_columns = list(range(1, len(quarters) + 1))
        data_rows = []

        for row_idx in range(7, len(df)):
            row_data = df.iloc[row_idx]
            country_name = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None

            if not country_name or country_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            for col_idx, quarter in zip(quarter_columns[:len(quarters)], quarters):
                if col_idx >= len(row_data):
                    break

                value = row_data.iloc[col_idx]
                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:
                            data_rows.append({
                                'quarter': quarter,
                                'import_value': numeric_value,
                                'source_country': clean_country_name(country_name),
                                'data_source': quarter_prefix
                            })
                    except (ValueError, TypeError):
                        continue

        logger.info(f"Extracted {len(data_rows)} country import records")
        return data_rows

    def extract_country_reexports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract country-level re-export data."""
        logger.info("Extracting country re-export data")
        # Similar to exports but for re-exports
        reexport_data = self.extract_country_exports(df, quarter_prefix)
        for record in reexport_data:
            record['trade_type'] = 'reexport'
        return reexport_data

    def extract_commodity_exports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract commodity-level export data."""
        logger.info("Extracting commodity export data")

        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small for commodity exports")
            return []

        # Check for expected header pattern
        header_row = 3  # Different header structure for commodity sheets
        if pd.isna(df.iloc[header_row, 0]) or 'SITC SECTION' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected commodity header pattern not found")
            return []

        # Define quarters based on file
        if '2024' in quarter_prefix:
            quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
        else:  # 2025Q1
            quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        quarter_columns = list(range(2, len(quarters) + 2))  # Start from column 2 for commodities
        data_rows = []

        for row_idx in range(4, len(df)):  # Start from row 4 for commodity data
            row_data = df.iloc[row_idx]
            commodity_code = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None
            commodity_name = str(row_data.iloc[1]).strip() if pd.notna(row_data.iloc[1]) else None

            if not commodity_name or commodity_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            # Skip section headers (SITC codes like "0", "1", etc.)
            if commodity_code in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                continue

            for col_idx, quarter in zip(quarter_columns[:len(quarters)], quarters):
                if col_idx >= len(row_data):
                    break

                value = row_data.iloc[col_idx]
                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:
                            data_rows.append({
                                'quarter': quarter,
                                'export_value': numeric_value,
                                'commodity_code': commodity_code,
                                'commodity_name': clean_commodity_name(commodity_name),
                                'sitc_section': commodity_code[0] if len(commodity_code) > 0 else 'Unknown',
                                'data_source': quarter_prefix
                            })
                    except (ValueError, TypeError):
                        continue

        logger.info(f"Extracted {len(data_rows)} commodity export records")
        return data_rows

    def extract_commodity_imports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract commodity-level import data."""
        logger.info("Extracting commodity import data")

        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small for commodity imports")
            return []

        # Check for expected header pattern
        header_row = 3  # Different header structure for commodity sheets
        if pd.isna(df.iloc[header_row, 0]) or 'SITC SECTION' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected commodity header pattern not found")
            return []

        # Define quarters based on file
        if '2024' in quarter_prefix:
            quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
        else:  # 2025Q1
            quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        quarter_columns = list(range(2, len(quarters) + 2))  # Start from column 2 for commodities
        data_rows = []

        for row_idx in range(4, len(df)):  # Start from row 4 for commodity data
            row_data = df.iloc[row_idx]
            commodity_code = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None
            commodity_name = str(row_data.iloc[1]).strip() if pd.notna(row_data.iloc[1]) else None

            if not commodity_name or commodity_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            # Skip section headers (SITC codes like "0", "1", etc.)
            if commodity_code in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                continue

            for col_idx, quarter in zip(quarter_columns[:len(quarters)], quarters):
                if col_idx >= len(row_data):
                    break

                value = row_data.iloc[col_idx]
                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:
                            data_rows.append({
                                'quarter': quarter,
                                'import_value': numeric_value,
                                'commodity_code': commodity_code,
                                'commodity_name': clean_commodity_name(commodity_name),
                                'sitc_section': commodity_code[0] if len(commodity_code) > 0 else 'Unknown',
                                'data_source': quarter_prefix
                            })
                    except (ValueError, TypeError):
                        continue

        logger.info(f"Extracted {len(data_rows)} commodity import records")
        return data_rows

    def extract_commodity_reexports(self, df: pd.DataFrame, quarter_prefix: str) -> List[Dict]:
        """Extract commodity-level re-export data."""
        logger.info("Extracting commodity re-export data")

        if len(df) < 5 or df.shape[1] < 13:
            logger.warning("Dataframe too small for commodity re-exports")
            return []

        # Check for expected header pattern
        header_row = 3  # Different header structure for commodity sheets
        if pd.isna(df.iloc[header_row, 0]) or 'SITC SECTION' not in str(df.iloc[header_row, 0]):
            logger.warning("Expected commodity header pattern not found")
            return []

        # Define quarters based on file
        if '2024' in quarter_prefix:
            quarters = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
        else:  # 2025Q1
            quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        quarter_columns = list(range(2, len(quarters) + 2))  # Start from column 2 for commodities
        data_rows = []

        for row_idx in range(4, len(df)):  # Start from row 4 for commodity data
            row_data = df.iloc[row_idx]
            commodity_code = str(row_data.iloc[0]).strip() if pd.notna(row_data.iloc[0]) else None
            commodity_name = str(row_data.iloc[1]).strip() if pd.notna(row_data.iloc[1]) else None

            if not commodity_name or commodity_name.lower() in ['nan', 'source:', 'total', '']:
                continue

            # Skip section headers (SITC codes like "0", "1", etc.)
            if commodity_code in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                continue

            for col_idx, quarter in zip(quarter_columns[:len(quarters)], quarters):
                if col_idx >= len(row_data):
                    break

                value = row_data.iloc[col_idx]
                if pd.notna(value):
                    try:
                        numeric_value = float(value)
                        if numeric_value > 0:
                            data_rows.append({
                                'quarter': quarter,
                                'reexport_value': numeric_value,
                                'commodity_code': commodity_code,
                                'commodity_name': clean_commodity_name(commodity_name),
                                'sitc_section': commodity_code[0] if len(commodity_code) > 0 else 'Unknown',
                                'data_source': quarter_prefix,
                                'trade_type': 'reexport'
                            })
                    except (ValueError, TypeError):
                        continue

        logger.info(f"Extracted {len(data_rows)} commodity re-export records")
        return data_rows

    def _combine_all_data(self) -> None:
        """Use data from 2025Q1 file only."""
        logger.info("Using 2025Q1 data")

        # Use exports data directly from 2025Q1
        self.combined_data["exports_data"] = self.data_2025q1["exports_data"]

        # Use imports data directly from 2025Q1
        self.combined_data["imports_data"] = self.data_2025q1["imports_data"]

        # Use re-exports data directly from 2025Q1
        self.combined_data["re_exports_data"] = self.data_2025q1["re_exports_data"]

        # Update metadata
        for record in self.combined_data["exports_data"]:
            self.metadata["data_quarters"].add(record.get("quarter", ""))
            self.metadata["countries"].add(record.get("destination_country", ""))

        for record in self.combined_data["imports_data"]:
            self.metadata["data_quarters"].add(record.get("quarter", ""))
            self.metadata["countries"].add(record.get("source_country", ""))

    def _generate_file_summary(self, filename: str) -> Dict[str, Any]:
        """Generate summary for a single file."""
        summary = {
            "total_records": 0,
            "quarters_covered": set(),
            "countries_found": set(),
            "data_by_type": {}
        }

        # Use 2025Q1 data only
        data_dict = self.data_2025q1

        for data_type, data_list in data_dict.items():
            count = len(data_list)
            summary["total_records"] += count
            summary["data_by_type"][data_type] = count

            # Extract quarters and countries
            for record in data_list:
                summary["quarters_covered"].add(record.get("quarter", ""))
                if "export" in data_type:
                    summary["countries_found"].add(record.get("destination_country", ""))
                elif "import" in data_type:
                    summary["countries_found"].add(record.get("source_country", ""))

        summary["quarters_covered"] = list(summary["quarters_covered"])
        summary["countries_found"] = list(summary["countries_found"])

        return summary

    def _generate_comprehensive_analysis(self) -> Dict[str, Any]:
        """Generate comprehensive analysis of all processed data."""
        logger.info("Generating comprehensive analysis")

        analysis = {
            "summary": {
                "total_files_processed": 2,
                "total_sheets_processed": 26,
                "total_records_extracted": len(self.combined_data["exports_data"]) + len(self.combined_data["imports_data"]),
                "quarters_covered": list(self.metadata["data_quarters"]),
                "countries_found": list(self.metadata["countries"])
            },
            "quarterly_aggregation": self._aggregate_by_quarter(),
            "country_aggregation": self._aggregate_by_country(),
            "trade_balance_analysis": self._calculate_trade_balance_analysis(),
            "year_over_year_comparison": self._compare_years(),
            "top_performers": self._identify_top_performers()
        }

        return analysis

    def _aggregate_by_quarter(self) -> Dict[str, Any]:
        """Aggregate data by quarter."""
        quarterly_data = {}

        # Aggregate exports by quarter
        export_df = pd.DataFrame(self.combined_data["exports_data"])
        if not export_df.empty:
            export_agg = export_df.groupby('quarter')['export_value'].sum().reset_index()
            quarterly_data["exports"] = export_agg.to_dict('records')

        # Aggregate imports by quarter
        import_df = pd.DataFrame(self.combined_data["imports_data"])
        if not import_df.empty:
            import_agg = import_df.groupby('quarter')['import_value'].sum().reset_index()
            quarterly_data["imports"] = import_agg.to_dict('records')

        return quarterly_data

    def _aggregate_by_country(self) -> Dict[str, Any]:
        """Aggregate data by country."""
        country_data = {
            "export_destinations": {},
            "import_sources": {}
        }

        # Aggregate exports by destination country
        export_df = pd.DataFrame(self.combined_data["exports_data"])
        if not export_df.empty:
            export_by_country = export_df.groupby('destination_country')['export_value'].sum().reset_index()
            export_by_country = export_by_country.nlargest(20, 'export_value')
            country_data["export_destinations"] = export_by_country.to_dict('records')

        # Aggregate imports by source country
        import_df = pd.DataFrame(self.combined_data["imports_data"])
        if not import_df.empty:
            import_by_country = import_df.groupby('source_country')['import_value'].sum().reset_index()
            import_by_country = import_by_country.nlargest(20, 'import_value')
            country_data["import_sources"] = import_by_country.to_dict('records')

        return country_data

    def _calculate_trade_balance_analysis(self) -> Dict[str, Any]:
        """Calculate comprehensive trade balance analysis."""
        logger.info("Calculating trade balance analysis")

        # Create quarterly summary
        export_df = pd.DataFrame(self.combined_data["exports_data"])
        import_df = pd.DataFrame(self.combined_data["imports_data"])

        if export_df.empty or import_df.empty:
            return {"error": "Insufficient data for trade balance calculation"}

        # Aggregate by quarter
        export_agg = export_df.groupby('quarter')['export_value'].sum().reset_index()
        import_agg = import_df.groupby('quarter')['import_value'].sum().reset_index()

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

        self.combined_data["trade_balance_data"] = balance_df.to_dict('records')

        return {
            "quarterly_balance": balance_df.to_dict('records'),
            "summary": {
                "total_export_value": balance_df['export_value'].sum(),
                "total_import_value": balance_df['import_value'].sum(),
                "overall_balance": balance_df['trade_balance'].sum(),
                "quarters_analyzed": len(balance_df)
            }
        }

    def _compare_years(self) -> Dict[str, Any]:
        """Compare data between 2024 and 2025."""
        comparison = {
            "exports_comparison": {},
            "imports_comparison": {},
            "growth_analysis": {}
        }

        # Compare 2024 vs 2025 data
        export_2024 = [r for r in self.combined_data["exports_data"] if r.get("data_source") == "2024Q4"]
        export_2025 = [r for r in self.combined_data["exports_data"] if r.get("data_source") == "2025Q1"]

        if export_2024 and export_2025:
            export_df_2024 = pd.DataFrame(export_2024)
            export_df_2025 = pd.DataFrame(export_2025)

            export_sum_2024 = export_df_2024['export_value'].sum()
            export_sum_2025 = export_df_2025['export_value'].sum()

            comparison["exports_comparison"] = {
                "2024_total": export_sum_2024,
                "2025_total": export_sum_2025,
                "growth": ((export_sum_2025 - export_sum_2024) / export_sum_2024) * 100 if export_sum_2024 > 0 else 0
            }

        return comparison

    def _identify_top_performers(self) -> Dict[str, Any]:
        """Identify top performing countries and commodities."""
        top_performers = {
            "top_export_destinations": [],
            "top_import_sources": [],
            "fastest_growing_exports": [],
            "fastest_growing_imports": []
        }

        # Top export destinations
        export_df = pd.DataFrame(self.combined_data["exports_data"])
        if not export_df.empty:
            top_exports = export_df.groupby('destination_country')['export_value'].sum().reset_index()
            top_exports = top_exports.nlargest(10, 'export_value')
            top_performers["top_export_destinations"] = top_exports.to_dict('records')

        # Top import sources
        import_df = pd.DataFrame(self.combined_data["imports_data"])
        if not import_df.empty:
            top_imports = import_df.groupby('source_country')['import_value'].sum().reset_index()
            top_imports = top_imports.nlargest(10, 'import_value')
            top_performers["top_import_sources"] = top_imports.to_dict('records')

        return top_performers

    def _save_all_results(self) -> None:
        """Save all processed data and analysis results."""
        logger.info("Saving all results to JSON files")

        # Save individual file data for 2025Q1 only
        for data_type, data_list in self.data_2025q1.items():
            if data_list:
                filename = f"2025q1_{data_type}.json"
                filepath = self.processed_data_dir / filename
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data_list, f, indent=2, ensure_ascii=False, default=str)

        # Save combined data
        for data_type, data_list in self.combined_data.items():
            if data_list:
                filename = f"combined_{data_type}.json"
                filepath = self.processed_data_dir / filename
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data_list, f, indent=2, ensure_ascii=False, default=str)

        # Save comprehensive analysis
        analysis_filepath = self.processed_data_dir / "comprehensive_analysis.json"
        analysis_results = self._generate_comprehensive_analysis()
        with open(analysis_filepath, 'w', encoding='utf-8') as f:
            json.dump(analysis_results, f, indent=2, ensure_ascii=False, default=str)

        # Save metadata
        metadata_filepath = self.processed_data_dir / "enhanced_metadata.json"
        with open(metadata_filepath, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Saved all results to {self.processed_data_dir}")

# Utility functions (same as before)
def clean_country_name(country: str) -> str:
    """Clean and standardize country names."""
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

    if pd.isna(country) or country == 'Unknown':
        return 'Unknown'

    country = str(country).strip()

    if country in country_mapping:
        return country_mapping[country]

    country = re.sub(r'[^a-zA-Z\s]', '', country)
    country = country.strip()

    country_lower = country.lower()
    for key, value in country_mapping.items():
        if key.lower() == country_lower or key.lower().replace(',', '').replace('the', '').strip() == country_lower:
            return value

    return country.title() if country else 'Unknown'

def clean_commodity_name(commodity: str) -> str:
    """Clean and standardize commodity names."""
    if pd.isna(commodity) or commodity == 'Unknown':
        return 'Unknown'

    commodity = str(commodity).strip()

    # Remove SITC codes and extra formatting
    commodity = re.sub(r'SITC SECTION', '', commodity, flags=re.IGNORECASE)
    commodity = re.sub(r'COMMODITY DESCRIPTION/', '', commodity, flags=re.IGNORECASE)
    commodity = re.sub(r'TOTAL ESTIMATES', '', commodity, flags=re.IGNORECASE)
    commodity = re.sub(r'^\d+\s*', '', commodity)  # Remove leading numbers
    commodity = re.sub(r'[^a-zA-Z0-9\s\-&(),.]', ' ', commodity)  # Keep alphanumeric and common punctuation
    commodity = re.sub(r'\s+', ' ', commodity).strip()  # Clean whitespace

    # Standardize common commodity names
    commodity_clean = {
        'food and live animals': 'Food and Live Animals',
        'beverages and tobacco': 'Beverages and Tobacco',
        'crude materials inedible except fuels': 'Crude Materials (Inedible) Except Fuels',
        'mineral fuels lubricants and related materials': 'Mineral Fuels, Lubricants and Related Materials',
        'animals and vegetable oils fats  waxes': 'Animal and Vegetable Oils, Fats & Waxes',
        'chemicals  related products n e s': 'Chemicals & Related Products',
        'manufactured goods classified chiefly by material': 'Manufactured Goods Classified by Material',
        'machinery and transport equipment': 'Machinery and Transport Equipment',
        'miscellaneous manufactured articles': 'Miscellaneous Manufactured Articles',
        'other commodities  transactions n e s': 'Other Commodities & Transactions'
    }

    commodity_lower = commodity.lower()
    for key, value in commodity_clean.items():
        if key in commodity_lower:
            return value

    return commodity.title() if commodity else 'Unknown'

def main():
    """Main function to run enhanced data processing."""
    try:
        processor = EnhancedDataProcessor()
        results = processor.process_multiple_files()

        print("SUCCESS: Enhanced data processing completed successfully!")
        print(f"DATA: Processed {results['summary']['total_records_extracted']} trade records")
        print(f"GLOBE: Found data for {len(results['summary']['countries_found'])} countries")
        print(f"CALENDAR: Covered {len(results['summary']['quarters_covered'])} quarters")
        print(f"SAVE: Saved results to: {processor.processed_data_dir}")

        return results

    except Exception as e:
        print(f"❌ Error during enhanced data processing: {str(e)}")
        logger.error(f"Main execution failed: {str(e)}")
        return None

if __name__ == "__main__":
    main()