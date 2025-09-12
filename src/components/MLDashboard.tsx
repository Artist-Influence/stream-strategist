// Advanced ML Dashboard for Algorithm & Learning Monitoring

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Settings,
  Activity,
  Gauge,
  Lightbulb
} from "lucide-react";
import { useAdvancedLearningMetrics, useDynamicAlgorithmOptimization } from "@/hooks/useAdvancedLearning";
import { useMLModelAnalysis } from "@/hooks/useMLPerformancePredictor";
import { useVendorAutoAdjustmentRecommendations, useApplyVendorAutoAdjustments } from "@/hooks/useVendorAutoAdjustment";
import { useMLAlerts, useMLPerformanceTrends, useMLSystemHealth } from "@/hooks/useMLDashboardData";
import { useState } from "react";

export function MLDashboard({ className }: { className?: string }) {
  const { data: learningMetrics, isLoading: metricsLoading } = useAdvancedLearningMetrics();
  const { data: modelAnalysis, isLoading: analysisLoading } = useMLModelAnalysis();
  const { data: vendorRecommendations, isLoading: recommendationsLoading } = useVendorAutoAdjustmentRecommendations();
  const { data: mlAlerts } = useMLAlerts();
  const { data: performanceTrends } = useMLPerformanceTrends();
  const { data: systemHealth } = useMLSystemHealth();
  
  const optimizeModel = useDynamicAlgorithmOptimization();
  const applyVendorAdjustments = useApplyVendorAutoAdjustments();
  
  const [activeTab, setActiveTab] = useState("overview");

  if (metricsLoading || analysisLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Loading ML Dashboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleOptimizeModel = () => {
    optimizeModel.mutate();
  };

  const handleApplyAdjustments = () => {
    if (vendorRecommendations) {
      applyVendorAdjustments.mutate({
        recommendations: vendorRecommendations.filter(r => r.riskLevel === 'low'),
        autoApprove: false,
        maxAdjustments: 5
      });
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            ML Learning Dashboard
          </h2>
          <p className="text-muted-foreground">
            Advanced machine learning monitoring and optimization control
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleOptimizeModel}
            disabled={optimizeModel.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${optimizeModel.isPending ? 'animate-spin' : ''}`} />
            Optimize Model
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="model">Model Performance</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
          <TabsTrigger value="insights">Insights & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Algorithm Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Algorithm Accuracy</p>
                    <p className="text-2xl font-bold text-success">
                      {learningMetrics ? (learningMetrics.algorithmPerformance.accuracy * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-success" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={learningMetrics ? learningMetrics.algorithmPerformance.accuracy * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {learningMetrics ? learningMetrics.algorithmPerformance.adaptationRate.toFixed(1) : '0'}/day
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <Badge variant="outline" className="mt-2">
                  {learningMetrics?.algorithmPerformance.adaptationRate > 2 ? 'High' : 'Normal'} Activity
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Model Confidence</p>
                    <p className="text-2xl font-bold text-warning">
                      {modelAnalysis ? (modelAnalysis.accuracy * 100).toFixed(0) : '0'}%
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-warning" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={modelAnalysis ? modelAnalysis.accuracy * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Optimizations</p>
                    <p className="text-2xl font-bold">
                      {learningMetrics?.optimizationOpportunities.filter(o => o.priority === 'high').length || 0}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-warning" />
                </div>
                <Badge variant="destructive" className="mt-2">
                  {learningMetrics?.optimizationOpportunities.filter(o => o.priority === 'high').length || 0} High Priority
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Recent Learning Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recent Learning Insights
              </CardTitle>
              <CardDescription>
                Latest algorithmic discoveries and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningMetrics?.optimizationOpportunities.slice(0, 3).map((opportunity, index) => (
                  <Alert key={index} className={`border-l-4 ${
                    opportunity.priority === 'high' ? 'border-l-destructive' : 
                    opportunity.priority === 'medium' ? 'border-l-warning' : 'border-l-primary'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>{opportunity.description}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={opportunity.priority === 'high' ? 'destructive' : 'secondary'}>
                            {opportunity.priority} priority
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            +{(opportunity.potentialImpact * 100).toFixed(1)}% impact
                          </span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-6">
          {/* Model Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success mb-2">
                  {modelAnalysis ? (modelAnalysis.accuracy * 100).toFixed(1) : '0'}%
                </div>
                <Progress value={modelAnalysis ? modelAnalysis.accuracy * 100 : 0} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Based on {modelAnalysis?.predictionCount || 0} recent predictions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mean Absolute Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {modelAnalysis ? Math.round(modelAnalysis.mae).toLocaleString() : '0'}
                </div>
                <p className="text-sm text-muted-foreground">Average prediction error in streams</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <span className="text-lg font-semibold">Healthy</span>
                </div>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>

          {/* Model Insights */}
          <Card>
              <CardHeader>
                <CardTitle>System Health & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-success' : 'bg-warning'}`} />
                      <span className="font-medium">System Status</span>
                    </div>
                    <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'secondary'}>
                      {systemHealth?.status || 'Unknown'}
                    </Badge>
                  </div>
                  
                  {mlAlerts && mlAlerts.totalAlerts > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Active Alerts ({mlAlerts.totalAlerts})</h4>
                      {mlAlerts.performanceAlerts.slice(0, 3).map((alert, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border-l-4 border-l-warning bg-muted/50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.alert_type}</p>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                          </div>
                          <Badge variant="secondary">{alert.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {modelAnalysis?.insights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          {/* Vendor Auto-Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vendor Auto-Adjustment Recommendations</span>
                <Button 
                  onClick={handleApplyAdjustments}
                  disabled={applyVendorAdjustments.isPending || !vendorRecommendations?.length}
                  size="sm"
                >
                  Apply Safe Adjustments
                </Button>
              </CardTitle>
              <CardDescription>
                AI-driven vendor capacity and reliability adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorRecommendations?.slice(0, 5).map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{rec.vendorName}</span>
                          <Badge variant={
                            rec.riskLevel === 'high' ? 'destructive' : 
                            rec.riskLevel === 'medium' ? 'secondary' : 'outline'
                          }>
                            {rec.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.reasoning[0]}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Current: {rec.currentCapacity.toLocaleString()}</span>
                          <span>→</span>
                          <span>Recommended: {rec.recommendedCapacity.toLocaleString()}</span>
                          <span>Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec.adjustmentType === 'increase_capacity' && <TrendingUp className="h-4 w-4 text-success" />}
                        {rec.adjustmentType === 'decrease_capacity' && <TrendingDown className="h-4 w-4 text-warning" />}
                        {rec.adjustmentType === 'suspend' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <span className="text-sm">
                          +{(rec.impactEstimate.campaignSuccess * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Reliability Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Reliability Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningMetrics?.vendorReliabilityTrends.slice(0, 6).map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        vendor.trend === 'improving' ? 'bg-success' : 
                        vendor.trend === 'declining' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`} />
                      <span className="font-medium">{vendor.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(vendor.reliabilityScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vendor.changeRate > 0 ? '+' : ''}{(vendor.changeRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <Badge variant={
                        vendor.trend === 'improving' ? 'default' : 
                        vendor.trend === 'declining' ? 'destructive' : 'secondary'
                      }>
                        {vendor.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Genre Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Genre Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningMetrics?.genrePerformanceInsights.slice(0, 6).map((genre, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{genre.genre}</span>
                      <Badge variant={
                        genre.marketTrend === 'growing' ? 'default' : 
                        genre.marketTrend === 'declining' ? 'destructive' : 'secondary'
                      }>
                        {genre.marketTrend}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span>{(genre.avgPerformance * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={genre.avgPerformance * 100} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>Consistency</span>
                        <span>{(genre.consistency * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={genre.consistency * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Playlist Clusters */}
          <Card>
            <CardHeader>
              <CardTitle>Playlist Performance Clusters</CardTitle>
              <CardDescription>
                Machine learning identified playlist groupings for optimal allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningMetrics?.playlistClusters.map((cluster, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{cluster.clusterId.replace('-', ' ')}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cluster.playlistCount} playlists</Badge>
                        <Badge variant="secondary">
                          {(cluster.avgPerformance * 100).toFixed(0)}% avg performance
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {cluster.characteristics.map((char, charIndex) => (
                          <Badge key={charIndex} variant="outline" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                      <Separator />
                      <p className="text-sm text-muted-foreground italic">
                        {cluster.recommendedUse}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}