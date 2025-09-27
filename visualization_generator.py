#!/usr/bin/env python3
"""
Rwanda Export Explorer - Visualization Generator
Generates comprehensive visualizations for Rwanda trade data analysis
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

# Set plotting style
sns.set_style('whitegrid')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

class RwandaTradeVisualizer:
    """
    Comprehensive visualization generator for Rwanda trade data
    """

    def __init__(self, data_dict):
        """
        Initialize with cleaned data dictionary

        Parameters:
        - data_dict: Dictionary containing cleaned DataFrames from all sheets
        """
        self.data = data_dict
        self.output_dir = "data/processed/visualizations/"

        # Create output directory if it doesn't exist
        import os
        os.makedirs(self.output_dir, exist_ok=True)

        print("🎨 Rwanda Trade Visualizer initialized")
        print(f"📁 Output directory: {self.output_dir}")

    def create_overall_trade_dashboard(self):
        """
        Create comprehensive dashboard for overall trade analysis
        """
        if 'Graph Overall' not in self.data:
            print("❌ Graph Overall data not available")
            return

        overall_df = self.data['Graph Overall']

        # Create comprehensive dashboard
        fig = make_subplots(
            rows=4, cols=2,
            subplot_titles=(
                'Trade Volume Trends (2022-2024)',
                'Trade Balance Analysis',
                'Export vs Import Growth Rates',
                'Quarterly Trade Distribution',
                'Trade Components Breakdown',
                'Year-over-Year Growth Trends'
            ),
            specs=[
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"secondary_y": False}, {"secondary_y": False}]
            ]
        )

        # 1. Trade Volume Trends
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['exports'],
                mode='lines+markers',
                name='Exports',
                line=dict(color='#2E86AB', width=3),
                marker=dict(size=6)
            ),
            row=1, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['imports'],
                mode='lines+markers',
                name='Imports',
                line=dict(color='#A23B72', width=3),
                marker=dict(size=6)
            ),
            row=1, col=1
        )

        # 2. Trade Balance
        colors = ['red' if x < 0 else 'green' for x in overall_df['trade_balance']]
        fig.add_trace(
            go.Bar(
                x=overall_df['period'],
                y=overall_df['trade_balance'],
                name='Trade Balance',
                marker_color=colors
            ),
            row=1, col=2
        )

        # 3. Growth Rates
        growth_df = overall_df.copy()
        growth_df['export_growth'] = growth_df['exports'].pct_change() * 100
        growth_df['import_growth'] = growth_df['imports'].pct_change() * 100

        fig.add_trace(
            go.Scatter(
                x=growth_df['period'][1:],
                y=growth_df['export_growth'][1:],
                mode='lines+markers',
                name='Export Growth %',
                line=dict(color='#F18F01', width=2)
            ),
            row=2, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=growth_df['period'][1:],
                y=growth_df['import_growth'][1:],
                mode='lines+markers',
                name='Import Growth %',
                line=dict(color='#C73E1D', width=2)
            ),
            row=2, col=1
        )

        # 4. Quarterly Distribution
        latest_year = overall_df.iloc[-4:]
        fig.add_trace(
            go.Pie(
                labels=['Exports', 'Imports', 'Re-exports'],
                values=[latest_year['exports'].sum(), latest_year['imports'].sum(), latest_year['reexports'].sum()],
                name='Trade Distribution',
                marker_colors=['#2E86AB', '#A23B72', '#F18F01']
            ),
            row=2, col=2
        )

        # 5. Trade Components
        latest_data = overall_df.iloc[-1]
        fig.add_trace(
            go.Bar(
                x=['Domestic Exports', 'Re-exports', 'Imports'],
                y=[latest_data['exports'], latest_data['reexports'], latest_data['imports']],
                name='Trade Components',
                marker_color=['#2E86AB', '#F18F01', '#A23B72']
            ),
            row=3, col=1
        )

        # 6. Year-over-Year Growth
        yearly_export_growth = []
        yearly_import_growth = []
        years = []

        for i in range(4, len(overall_df), 4):
            year_exports = overall_df.iloc[i-4:i]['exports'].sum()
            year_imports = overall_df.iloc[i-4:i]['imports'].sum()

            if i >= 8:
                prev_year_exports = overall_df.iloc[i-8:i-4]['exports'].sum()
                prev_year_imports = overall_df.iloc[i-8:i-4]['imports'].sum()

                export_yoy = ((year_exports - prev_year_exports) / prev_year_exports) * 100 if prev_year_exports != 0 else 0
                import_yoy = ((year_imports - prev_year_imports) / prev_year_imports) * 100 if prev_year_imports != 0 else 0

                yearly_export_growth.append(export_yoy)
                yearly_import_growth.append(import_yoy)
                years.append(f"{2021 + (i//4)}")

        fig.add_trace(
            go.Scatter(
                x=years,
                y=yearly_export_growth,
                mode='lines+markers',
                name='Export YoY Growth %',
                line=dict(color='#2E86AB', width=3)
            ),
            row=3, col=2
        )

        fig.add_trace(
            go.Scatter(
                x=years,
                y=yearly_import_growth,
                mode='lines+markers',
                name='Import YoY Growth %',
                line=dict(color='#A23B72', width=3)
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            height=1600,
            title_text="Rwanda Overall Trade Analysis Dashboard (2022-2024)",
            title_x=0.5,
            showlegend=True
        )

        # Update x-axis labels
        for i in range(1, 5):
            for j in range(1, 3):
                fig.update_xaxes(tickangle=45, row=i, col=j)

        # Save the figure
        output_file = f"{self.output_dir}overall_trade_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Overall trade dashboard saved to: {output_file}")

        return fig

    def create_regional_analysis_dashboard(self):
        """
        Create comprehensive regional trade analysis dashboard
        """
        if 'EAC' not in self.data:
            print("❌ EAC data not available")
            return

        eac_df = self.data['EAC']

        # Create regional analysis dashboard
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=(
                'EAC Trade Volume by Country (Q4 2024)',
                'EAC Market Share Distribution',
                'EAC Year-over-Year Growth Analysis',
                'EAC Trade Trends (2022-2024)'
            ),
            specs=[
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "scatter"}]
            ]
        )

        # Sort EAC countries by trade volume
        eac_sorted = eac_df.sort_values('q4_2024', ascending=True)

        # 1. EAC Trade Volume
        fig.add_trace(
            go.Bar(
                x=eac_sorted['q4_2024'],
                y=eac_sorted['country'],
                orientation='h',
                name='Trade Volume',
                marker_color='#2E86AB'
            ),
            row=1, col=1
        )

        # 2. EAC Market Share
        fig.add_trace(
            go.Pie(
                labels=eac_sorted['country'],
                values=eac_sorted['share_q4'],
                name='Market Share',
                textinfo='label+percent',
                textposition='inside'
            ),
            row=1, col=2
        )

        # 3. EAC Growth Analysis
        eac_df['yoy_growth'] = ((eac_df['q4_2024'] - eac_df['q4_2023']) / eac_df['q4_2023']) * 100
        growth_sorted = eac_df.sort_values('yoy_growth', ascending=True)
        colors = ['red' if x < 0 else 'green' for x in growth_sorted['yoy_growth']]

        fig.add_trace(
            go.Bar(
                x=growth_sorted['yoy_growth'],
                y=growth_sorted['country'],
                orientation='h',
                name='YoY Growth %',
                marker_color=colors
            ),
            row=2, col=1
        )

        # 4. EAC Trade Trends
        quarters = ['q1_2022', 'q2_2022', 'q3_2022', 'q4_2022',
                   'q1_2023', 'q2_2023', 'q3_2023', 'q4_2023',
                   'q1_2024', 'q2_2024', 'q3_2024', 'q4_2024']

        quarterly_totals = []
        for quarter in quarters:
            total = eac_df[quarter].sum()
            quarterly_totals.append(total)

        fig.add_trace(
            go.Scatter(
                x=quarters,
                y=quarterly_totals,
                mode='lines+markers',
                name='Total EAC Trade',
                line=dict(color='#F18F01', width=3),
                marker=dict(size=6)
            ),
            row=2, col=2
        )

        # Update layout
        fig.update_layout(
            height=1000,
            title_text="East African Community (EAC) Trade Analysis Dashboard",
            title_x=0.5,
            showlegend=True
        )

        # Update x-axis labels
        fig.update_xaxes(tickangle=45, row=2, col=2)

        # Save the figure
        output_file = f"{self.output_dir}regional_analysis_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Regional analysis dashboard saved to: {output_file}")

        return fig

    def create_commodity_analysis_dashboard(self):
        """
        Create comprehensive commodity analysis dashboard
        """
        if not all(sheet in self.data for sheet in ['ExportsCommodity', 'ImportsCommodity', 'ReexportsCommodity']):
            print("❌ Commodity data not available")
            return

        export_comm = self.data['ExportsCommodity']
        import_comm = self.data['ImportsCommodity']
        reexport_comm = self.data['ReexportsCommodity']

        # Create commodity analysis dashboard
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=(
                'Top Export Commodities (Q4 2024)',
                'Export Commodities by SITC Section',
                'Top Import Commodities (Q4 2024)',
                'Import Commodities by SITC Section',
                'Top Re-export Commodities',
                'Commodity Trade Comparison'
            ),
            specs=[
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "bar"}]
            ]
        )

        # 1. Top Export Commodities
        top_export_comm = export_comm.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_export_comm['q4_2024'],
                y=top_export_comm['description'],
                orientation='h',
                name='Export Volume',
                marker_color='#2E86AB'
            ),
            row=1, col=1
        )

        # 2. Export Commodities by SITC Section
        export_sitc = export_comm.groupby('sitc_section')['q4_2024'].sum().sort_values(ascending=True)
        sitc_labels = [f'SITC {sitc}' for sitc in export_sitc.index]

        fig.add_trace(
            go.Bar(
                x=export_sitc.values,
                y=sitc_labels,
                orientation='h',
                name='Export by SITC',
                marker_color='#2E86AB'
            ),
            row=1, col=2
        )

        # 3. Top Import Commodities
        top_import_comm = import_comm.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_import_comm['q4_2024'],
                y=top_import_comm['description'],
                orientation='h',
                name='Import Volume',
                marker_color='#A23B72'
            ),
            row=2, col=1
        )

        # 4. Import Commodities by SITC Section
        import_sitc = import_comm.groupby('sitc_section')['q4_2024'].sum().sort_values(ascending=True)
        import_sitc_labels = [f'SITC {sitc}' for sitc in import_sitc.index]

        fig.add_trace(
            go.Bar(
                x=import_sitc.values,
                y=import_sitc_labels,
                orientation='h',
                name='Import by SITC',
                marker_color='#A23B72'
            ),
            row=2, col=2
        )

        # 5. Top Re-export Commodities
        top_reexport_comm = reexport_comm.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_reexport_comm['q4_2024'],
                y=top_reexport_comm['description'],
                orientation='h',
                name='Re-export Volume',
                marker_color='#F18F01'
            ),
            row=3, col=1
        )

        # 6. Commodity Trade Comparison
        export_val = top_export_comm.iloc[0]['q4_2024']
        import_val = top_import_comm.iloc[0]['q4_2024']
        reexport_val = top_reexport_comm.iloc[0]['q4_2024']

        fig.add_trace(
            go.Bar(
                x=['Top Export', 'Top Import', 'Top Re-export'],
                y=[export_val, import_val, reexport_val],
                name='Top Commodity Comparison',
                marker_color=['#2E86AB', '#A23B72', '#F18F01']
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            height=1200,
            title_text="Rwanda Commodity Trade Analysis Dashboard (Q4 2024)",
            title_x=0.5,
            showlegend=True
        )

        # Save the figure
        output_file = f"{self.output_dir}commodity_analysis_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Commodity analysis dashboard saved to: {output_file}")

        return fig

    def create_country_analysis_dashboard(self):
        """
        Create comprehensive country analysis dashboard
        """
        if not all(sheet in self.data for sheet in ['ExportCountry', 'ImportCountry', 'ReexportsCountry']):
            print("❌ Country data not available")
            return

        export_df = self.data['ExportCountry']
        import_df = self.data['ImportCountry']
        reexport_df = self.data['ReexportsCountry']

        # Create country analysis dashboard
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=(
                'Top Export Destinations (Q4 2024)',
                'Export Market Share Distribution',
                'Top Import Sources (Q4 2024)',
                'Import Source Distribution',
                'Top Re-export Destinations',
                'Trade Partner Comparison'
            ),
            specs=[
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "bar"}]
            ]
        )

        # 1. Top Export Destinations
        top_exports = export_df.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_exports['q4_2024'],
                y=top_exports['country'],
                orientation='h',
                name='Export Volume',
                marker_color='#2E86AB'
            ),
            row=1, col=1
        )

        # 2. Export Market Share
        fig.add_trace(
            go.Pie(
                labels=top_exports['country'],
                values=top_exports['share_q4'],
                name='Export Share',
                textinfo='label+percent',
                textposition='inside'
            ),
            row=1, col=2
        )

        # 3. Top Import Sources
        top_imports = import_df.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_imports['q4_2024'],
                y=top_imports['country'],
                orientation='h',
                name='Import Volume',
                marker_color='#A23B72'
            ),
            row=2, col=1
        )

        # 4. Import Source Distribution
        fig.add_trace(
            go.Pie(
                labels=top_imports['country'],
                values=top_imports['share_q4'],
                name='Import Share',
                textinfo='label+percent',
                textposition='inside'
            ),
            row=2, col=2
        )

        # 5. Top Re-export Destinations
        top_reexports = reexport_df.nlargest(10, 'q4_2024')
        fig.add_trace(
            go.Bar(
                x=top_reexports['q4_2024'],
                y=top_reexports['country'],
                orientation='h',
                name='Re-export Volume',
                marker_color='#F18F01'
            ),
            row=3, col=1
        )

        # 6. Trade Partner Comparison
        export_val = top_exports.iloc[0]['q4_2024']
        import_val = top_imports.iloc[0]['q4_2024']
        reexport_val = top_reexports.iloc[0]['q4_2024']

        fig.add_trace(
            go.Bar(
                x=['Top Export', 'Top Import', 'Top Re-export'],
                y=[export_val, import_val, reexport_val],
                name='Top Partner Comparison',
                marker_color=['#2E86AB', '#A23B72', '#F18F01']
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            height=1200,
            title_text="Rwanda Country-Specific Trade Analysis Dashboard (Q4 2024)",
            title_x=0.5,
            showlegend=True
        )

        # Save the figure
        output_file = f"{self.output_dir}country_analysis_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Country analysis dashboard saved to: {output_file}")

        return fig

    def create_trend_analysis_dashboard(self):
        """
        Create comprehensive trend analysis dashboard
        """
        if 'Graph Overall' not in self.data:
            print("❌ Trend analysis data not available")
            return

        overall_df = self.data['Graph Overall']

        # Calculate moving averages and trends
        overall_df['export_ma_4'] = overall_df['exports'].rolling(window=4).mean()
        overall_df['import_ma_4'] = overall_df['imports'].rolling(window=4).mean()
        overall_df['trade_balance_ma_4'] = overall_df['trade_balance'].rolling(window=4).mean()
        overall_df['export_yoy'] = overall_df['exports'].pct_change(periods=4) * 100
        overall_df['import_yoy'] = overall_df['imports'].pct_change(periods=4) * 100

        # Create trend analysis dashboard
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=(
                'Trade Volume Trends with Moving Averages',
                'Trade Balance Trend Analysis',
                'Year-over-Year Growth Rates',
                'Volatility Analysis',
                'Export vs Import Ratio',
                'Forecasting Model'
            ),
            specs=[
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"secondary_y": False}, {"secondary_y": False}]
            ]
        )

        # 1. Trade Volume Trends with Moving Averages
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['exports'],
                mode='lines+markers',
                name='Exports',
                line=dict(color='#2E86AB', width=2)
            ),
            row=1, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['export_ma_4'],
                mode='lines',
                name='Export MA (4Q)',
                line=dict(color='#2E86AB', width=4, dash='dash')
            ),
            row=1, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['imports'],
                mode='lines+markers',
                name='Imports',
                line=dict(color='#A23B72', width=2)
            ),
            row=1, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['import_ma_4'],
                mode='lines',
                name='Import MA (4Q)',
                line=dict(color='#A23B72', width=4, dash='dash')
            ),
            row=1, col=1
        )

        # 2. Trade Balance Trend
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['trade_balance'],
                mode='lines+markers',
                name='Trade Balance',
                line=dict(color='#F18F01', width=3),
                fill='tozeroy',
                fillcolor='rgba(241, 143, 1, 0.3)'
            ),
            row=1, col=2
        )

        # 3. Year-over-Year Growth Rates
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'][4:],
                y=overall_df['export_yoy'][4:],
                mode='lines+markers',
                name='Export YoY Growth %',
                line=dict(color='#2E86AB', width=2)
            ),
            row=2, col=1
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'][4:],
                y=overall_df['import_yoy'][4:],
                mode='lines+markers',
                name='Import YoY Growth %',
                line=dict(color='#A23B72', width=2)
            ),
            row=2, col=1
        )

        # 4. Volatility Analysis
        export_vol = overall_df['exports'].rolling(window=4).std()
        import_vol = overall_df['imports'].rolling(window=4).std()

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'][3:],
                y=export_vol[3:],
                mode='lines',
                name='Export Volatility',
                line=dict(color='#2E86AB', width=2)
            ),
            row=2, col=2
        )

        fig.add_trace(
            go.Scatter(
                x=overall_df['period'][3:],
                y=import_vol[3:],
                mode='lines',
                name='Import Volatility',
                line=dict(color='#A23B72', width=2)
            ),
            row=2, col=2
        )

        # 5. Export vs Import Ratio
        export_import_ratio = overall_df['exports'] / overall_df['imports'] * 100
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=export_import_ratio,
                mode='lines+markers',
                name='Export/Import Ratio %',
                line=dict(color='#C73E1D', width=3)
            ),
            row=3, col=1
        )

        # 6. Simple Forecasting (placeholder)
        fig.add_trace(
            go.Scatter(
                x=overall_df['period'],
                y=overall_df['exports'],
                mode='markers',
                name='Actual Exports',
                marker=dict(color='#2E86AB', size=6)
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            height=1200,
            title_text="Rwanda Trade Trend Analysis Dashboard (2022-2024)",
            title_x=0.5,
            showlegend=True
        )

        # Update x-axis labels
        for i in range(1, 4):
            for j in range(1, 3):
                fig.update_xaxes(tickangle=45, row=i, col=j)

        # Save the figure
        output_file = f"{self.output_dir}trend_analysis_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Trend analysis dashboard saved to: {output_file}")

        return fig

    def create_insights_dashboard(self, insights, recommendations):
        """
        Create insights and recommendations dashboard
        """
        # Categorize insights by type
        insight_types = {}
        for insight in insights:
            insight_type = insight['type']
            if insight_type not in insight_types:
                insight_types[insight_type] = 0
            insight_types[insight_type] += 1

        # Categorize recommendations by priority
        priority_counts = {}
        for rec in recommendations:
            priority = rec['priority']
            if priority not in priority_counts:
                priority_counts[priority] = 0
            priority_counts[priority] += 1

        # Create insights dashboard
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=(
                'Insights by Category',
                'Insights by Type',
                'Recommendations by Priority',
                'Action Items Summary'
            ),
            specs=[
                [{"type": "bar"}, {"type": "pie"}],
                [{"type": "bar"}, {"type": "table"}]
            ]
        )

        # 1. Insights by Category
        categories = [insight['category'] for insight in insights]
        category_counts = {}
        for cat in categories:
            if cat not in category_counts:
                category_counts[cat] = 0
            category_counts[cat] += 1

        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)

        fig.add_trace(
            go.Bar(
                x=[cat[1] for cat in sorted_categories],
                y=[cat[0] for cat in sorted_categories],
                orientation='h',
                name='Insights by Category',
                marker_color='#2E86AB'
            ),
            row=1, col=1
        )

        # 2. Insights by Type
        fig.add_trace(
            go.Pie(
                labels=list(insight_types.keys()),
                values=list(insight_types.values()),
                name='Insights by Type',
                textinfo='label+value',
                textposition='inside'
            ),
            row=1, col=2
        )

        # 3. Recommendations by Priority
        fig.add_trace(
            go.Bar(
                x=list(priority_counts.values()),
                y=list(priority_counts.keys()),
                orientation='h',
                name='Recommendations by Priority',
                marker_color=['#F18F01' if p == 'High' else '#2E86AB' if p == 'Medium' else '#A23B72' for p in priority_counts.keys()]
            ),
            row=2, col=1
        )

        # 4. Action Items Summary
        total_actions = sum(len(rec['actions']) for rec in recommendations)
        high_priority_actions = sum(len(rec['actions']) for rec in recommendations if rec['priority'] == 'High')
        medium_priority_actions = sum(len(rec['actions']) for rec in recommendations if rec['priority'] == 'Medium')

        summary_data = [
            ['Total Recommendations', len(recommendations)],
            ['Total Action Items', total_actions],
            ['High Priority Actions', high_priority_actions],
            ['Medium Priority Actions', medium_priority_actions],
            ['Insights Generated', len(insights)]
        ]

        fig.add_trace(
            go.Table(
                header=dict(values=['Metric', 'Value']),
                cells=dict(values=list(zip(*summary_data)))
            ),
            row=2, col=2
        )

        # Update layout
        fig.update_layout(
            height=800,
            title_text="Rwanda Trade Analysis - Insights Dashboard",
            title_x=0.5,
            showlegend=False
        )

        # Save the figure
        output_file = f"{self.output_dir}insights_dashboard.html"
        fig.write_html(output_file)
        print(f"✅ Insights dashboard saved to: {output_file}")

        return fig

    def generate_all_visualizations(self, insights=None, recommendations=None):
        """
        Generate all visualization dashboards
        """
        print("🎨 Generating comprehensive visualization suite...")

        # Generate all dashboards
        dashboards = {}

        try:
            dashboards['overall'] = self.create_overall_trade_dashboard()
            print("✅ Overall trade dashboard completed")
        except Exception as e:
            print(f"❌ Error creating overall dashboard: {str(e)}")

        try:
            dashboards['regional'] = self.create_regional_analysis_dashboard()
            print("✅ Regional analysis dashboard completed")
        except Exception as e:
            print(f"❌ Error creating regional dashboard: {str(e)}")

        try:
            dashboards['commodity'] = self.create_commodity_analysis_dashboard()
            print("✅ Commodity analysis dashboard completed")
        except Exception as e:
            print(f"❌ Error creating commodity dashboard: {str(e)}")

        try:
            dashboards['country'] = self.create_country_analysis_dashboard()
            print("✅ Country analysis dashboard completed")
        except Exception as e:
            print(f"❌ Error creating country dashboard: {str(e)}")

        try:
            dashboards['trends'] = self.create_trend_analysis_dashboard()
            print("✅ Trend analysis dashboard completed")
        except Exception as e:
            print(f"❌ Error creating trend dashboard: {str(e)}")

        if insights and recommendations:
            try:
                dashboards['insights'] = self.create_insights_dashboard(insights, recommendations)
                print("✅ Insights dashboard completed")
            except Exception as e:
                print(f"❌ Error creating insights dashboard: {str(e)}")

        print(f"\n📊 Visualization Summary:")
        print(f"   Total dashboards created: {len(dashboards)}")
        print(f"   Output directory: {self.output_dir}")
        print(f"   File format: HTML (interactive)")

        return dashboards

def main():
    """
    Main function to run the visualization generator
    """
    print("🚀 Rwanda Trade Data Visualization Generator")
    print("=" * 50)

    # This would typically load data from the comprehensive analysis
    # For now, we'll create a placeholder
    print("📝 Note: This script requires cleaned data from the comprehensive analysis")
    print("🔄 Please run the comprehensive_rwanda_trade_analysis.ipynb notebook first")

    print("\n✅ Visualization generator loaded successfully")
    print("📋 Available methods:")
    print("   - generate_all_visualizations()")
    print("   - create_overall_trade_dashboard()")
    print("   - create_regional_analysis_dashboard()")
    print("   - create_commodity_analysis_dashboard()")
    print("   - create_country_analysis_dashboard()")
    print("   - create_trend_analysis_dashboard()")
    print("   - create_insights_dashboard()")

if __name__ == "__main__":
    main()   