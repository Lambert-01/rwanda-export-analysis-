/**
 * OpenAI Service for Rwanda Export Explorer
 * Provides AI-powered insights and descriptions for trade data
 */

const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || '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',
            baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
        });
        console.log('🤖 OpenAI service initialized');
    }

    /**
     * Generate comprehensive analysis description
     */
    async generateAnalysisDescription(data, context = 'general') {
        try {
            console.log('🤖 Generating analysis description for:', context);

            const prompt = this.buildAnalysisPrompt(data, context);

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
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
                max_tokens: 800,
                temperature: 0.7
            });

            const description = completion.choices[0].message.content;
            console.log('✅ Analysis description generated successfully');

            return {
                success: true,
                description: description,
                context: context,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error generating analysis description:', error);
            return {
                success: false,
                error: error.message,
                fallback_description: this.getFallbackDescription(context)
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

            const insights = completion.choices[0].message.content;
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

            const recommendations = completion.choices[0].message.content;
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
                analysis: completion.choices[0].message.content,
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
                insights: completion.choices[0].message.content,
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

module.exports = openaiService;