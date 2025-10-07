#!/usr/bin/env python3
"""
Rwanda Export Explorer - Excel File Examiner
Examines the structure and content of both 2024Q4 and 2025Q1 Excel files
"""

import os
import sys
import json
import logging
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('excel_examination.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ExcelFileExaminer:
    """Examines Excel files to understand their structure and content."""

    def __init__(self, raw_data_dir: str = "../data/raw"):
        """Initialize the examiner with the raw data directory."""
        self.raw_data_dir = Path(raw_data_dir)
        self.examination_results = {
            "examination_date": datetime.now().isoformat(),
            "files_examined": [],
            "summary": {}
        }

    def examine_excel_file(self, filename: str) -> Dict[str, Any]:
        """Examine a single Excel file and return detailed information."""
        filepath = self.raw_data_dir / filename

        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            return {"error": f"File not found: {filename}"}

        logger.info(f"Examining Excel file: {filename}")

        try:
            # Load the Excel file
            excel_file = pd.ExcelFile(filepath)
            sheets = excel_file.sheet_names

            file_info = {
                "filename": filename,
                "filepath": str(filepath),
                "file_size": filepath.stat().st_size,
                "total_sheets": len(sheets),
                "sheets": {}
            }

            # Examine each sheet
            for sheet_name in sheets:
                logger.info(f"  Examining sheet: {sheet_name}")

                try:
                    df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)

                    sheet_info = {
                        "sheet_name": sheet_name,
                        "shape": df.shape,
                        "columns": df.shape[1],
                        "rows": df.shape[0],
                        "memory_usage": df.memory_usage(deep=True).sum(),
                        "data_types": self._analyze_data_types(df),
                        "sample_data": self._get_sample_data(df),
                        "header_analysis": self._analyze_headers(df),
                        "content_preview": self._get_content_preview(df)
                    }

                    file_info["sheets"][sheet_name] = sheet_info

                except Exception as e:
                    logger.error(f"Error examining sheet {sheet_name}: {str(e)}")
                    file_info["sheets"][sheet_name] = {
                        "error": str(e),
                        "shape": "unknown"
                    }

            return file_info

        except Exception as e:
            logger.error(f"Error examining file {filename}: {str(e)}")
            return {"error": str(e)}

    def _analyze_data_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data types in the dataframe."""
        try:
            # Convert to string for analysis
            str_df = df.astype(str)

            analysis = {
                "numeric_count": 0,
                "text_count": 0,
                "empty_count": 0,
                "mixed_count": 0
            }

            for col in str_df.columns:
                col_data = str_df[col]

                # Check for numeric patterns
                numeric_pattern = r'^-?\d+\.?\d*$'
                numeric_mask = col_data.str.match(numeric_pattern)

                # Check for empty/null values
                empty_mask = col_data.isin(['nan', 'None', ''])

                numeric_count = numeric_mask.sum()
                empty_count = empty_mask.sum()
                total_count = len(col_data)

                if empty_count == total_count:
                    analysis["empty_count"] += 1
                elif numeric_count == total_count - empty_count:
                    analysis["numeric_count"] += 1
                elif numeric_count == 0:
                    analysis["text_count"] += 1
                else:
                    analysis["mixed_count"] += 1

            return analysis

        except Exception as e:
            return {"error": str(e)}

    def _get_sample_data(self, df: pd.DataFrame, max_rows: int = 5) -> List[List]:
        """Get sample data from the dataframe."""
        try:
            return df.head(max_rows).values.tolist()
        except:
            return []

    def _analyze_headers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze potential header rows."""
        try:
            analysis = {
                "potential_header_rows": [],
                "header_candidates": []
            }

            # Look for rows that might be headers (text-heavy rows)
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
                    if text_ratio > 0.7:  # More than 70% text
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
                "last_few_values": [],
                "unique_values_count": {},
                "potential_data_starts": []
            }

            # Get first few non-empty values
            for col in df.columns:
                col_data = df[col].dropna()
                if len(col_data) > 0:
                    preview["first_few_values"].extend([str(x) for x in col_data.head(3).tolist()])

                # Count unique values
                unique_count = df[col].nunique()
                preview["unique_values_count"][f"col_{col}"] = unique_count

            # Look for where actual data might start
            for i, row in df.iterrows():
                non_empty_count = row.notna().sum()
                if non_empty_count > df.shape[1] * 0.5:  # More than half the row is filled
                    preview["potential_data_starts"].append({
                        "row_index": int(i),
                        "filled_cells": int(non_empty_count)
                    })

            return preview

        except Exception as e:
            return {"error": str(e)}

    def examine_both_files(self) -> Dict[str, Any]:
        """Examine both 2024Q4 and 2025Q1 Excel files."""
        files_to_examine = [
            "2025Q1_Trade_report_annexTables.xlsx"
        ]

        results = {}

        for filename in files_to_examine:
            logger.info(f"Examining {filename}")
            file_info = self.examine_excel_file(filename)
            results[filename] = file_info
            self.examination_results["files_examined"].append(filename)

        # Create summary
        self._create_summary(results)
        self.examination_results["detailed_results"] = results

        return self.examination_results

    def _create_summary(self, results: Dict[str, Any]) -> None:
        """Create a summary of the examination results."""
        summary = {
            "total_files": len(results),
            "total_sheets": 0,
            "common_sheets": [],
            "unique_sheets": [],
            "file_sizes": {},
            "data_characteristics": {}
        }

        all_sheets = set()

        for filename, file_info in results.items():
            if "error" not in file_info:
                summary["total_sheets"] += file_info["total_sheets"]
                summary["file_sizes"][filename] = file_info["file_size"]

                # Collect all sheet names
                file_sheets = set(file_info["sheets"].keys())
                all_sheets.update(file_sheets)

                # Analyze data characteristics
                for sheet_name, sheet_info in file_info["sheets"].items():
                    if "error" not in sheet_info:
                        # This would be expanded based on what we find
                        pass

        # For single file, all sheets are unique to that file
        result_files = list(results.keys())
        if len(result_files) >= 1:
            file_sheets = set(results[result_files[0]]["sheets"].keys()) if "error" not in results[result_files[0]] else set()

        summary["common_sheets"] = []
        summary["unique_sheets"] = {
            "2025q1_only": list(file_sheets)
        }

        self.examination_results["summary"] = summary

    def save_results(self, output_path: str = "data/processed/excel_examination_results.json") -> None:
        """Save the examination results to a JSON file."""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.examination_results, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"Examination results saved to {output_file}")

def main():
    """Main function to examine both Excel files."""
    try:
        examiner = ExcelFileExaminer()
        results = examiner.examine_both_files()

        # Save results
        examiner.save_results()

        # Print summary to console
        print("\n" + "="*80)
        print("EXCEL FILES EXAMINATION SUMMARY")
        print("="*80)

        summary = results["summary"]
        print(f"Total files examined: {summary['total_files']}")
        print(f"Total sheets found: {summary['total_sheets']}")
        print(f"Common sheets: {', '.join(summary['common_sheets'])}")

        if summary["unique_sheets"]["2025q1_only"]:
            print(f"2025Q1 sheets: {', '.join(summary['unique_sheets']['2025q1_only'])}")

        print(f"\nDetailed results saved to: data/processed/excel_examination_results.json")
        print("="*80)

        return results

    except Exception as e:
        logger.error(f"Examination failed: {str(e)}")
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    main()