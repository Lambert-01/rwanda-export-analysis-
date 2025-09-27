#!/usr/bin/env python3
"""
Rwanda Trade Analysis Dashboard
Comprehensive interactive dashboard with sidebar navigation
Created: 2025-09-25
"""

import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
from datetime import datetime
import json
import os
from pathlib import Path

# Initialize the Dash app with Bootstrap theme
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
server = app.server

# Load processed data
def load_processed_data():
    """Load all processed JSON data files"""
    data_dir = Path("data/processed")
    data_files = list(data_dir.glob("*.json"))

    if not data_files:
        # If no processed files exist, create sample data
        return create_sample_data()

    data_dict = {}
    for file_path in data_files:
        if file_path.name.startswith("sheet_"):
            sheet_name = file_path.name.replace("sheet_", "").replace(".json", "").replace("_", " ").title()
            try:
                df = pd.read_json(file_path, orient='records')
                data_dict[sheet_name] = df
            except:
                continue

    return data_dict

def create_sample_data():
    """Create sample data for demonstration if processed files don't exist"""
    # This would be replaced with actual processed data
    return {
        'Graph Overall': pd.DataFrame({
            'period': ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4'],
            'exports': [293.58, 331.55, 342.56, 354.84, 402.14, 484.74, 388.11, 399.11, 431.61, 537.64, 667.00, 677.45],
            'imports': [1034.54, 1348.03, 1481.22, 1281.21, 1476.51, 1571.09, 1581.81, 1486.93, 1410.52, 1568.97, 1751.57, 1629.39],
            'reexports': [150.66, 161.74, 201.15, 190.42, 156.25, 154.52, 173.00, 159.55, 173.17, 164.00, 184.56, 177.29],
            'total_trade': [1478.77, 1841.32, 2024.94, 1826.47, 2034.91, 2210.36, 2142.92, 2045.60, 2015.30, 2270.61, 2603.13, 2484.12],
            'trade_balance': [-590.31, -854.73, -937.51, -735.94, -918.11, -931.83, -1020.70, -928.27, -805.74, -867.33, -900.01, -774.66]
        })
    }

# Load data
processed_data = load_processed_data()

