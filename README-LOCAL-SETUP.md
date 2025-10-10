# 🇷🇼 Rwanda trade analysis system- Local Setup Guide

This guide explains how to set up and run the Rwanda trade analysis systemapplication locally using the comprehensive environment configuration.

## 📋 Prerequisites

- **Node.js** (v14.0.0 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)
- **npm** (Node.js package manager)

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

#### Windows
```bash
# Double-click the startup script
start-local.bat
```

#### Linux/Mac
```bash
# Make script executable and run
chmod +x start-local.sh
./start-local.sh
```

This will automatically:
- Install all dependencies
- Start the backend server on port 3000
- Start the frontend server on port 3001
- Open your browser to the application

### Option 2: Manual Startup

1. **Install Dependencies**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   pip install -r python_processing/requirements.txt

   # Install Node.js dependencies
   npm install
   cd backend && npm install && cd ..
   ```

2. **Start Backend Server** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```
   Backend will run on: http://localhost:3000

3. **Start Frontend Server** (Terminal 2)
   ```bash
   npm start
   ```
   Frontend will run on: http://localhost:3001

4. **Open your browser** and navigate to: http://localhost:3001

## 🔧 Environment Configuration

The `.env` file contains all configuration for local development:

### Server Configuration
- **PORT=3001** - Frontend server port
- **BACKEND_PORT=3000** - Backend API server port
- **NODE_ENV=development** - Environment mode

### API Configuration
- **API_BASE_URL=http://localhost:3000** - Backend API URL
- **API_TIMEOUT=30000** - Request timeout in milliseconds

### Data Processing
- **DATA_RAW_PATH=./data/raw** - Raw data directory
- **DATA_PROCESSED_PATH=./data/processed** - Processed data directory
- **CACHE_ENABLED=true** - Enable result caching
- **CACHE_DURATION_HOURS=1** - Cache duration

### Python Environment
- **PYTHON_PATH=python** - Python executable (if not in PATH)
- **VIRTUAL_ENV_PATH=./venv** - Virtual environment path

### Development Settings
- **DEBUG_MODE=true** - Enable detailed logging
- **LOG_LEVEL=info** - Logging level
- **AUTO_RELOAD=true** - Auto-reload on file changes

## 📁 Project Structure

```
rwanda-export-explorer/
├── .env                    # Environment configuration
├── .env.example           # Environment template
├── server.js              # Frontend server (port 3001)
├── backend/
│   ├── server.js          # Backend API server (port 3000)
│   └── routes/            # API route handlers
├── frontend/              # Frontend HTML/CSS/JS
├── python_processing/     # Python data processing
├── data/
│   ├── raw/              # Raw Excel files
│   └── processed/        # Processed JSON data
└── models/               # ML models
```

## 🔄 Data Flow

1. **Raw Data**: Excel files in `data/raw/`
2. **Processing**: Python scripts process Excel → JSON
3. **Backend API**: Serves processed data on port 3000
4. **Frontend Proxy**: Proxies API requests to backend
5. **Dashboard**: Interactive UI on port 3001

## 🛠️ Development Commands

### Run Python Data Processing
```bash
cd python_processing
python run_pipeline.py
```

### Run Excel Analysis Only
```bash
cd python_processing
python export_analyzer.py
```

### Run AI Predictions Only
```bash
cd python_processing
python predictor.py
```

### Install Additional Dependencies
```bash
# Python packages
pip install pandas numpy scikit-learn openpyxl

# Node.js packages
npm install express cors morgan
```

## 🌐 API Endpoints

### Frontend Server (Port 3001)
- `GET /` - Main dashboard
- `GET /api/health` - Health check
- `POST /api/analyze-excel` - Trigger Excel analysis
- `GET /api/analysis-results` - Get cached results

### Backend API (Port 3000)
- `GET /api` - API documentation
- `GET /api/health` - Backend health check
- `GET /api/exports/*` - Export data endpoints
- `GET /api/imports/*` - Import data endpoints
- `GET /api/predictions/*` - AI predictions
- `GET /api/analytics/*` - Analytics data

## 🔍 Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are in use:
1. Update `.env` file with different ports
2. Restart the servers

### Python Dependencies Issues
```bash
# Update pip
pip install --upgrade pip

# Install specific versions
pip install pandas==1.5.0 numpy==1.21.0 scikit-learn==1.2.0
```

### Node.js Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall all packages
rm -rf node_modules package-lock.json
npm install
```

### Data Processing Errors
1. Ensure Excel file exists in `data/raw/`
2. Check file permissions
3. Verify Python packages are installed
4. Check the logs in `python_processing/*.log`

## 📊 Monitoring

### Check Server Status
- Frontend: http://localhost:3001/api/health
- Backend: http://localhost:3000/api/health

### View Logs
- Python logs: `python_processing/*.log`
- Node.js logs: Terminal output
- Browser console: Developer tools

### Data Validation
- Processed data: `data/processed/`
- Analysis results: `data/processed/analysis_report.json`
- Predictions: `data/processed/predictions.json`

## 🚀 Production Deployment

For production deployment:

1. **Update `.env`**:
   ```env
   NODE_ENV=production
   PORT=80
   BACKEND_PORT=3000
   API_BASE_URL=https://your-domain.com
   ```

2. **Set up reverse proxy** (nginx/apache) to route:
   - `https://your-domain.com/api/*` → `http://localhost:3000/api/*`
   - `https://your-domain.com/*` → `http://localhost:3001/*`

3. **Configure SSL/TLS** certificates

4. **Set up process manager** (PM2) for automatic restarts

## 🤝 Contributing

1. Copy `.env.example` to `.env` and customize
2. Make your changes
3. Test with both servers running
4. Submit pull request

## 📞 Support

For issues or questions:
1. Check the logs for error messages
2. Verify all dependencies are installed
3. Ensure ports are not conflicting
4. Check file permissions

---

**Built with ❤️ for Rwanda's economic development**