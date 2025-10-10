# 🚀 Deploying Rwanda Export Analysis Platform on Render.com

## 📋 Deployment Overview

Your platform consists of multiple components that need to be deployed separately on Render:

1. **Frontend** (HTML/CSS/JS) → **Static Site** on Render
2. **Backend API** (Node.js/Express) → **Web Service** on Render
3. **Python Processing** → **Background Worker** or **integrated into backend**

## 🛠️ Step 1: Prepare Your Codebase

### Update package.json for Production
```json
{
  "name": "rwanda-export-analysis-frontend",
  "version": "1.0.0",
  "description": "Frontend for Rwanda trade analysis system",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build process needed for vanilla JS'"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Create render.yaml for Multi-Service Deployment
```yaml
# render.yaml
services:
  - type: web
    name: rwanda-trade-backend
    env: node
    buildCommand: "cd backend && npm install"
    startCommand: "cd backend && npm start"
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        # You'll set this in Render dashboard
      - key: OPENAI_API_KEY
        # You'll set this in Render dashboard

  - type: static
    name: rwanda-trade-frontend
    buildCommand: "npm install"
    staticPublishPath: ./
    envVars:
      - key: API_BASE_URL
        value: https://rwanda-trade-backend.onrender.com
```

## 🚀 Step 2: Deploy Backend API

### 1. Create New Web Service on Render
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `https://github.com/Lambert-01/rwanda-trade-analysis-system`

### 2. Configure Backend Service
**Service Settings:**
- **Name**: `rwanda-trade-backend`
- **Runtime**: `Node.js`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

### 3. Set Environment Variables
In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=3000

# Database (you'll need to set up MongoDB Atlas)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/rwanda_trade

# AI Integration
OPENAI_API_KEY=your-openrouter-api-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-oss-20b:free

# Data Paths (adjust for Render filesystem)
DATA_RAW_PATH=./data/raw
DATA_PROCESSED_PATH=./data/processed

# CORS (allow frontend domain)
CORS_ORIGIN=https://rwanda-trade-frontend.onrender.com

# Security
RATE_LIMIT=100
```

## 🌐 Step 3: Deploy Frontend

### 1. Create Static Site Service
1. In Render dashboard: **"New +"** → **"Static Site"**
2. Connect same GitHub repository

### 2. Configure Frontend Service
**Service Settings:**
- **Name**: `rwanda-trade-frontend`
- **Build Command**: `npm install`
- **Publish Directory**: `.` (root directory)

### 3. Frontend Environment Variables
```env
API_BASE_URL=https://rwanda-trade-backend.onrender.com
NODE_ENV=production
```

## 🐍 Step 4: Handle Python Processing

### Option A: Background Worker (Recommended)
Create a separate **Background Worker** service for Python processing:

1. **"New +"** → **"Background Worker"**
2. **Name**: `rwanda-data-processor`
3. **Runtime**: `Python`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `cd python_processing && python run_pipeline.py`

### Option B: Integrate into Backend
Modify your backend to handle Python processing via `python-shell`:

```javascript
// In backend/routes/exports.js or similar
const { PythonShell } = require('python-shell');

router.post('/api/process-data', async (req, res) => {
  try {
    const pythonProcess = await PythonShell.run('run_pipeline.py', {
      mode: 'text',
      pythonPath: 'python',
      scriptPath: 'python_processing/',
      args: []
    });

    res.json({ success: true, output: pythonProcess });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## ⚙️ Step 5: Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster (M0 Sandbox)
3. Get connection string

### 2. Update Backend Environment
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rwanda_trade?retryWrites=true&w=majority
```

## 🔧 Step 6: Domain Configuration

### Custom Domain (Optional)
1. In Render dashboard, go to your service **Settings**
2. Click **"Custom Domains"**
3. Add your domain or use provided `*.onrender.com` subdomain

**Example URLs:**
- Frontend: `https://rwanda-trade-frontend.onrender.com`
- Backend: `https://rwanda-trade-backend.onrender.com`

## 🚀 Step 7: Deployment Verification

### Test Your Deployed Application

1. **Check Backend Health**:
```bash
curl https://rwanda-trade-backend.onrender.com/api/exports
```

2. **Check Frontend**:
   - Open `https://rwanda-trade-frontend.onrender.com`
   - Verify all pages load correctly
   - Test interactive features

3. **Verify Data Processing**:
   - Trigger data processing via API or background worker
   - Check logs in Render dashboard

## 📊 Step 8: Monitor & Scale

### Render Dashboard Monitoring
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and response times
- **Uptime**: Service availability monitoring
- **Auto-deployment**: Automatic deployments on git push

### Performance Optimization
```env
# In production environment variables
NODE_ENV=production
CACHE_DURATION_HOURS=6
RATE_LIMIT=1000
```

## 🛠️ Troubleshooting Common Issues

### Issue: MongoDB Connection Failed
**Solution**: Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` for Render

### Issue: Python Dependencies
**Solution**: Ensure `requirements.txt` includes all necessary packages

### Issue: Build Failures
**Solution**: Check build logs in Render dashboard for specific errors

### Issue: CORS Errors
**Solution**: Update CORS_ORIGIN in backend to match frontend URL

## 💰 Cost Estimation (Render Free Tier)

| Service | Type | Estimated Cost |
|---------|------|----------------|
| **Backend API** | Web Service | Free (750 hours/month) |
| **Frontend** | Static Site | Free (100GB bandwidth/month) |
| **Background Worker** | Background Worker | Free (750 hours/month) |
| **MongoDB Atlas** | Database | Free (M0 Sandbox: 512MB) |

**Total Estimated Cost**: **FREE** (within limits)

## 🚀 Quick Deployment Commands

### For Future Updates:
```bash
# Commit your changes
git add .
git commit -m "Update: deployment improvements"

# Push to trigger auto-deployment
git push origin main
```

### Manual Deployment (if needed):
1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

## 📞 Support & Resources

### Render Documentation
- [Web Services](https://render.com/docs/web-services)
- [Static Sites](https://render.com/docs/static-sites)
- [Background Workers](https://render.com/docs/background-workers)

### MongoDB Atlas Setup
- [Free Cluster Setup](https://docs.atlas.mongodb.com/getting-started/)

---

## 🎉 Deployment Success Checklist

- [ ] Backend API deployed and responding
- [ ] Frontend static site accessible
- [ ] MongoDB Atlas connected
- [ ] Environment variables configured
- [ ] Cross-origin requests working
- [ ] Data processing functional
- [ ] All pages loading correctly
- [ ] Interactive features working

**Once deployed, your platform will be accessible at:**
- **🌐 Frontend**: `https://rwanda-trade-frontend.onrender.com`
- **🔌 API**: `https://rwanda-trade-backend.onrender.com`

**Ready for NISR Hackathon 2025 evaluation!** 🏆