# Create the main dashboard layout
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("🇷🇼 Rwanda Trade Analysis Dashboard",
                   className="text-center mb-4",
                   style={'color': '#2E86AB', 'fontWeight': 'bold'}),
            html.Hr()
        ], width=12)
    ]),

    dbc.Row([
        # Sidebar
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("📊 Navigation",
                              style={'backgroundColor': '#2E86AB', 'color': 'white', 'fontWeight': 'bold'}),
                dbc.CardBody([
                    dbc.Nav([
                        dbc.NavLink("🏠 Overview", href="#", id="nav-overview", active=True),
                        dbc.NavLink("📈 Trade Trends", href="#", id="nav-trends"),
                        dbc.NavLink("🌍 Regional Analysis", href="#", id="nav-regional"),
                        dbc.NavLink("🇺🇳 Country Analysis", href="#", id="nav-country"),
                        dbc.NavLink("📦 Commodity Analysis", href="#", id="nav-commodity"),
                        dbc.NavLink("🔮 Forecasting", href="#", id="nav-forecasting"),
                        dbc.NavLink("📋 Summary Report", href="#", id="nav-summary"),
                    ], vertical=True, pills=True)
                ])
            ], className="mb-4"),

            dbc.Card([
                dbc.CardHeader("⚙️ Controls",
                              style={'backgroundColor': '#A23B72', 'color': 'white', 'fontWeight': 'bold'}),
                dbc.CardBody([
                    html.Label("Select Time Period:", className="fw-bold"),
                    dcc.RangeSlider(
                        id='time-period-slider',
                        min=0,
                        max=11,
                        value=[8, 11],  # Default to 2024
                        marks={i: f'Q{(i%4)+1} {2022+(i//4)}' for i in range(12)},
                        className="mb-3"
                    ),

                    html.Label("Chart Type:", className="fw-bold mt-3"),
                    dcc.Dropdown(
                        id='chart-type-dropdown',
                        options=[
                            {'label': 'Line Chart', 'value': 'line'},
                            {'label': 'Bar Chart', 'value': 'bar'},
                            {'label': 'Area Chart', 'value': 'area'},
                            {'label': 'Scatter Plot', 'value': 'scatter'}
                        ],
                        value='line',
                        className="mb-3"
                    ),

                    dbc.Button("🔄 Refresh Data", id="refresh-btn", color="primary", className="w-100")
                ])
            ])
        ], width=3, className="bg-light"),

        # Main content area
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    # Overview metrics
                    dbc.Row([
                        dbc.Col([
                            dbc.Card([
                                dbc.CardBody([
                                    html.H3("💰 Total Exports", className="card-title text-center"),
                                    html.H2(id="total-exports", className="text-center text-primary"),
                                    html.P("Q4 2024", className="text-center text-muted")
                                ])
                            ])
                        ], width=3),
                        dbc.Col([
                            dbc.Card([
                                dbc.CardBody([
                                    html.H3("📦 Total Imports", className="card-title text-center"),
                                    html.H2(id="total-imports", className="text-center text-danger"),
                                    html.P("Q4 2024", className="text-center text-muted")
                                ])
                            ])
                        ], width=3),
                        dbc.Col([
                            dbc.Card([
                                dbc.CardBody([
                                    html.H3("🔄 Trade Balance", className="card-title text-center"),
                                    html.H2(id="trade-balance", className="text-center text-warning"),
                                    html.P("Q4 2024", className="text-center text-muted")
                                ])
                            ])
                        ], width=3),
                        dbc.Col([
                            dbc.Card([
                                dbc.CardBody([
                                    html.H3("📈 Growth Rate", className="card-title text-center"),
                                    html.H2(id="growth-rate", className="text-center text-success"),
                                    html.P("QoQ Change", className="text-center text-muted")
                                ])
                            ])
                        ], width=3)
                    ], className="mb-4"),

                    # Main chart area
                    dbc.Row([
                        dbc.Col([
                            dcc.Graph(id="main-chart", style={'height': '600px'})
                        ], width=12)
                    ])
                ])
            ])
        ], width=9)
    ]),

    # Footer
    dbc.Row([
        dbc.Col([
            html.Hr(),
            html.P("© 2025 Rwanda Trade Analysis Dashboard | Data Source: NISR",
                  className="text-center text-muted")
        ], width=12)
    ])
], fluid=True)

# Callback functions
@app.callback(
    [Output("total-exports", "children"),
     Output("total-imports", "children"),
     Output("trade-balance", "children"),
     Output("growth-rate", "children")],
    [Input("time-period-slider", "value")]
)
def update_metrics(time_range):
    """Update key metrics based on selected time period"""
    if 'Graph Overall' not in processed_data:
        return "$0.00M", "$0.00M", "$0.00M", "0.00%"

    df = processed_data['Graph Overall']
    start_idx, end_idx = time_range

    # Get data for selected period
    selected_data = df.iloc[start_idx:end_idx+1]

    total_exports = selected_data['exports'].iloc[-1]
    total_imports = selected_data['imports'].iloc[-1]
    trade_balance = selected_data['trade_balance'].iloc[-1]

    # Calculate growth rate
    if len(selected_data) >= 2:
        prev_exports = selected_data['exports'].iloc[-2]
        growth_rate = ((total_exports - prev_exports) / prev_exports) * 100 if prev_exports != 0 else 0
    else:
        growth_rate = 0

    return f"${total_exports:.2f}M", f"${total_imports:.2f}M", f"${trade_balance:.2f}M", f"{growth_rate:.2f}%"

