/**
 * OpenAI Service for Rwanda Trade analytic system
 * Provides AI-powered insights and descriptions for trade data
 */

const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.OPENAI_MODEL || 'openai/gpt-oss-20b:free';
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
        this.apiKeyValid = false;

        if (this.apiKey && this.apiKey.startsWith('sk-or-v1-')) {
            // OpenRouter configuration
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            });
            console.log('🚀 OpenRouter service initialized with DeepSeek model');
            console.log('🎯 Model:', this.model);

            // Test API key validity on initialization
            this.testApiKey();
        } else if (this.apiKey && this.apiKey.startsWith('sk-')) {
            // OpenAI configuration
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: this.baseURL
            });
            console.log('🤖 OpenAI service initialized');
            this.apiKeyValid = true;
        } else {
            this.client = null;
            this.apiKeyValid = false;
            console.log('⚠️ No valid API key found - using fallback responses');
            console.log('💡 Add OPENAI_API_KEY to your .env file to enable AI features');
        }
    }

    /**
     * Check if OpenAI is properly configured
     */
    isConfigured() {
        return !!(this.apiKey && this.client && this.apiKeyValid);
    }

    /**
     * Test API key validity
     */
    async testApiKey() {
        try {
            console.log('🔑 Testing API key validity...');

            const testCompletion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: "Hello"
                    }
                ],
                max_tokens: 5
            });

            this.apiKeyValid = true;
            console.log('✅ API key is valid');
        } catch (error) {
            console.error('❌ API key test failed:', error.message);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 Authentication failed - API key is invalid or expired');
                console.log('💡 To fix this:');
                console.log('   1. Get a new API key from https://openrouter.ai/keys');
                console.log('   2. Or set OPENAI_API_KEY= to disable AI features');
                console.log('   3. Restart the server after updating .env');
                console.log('   4. Current key starts with:', this.apiKey.substring(0, 20) + '...');
            } else if (error.status === 429) {
                console.log('⚠️ Rate limit exceeded - too many requests');
            } else if (error.status === 403) {
                console.log('🚫 Access forbidden - check API key permissions');
            } else {
                console.log('❓ Unexpected error - check your internet connection and API key');
            }

            console.log('🔄 Switching to fallback mode');
            this.apiKeyValid = false;
            this.client = null;
        }
    }

    /**
     * Generate comprehensive analysis description
     */
    async generateAnalysisDescription(data, context = 'general') {
        // Check if OpenAI is configured
        if (!this.isConfigured()) {
            console.log('🤖 OpenAI not configured, using fallback description');
            return {
                success: true,
                description: this.getFallbackDescription(context),
                context: context,
                generated_at: new Date().toISOString(),
                using_fallback: true
            };
        }

        try {
            console.log('🤖 Generating analysis description for:', context);

            const prompt = this.buildAnalysisPrompt(data, context);

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert trade analyst specializing in African economic data. Provide detailed, professional analysis of Rwanda's trade data with actionable insights."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            // Clean the AI response to remove any <think> tags that may be present
            // Some reasoning models (DeepSeek, Qwen) include internal reasoning in <think> tags
            const rawDescription = completion.choices[0].message.content;
            const description = cleanAIResponse(rawDescription);
            console.log('✅ Analysis description generated successfully');

            return {
                success: true,
                description: description,
                context: context,
                generated_at: new Date().toISOString(),
                using_ai: true
            };

        } catch (error) {
            console.error('❌ Error generating analysis description:', error);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 Authentication failed - disabling AI features and using fallback');
                console.log('💡 Current API key starts with:', this.apiKey?.substring(0, 20) + '...');
                this.apiKeyValid = false;
                this.client = null;
            } else if (error.status === 429) {
                console.log('⚠️ Rate limit exceeded during analysis generation');
            } else if (error.status === 403) {
                console.log('🚫 Access forbidden during analysis generation');
            }

            return {
                success: false,
                error: error.message,
                fallback_description: this.getFallbackDescription(context),
                using_fallback: true,
                debug_info: {
                    api_configured: this.isConfigured(),
                    api_key_valid: this.apiKeyValid,
                    model: this.model,
                    base_url: this.baseURL
                }
            };
        }
    }

    /**
     * Generate chart-specific insights
     */
    async generateChartInsights(chartType, data) {
        try {
            console.log('📊 Generating chart insights for:', chartType);

            const prompt = this.buildChartPrompt(chartType, data);

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a data visualization expert. Analyze chart data and provide meaningful insights about Rwanda's trade patterns."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.6
            });

            // Clean the AI response to remove any <think> tags that may be present
            const rawInsights = completion.choices[0].message.content;
            const insights = cleanAIResponse(rawInsights);
            console.log('✅ Chart insights generated successfully');

            return {
                success: true,
                insights: insights,
                chart_type: chartType,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error generating chart insights:', error);
            return {
                success: false,
                error: error.message,
                fallback_insights: this.getFallbackChartInsights(chartType)
            };
        }
    }

    /**
     * Generate recommendations based on trade data
     */
    async generateRecommendations(data) {
        try {
            console.log('💡 Generating AI recommendations...');

            const prompt = this.buildRecommendationPrompt(data);

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a trade policy advisor specializing in African markets. Provide strategic recommendations for Rwanda's trade development."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 600,
                temperature: 0.7
            });

            // Clean the AI response to remove any <think> tags that may be present
            const rawRecommendations = completion.choices[0].message.content;
            const recommendations = cleanAIResponse(rawRecommendations);
            console.log('✅ Recommendations generated successfully');

            return {
                success: true,
                recommendations: recommendations,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error generating recommendations:', error);
            return {
                success: false,
                error: error.message,
                fallback_recommendations: this.getFallbackRecommendations()
            };
        }
    }

    /**
     * Build analysis prompt based on context
     */
    buildAnalysisPrompt(data, context) {
        const baseData = {
            total_exports: data.total_exports || 0,
            total_imports: data.total_imports || 0,
            trade_balance: data.trade_balance || 0,
            top_destinations: data.top_destinations || [],
            top_products: data.top_products || []
        };

        switch (context) {
            case 'overview':
                return `Analyze Rwanda's trade overview with the following data:
                - Total Exports: $${baseData.total_exports.toFixed(2)}M
                - Total Imports: $${baseData.total_imports.toFixed(2)}M
                - Trade Balance: $${baseData.trade_balance.toFixed(2)}M
                - Top Export Destinations: ${baseData.top_destinations.slice(0, 3).map(d => d.country).join(', ')}
                - Top Products: ${baseData.top_products.slice(0, 3).map(p => p.commodity).join(', ')}

                Provide a comprehensive analysis of Rwanda's trade performance, key trends, and economic implications.`;

            case 'exports':
                return `Analyze Rwanda's export performance:
                - Total Export Value: $${baseData.total_exports.toFixed(2)}M
                - Top Destinations: ${baseData.top_destinations.map(d => `${d.country} ($${d.export_value.toFixed(2)}M)`).join(', ')}
                - Key Products: ${baseData.top_products.map(p => `${p.commodity} ($${p.export_value.toFixed(2)}M)`).join(', ')}

                Provide detailed insights on export trends, market opportunities, and growth potential.`;

            case 'imports':
                return `Analyze Rwanda's import patterns:
                - Total Import Value: $${baseData.total_imports.toFixed(2)}M
                - Trade Balance: $${baseData.trade_balance.toFixed(2)}M
                - Import Dependency Ratio: ${((baseData.total_imports / (baseData.total_exports + baseData.total_imports)) * 100).toFixed(1)}%

                Provide insights on import dependencies, supply chain risks, and opportunities for import substitution.`;

            default:
                return `Provide a comprehensive analysis of Rwanda's trade data focusing on key economic indicators and market trends.`;
        }
    }

    /**
     * Build chart-specific prompt
     */
    buildChartPrompt(chartType, data) {
        switch (chartType) {
            case 'trade_balance':
                return `Analyze this trade balance chart data showing quarterly trade balance trends.
                Data shows: ${JSON.stringify(data, null, 2)}

                What patterns do you observe? What are the implications for Rwanda's economy?`;

            case 'export_destinations':
                return `Analyze the export destinations data showing Rwanda's top trading partners.
                Key destinations: ${JSON.stringify(data.slice(0, 5), null, 2)}

                What does this tell us about Rwanda's export strategy and market diversification?`;

            case 'commodity_performance':
                return `Analyze commodity performance data showing Rwanda's key export products.
                Top commodities: ${JSON.stringify(data.slice(0, 5), null, 2)}

                What insights can you provide about Rwanda's export product concentration and diversification opportunities?`;

            default:
                return `Provide insights on this trade visualization data: ${JSON.stringify(data, null, 2)}`;
        }
    }

    /**
     * Build recommendation prompt
     */
    buildRecommendationPrompt(data) {
        return `Based on Rwanda's trade data:
        - Export Value: $${data.total_exports?.toFixed(2)}M
        - Import Value: $${data.total_imports?.toFixed(2)}M
        - Trade Balance: $${data.trade_balance?.toFixed(2)}M
        - Top Export Markets: ${data.top_destinations?.slice(0, 3).map(d => d.country).join(', ')}
        - Key Products: ${data.top_products?.slice(0, 3).map(p => p.commodity).join(', ')}

        Provide strategic recommendations for improving Rwanda's trade performance, market diversification, and economic growth. Consider Rwanda's Vision 2050 goals and regional integration opportunities.`;
    }

    /**
     * Get fallback descriptions when OpenAI fails
     */
    getFallbackDescription(context) {
        const fallbacks = {
            overview: "Rwanda's trade data shows a dynamic economy with opportunities for growth in key sectors. The trade balance reflects both challenges and opportunities for economic development.",
            exports: "Rwanda's export sector demonstrates strength in traditional commodities while showing potential for diversification into new markets and products.",
            imports: "Import patterns indicate Rwanda's integration into global value chains and highlight opportunities for domestic production and supply chain development."
        };
        return fallbacks[context] || "Trade analysis provides valuable insights for economic policy and business strategy development.";
    }

    /**
     * Get fallback chart insights
     */
    getFallbackChartInsights(chartType) {
        const fallbacks = {
            trade_balance: "Trade balance trends indicate the relationship between exports and imports, showing periods of surplus and deficit that reflect economic conditions.",
            export_destinations: "Export destination analysis reveals market concentration patterns and opportunities for geographic diversification.",
            commodity_performance: "Commodity performance shows product specialization and identifies opportunities for value addition and diversification."
        };
        return fallbacks[chartType] || "Chart analysis provides visual insights into trade patterns and performance metrics.";
    }

    /**
     * Get fallback recommendations
     */
    getFallbackRecommendations() {
        return `Based on the trade data analysis, consider these strategic approaches:
        1. Focus on export market diversification to reduce dependency on single markets
        2. Explore value addition opportunities in key commodity sectors
        3. Strengthen regional trade integration within the EAC
        4. Develop policies to support import substitution where feasible
        5. Invest in trade facilitation and logistics infrastructure`;
    }

    /**
     * Generate detailed country analysis
     */
    async generateCountryAnalysis(countryData) {
        try {
            console.log('🌍 Generating country analysis for:', countryData.country);

            const prompt = `Analyze ${countryData.country}'s trade relationship with Rwanda:
            - Export Value: $${countryData.export_value?.toFixed(2)}M
            - Market Share: ${countryData.percentage?.toFixed(1)}%
            - Growth Trend: ${countryData.growth_rate?.toFixed(1)}%
            - Trade Type: ${countryData.trade_type || 'Export destination'}

            Provide insights on this trading relationship and future opportunities.`;

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a trade relations expert specializing in African markets and regional integration."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.6
            });

            return {
                success: true,
                analysis: cleanAIResponse(completion.choices[0].message.content),
                country: countryData.country
            };

        } catch (error) {
            console.error('❌ Error generating country analysis:', error);
            return {
                success: false,
                error: error.message,
                fallback_analysis: `${countryData.country} represents an important trading partner for Rwanda, contributing to regional economic integration and market diversification.`
            };
        }
    }

    /**
     * Generate commodity insights
     */
    async generateCommodityInsights(commodityData) {
        try {
            console.log('📦 Generating commodity insights for:', commodityData.commodity);

            const prompt = `Analyze ${commodityData.commodity} as an export product:
            - Export Value: $${commodityData.export_value?.toFixed(2)}M
            - Market Share: ${commodityData.percentage?.toFixed(1)}%
            - Global Competitiveness: ${commodityData.competitive_advantage ? 'Strong' : 'Developing'}

            Provide insights on market position, competitive advantages, and growth opportunities.`;

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a commodity market analyst specializing in African agricultural and mineral products."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 250,
                temperature: 0.6
            });

            return {
                success: true,
                insights: cleanAIResponse(completion.choices[0].message.content),
                commodity: commodityData.commodity
            };

        } catch (error) {
            console.error('❌ Error generating commodity insights:', error);
            return {
                success: false,
                error: error.message,
                fallback_insights: `${commodityData.commodity} represents a key export product with opportunities for value addition and market expansion.`
            };
        }
    }
}

// Create singleton instance
const openaiService = new OpenAIService();

/**
 * Utility function to clean AI responses by removing reasoning tags
 * Some models (like DeepSeek, Qwen) include internal reasoning in <think> tags
 * This function removes these tags to provide clean responses to users
 *
 * @param {string} response - Raw AI response that may contain <think> tags
 * @returns {string} Cleaned response without reasoning tags
 */
function cleanAIResponse(response) {
    if (typeof response !== 'string') {
        return response;
    }

    // Remove <think> and </think> tags and their content
    // This regex matches everything between <think> and </think> including the tags themselves
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Trim any extra whitespace that might be left after removing the tags
    return cleanedResponse.trim();
}

module.exports = openaiService;
module.exports.cleanAIResponse = cleanAIResponse;