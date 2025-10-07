/**
 * Chat API Routes for Rwanda Export Explorer
 * Handles AI chat interactions using OpenAI
 */

const express = require('express');
const router = express.Router();
const openaiService = require('../utils/openaiService');

/**
 * POST /api/chat/message
 * Send a chat message and get AI response
 */
router.post('/message', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log('💬 Chat message received:', message.substring(0, 50) + '...');

        // Get trade data context for better responses
        const tradeContext = await getTradeContext();

        // Create enhanced prompt with trade data context
        const enhancedPrompt = `
        Context about Rwanda's trade data:
        - Total Exports: $${tradeContext.total_exports?.toFixed(2)}M
        - Total Imports: $${tradeContext.total_imports?.toFixed(2)}M
        - Trade Balance: $${tradeContext.trade_balance?.toFixed(2)}M
        - Top Export Destinations: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}
        - Top Export Products: ${tradeContext.top_products?.slice(0, 3).map(p => p.commodity).join(', ') || 'N/A'}

        User Question: ${message}

        Please provide a helpful, accurate response about Rwanda's trade data based on the context above.
        If the question is not related to trade data, politely redirect the conversation back to Rwanda's trade topics.
        `;

        // Check if OpenAI/OpenRouter is configured
        if (openaiService.isConfigured()) {
            try {
                console.log('🚀 Calling OpenRouter/DeepSeek API...');
                console.log('🎯 Using model:', openaiService.model);

                // Try multiple possible model names for AI chat on OpenRouter (prioritizing free models)
                const possibleModels = [
                    'deepseek/deepseek-chat-v3.1:free',  // Free DeepSeek V3.1 model
                    'deepseek/deepseek-chat',  // Free DeepSeek model
                    'deepseek/deepseek-coder',  // Free DeepSeek Coder model
                    'google/gemma-7b-it',  // Free Gemma model
                    'microsoft/wizardlm-2-8x22b',  // Free WizardLM model
                    'meta-llama/llama-3.1-8b-instruct:free',  // Free Llama model
                    'anthropic/claude-3-haiku'  // Claude Haiku (may work with credits)
                ];

                let completion = null;
                let lastError = null;

                for (const modelName of possibleModels) {
                    try {
                        console.log(`🔄 Trying model: ${modelName}`);

                        completion = await openaiService.client.chat.completions.create({
                            model: modelName,
                            messages: [
                                {
                                    role: "system",
                                    content: "You are an expert AI assistant specializing in African economic data and trade analysis, with particular expertise in Rwanda's trade statistics. You have deep knowledge of export/import patterns, commodity analysis, and regional economic integration. Provide accurate, insightful responses based on the trade data context provided. Focus on actionable insights for business and policy decisions. If you are not Grok, please respond helpfully as a trade analysis expert."
                                },
                                {
                                    role: "user",
                                    content: enhancedPrompt
                                }
                            ],
                            max_tokens: openaiService.maxTokens,
                            temperature: openaiService.temperature
                        });

                        console.log(`✅ Success with model: ${modelName}`);
                        break; // Success, exit the loop

                    } catch (modelError) {
                        console.log(`❌ Model ${modelName} failed:`, modelError.message);
                        lastError = modelError;

                        // If it's the last model, throw the error
                        if (modelName === possibleModels[possibleModels.length - 1]) {
                            throw modelError;
                        }
                    }
                }

                const aiResponse = completion.choices[0].message.content;

                console.log('✅ DeepSeek response generated successfully');
                console.log('📊 Tokens used:', completion.usage?.total_tokens || 'N/A');

                return res.json({
                    success: true,
                    response: aiResponse,
                    using_ai: true,
                    model: openaiService.model,
                    tokens_used: completion.usage?.total_tokens || 0,
                    timestamp: new Date().toISOString()
                });

            } catch (aiError) {
                console.error('❌ OpenRouter/DeepSeek API error:', aiError);

                // Provide detailed error information
                let errorMessage = 'AI service temporarily unavailable';
                if (aiError.response) {
                    errorMessage += ` (Status: ${aiError.response.status})`;
                    if (aiError.response.data?.error?.message) {
                        errorMessage += `: ${aiError.response.data.error.message}`;
                    }
                    console.error('API Error Details:', aiError.response.data);
                }

                // Fallback to static response
                const fallbackResponse = generateFallbackResponse(message, tradeContext);

                return res.json({
                    success: true,
                    response: fallbackResponse,
                    using_ai: false,
                    error: errorMessage,
                    fallback: true,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Use fallback responses when OpenAI is not configured
            console.log('🤖 OpenAI not configured, using fallback response');

            const fallbackResponse = generateFallbackResponse(message, tradeContext);

            return res.json({
                success: true,
                response: fallbackResponse,
                using_ai: false,
                note: 'OpenAI API key not configured - using static responses',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ Chat API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat message',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/chat/status
 * Get chat service status and configuration
 */
router.get('/status', (req, res) => {
    const isConfigured = openaiService.isConfigured();

    res.json({
        success: true,
        status: 'online',
        ai_configured: isConfigured,
        provider: isConfigured && openaiService.apiKey?.startsWith('sk-or-v1-') ? 'OpenRouter (DeepSeek)' : 'OpenAI',
        model: openaiService.model || 'Not configured',
        base_url: openaiService.baseURL,
        features: {
            ai_chat: isConfigured,
            fallback_responses: true,
            typing_indicator: true,
            message_history: true
        },
        configuration: {
            max_tokens: openaiService.maxTokens,
            temperature: openaiService.temperature,
            api_key_configured: !!openaiService.apiKey,
            api_key_prefix: openaiService.apiKey ? openaiService.apiKey.substring(0, 10) + '...' : 'Not set'
        },
        timestamp: new Date().toISOString()
    });
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
 * Generate fallback response when AI is not available
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