@app.callback(
    Output("main-chart", "figure"),
    [Input("nav-overview", "n_clicks"),
     Input("nav-trends", "n_clicks"),
     Input("nav-regional", "n_clicks"),
     Input("nav-country", "n_clicks"),
     Input("nav-commodity", "n_clicks"),
     Input("nav-forecasting", "n_clicks"),
     Input("nav-summary", "n_clicks"),
     Input("chart-type-dropdown", "value"),
     Input("time-period-slider", "value")]
)
def update_main_chart(nav_overview, nav_trends, nav_regional, nav_country, nav_commodity, nav_forecasting, nav_summary, chart_type, time_range):
    """Update main chart based on navigation and controls"""
    ctx = dash.callback_context
    if not ctx.triggered:
        return create_overview_chart(chart_type, time_range)

    button_id = ctx.triggered[0]['prop_id'].split('.')[0]

    if button_id == "nav-overview":
        return create_overview_chart(chart_type, time_range)
    elif button_id == "nav-trends":
        return create_trends_chart(chart_type, time_range)
    elif button_id == "nav-regional":
        return create_regional_chart(chart_type, time_range)
    elif button_id == "nav-country":
        return create_country_chart(chart_type, time_range)
    elif button_id == "nav-commodity":
        return create_commodity_chart(chart_type, time_range)
    elif button_id == "nav-forecasting":
        return create_forecasting_chart(chart_type, time_range)
    elif button_id == "nav-summary":
        return create_summary_chart(chart_type, time_range)
    else:
        return create_overview_chart(chart_type, time_range)

def create_overview_chart(chart_type, time_range):
    """Create overview chart with trade balance and volume"""
    if 'Graph Overall' not in processed_data:
        return go.Figure()

    df = processed_data['Graph Overall']
    start_idx, end_idx = time_range
    plot_df = df.iloc[start_idx:end_idx+1]

    if chart_type == 'line':
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=plot_df['period'], y=plot_df['exports'],
            mode='lines+markers', name='Exports',
            line=dict(color='#2E86AB', width=3)
        ))
        fig.add_trace(go.Scatter(
            x=plot_df['period'], y=plot_df['imports'],
            mode='lines+markers', name='Imports',
            line=dict(color='#A23B72', width=3)
        ))
        fig.add_trace(go.Scatter(
            x=plot_df['period'], y=plot_df['trade_balance'],
            mode='lines+markers', name='Trade Balance',
            line=dict(color='#F18F01', width=3),
            yaxis='y2'
        ))

    elif chart_type == 'bar':
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=plot_df['period'], y=plot_df['exports'],
            name='Exports', marker_color='#2E86AB'
        ))
        fig.add_trace(go.Bar(
            x=plot_df['period'], y=plot_df['imports'],
            name='Imports', marker_color='#A23B72'
        ))

    elif chart_type == 'area':
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=plot_df['period'], y=plot_df['exports'],
            mode='lines', name='Exports', fill='tozeroy',
            line=dict(color='#2E86AB')
        ))
        fig.add_trace(go.Scatter(
            x=plot_df['period'], y=plot_df['imports'],
            mode='lines', name='Imports', fill='tonexty',
            line=dict(color='#A23B72')
        ))

    fig.update_layout(
        title="Rwanda Trade Overview",
        xaxis_title="Period",
        yaxis_title="Trade Volume (US$ Million)",
        yaxis2=dict(title="Trade Balance (US$ Million)", overlaying='y', side='right'),
        hovermode='x unified',
        template='plotly_white'
    )

    return fig

