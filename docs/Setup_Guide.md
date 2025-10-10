# Rwanda Export Analysis Platform - Complete Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Check Node.js version (need 14+)
node --version

# Check Python version (need 3.8+)
python --version

# Check MongoDB status
mongod --version
```

### 2. Clone and Install
```bash
# Clone repository
git clone <repository-url>
cd rwanda-export-analysis

# Install all dependencies
npm install                    # Frontend dependencies
cd backend && npm install      # Backend dependencies
cd .. && pip install -r requirements.txt  # Python dependencies
```

### 3. Configure Environment
```bash
# Copy and edit backend configuration
cd backend
cp .env.example .env
# Edit .env with your settings (see Configuration section below)
```

### 4. Start the System
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend API
cd backend && npm start

# Terminal 3: Start Frontend
npm start

# Terminal 4: Process Data (optional)
cd python_processing && python run_pipeline.py
```

**🎉 Access your application**: http://localhost:8080

---

## 📋 Detailed Setup Instructions

## 1. System Requirements

### Hardware Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **CPU**: 2 cores minimum, 4 cores recommended

### Software Requirements
- **Node.js**: v14.0.0 or higher
- **Python**: 3.8 or higher
- **MongoDB**: v4.4 or higher
- **Git**: Latest version
- **Text Editor**: VS Code recommended

## 2. Installation Steps

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd rwanda-export-analysis
```

### Step 2: Backend Setup (Node.js)
```bash
cd backend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected packages**:
- express: ^4.18.2
- mongodb: ^6.20.0
- mongoose: ^8.18.3
- openai: ^5.23.2
- cors: ^2.8.5

### Step 3: Frontend Setup
```bash
# From root directory
npm install
```

**Expected packages**:
- express: ^4.18.2
- chart.js: ^4.4.0
- leaflet: ^1.9.4
- bootstrap: ^5.3.0

### Step 4: Python Environment Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify key packages
python -c "import pandas, numpy, sklearn; print('✅ Python packages installed successfully')"
```

**Expected packages**:
- pandas>=1.5.0
- numpy>=1.21.0
- scikit-learn>=1.0.0
- openpyxl>=3.0.0

### Step 5: MongoDB Setup
```bash
# Start MongoDB service
# On Windows:
"C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe"

# On macOS/Linux:
mongod

# Verify MongoDB is running
mongo --eval "db.runCommand('ismaster')"
```

## 3. Configuration

### Backend Configuration (backend/.env)

```env
# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=3001
BACKEND_PORT=3000
NODE_ENV=development

# ========================================
# OPENAI / OPENROUTER CONFIGURATION
# ========================================
OPENAI_API_KEY=sk-or-v1-your-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-oss-20b:free
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Enable AI features
AI_CHAT_ENABLED=true
AI_ANALYSIS_ENABLED=true
AI_PREDICTIONS_ENABLED=true

# ========================================
# DATA PROCESSING
# ========================================
DATA_RAW_PATH=../data/raw
DATA_PROCESSED_PATH=../data/processed
CACHE_ENABLED=true
CACHE_DURATION_HOURS=1

# ========================================
# API CONFIGURATION
# ========================================
API_BASE_URL=http://localhost:3000
API_TIMEOUT=30000
MAX_FILE_SIZE=50

# ========================================
# SECURITY
# ========================================
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT=100

# ========================================
# LOGGING
# ========================================
LOG_LEVEL=info
DEBUG_MODE=true

# ========================================
# DEVELOPMENT SETTINGS
# ========================================
AUTO_RELOAD=true
SOURCE_MAPS=true
```

### MongoDB Configuration
Create `mongod.conf` if needed:

```yaml
storage:
  dbPath: /data/db
net:
  bindIp: 127.0.0.1
  port: 27017
```

## 4. Data Setup

### Step 1: Prepare Raw Data
1. Place your Excel/CSV trade data files in `data/raw/`
2. Supported formats: `.xlsx`, `.csv`, `.pdf`
3. Expected files:
   - `2025Q1_Trade_report_annexTables.xlsx` (primary dataset)
   - `Formal External Trade in Goods Report 2024Q4.pdf`

### Step 2: Run Data Processing Pipeline
```bash
cd python_processing

# Run the main data processing pipeline
python run_pipeline.py

# Alternative: Run enhanced analysis
python run_enhanced_analysis.py

# Check data processing logs
tail -f data_processing.log
```

### Step 3: Load Data to MongoDB
```bash
# Load processed data to MongoDB
python load_processed_data_to_mongodb.py

# Verify data loading
python test_mongodb_api.py
```

## 5. Running the Application

### Development Mode
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: Frontend
npm start

# Terminal 4: Data Processing (optional)
cd python_processing && python run_pipeline.py
```

