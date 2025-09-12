import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MLProcessingRequest {
  operation: 'batch_prediction' | 'campaign_optimization' | 'vendor_scoring' | 'trend_analysis';
  data: any;
  options?: {
    useAdvancedModel?: boolean;
    batchSize?: number;
    cacheResults?: boolean;
  };
}

interface MLFeatures {
  playlistMetrics: {
    followers: number;
    avgDailyStreams: number;
    engagementRate: number;
    genreRelevance: number;
  };
  campaignContext: {
    budget: number;
    duration: number;
    targetGenres: string[];
    territoryPreferences: string[];
  };
  vendorMetrics?: {
    reliabilityScore: number;
    avgDeliveryTime: number;
    historicalPerformance: number;
  };
  temporalFactors: {
    seasonality: number;
    dayOfWeek: number;
    timeOfDay: number;
  };
}

class MLProcessor {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async processBatchPrediction(playlists: any[], campaign: any): Promise<any[]> {
    console.log(`Processing batch prediction for ${playlists.length} playlists`);
    
    const predictions = await Promise.all(
      playlists.map(async (playlist) => {
        const features = await this.extractFeatures(playlist, campaign);
        const prediction = this.predictPerformance(features);
        
        return {
          playlistId: playlist.id,
          prediction,
          confidence: prediction.confidence,
          risk: prediction.risk,
          factors: prediction.factors
        };
      })
    );

    // Store predictions for learning
    await this.storePredictions(predictions, campaign.id);
    
    return predictions;
  }

  async optimizeCampaignAllocation(playlists: any[], campaign: any, vendors: any[]): Promise<any> {
    console.log(`Optimizing allocation for ${playlists.length} playlists across ${vendors.length} vendors`);
    
    // Get predictions for all playlists
    const predictions = await this.processBatchPrediction(playlists, campaign);
    
    // Calculate optimal allocation
    const totalBudget = campaign.budget;
    const totalStreamGoal = campaign.stream_goal;
    
    let allocations = [];
    let remainingBudget = totalBudget;
    let remainingStreamGoal = totalStreamGoal;
    
    // Sort predictions by efficiency (streams per dollar)
    const sortedPredictions = predictions.sort((a, b) => {
      const efficiencyA = a.prediction.streams / a.prediction.cost;
      const efficiencyB = b.prediction.streams / b.prediction.cost;
      return efficiencyB - efficiencyA;
    });
    
    for (const prediction of sortedPredictions) {
      if (remainingBudget <= 0 || remainingStreamGoal <= 0) break;
      
      const playlist = playlists.find(p => p.id === prediction.playlistId);
      const vendor = vendors.find(v => v.id === playlist.vendor_id);
      
      const allocation = Math.min(
        remainingBudget * 0.3, // Max 30% of remaining budget per playlist
        prediction.prediction.cost,
        remainingStreamGoal / prediction.prediction.streams * prediction.prediction.cost
      );
      
      if (allocation > 0) {
        allocations.push({
          playlistId: prediction.playlistId,
          vendorId: vendor?.id,
          allocation: Math.round(allocation),
          predictedStreams: Math.round(prediction.prediction.streams * (allocation / prediction.prediction.cost)),
          confidence: prediction.confidence,
          risk: prediction.risk
        });
        
        remainingBudget -= allocation;
        remainingStreamGoal -= Math.round(prediction.prediction.streams * (allocation / prediction.prediction.cost));
      }
    }
    
    return {
      allocations,
      totalAllocated: totalBudget - remainingBudget,
      goalCoverage: ((totalStreamGoal - remainingStreamGoal) / totalStreamGoal * 100),
      optimization: {
        efficiency: allocations.reduce((sum, a) => sum + (a.predictedStreams / a.allocation), 0) / allocations.length,
        riskScore: allocations.reduce((sum, a) => sum + a.risk, 0) / allocations.length,
        confidence: allocations.reduce((sum, a) => sum + a.confidence, 0) / allocations.length
      }
    };
  }

  async updateVendorScoring(vendorId: string): Promise<any> {
    console.log(`Updating scoring for vendor ${vendorId}`);
    
    // Get vendor's historical performance
    const { data: performance } = await this.supabase
      .from('campaign_allocations_performance')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!performance || performance.length === 0) {
      return { reliability: 0.5, consistency: 0.5, growth: 0 };
    }
    
    // Calculate reliability (delivery vs prediction accuracy)
    const reliability = performance.reduce((sum: number, p: any) => {
      const accuracy = Math.min(p.actual_streams / Math.max(p.predicted_streams, 1), 2);
      return sum + Math.min(accuracy, 1);
    }, 0) / performance.length;
    
