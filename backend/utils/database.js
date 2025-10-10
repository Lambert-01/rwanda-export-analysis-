/**
 * MongoDB Database Connection and Models
 * Comprehensive database integration for Rwanda Trade analytic system
 */

const mongoose = require('mongoose');

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rwanda_export_explorer';

// Connection options
const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    maxIdleTimeMS: 30000
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, connectionOptions);
        console.log('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        return mongoose.connection;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
    try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
}

/**
 * Check database connection status
 */
function getConnectionStatus() {
    return {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
    };
}

// Export data schema
const ExportDataSchema = new mongoose.Schema({
    quarter: {
        type: String,
        required: true,
        index: true
    },
    export_value: {
        type: Number,
        required: true
    },
    commodity: {
        type: String,
        required: true,
        index: true
    },
    destination_country: {
        type: String,
        required: true,
        index: true
    },
    sitc_section: {
        type: String,
        index: true
    },
    year: {
        type: Number,
        index: true
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    source_file: String,
    data_quality_score: Number
}, {
    timestamps: true,
    collection: 'export_data'
});

// Import data schema
const ImportDataSchema = new mongoose.Schema({
    quarter: {
        type: String,
        required: true,
        index: true
    },
    import_value: {
        type: Number,
        required: true
    },
    commodity: {
        type: String,
        required: true,
        index: true
    },
    source_country: {
        type: String,
        required: true,
        index: true
    },
    sitc_section: {
        type: String,
        index: true
    },
    year: {
        type: Number,
        index: true
    },
    processed_at: {
        type: Date,
        default: Date.now
    },
    source_file: String,
    data_quality_score: Number
}, {
    timestamps: true,
    collection: 'import_data'
});

// Trade balance schema
const TradeBalanceSchema = new mongoose.Schema({
    quarter: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    export_value: {
        type: Number,
        required: true
    },
    import_value: {
        type: Number,
        required: true
    },
    trade_balance: {
        type: Number,
        required: true
    },
    balance_type: {
        type: String,
        enum: ['surplus', 'deficit'],
        required: true
    },
    export_growth: Number,
    import_growth: Number,
    balance_growth: Number,
    analysis_date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'trade_balance'
});

// Statistical analysis schema
const StatisticalAnalysisSchema = new mongoose.Schema({
    analysis_type: {
        type: String,
        required: true,
        enum: ['descriptive', 'correlation', 'regression', 'clustering', 'outlier_detection', 'forecasting'],
        index: true
    },
    dataset: {
        type: String,
        required: true,
        index: true
    },
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    results: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    metrics: {
        accuracy: Number,
        precision: Number,
        recall: Number,
        f1_score: Number,
        r_squared: Number,
        rmse: Number,
        mae: Number
    },
    visualizations: [{
        type: {
            type: String,
            enum: ['scatter', 'line', 'bar', 'heatmap', 'boxplot', 'histogram']
        },
        title: String,
        data_url: String,
        description: String
    }],
    insights: [String],
    recommendations: [String],
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    model_version: String,
    execution_time_ms: Number
}, {
    timestamps: true,
    collection: 'statistical_analyses'
});

// Machine learning model schema
const MLModelSchema = new mongoose.Schema({
    model_name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    model_type: {
        type: String,
        required: true,
        enum: ['regression', 'classification', 'clustering', 'time_series', 'ensemble'],
        index: true
    },
    algorithm: {
        type: String,
        required: true
    },
    dataset: {
        type: String,
        required: true
    },
    features: [String],
    target_variable: String,
    hyperparameters: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    performance_metrics: {
        training_accuracy: Number,
        validation_accuracy: Number,
        test_accuracy: Number,
        cross_validation_scores: [Number],
        feature_importance: mongoose.Schema.Types.Mixed
    },
    model_file_path: String,
    model_metadata: {
        training_date: Date,
        training_time_ms: Number,
        data_size: Number,
        framework: String,
        framework_version: String
    },
    status: {
        type: String,
        enum: ['training', 'trained', 'deployed', 'deprecated'],
        default: 'trained'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'ml_models'
});

// Predictions schema
const PredictionsSchema = new mongoose.Schema({
    prediction_type: {
        type: String,
        required: true,
        enum: ['export_forecast', 'import_forecast', 'trade_balance_forecast', 'commodity_forecast'],
        index: true
    },
    model_used: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MLModel',
        required: true
    },
    prediction_horizon: {
        type: Number,
        required: true
    },
    predictions: [{
        period: String,
        predicted_value: Number,
        confidence_interval_lower: Number,
        confidence_interval_upper: Number,
        confidence_score: Number,
        prediction_method: String
    }],
    input_features: mongoose.Schema.Types.Mixed,
    ensemble_weights: mongoose.Schema.Types.Mixed,
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    expires_at: {
        type: Date,
        index: true
    }
}, {
    timestamps: true,
    collection: 'predictions'
});

// Outliers schema
const OutliersSchema = new mongoose.Schema({
    dataset: {
        type: String,
        required: true,
        index: true
    },
    detection_method: {
        type: String,
        required: true,
        enum: ['z_score', 'iqr', 'isolation_forest', 'local_outlier_factor', 'modified_z_score']
    },
    outliers: [{
        index: Number,
        value: Number,
        outlier_score: Number,
        description: String,
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'extreme']
        }
    }],
    statistics: {
        total_points: Number,
        outlier_count: Number,
        outlier_percentage: Number,
        threshold_used: Number
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'outliers'
});

// Correlation analysis schema
const CorrelationAnalysisSchema = new mongoose.Schema({
    dataset: {
        type: String,
        required: true,
        index: true
    },
    variables: [String],
    correlation_matrix: mongoose.Schema.Types.Mixed,
    significant_correlations: [{
        variable_1: String,
        variable_2: String,
        correlation_coefficient: Number,
        p_value: Number,
        significance_level: String,
        interpretation: String
    }],
    analysis_method: {
        type: String,
        enum: ['pearson', 'spearman', 'kendall'],
        default: 'pearson'
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'correlation_analyses'
});

// Create models
const ExportData = mongoose.model('ExportData', ExportDataSchema);
const ImportData = mongoose.model('ImportData', ImportDataSchema);
const TradeBalance = mongoose.model('TradeBalance', TradeBalanceSchema);
const StatisticalAnalysis = mongoose.model('StatisticalAnalysis', StatisticalAnalysisSchema);
const MLModel = mongoose.model('MLModel', MLModelSchema);
const Predictions = mongoose.model('Predictions', PredictionsSchema);
const Outliers = mongoose.model('Outliers', OutliersSchema);
const CorrelationAnalysis = mongoose.model('CorrelationAnalysis', CorrelationAnalysisSchema);

// Export everything
module.exports = {
    connectDB,
    disconnectDB,
    getConnectionStatus,
    mongoose,
    ExportData,
    ImportData,
    TradeBalance,
    StatisticalAnalysis,
    MLModel,
    Predictions,
    Outliers,
    CorrelationAnalysis
};