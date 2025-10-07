#!/usr/bin/env python3
"""
Project Cleanup and Optimization Script
Removes unnecessary files and optimizes project structure
"""

import os
import shutil
from pathlib import Path

def cleanup_project():
    """Clean up and optimize the project structure."""

    project_root = Path(__file__).parent

    print("🧹 Starting project cleanup and optimization...")

    # Files to remove (log files, temporary files, duplicates)
    files_to_remove = [
        "python_processing/data_processing.log",
        "python_processing/enhanced_data_processing.log",
        "python_processing/excel_examination.log",
        "python_processing/export_analysis.log",
        "python_processing/pipeline.log",
        "python_processing/prediction.log",
        # Keep only the enhanced processor (remove basic data_processor.py if it exists)
        # "python_processing/data_processor.py",  # Keep this as backup
    ]

    # Remove specified files
    for file_path in files_to_remove:
        full_path = project_root / file_path
        if full_path.exists():
            try:
                full_path.unlink()
                print(f"✅ Removed: {file_path}")
            except Exception as e:
                print(f"❌ Error removing {file_path}: {e}")

    # Create optimized directory structure
    directories_to_create = [
        "data/processed",
        "data/raw",
        "models",
        "reports",
        "visualizations",
        "docs",
        "backend/routes",
        "backend/middleware",
        "backend/utils",
        "frontend/js",
        "frontend/css",
        "frontend/assets"
    ]

    for dir_path in directories_to_create:
        full_dir_path = project_root / dir_path
        full_dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created/verified directory: {dir_path}")

    # Create essential configuration files if they don't exist
    essential_files = {
        ".env.example": """# Environment Configuration
NODE_ENV=development
BACKEND_PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/rwanda_trade
DATA_RAW_PATH=data/raw
DATA_PROCESSED_PATH=data/processed
MODELS_DIR=models
""",
        "data/.gitkeep": "# This file keeps the data directory in git",
        "models/.gitkeep": "# This file keeps the models directory in git",
        "reports/.gitkeep": "# This file keeps the reports directory in git",
        "visualizations/.gitkeep": "# This file keeps the visualizations directory in git"
    }

    for file_path, content in essential_files.items():
        full_file_path = project_root / file_path
        if not full_file_path.exists():
            full_file_path.write_text(content)
            print(f"✅ Created: {file_path}")

    # Update .gitignore if needed
    gitignore_path = project_root / ".gitignore"
    if gitignore_path.exists():
        current_content = gitignore_path.read_text()
        additional_ignores = [
            "",
            "# Project specific",
            "*.log",
            "__pycache__/",
            "*.pyc",
            ".env",
            "node_modules/",
            ".DS_Store",
            "data/processed/*.json",
            "!data/processed/comprehensive_analysis.json",
            "!data/processed/analysis_report.json"
        ]

        for ignore in additional_ignores:
            if ignore and ignore not in current_content:
                current_content += ignore + "\n"

        gitignore_path.write_text(current_content)
        print("✅ Updated .gitignore")

    print("\n🎉 Project cleanup and optimization completed!")
    print("\n📋 Summary of optimizations:")
    print("   • Removed unnecessary log files")
    print("   • Created optimized directory structure")
    print("   • Added essential configuration files")
    print("   • Updated .gitignore for better project management")
    print("   • Maintained all essential functionality")

    print("\n🚀 Your Rwanda Export Analysis project is now optimized and ready!")

if __name__ == "__main__":
    cleanup_project()