def create_trends_chart(chart_type, time_range):
    """Create trends analysis chart"""
    if 'Graph Overall' not in processed_data:
        return go.Figure()

    df = processed_data['Graph Overall']
    start_idx, end_idx = time_range
    plot_df = df.iloc[start_idx:end_idx+1]

    # Calculate growth rates
    plot_df['export_growth'] = plot_df['exports'].pct_change() * 100
    plot_df['import_growth'] = plot_df['imports'].pct_change() * 100

    if chart_type == 'line':
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=plot_df['period'][1:], y=plot_df['export_growth'][1:],
            mode='lines+markers', name='Export Growth %',
            line=dict(color='#2E86AB', width=3)
        ))
        fig.add_trace(go.Scatter(
            x=plot_df['period'][1:], y=plot_df['import_growth'][1:],
            mode='lines+markers', name='Import Growth %',
            line=dict(color='#A23B72', width=3)
        ))

    elif chart_type == 'bar':
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=plot_df['period'][1:], y=plot_df['export_growth'][1:],
            name='Export Growth %', marker_color='#2E86AB'
        ))
        fig.add_trace(go.Bar(
            x=plot_df['period'][1:], y=plot_df['import_growth'][1:],
            name='Import Growth %', marker_color='#A23B72'
        ))

    fig.update_layout(
        title="Trade Growth Trends",
        xaxis_title="Period",
        yaxis_title="Growth Rate (%)",
        hovermode='x unified',
        template='plotly_white'
    )

    return fig

def create_regional_chart(chart_type, time_range):
    """Create regional analysis chart"""
    # This would use EAC and regional data
    fig = go.Figure()

    # Sample regional data visualization
    regions = ['EAC', 'COMESA', 'EU', 'ASIA', 'AMERICA']
    values = [100, 80, 60, 120, 40]

    if chart_type == 'bar':
        fig.add_trace(go.Bar(x=regions, y=values, marker_color='#2E86AB'))
    else:
        fig.add_trace(go.Scatter(x=regions, y=values, mode='lines+markers', line=dict(color='#2E86AB', width=3)))

    fig.update_layout(
        title="Regional Trade Analysis",
        xaxis_title="Region",
        yaxis_title="Trade Volume (US$ Million)",
        template='plotly_white'
    )

    return fig

def create_country_chart(chart_type, time_range):
    """Create country analysis chart"""
    # This would use country-specific data
    fig = go.Figure()

    # Sample country data
    countries = ['UAE', 'DRC', 'China', 'USA', 'Kenya']
    values = [442, 84, 20, 9, 13]

    if chart_type == 'bar':
        fig.add_trace(go.Bar(x=countries, y=values, marker_color='#A23B72'))
    else:
        fig.add_trace(go.Scatter(x=countries, y=values, mode='lines+markers', line=dict(color='#A23B72', width=3)))

    fig.update_layout(
        title="Top Trading Partners",
        xaxis_title="Country",
        yaxis_title="Trade Volume (US$ Million)",
        template='plotly_white'
    )

    return fig

def create_commodity_chart(chart_type, time_range):
    """Create commodity analysis chart"""
    # This would use commodity data
    fig = go.Figure()

    # Sample commodity data
    commodities = ['Food & Live Animals', 'Machinery', 'Chemicals', 'Fuels', 'Manufactured Goods']
    values = [101, 17, 5, 1, 35]

    if chart_type == 'bar':
        fig.add_trace(go.Bar(x=commodities, y=values, marker_color='#F18F01'))
    else:
        fig.add_trace(go.Scatter(x=commodities, y=values, mode='lines+markers', line=dict(color='#F18F01', width=3)))

    fig.update_layout(
        title="Commodity Trade Analysis",
        xaxis_title="Commodity Category",
        yaxis_title="Trade Volume (US$ Million)",
        template='plotly_white'
    )

    return fig

def create_forecasting_chart(chart_type, time_range):
    """Create forecasting chart"""
    if 'Graph Overall' not in processed_data:
        return go.Figure()

    df = processed_data['Graph Overall']
    start_idx, end_idx = time_range
    plot_df = df.iloc[start_idx:end_idx+1]

    fig = go.Figure()

    # Historical data
    fig.add_trace(go.Scatter(
        x=plot_df['period'], y=plot_df['exports'],
        mode='lines+markers', name='Historical Exports',
        line=dict(color='#2E86AB', width=2)
    ))

    # Simple forecast (linear trend)
    x_numeric = np.arange(len(plot_df))
    z = np.polyfit(x_numeric, plot_df['exports'], 1)
    p = np.poly1d(z)

    # Future periods
    future_periods = 4  # Next 4 quarters
    future_x = np.arange(len(plot_df), len(plot_df) + future_periods)
    future_y = p(future_x)

    future_labels = [f'Q{(i%4)+1} {2024+(i//4)}' for i in range(len(plot_df), len(plot_df) + future_periods)]

    fig.add_trace(go.Scatter(
        x=future_labels, y=future_y,
        mode='lines+markers', name='Forecast',
        line=dict(color='#F18F01', width=3, dash='dash'),
        marker=dict(symbol='star', size=8)
    ))

    fig.update_layout(
        title="Trade Forecasting Model",
        xaxis_title="Period",
        yaxis_title="Export Volume (US$ Million)",
        template='plotly_white'
    )

    return fig

def create_summary_chart(chart_type, time_range):
    """Create summary dashboard chart"""
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Trade Volume', 'Growth Rates', 'Regional Share', 'Commodity Mix'),
        specs=[[{"type": "bar"}, {"type": "line"}],
               [{"type": "pie"}, {"type": "bar"}]]
    )

    # Sample data for summary
    periods = ['2022Q1', '2022Q2', '2022Q3', '2022Q4', '2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4']
    exports = [294, 332, 343, 355, 402, 485, 388, 399, 432, 538, 667, 677]
    imports = [1035, 1348, 1481, 1281, 1477, 1571, 1582, 1487, 1411, 1569, 1752, 1629]

    # Trade volume
    fig.add_trace(go.Bar(x=periods[-6:], y=exports[-6:], name='Exports', marker_color='#2E86AB'), row=1, col=1)
    fig.add_trace(go.Bar(x=periods[-6:], y=imports[-6:], name='Imports', marker_color='#A23B72'), row=1, col=1)

    # Growth rates
    growth_export = [((exports[i] - exports[i-1]) / exports[i-1]) * 100 for i in range(1, len(exports))]
    growth_import = [((imports[i] - imports[i-1]) / imports[i-1]) * 100 for i in range(1, len(imports))]

    fig.add_trace(go.Scatter(x=periods[1:7], y=growth_export[-6:], name='Export Growth', line=dict(color='#2E86AB')), row=1, col=2)
    fig.add_trace(go.Scatter(x=periods[1:7], y=growth_import[-6:], name='Import Growth', line=dict(color='#A23B72')), row=1, col=2)

    # Regional share
    regions = ['EAC', 'EU', 'ASIA', 'AMERICA', 'OTHER']
    shares = [15, 8, 65, 5, 7]
    fig.add_trace(go.Pie(labels=regions, values=shares, marker_colors=['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#90EE90']), row=2, col=1)

    # Commodity mix
    commodities = ['Food', 'Manufactured', 'Machinery', 'Chemicals', 'Other']
    values = [25, 35, 15, 10, 15]
    fig.add_trace(go.Bar(x=commodities, y=values, marker_color='#F18F01'), row=2, col=2)

    fig.update_layout(
        title="Trade Analysis Summary",
        height=800,
        template='plotly_white'
    )

    return fig

if __name__ == '__main__':
    print("Starting Rwanda Trade Analysis Dashboard...")
    print(f"Loaded {len(processed_data)} data sheets")
    print("Dashboard available at: http://localhost:8050")
    print("Features:")
    print("   • Interactive charts with multiple visualization types")
    print("   • Sidebar navigation between different analysis views")
    print("   • Real-time metric updates")
    print("   • Professional Bootstrap styling")
    print("   • Responsive design")

    app.run_server(debug=True, host='0.0.0.0', port=8050)