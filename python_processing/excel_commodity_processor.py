import pandas as pd
import json
import os
from datetime import datetime

class ExcelCommodityProcessor:
    def __init__(self, input_file, output_dir="data/processed"):
        self.input_file = input_file
        self.output_dir = output_dir
        self.sheets_to_process = [
            "ExportsCommodity",
            "ImportsCommodity",
            "Regional blocks",
            "ReexportsCommodity"
        ]

    def read_excel_file(self):
        """Read the Excel file and return a dictionary of DataFrames for each sheet"""
        try:
            excel_file = pd.ExcelFile(self.input_file)
            print(f"Available sheets: {excel_file.sheet_names}")

            sheet_data = {}
            for sheet_name in self.sheets_to_process:
                if sheet_name in excel_file.sheet_names:
                    print(f"Processing sheet: {sheet_name}")
                    df = pd.read_excel(self.input_file, sheet_name=sheet_name)
                    sheet_data[sheet_name] = df
                else:
                    print(f"Warning: Sheet '{sheet_name}' not found in Excel file")

            return sheet_data
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return None

    def process_commodity_data(self, df, sheet_name):
        """Process commodity data from a DataFrame"""
        try:
            # Skip empty rows and metadata
            df = df.dropna(how='all')

            # Find the header row (usually contains "Year and Period" or similar)
            header_row = None
            for idx, row in df.iterrows():
                if pd.notna(row.iloc[0]) and 'Year' in str(row.iloc[0]):
                    header_row = idx
                    break
                elif pd.notna(row.iloc[0]) and 'SITC' in str(row.iloc[0]):
                    header_row = idx
                    break

            if header_row is None:
                print(f"Could not find header row for {sheet_name}")
                return []

            # Get data starting from header row
            data_df = df.iloc[header_row:].copy()
            data_df.columns = data_df.iloc[0]  # Set first row as column names
            data_df = data_df.iloc[1:].reset_index(drop=True)  # Remove header row from data

            # Clean column names
            data_df.columns = [str(col).strip() for col in data_df.columns]

            processed_data = []
            for _, row in data_df.iterrows():
                if pd.isna(row.iloc[0]) or 'Source:' in str(row.iloc[0]):
                    continue  # Skip metadata rows

                try:
                    record = {
                        "data_source": "2025Q1",
                        "sheet_name": sheet_name
                    }

                    # Handle different sheet structures
                    if sheet_name in ["ExportsCommodity", "ImportsCommodity", "ReexportsCommodity"]:
                        # These sheets have SITC codes and descriptions
                        if len(row) >= 2:
                            record["sitc_section"] = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                            record["commodity_description"] = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""

                            # Add quarterly data
                            for i in range(2, len(row)):
                                if i < len(data_df.columns):
                                    col_name = str(data_df.columns[i]).strip()
                                    if col_name and pd.notna(row.iloc[i]):
                                        record[col_name] = float(row.iloc[i]) if self.is_numeric(row.iloc[i]) else str(row.iloc[i])

                    elif sheet_name == "Regional blocks":
                        # Regional blocks sheet structure
                        if len(row) >= 2:
                            record["partner"] = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                            record["flow"] = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""

                            # Add quarterly data
                            for i in range(2, len(row)):
                                if i < len(data_df.columns):
                                    col_name = str(data_df.columns[i]).strip()
                                    if col_name and pd.notna(row.iloc[i]):
                                        record[col_name] = float(row.iloc[i]) if self.is_numeric(row.iloc[i]) else str(row.iloc[i])

                    processed_data.append(record)

                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue

            return processed_data

        except Exception as e:
            print(f"Error processing {sheet_name}: {e}")
            return []

    def is_numeric(self, value):
        """Check if a value is numeric"""
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False

    def save_json_file(self, data, filename):
        """Save data to JSON file"""
        try:
            os.makedirs(self.output_dir, exist_ok=True)
            filepath = os.path.join(self.output_dir, filename)

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"Successfully saved {len(data)} records to {filepath}")
            return True
        except Exception as e:
            print(f"Error saving {filename}: {e}")
            return False

    def process_all_sheets(self):
        """Process all specified sheets and save to JSON files"""
        print(f"Processing Excel file: {self.input_file}")

        # Read the Excel file
        sheet_data = self.read_excel_file()
        if not sheet_data:
            return False

        all_processed_data = {}

        # Process each sheet
        for sheet_name, df in sheet_data.items():
            print(f"\nProcessing {sheet_name}...")
            processed_data = self.process_commodity_data(df, sheet_name)

            if processed_data:
                # Save individual sheet data
                filename = f"{sheet_name.lower().replace(' ', '_')}_data.json"
                self.save_json_file(processed_data, filename)

                all_processed_data[sheet_name] = processed_data
                print(f"Processed {len(processed_data)} records from {sheet_name}")
            else:
                print(f"No data processed from {sheet_name}")

        # Save combined data
        if all_processed_data:
            combined_filename = "combined_commodity_data.json"
            self.save_json_file(all_processed_data, combined_filename)

            # Save summary
            summary = {
                "processed_at": datetime.now().isoformat(),
                "source_file": self.input_file,
                "sheets_processed": list(all_processed_data.keys()),
                "total_records": sum(len(data) for data in all_processed_data.values()),
                "records_by_sheet": {sheet: len(data) for sheet, data in all_processed_data.items()}
            }

            summary_filename = "commodity_processing_summary.json"
            self.save_json_file(summary, summary_filename)

        return True

def main():
    """Main function to process the Excel file"""
    input_file = "data/raw/2025Q1_Trade_report_annexTables.xlsx"
    output_dir = "data/processed"

    processor = ExcelCommodityProcessor(input_file, output_dir)
    success = processor.process_all_sheets()

    if success:
        print("\n✅ Commodity data processing completed successfully!")
        print(f"Output directory: {output_dir}")
    else:
        print("\n❌ Commodity data processing failed!")

    return success

if __name__ == "__main__":
    main()