### Production Mode
```bash
# Start all services with production settings
NODE_ENV=production npm start

# Or use the provided scripts
./start-local.sh
# Windows: start-local.bat
```

### Verify Everything is Working

1. **Backend API**: http://localhost:3000/api/exports
2. **Frontend**: http://localhost:8080
3. **MongoDB**: Check `mongodb://localhost:27017/rwanda_trade`

## 6. Troubleshooting

### Common Issues & Solutions

#### Issue: "Port already in use"
```bash
# Find process using the port
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use different ports in .env
PORT=3001
```

#### Issue: MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB if stopped
sudo systemctl start mongod

# Reset MongoDB data if corrupted
rm -rf /data/db && mongod --repair
```

#### Issue: Python Package Installation Failed
```bash
# Update pip
python -m pip install --upgrade pip

# Install packages one by one
pip install pandas
pip install numpy
pip install scikit-learn

# Use virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

#### Issue: Node.js Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use legacy OpenSSL provider (if needed)
export NODE_OPTIONS=--openssl-legacy-provider
```

#### Issue: Data Processing Errors
```bash
# Check Python environment
python --version
pip list | grep pandas

# Verify data files exist
ls -la data/raw/

# Check data processing logs
cd python_processing
tail -f data_processing.log
```

## 7. Testing the Installation

### Backend API Tests
```bash
# Test basic endpoints
curl http://localhost:3000/api/exports
curl http://localhost:3000/api/imports
curl http://localhost:3000/api/analytics/trade-balance
```

### Frontend Tests
1. Open http://localhost:8080
2. Check browser console for errors
3. Verify all pages load correctly
4. Test interactive features (charts, maps)

### Data Pipeline Tests
```bash
cd python_processing

# Test data loading
python -c "from data_processor import *; print('✅ Data processor works')"

# Test MongoDB connection
python test_mongodb_api.py

# Test ML models
python -c "import pickle; print('✅ ML models accessible')"
```

## 8. Performance Optimization

### Memory Optimization
```bash
# Increase Node.js memory limit if needed
NODE_OPTIONS="--max-old-space-size=8192" npm start

# MongoDB optimization
mongod --wiredTigerCacheSizeGB 2
```

### Database Optimization
```javascript
// In MongoDB shell
use rwanda_trade

// Create indexes for better performance
db.exports.createIndex({quarter: 1})
db.exports.createIndex({destination_country: 1})
db.imports.createIndex({quarter: 1})
db.imports.createIndex({source_country: 1})
```

### Caching Strategy
- **API responses**: Cached for 1 hour
- **Static assets**: Cached for 24 hours
- **Data processing results**: Cached for 6 hours

## 9. Backup and Recovery

### Database Backup
```bash
# Create backup
mongodump --db rwanda_trade --out backup/

# Restore from backup
mongorestore --db rwanda_trade backup/rwanda_trade
```

### Data Files Backup
```bash
# Backup raw data
cp -r data/raw/ backup/raw_data_$(date +%Y%m%d)

# Backup processed data
cp -r data/processed/ backup/processed_data_$(date +%Y%m%d)
```

## 10. Monitoring and Logs

### Application Logs
```bash
# Backend logs
tail -f backend/app.log

# Python processing logs
tail -f python_processing/data_processing.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### System Monitoring
```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

## 11. Security Considerations

### For Production Deployment

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   ```

2. **API Keys**: Store securely, never in code
3. **CORS**: Configure for specific domains only
4. **Rate Limiting**: Implement API rate limiting
5. **HTTPS**: Use reverse proxy (nginx) for SSL

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 3000    # Backend API
sudo ufw allow 8080    # Frontend
sudo ufw allow 27017   # MongoDB (restrict to localhost)
```

## 12. Getting Help

### Documentation
- **API Documentation**: `/docs/API_Documentation.md`
- **Implementation Plan**: `/docs/Implementation_Plan.md`
- **This Setup Guide**: `/docs/Setup_Guide.md`

### Common Commands Reference
```bash
# Start everything
npm start && mongod

# Stop everything
pkill -f node && pkill -f mongod

# Check status
ps aux | grep -E "(node|mongod|python)" | grep -v grep

# View logs
pm2 logs all  # If using PM2
```

### Support Channels
- Check the logs in each component's directory
- Verify all prerequisites are installed correctly
- Test each component independently before full system test

---

**Setup completed successfully?** 🎉

Your Rwanda Export Analysis Platform should now be running at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

**Next Steps**:
1. Explore the dashboard features
2. Check API endpoints with the provided documentation
3. Customize configuration as needed
4. Set up automated backups for production use