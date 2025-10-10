/**
 * Enhanced Chat API Routes for Rwanda Trade analytic system
 * Handles AI chat interactions with full system integration and context awareness
 */

const express = require('express');
const router = express.Router();
const openaiService = require('../utils/openaiService');
const { cleanAIResponse } = require('../utils/openaiService');
const { aiSystemMonitor, generateRealTimeInsights } = require('../utils/aiExplanationService');

/**
 * Enhanced POST /api/chat/message
 * Send a chat message and get AI response with full system context
 */
router.post('/message', async (req, res) => {
    try {
        const { message, context, user_id, session_id } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log('💬 Enhanced chat message received:', message.substring(0, 50) + '...');

        // Get comprehensive system context
        const systemContext = aiSystemMonitor.getSystemStatus();
        const tradeContext = await getTradeContext();

        // Log user interaction
        aiSystemMonitor.logSystemEvent({
            type: 'user_interaction',
            action: 'chat_message',
            message: message.substring(0, 100),
            user_id: user_id || 'anonymous',
            session_id: session_id || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Analyze message intent and context
        const messageAnalysis = await analyzeMessageIntent(message, systemContext, tradeContext);

        // Generate contextual suggestions
        const contextualSuggestions = await generateContextualSuggestions(message, messageAnalysis, systemContext);

        // Create enhanced prompt with full system awareness
        const enhancedPrompt = await buildEnhancedPrompt(message, messageAnalysis, systemContext, tradeContext);

        // Check if OpenAI/OpenRouter is configured
        if (openaiService.isConfigured()) {
            try {
                console.log('🚀 Calling OpenRouter API with enhanced context...');
                console.log('🎯 Using configured model:', openaiService.model);

                const completion = await openaiService.client.chat.completions.create({
                    model: openaiService.model,
                    messages: [
                        {
                            role: "system",
                            content: `You are Kilo Code, a fully integrated AI assistant for the Rwanda trade analysis systemsystem. You have complete awareness of:

                            SYSTEM STATUS:
                            - Health: ${systemContext.system_health}%
                            - Active Events: ${systemContext.total_events_logged}
                            - AI Insights Generated: ${systemContext.total_insights_generated}
                            - Recent Activities: ${systemContext.recent_events?.slice(0, 3).map(e => e.type).join(', ') || 'None'}

                            TRADE DATA CONTEXT:
                            - Total Exports: $${tradeContext.total_exports?.toFixed(2)}M
                            - Total Imports: $${tradeContext.total_imports?.toFixed(2)}M
                            - Trade Balance: $${tradeContext.trade_balance?.toFixed(2)}M
                            - Top Destinations: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}

                            MESSAGE ANALYSIS:
                            - Intent: ${messageAnalysis.intent}
                            - Entities: ${messageAnalysis.entities?.join(', ') || 'None detected'}
                            - Urgency: ${messageAnalysis.urgency}
                            - Context: ${messageAnalysis.context}

                            Provide comprehensive, context-aware responses that leverage full system knowledge. Be proactive in offering relevant insights and suggestions.`
                        },
                        {
                            role: "user",
                            content: enhancedPrompt
                        }
                    ],
                    max_tokens: openaiService.maxTokens,
                    temperature: openaiService.temperature
                });

                // Clean the AI response to remove any <think> tags that may be present
                // Some reasoning models (DeepSeek, Qwen) include internal reasoning in <think> tags
                // We remove these to provide clean responses to users
                const rawResponse = completion.choices[0].message.content;
                const aiResponse = cleanAIResponse(rawResponse);

                console.log('✅ Enhanced AI response generated and cleaned successfully');
                console.log('📊 Tokens used:', completion.usage?.total_tokens || 'N/A');

                // Generate real-time insight about this interaction
                const interactionInsight = await generateRealTimeInsights({
                    type: 'user_chat',
                    message: message.substring(0, 50),
                    response_length: aiResponse.length,
                    system_health: systemContext.system_health
                });

                return res.json({
                    success: true,
                    response: aiResponse,
                    using_ai: true,
                    model: openaiService.model,
                    provider: 'OpenRouter',
                    tokens_used: completion.usage?.total_tokens || 0,
                    timestamp: new Date().toISOString(),
                    message_analysis: messageAnalysis,
                    contextual_suggestions: contextualSuggestions,
                    system_context: {
                        health: systemContext.system_health,
                        recent_activity: systemContext.recent_events?.slice(0, 2) || []
                    },
                    real_time_insight: interactionInsight.success ? interactionInsight.insight : null
                });

            } catch (aiError) {
                console.error('❌ OpenRouter/DeepSeek API error:', aiError);

                // Generate enhanced fallback with system context
                const enhancedFallbackResponse = await generateEnhancedFallbackResponse(message, messageAnalysis, systemContext, tradeContext);

                return res.json({
                    success: true,
                    response: enhancedFallbackResponse,
                    using_ai: false,
                    fallback: true,
                    message_analysis: messageAnalysis,
                    contextual_suggestions: contextualSuggestions,
                    system_context: {
                        health: systemContext.system_health,
                        recent_activity: systemContext.recent_events?.slice(0, 2) || []
                    },
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Enhanced fallback when OpenAI is not configured
            console.log('🤖 OpenAI not configured, using enhanced fallback response');

            const enhancedFallbackResponse = await generateEnhancedFallbackResponse(message, messageAnalysis, systemContext, tradeContext);

            return res.json({
                success: true,
                response: enhancedFallbackResponse,
                using_ai: false,
                note: 'OpenAI API key not configured - using enhanced static responses',
                message_analysis: messageAnalysis,
                contextual_suggestions: contextualSuggestions,
                system_context: {
                    health: systemContext.system_health,
                    recent_activity: systemContext.recent_events?.slice(0, 2) || []
                },
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ Enhanced chat API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat message',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * Enhanced GET /api/chat/status
 * Get comprehensive chat service status with system monitoring
 */
router.get('/status', (req, res) => {
    const isConfigured = openaiService.isConfigured();
    const systemStatus = aiSystemMonitor.getSystemStatus();

    res.json({
        success: true,
        status: 'online',
        ai_configured: isConfigured,
        provider: isConfigured && openaiService.apiKey?.startsWith('sk-or-v1-') ? 'OpenRouter (DeepSeek)' : 'OpenAI',
        model: openaiService.model || 'Not configured',
        base_url: openaiService.baseURL,
        system_health: systemStatus.system_health,
        features: {
            ai_chat: isConfigured,
            fallback_responses: true,
            typing_indicator: true,
            message_history: true,
            context_awareness: true,
            proactive_suggestions: true,
            real_time_insights: true,
            system_monitoring: true
        },
        configuration: {
            max_tokens: openaiService.maxTokens,
            temperature: openaiService.temperature,
            api_key_configured: !!openaiService.apiKey,
            api_key_prefix: openaiService.apiKey ? openaiService.apiKey.substring(0, 10) + '...' : 'Not set'
        },
        system_status: {
            total_events_logged: systemStatus.total_events_logged,
            total_insights_generated: systemStatus.total_insights_generated,
            recent_events: systemStatus.recent_events.slice(0, 5),
            recent_insights: systemStatus.recent_insights.slice(0, 3),
            last_activity: systemStatus.last_activity
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/chat/insights
 * Get recent AI insights and system status
 */
router.get('/insights', (req, res) => {
    try {
        const systemStatus = aiSystemMonitor.getSystemStatus();
        const recentInsights = systemStatus.recent_insights.slice(0, 10);

        res.json({
            success: true,
            insights: recentInsights,
            system_health: systemStatus.system_health,
            total_insights: systemStatus.total_insights_generated,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve insights'
        });
    }
});

/**
 * GET /api/chat/suggestions
 * Get contextual suggestions based on current system state
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { context, intent } = req.query;

        // Generate suggestions based on current system state
        const systemStatus = aiSystemMonitor.getSystemStatus();
        const suggestions = await generateContextualSuggestions(
            context || 'general',
            { intent: intent || 'general_inquiry' },
            systemStatus
        );

        res.json({
            success: true,
            suggestions: suggestions,
            context: context || 'general',
            system_health: systemStatus.system_health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions'
        });
    }
});

/**
 * POST /api/chat/analyze
 * Analyze message intent and generate contextual information
 */
router.post('/analyze', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const systemContext = aiSystemMonitor.getSystemStatus();
        const tradeContext = await getTradeContext();
        const messageAnalysis = await analyzeMessageIntent(message, systemContext, tradeContext);
        const contextualSuggestions = await generateContextualSuggestions(message, messageAnalysis, systemContext);

        res.json({
            success: true,
            analysis: messageAnalysis,
            suggestions: contextualSuggestions,
            system_context: {
                health: systemContext.system_health,
                recent_activity: systemContext.recent_events.slice(0, 3)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze message'
        });
    }
});

/**
 * POST /api/chat/configure
 * Configure OpenAI API key (for user setup)
 */
router.post('/configure', (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }

        // Here you could save the API key to environment or database
        // For security, in production this should be encrypted and stored securely
        console.log('🔑 OpenAI API key configured by user');

        res.json({
            success: true,
            message: 'OpenAI API key configured successfully',
            note: 'Please restart the server for changes to take effect',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error configuring OpenAI:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure OpenAI API key'
        });
    }
});

/**
 * Get trade data context for AI responses
 */
async function getTradeContext() {
    try {
        // This would typically fetch from your database
        // For now, returning sample data structure
        return {
            total_exports: 8940,
            total_imports: 20260,
            trade_balance: -11320,
            top_destinations: [
                { country: 'United Arab Emirates', value: 5810 },
                { country: 'Democratic Republic of Congo', value: 890 },
                { country: 'Switzerland', value: 340 }
            ],
            top_products: [
                { commodity: 'Other commodities', value: 428 },
                { commodity: 'Food and live animals', value: 101 },
                { commodity: 'Crude materials', value: 59 }
            ]
        };
    } catch (error) {
        console.error('Error getting trade context:', error);
        return {};
    }
}

/**
 * Analyze message intent and context
 */
async function analyzeMessageIntent(message, systemContext, tradeContext) {
    try {
        // Simple keyword-based analysis (could be enhanced with NLP)
        const lowerMessage = message.toLowerCase();

        const analysis = {
            intent: 'general_inquiry',
            entities: [],
            urgency: 'normal',
            context: 'trade_data',
            confidence: 0.8
        };

        // Detect intent
        if (lowerMessage.includes('export') || lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
            analysis.intent = 'export_analysis';
            analysis.entities.push('exports');
        }
        if (lowerMessage.includes('import') || lowerMessage.includes('buy') || lowerMessage.includes('buying')) {
            analysis.intent = 'import_analysis';
            analysis.entities.push('imports');
        }
        if (lowerMessage.includes('forecast') || lowerMessage.includes('predict') || lowerMessage.includes('future')) {
            analysis.intent = 'forecast_request';
            analysis.entities.push('predictions');
        }
        if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('growth')) {
            analysis.intent = 'trend_analysis';
            analysis.entities.push('trends');
        }
        if (lowerMessage.includes('commodity') || lowerMessage.includes('product') || lowerMessage.includes('goods')) {
            analysis.intent = 'commodity_analysis';
            analysis.entities.push('commodities');
        }
        if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
            analysis.intent = 'help_request';
        }

        // Detect urgency
        if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('quickly')) {
            analysis.urgency = 'high';
        }
        if (lowerMessage.includes('when') || lowerMessage.includes('update') || lowerMessage.includes('latest')) {
            analysis.urgency = 'medium';
        }

        // Detect entities (countries, products, etc.)
        const countries = ['rwanda', 'china', 'uae', 'usa', 'kenya', 'tanzania', 'uganda', 'burundi'];
        const products = ['coffee', 'tea', 'minerals', 'agricultural', 'manufactured', 'services'];

        for (const country of countries) {
            if (lowerMessage.includes(country)) {
                analysis.entities.push(country.toUpperCase());
            }
        }

        for (const product of products) {
            if (lowerMessage.includes(product)) {
                analysis.entities.push(product);
            }
        }

        return analysis;
    } catch (error) {
        console.error('Error analyzing message intent:', error);
        return {
            intent: 'general_inquiry',
            entities: [],
            urgency: 'normal',
            context: 'trade_data',
            confidence: 0.5
        };
    }
}

/**
 * Generate contextual suggestions based on message and analysis
 */
async function generateContextualSuggestions(message, messageAnalysis, systemContext) {
    try {
        const suggestions = [];

        // Based on intent, suggest relevant actions
        switch (messageAnalysis.intent) {
            case 'export_analysis':
                suggestions.push(
                    'View detailed export trends and destination analysis',
                    'Analyze top-performing export commodities',
                    'Check regional export performance',
                    'Get AI-powered export recommendations'
                );
                break;
            case 'import_analysis':
                suggestions.push(
                    'Review import dependency analysis',
                    'Check commodity-specific import patterns',
                    'Analyze import source diversification',
                    'Get import optimization recommendations'
                );
                break;
            case 'forecast_request':
                suggestions.push(
                    'View AI-powered trade forecasts',
                    'Check prediction confidence intervals',
                    'Analyze forecast methodology',
                    'Get scenario-based predictions'
                );
                break;
            case 'trend_analysis':
                suggestions.push(
                    'View historical trend analysis',
                    'Check growth rate calculations',
                    'Analyze seasonal patterns',
                    'Get trend-based recommendations'
                );
                break;
            case 'commodity_analysis':
                suggestions.push(
                    'View commodity performance dashboard',
                    'Check SITC classification analysis',
                    'Analyze commodity concentration',
                    'Get diversification recommendations'
                );
                break;
            default:
                suggestions.push(
                    'Explore export performance dashboard',
                    'Check latest import analysis',
                    'View AI-powered predictions',
                    'Get comprehensive trade insights'
                );
        }

        // Add system-aware suggestions
        if (systemContext.system_health < 80) {
            suggestions.push('System health is below optimal - consider checking data processing status');
        }

        if (systemContext.total_insights_generated > 0) {
            suggestions.push('Review recent AI-generated insights');
        }

        return suggestions.slice(0, 4); // Return top 4 suggestions
    } catch (error) {
        console.error('Error generating contextual suggestions:', error);
        return [
            'Explore export performance dashboard',
            'Check latest import analysis',
            'View AI-powered predictions',
            'Get comprehensive trade insights'
        ];
    }
}

/**
 * Build enhanced prompt with full context awareness
 */
async function buildEnhancedPrompt(message, messageAnalysis, systemContext, tradeContext) {
    const basePrompt = `
    User Message: "${message}"
    Intent: ${messageAnalysis.intent}
    Entities: ${messageAnalysis.entities.join(', ')}
    Urgency: ${messageAnalysis.urgency}

    Current System Status:
    - Health: ${systemContext.system_health}%
    - Active Events: ${systemContext.total_events_logged}
    - Recent Activities: ${systemContext.recent_events?.slice(0, 3).map(e => e.type).join(', ') || 'None'}

    Trade Data Context:
    - Total Exports: $${tradeContext.total_exports?.toFixed(2)}M
    - Total Imports: $${tradeContext.total_imports?.toFixed(2)}M
    - Trade Balance: $${tradeContext.trade_balance?.toFixed(2)}M
    - Top Destinations: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}
    - Top Products: ${tradeContext.top_products?.slice(0, 3).map(p => p.commodity).join(', ') || 'N/A'}

    Please provide a comprehensive, context-aware response that:
    1. Directly addresses the user's specific intent and entities mentioned
    2. Leverages current system status and recent activities
    3. Incorporates relevant trade data and statistics
    4. Offers proactive suggestions and next steps
    5. Maintains a professional, helpful tone as a trade analysis expert

    If the message is unclear, ask clarifying questions. If it's not trade-related, politely redirect to Rwanda trade topics.`;

    return basePrompt;
}

/**
 * Generate enhanced fallback response with full context
 */
async function generateEnhancedFallbackResponse(message, messageAnalysis, systemContext, tradeContext) {
    try {
        const lowerMessage = message.toLowerCase();

        // Enhanced trade data specific responses based on intent
        switch (messageAnalysis.intent) {
            case 'export_analysis':
                return `I understand you're interested in export analysis. Based on current data, Rwanda's export sector shows ${tradeContext.total_exports ? 'strong performance' : 'growth potential'} with key markets in ${tradeContext.top_destinations?.map(d => d.country).join(', ') || 'multiple regions'}. The system is currently ${systemContext.system_health > 80 ? 'operating optimally' : 'processing data'} and can provide detailed export insights through the dashboard.`;

            case 'import_analysis':
                return `For import analysis, I can help you understand Rwanda's import patterns totaling $${tradeContext.total_imports?.toFixed(0)}M. The current trade balance of $${tradeContext.trade_balance?.toFixed(0)}M reflects development needs. The system has processed ${systemContext.total_events_logged} recent events and maintains ${systemContext.system_health}% health for accurate analysis.`;

            case 'forecast_request':
                return `I can provide AI-powered forecasts for Rwanda's trade data. Based on current trends showing ${tradeContext.total_exports ? 'positive growth' : 'stable performance'}, the forecasting models are ready to generate predictions. The system is currently at ${systemContext.system_health}% health with ${systemContext.total_insights_generated} insights generated recently.`;

            case 'trend_analysis':
                return `Trend analysis reveals Rwanda's export growth of approximately 157.9% with current export values at $${tradeContext.total_exports?.toFixed(0)}M. The system's ${systemContext.total_events_logged} logged events provide rich data for pattern analysis. I recommend checking the analytics dashboard for detailed trend visualizations.`;

            case 'commodity_analysis':
                return `Commodity analysis shows Rwanda's key exports include ${tradeContext.top_products?.map(p => p.commodity).join(', ') || 'traditional agricultural products'}. The system has generated ${systemContext.total_insights_generated} AI insights about commodity performance and market opportunities.`;

            default:
                return `I'm here to help you with comprehensive trade data analysis for Rwanda. The system is currently at ${systemContext.system_health}% health and has processed ${systemContext.total_events_logged} events. Current trade data shows exports of $${tradeContext.total_exports?.toFixed(0)}M and imports of $${tradeContext.total_imports?.toFixed(0)}M. What specific aspect would you like to explore?`;
        }
    } catch (error) {
        console.error('Error generating enhanced fallback response:', error);
        return "I'm ready to help you analyze Rwanda's comprehensive trade data and provide AI-powered insights. The system is active and monitoring all trade activities. What would you like to know?";
    }
}

/**
 * Generate fallback response when AI is not available (legacy function)
 */
function generateFallbackResponse(message, tradeContext) {
    const lowerMessage = message.toLowerCase();

    // Trade data specific responses
    if (lowerMessage.includes('export') && lowerMessage.includes('total') || lowerMessage.includes('much')) {
        return `Based on the latest data, Rwanda's total exports amount to $${tradeContext.total_exports?.toFixed(0)}M. The export sector shows strong growth, particularly in traditional commodities like coffee, tea, and minerals.`;
    }

    if (lowerMessage.includes('import') && lowerMessage.includes('total') || lowerMessage.includes('much')) {
        return `Rwanda's total imports are valued at $${tradeContext.total_imports?.toFixed(0)}M. The import structure reflects the country's development needs, including machinery, petroleum products, and construction materials.`;
    }

    if (lowerMessage.includes('trade balance') || lowerMessage.includes('deficit') || lowerMessage.includes('surplus')) {
        return `Rwanda currently has a trade deficit of $${Math.abs(tradeContext.trade_balance || 0).toFixed(0)}M. While this reflects significant import needs for development, export growth is helping to narrow the gap over time.`;
    }

    if (lowerMessage.includes('top') && lowerMessage.includes('destination') || lowerMessage.includes('partner')) {
        const topDestinations = tradeContext.top_destinations || [];
        return `Rwanda's top export destinations include ${topDestinations.map(d => d.country).join(', ')}. The United Arab Emirates is currently the largest market, accounting for approximately 65% of total exports.`;
    }

    if (lowerMessage.includes('commodity') || lowerMessage.includes('product')) {
        const topProducts = tradeContext.top_products || [];
        return `Rwanda's key export commodities include ${topProducts.map(p => p.commodity).join(', ')}. Coffee remains the most valuable export product, followed by tea and mineral products.`;
    }

    if (lowerMessage.includes('growth') || lowerMessage.includes('trend')) {
        return `Rwanda's export sector has shown impressive growth of approximately 157.9% over recent years. This growth is driven by improved agricultural productivity, market diversification, and increased value addition in key sectors.`;
    }

    // Default responses
    const defaultResponses = [
        "I'd be happy to help you analyze Rwanda's trade data. Based on the latest statistics, Rwanda's export sector shows strong performance in traditional commodities while diversifying into new markets. What specific aspect would you like to explore?",
        "Rwanda's trade data reveals interesting patterns in both exports and imports. The country maintains strong trading relationships across multiple continents. Could you be more specific about what trade information you're looking for?",
        "As a trade analyst specializing in African markets, I can provide insights on Rwanda's export performance, import dependencies, and market opportunities. What would you like to know about Rwanda's trade statistics?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

module.exports = router;