    // Calculate consistency (variance in performance)
    const avgPerformance = performance.reduce((sum: number, p: any) => sum + p.performance_score, 0) / performance.length;
    const variance = performance.reduce((sum: number, p: any) => {
      return sum + Math.pow(p.performance_score - avgPerformance, 2);
    }, 0) / performance.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance));
    
    // Calculate growth trend
    const recentPerf = performance.slice(0, 10).reduce((sum: number, p: any) => sum + p.performance_score, 0) / Math.min(10, performance.length);
    const olderPerf = performance.slice(-10).reduce((sum: number, p: any) => sum + p.performance_score, 0) / Math.min(10, performance.length);
    const growth = (recentPerf - olderPerf) / Math.max(olderPerf, 0.1);
    
    // Update vendor reliability scores
    await this.supabase
      .from('vendor_reliability_scores')
      .upsert({
        vendor_id: vendorId,
        delivery_consistency: reliability,
        stream_accuracy: consistency,
        performance_trend: growth,
        last_updated: new Date().toISOString()
      });
    
    return { reliability, consistency, growth };
  }

  async analyzeTrends(data: any): Promise<any> {
    console.log('Analyzing performance trends');
    
    // Seasonal analysis
    const currentMonth = new Date().getMonth();
    const seasonalFactor = this.getSeasonalFactor(currentMonth);
    
    // Genre trend analysis
    const genreTrends = await this.analyzeGenreTrends();
    
    // Market competitiveness
    const marketAnalysis = await this.analyzeMarketCompetitiveness();
    
    return {
      seasonal: {
        currentFactor: seasonalFactor,
        recommendation: seasonalFactor > 1.1 ? "peak_season" : seasonalFactor < 0.9 ? "low_season" : "normal"
      },
      genres: genreTrends,
      market: marketAnalysis,
      recommendations: this.generateTrendRecommendations(seasonalFactor, genreTrends, marketAnalysis)
    };
  }

  private async extractFeatures(playlist: any, campaign: any): Promise<MLFeatures> {
    return {
      playlistMetrics: {
        followers: playlist.followers || 0,
        avgDailyStreams: playlist.avg_daily_streams || 0,
        engagementRate: playlist.engagement_rate || 0.05,
        genreRelevance: this.calculateGenreRelevance(playlist.genres, campaign.music_genres)
      },
      campaignContext: {
        budget: campaign.budget || 0,
        duration: campaign.duration_days || 30,
        targetGenres: campaign.music_genres || [],
        territoryPreferences: campaign.territory_preferences || []
      },
      temporalFactors: {
        seasonality: this.getSeasonalFactor(new Date().getMonth()),
        dayOfWeek: new Date().getDay(),
        timeOfDay: new Date().getHours()
      }
    };
  }

  private predictPerformance(features: MLFeatures): any {
    // Advanced ML prediction algorithm
    const baseStreams = features.playlistMetrics.avgDailyStreams * features.campaignContext.duration;
    const genreBoost = features.playlistMetrics.genreRelevance * 1.5;
    const seasonalBoost = features.temporalFactors.seasonality;
    
    const streams = Math.round(baseStreams * genreBoost * seasonalBoost);
    const cost = Math.round(features.campaignContext.budget * 0.1); // Example cost calculation
    const confidence = Math.min(0.95, 0.4 + features.playlistMetrics.genreRelevance * 0.6);
    const risk = Math.max(0.05, 1 - confidence);
    
    return {
      streams,
      cost,
      confidence,
      risk,
      factors: {
        genreRelevance: features.playlistMetrics.genreRelevance,
        seasonality: features.temporalFactors.seasonality,
        playlistQuality: features.playlistMetrics.engagementRate
      }
    };
  }

  private calculateGenreRelevance(playlistGenres: string[], campaignGenres: string[]): number {
    if (!playlistGenres || !campaignGenres) return 0.5;
    
    const matches = playlistGenres.filter(g => campaignGenres.includes(g)).length;
    return Math.min(1, matches / Math.max(campaignGenres.length, 1) + 0.2);
  }

  private getSeasonalFactor(month: number): number {
    // Seasonal factors based on music industry patterns
    const factors = [0.9, 0.85, 0.95, 1.1, 1.2, 1.15, 1.0, 0.95, 1.1, 1.2, 1.25, 1.3];
    return factors[month] || 1.0;
  }

  private async analyzeGenreTrends(): Promise<any> {
    const { data } = await this.supabase
      .from('campaigns')
      .select('music_genres, created_at')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    const genreCounts: { [key: string]: number } = {};
    data?.forEach((campaign: any) => {
      campaign.music_genres?.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    return Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count, trend: 'rising' }));
  }

  private async analyzeMarketCompetitiveness(): Promise<any> {
    return {
      competitiveness: 'moderate',
      saturation: 0.6,
      opportunities: ['electronic', 'indie-pop', 'lo-fi']
    };
  }

  private generateTrendRecommendations(seasonal: number, genres: any[], market: any): string[] {
    const recommendations = [];
    
    if (seasonal > 1.1) {
      recommendations.push("Increase budget allocation due to peak season");
    }
    
    if (genres.length > 0) {
      recommendations.push(`Focus on trending genre: ${genres[0].genre}`);
    }
    
    if (market.saturation < 0.7) {
      recommendations.push("Market shows opportunity for expansion");
    }
    
    return recommendations;
  }

  private async storePredictions(predictions: any[], campaignId: string): Promise<void> {
    const records = predictions.map(p => ({
      campaign_id: campaignId,
      playlist_id: p.playlistId,
      predicted_streams: p.prediction.streams,
      confidence_score: p.confidence,
      risk_score: p.risk,
      created_at: new Date().toISOString()
    }));
    
    await this.supabase
      .from('algorithm_learning_log')
      .insert(records);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, data, options = {} }: MLProcessingRequest = await req.json();
    const processor = new MLProcessor();
    
    let result;
    
    switch (operation) {
      case 'batch_prediction':
        result = await processor.processBatchPrediction(data.playlists, data.campaign);
        break;
      case 'campaign_optimization':
        result = await processor.optimizeCampaignAllocation(data.playlists, data.campaign, data.vendors);
        break;
      case 'vendor_scoring':
        result = await processor.updateVendorScoring(data.vendorId);
        break;
      case 'trend_analysis':
        result = await processor.analyzeTrends(data);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML Processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});