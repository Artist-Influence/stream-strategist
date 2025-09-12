import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Shield, TrendingUp, Users } from "lucide-react";
import { useComplianceOverview } from "@/hooks/useVendorComplianceScoring";
import { useFraudDetectionSummary } from "@/hooks/useFraudDetection";
import { useCampaignDeliveryOverview } from "@/hooks/useCampaignDeliveryVerification";
import { Skeleton } from "@/components/ui/skeleton";

const ComplianceMonitoringDashboard = () => {
  const { data: complianceOverview, isLoading: complianceLoading } = useComplianceOverview();
  const { data: fraudSummary, isLoading: fraudLoading } = useFraudDetectionSummary();
  const { data: deliveryOverview, isLoading: deliveryLoading } = useCampaignDeliveryOverview();

  if (complianceLoading || fraudLoading || deliveryLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getComplianceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 0.8) return { label: "Compliant", variant: "default" as const };
    if (score >= 0.6) return { label: "At Risk", variant: "secondary" as const };
    return { label: "Non-Compliant", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor quality assurance and compliance across all campaigns and vendors
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceOverview ? Math.round(complianceOverview.average_overall_compliance_score * 100) : 0}%
            </div>
            <Progress 
              value={complianceOverview ? complianceOverview.average_overall_compliance_score * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fraudSummary?.open_alerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {fraudSummary?.critical_alerts || 0} critical, {fraudSummary?.high_priority_alerts || 0} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceOverview?.compliant_vendors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceOverview?.at_risk_vendors || 0} at risk, {complianceOverview?.high_risk_vendors || 0} high risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceOverview ? Math.round(complianceOverview.average_delivery_compliance_score * 100) : 0}%
            </div>
            <Progress 
              value={complianceOverview ? complianceOverview.average_delivery_compliance_score * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Compliance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Delivery</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Metrics</CardTitle>
                <CardDescription>Average scores across all active vendors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Content Verification</span>
                    <span className="text-sm font-medium">
                      {complianceOverview ? Math.round(complianceOverview.average_content_verification_score * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={complianceOverview ? complianceOverview.average_content_verification_score * 100 : 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Fraud Risk Level</span>
                    <span className="text-sm font-medium">
                      {complianceOverview ? Math.round(complianceOverview.average_fraud_risk_score * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={complianceOverview ? complianceOverview.average_fraud_risk_score * 100 : 0} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Delivery Compliance</span>
                    <span className="text-sm font-medium">
                      {complianceOverview ? Math.round(complianceOverview.average_delivery_compliance_score * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={complianceOverview ? complianceOverview.average_delivery_compliance_score * 100 : 0} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendor Status Distribution</CardTitle>
                <CardDescription>Current compliance status of all vendors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Compliant Vendors</span>
                  </div>
                  <Badge variant="default">{complianceOverview?.compliant_vendors || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">At Risk Vendors</span>
                  </div>
                  <Badge variant="secondary">{complianceOverview?.at_risk_vendors || 0}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">High Risk Vendors</span>
                  </div>
                  <Badge variant="destructive">{complianceOverview?.high_risk_vendors || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Compliance Scores</CardTitle>
              <CardDescription>Detailed compliance metrics for each vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Shield className="mx-auto h-12 w-12 mb-4" />
                <p>Vendor compliance details will be displayed here</p>
                <p className="text-sm">Integration with vendor management system in progress</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Delivery Status</CardTitle>
              <CardDescription>Compliance checkpoints and delivery verification</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryOverview && deliveryOverview.length > 0 ? (
                <div className="space-y-4">
                  {deliveryOverview.slice(0, 10).map((campaign) => (
                    <div key={campaign.campaign_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {campaign.passed_checkpoints}/{campaign.total_checkpoints} checkpoints passed
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getComplianceStatus(campaign.compliance_score).variant}>
                          {getComplianceStatus(campaign.compliance_score).label}
                        </Badge>
                        <span className={`text-sm font-medium ${getComplianceColor(campaign.compliance_score)}`}>
                          {Math.round(campaign.compliance_score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                  <p>No campaign delivery data available</p>
                  <p className="text-sm">Campaign delivery verification will be displayed here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Summary</CardTitle>
              <CardDescription>Overview of fraud detection alerts and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {fraudSummary?.alert_types.suspicious_streams || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Suspicious Streams</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {fraudSummary?.alert_types.velocity_anomaly || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Velocity Anomalies</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {fraudSummary?.alert_types.pattern_irregularity || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Pattern Issues</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {fraudSummary?.alert_types.vendor_behavior || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Vendor Behavior</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceMonitoringDashboard;