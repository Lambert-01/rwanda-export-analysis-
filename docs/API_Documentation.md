# Rwanda Export Analysis Platform - API Documentation

## Overview

The Rwanda Export Analysis Platform provides a comprehensive REST API for accessing trade data, analytics, and AI-powered insights. The API supports both MongoDB (primary) and JSON file fallbacks for data access.

**Base URL**: `http://localhost:3000/api`

## Authentication

Currently, the API is publicly accessible without authentication. For production deployment, consider implementing JWT or API key authentication.

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "generated_at": "2025-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## 📤 Export Data Endpoints

### Get All Exports
**GET** `/api/exports`

Get quarterly export data with aggregated values.

**Response**:
```json
[
  {
    "period": "2024Q1",
    "exports": 431612.02,
    "count": 150
  }
]
```

### Get Export Destinations
**GET** `/api/exports/destinations`

Get top export destinations with values and coordinates for mapping.

**Query Parameters**:
- `year` (optional): Filter by year (default: "2024")
- `limit` (optional): Number of destinations (default: 10)

**Response**:
```json
[
  {
    "country": "United Arab Emirates",
    "value": 288749.92,
    "lat": 23.4241,
    "lng": 53.8478
  }
]
```

### Get Export Products/Commodities
**GET** `/api/exports/products`

Get top export commodities by value.

**Query Parameters**:
- `limit` (optional): Number of products (default: 10)

**Response**:
```json
[
  {
    "product": "Coffee, not roasted",
    "value": 156789.45
  }
]
```

### Get Export Growth Analysis
**GET** `/api/exports/growth`

Get export growth rates by quarter.

**Response**:
```json
[
  {
    "period": "2024Q1",
    "exports": 431612.02,
    "growth": 7.65
  }
]
```

### Get Export Summary Statistics
**GET** `/api/exports/summary`

Get comprehensive export summary statistics.

**Response**:
```json
{
  "total_export_value": 2156789.45,
  "total_countries": 45,
  "total_quarters": 8,
  "top_destination": "United Arab Emirates",
  "average_quarterly_value": 269598.68,
  "latest_quarter": "2025Q1"
}
```

### Get Export Trends Analysis
**GET** `/api/exports/trends`

Get detailed export trends with growth analysis.

**Response**:
```json
[
  {
    "quarter": "2024Q1",
    "total_value": 431612.02,
    "country_count": 35,
    "avg_value_per_country": 12331.77,
    "growth_rate": 5.23,
    "growth_amount": 21456.78
  }
]
```

### Get SITC Section Analysis
**GET** `/api/exports/sitc-analysis`

Get export analysis by Standard International Trade Classification (SITC) sections.

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "total_sections": 9,
  "sitc_sections": [
    {
      "sitc_section": "0",
      "section_name": "Food and live animals",
      "total_value": 82554.50,
      "commodity_count": 25
    }
  ]
}
```

### Get Period-Specific Analysis
**GET** `/api/exports/period-analysis/:period`

Get detailed export analysis for a specific period (e.g., "2024Q4").

**Parameters**:
- `period`: Period in format "YYYYQN" (e.g., "2024Q4")

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "target_period": "2024Q4",
  "total_export_value": 677446.20,
  "sitc_sections": [...]
}
```

### Get Export Growth by Quarter
**GET** `/api/exports/growth-analysis`

Get comprehensive export growth analysis across all quarters.

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "quarters_analyzed": 8,
  "total_export_value": 2156789.45,
  "growth_data": [...]
}
```

### Get Export Performance Over Time
**GET** `/api/exports/performance-analysis`

Get detailed export performance metrics over time.

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "quarters_analyzed": 8,
  "total_period_value": 2156789.45,
  "performance_data": [...]
}
```

### Get Detailed Country Analysis
**GET** `/api/exports/country-analysis`

Get comprehensive analysis of export performance by destination country.

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "total_countries": 45,
  "total_export_value": 2156789.45,
  "countries": [
    {
      "rank": 1,
      "country": "United Arab Emirates",
      "total_value_2022_2025": 1567890.45,
      "q4_2024_value": 442548.67,
      "share_percentage": 72.68,
      "growth_rate": 12.34,
      "trend": "Strong Growth",
      "trend_class": "success"
    }
  ]
}
```

### Get AI-Powered Export Analysis
**GET** `/api/exports/ai-analysis`

Get AI-generated insights and analysis of export data using OpenRouter API.

**Response**:
```json
{
  "success": true,
  "analysis": "AI-generated analysis text...",
  "key_insights": [...],
  "recommendations": [...],
  "confidence_score": 0.85
}
```

### Get Export Heatmap Data
**GET** `/api/exports/heatmap`

Get export data formatted for heatmap visualization.

**Query Parameters**:
- `year` (optional): Filter by year (default: "2024")

**Response**:
```json
[
  {
    "country": "United Arab Emirates",
    "value": 288749.92,
    "lat": 23.4241,
    "lng": 53.8478
  }
]
```

## 📥 Import Data Endpoints

### Get All Imports
**GET** `/api/imports`

Get quarterly import data with aggregated values.

**Response**:
```json
[
  {
    "period": "2024Q1",
    "imports": 1410520.45,
    "count": 200
  }
]
```

### Get Import Sources
**GET** `/api/imports/sources`

Get top import source countries.

**Query Parameters**:
- `year` (optional): Filter by year
- `limit` (optional): Number of sources (default: 10)

**Response**:
```json
[
  {
    "country": "China",
    "value": 338526.46,
    "lat": 35.8617,
    "lng": 104.1954
  }
]
```

### Get Import Products
**GET** `/api/imports/products`

Get top import commodities by value.

**Response**:
```json
[
  {
    "product": "Machinery and mechanical appliances",
    "value": 156789.45
  }
]
```

## 📊 Analytics Endpoints

### Get Trade Balance Analysis
**GET** `/api/analytics/trade-balance`

Get comprehensive trade balance analysis.

**Response**:
```json
{
  "generated_at": "2025-01-01T00:00:00.000Z",
  "total_export_value": 2156789.45,
  "total_import_value": 3456789.12,
  "trade_balance": -1300000.67,
  "balance_trend": "deficit",
  "quarterly_data": [...]
}
```

### Get Growth Trends
**GET** `/api/analytics/growth-trends`

Get growth trend analysis for exports and imports.

**Response**:
```json
{
  "export_growth": [...],
  "import_growth": [...],
  "overall_trend": "positive"
}
```

## 🤖 AI & Predictions Endpoints

### Get Export Predictions
**GET** `/api/predictions/exports`

Get machine learning predictions for future export values.

**Response**:
```json
{
  "model": "Random Forest",
  "predictions": [
    {
      "quarter": "2025Q2",
      "predicted_value": 485000.00,
      "confidence_interval": [470000, 500000]
    }
  ],
  "accuracy_metrics": {
    "mae": 12500.50,
    "rmse": 18750.75,
    "r2_score": 0.89
  }
}
```

### Get Import Predictions
**GET** `/api/predictions/imports`

Get machine learning predictions for future import values.

**Response**:
```json
{
  "model": "Random Forest",
  "predictions": [...],
  "accuracy_metrics": {...}
}
```

### Get AI Chat/Analysis
**POST** `/api/chat/ask`

Get AI-powered explanations and analysis.

**Request Body**:
```json
{
  "question": "What are the main export trends?",
  "context": "exports"
}
```

**Response**:
```json
{
  "answer": "AI-generated response...",
  "confidence": 0.85,
  "sources": ["exports_data", "analysis_results"]
}
```

### Get Model Information
**GET** `/api/models/info`

Get information about trained ML models.

**Response**:
```json
{
  "export_model": {
    "type": "Random Forest",
    "features": 15,
    "accuracy": 0.89,
    "last_trained": "2025-01-01"
  },
  "import_model": {
    "type": "XGBoost",
    "features": 12,
    "accuracy": 0.87,
    "last_trained": "2025-01-01"
  }
}
```

## 🚨 Error Handling

The API implements comprehensive error handling:

### Common HTTP Status Codes:
- **200**: Success
- **400**: Bad Request (invalid parameters)
- **404**: Not Found (no data available)
- **500**: Internal Server Error

### Error Response Format:
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 📈 Data Sources

The API uses a hierarchical data source strategy:

1. **Primary**: MongoDB database (fastest, most current)
2. **Secondary**: Pre-processed JSON files from Python pipeline
3. **Fallback**: Original Excel/CSV data files

## 🔧 Rate Limiting

Currently, no rate limiting is implemented. For production, consider implementing rate limiting to prevent abuse.

## 📝 Response Time

Typical response times:
- Simple queries: 50-200ms
- Complex aggregations: 200-500ms
- AI analysis: 1-3 seconds

## 🔄 Caching

The API implements intelligent caching:
- MongoDB results are cached for 1 hour
- JSON file results are cached for 30 minutes
- AI responses are cached for 24 hours

## 📊 Data Freshness

- **Real-time**: MongoDB data updated immediately
- **Daily**: JSON files updated by Python pipeline
- **Weekly**: Full data refresh from source files

---

**API Version**: 1.0.0
**Last Updated**: January 2025
**Contact**: NISR Development Team