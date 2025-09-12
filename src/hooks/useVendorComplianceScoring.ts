import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VendorComplianceScore {
  id: string;
  vendor_id: string;
  period_start: string;
  period_end: string;
  content_verification_score: number;
  fraud_risk_score: number;
  delivery_compliance_score: number;
  overall_compliance_score: number;
  campaigns_evaluated: number;
  violations_count: number;
  created_at: string;
  updated_at: string;
}

export const useVendorComplianceScores = (vendorId?: string) => {
  return useQuery({
    queryKey: ["vendor-compliance-scores", vendorId],
    queryFn: async () => {
      let query = supabase.from("vendor_compliance_scores").select("*");
      
      if (vendorId) {
        query = query.eq("vendor_id", vendorId);
      }
      
      query = query.order("period_end", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data as VendorComplianceScore[];
    },
  });
};

export const useLatestVendorComplianceScores = () => {
  return useQuery({
    queryKey: ["latest-vendor-compliance-scores"],
    queryFn: async () => {
      // Get the latest compliance score for each vendor
      const { data, error } = await supabase
        .from("vendor_compliance_scores")
        .select(`
          *,
          vendors!inner(id, name)
        `)
        .order("period_end", { ascending: false });
      
      if (error) throw error;
      
      // Group by vendor and get the latest score for each
      const latestScores = new Map();
      data.forEach(score => {
        if (!latestScores.has(score.vendor_id) || 
            new Date(score.period_end) > new Date(latestScores.get(score.vendor_id).period_end)) {
          latestScores.set(score.vendor_id, score);
        }
      });
      
      return Array.from(latestScores.values());
    },
  });
};

export const useCalculateVendorComplianceScore = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      vendorId, 
      periodStart, 
      periodEnd 
    }: { 
      vendorId: string; 
      periodStart: string; 
      periodEnd: string;
    }) => {
      // Fetch verification logs for the period
      const { data: verificationLogs, error: verificationError } = await supabase
        .from("content_verification_logs")
        .select(`
          *,
          playlists!inner(vendor_id)
        `)
        .eq("playlists.vendor_id", vendorId)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);
      
      if (verificationError) throw verificationError;
      
      // Fetch fraud alerts for the period
      const { data: fraudAlerts, error: fraudError } = await supabase
        .from("fraud_detection_alerts")
        .select("*")
        .eq("vendor_id", vendorId)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);
      
      if (fraudError) throw fraudError;
      
      // Fetch campaign checkpoints for campaigns involving this vendor
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select(`
          id,
          vendor_allocations
        `)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);
      
      if (campaignsError) throw campaignsError;
      
      // Filter campaigns that include this vendor
      const vendorCampaigns = campaigns.filter(campaign => 
        campaign.vendor_allocations && 
        Object.keys(campaign.vendor_allocations).includes(vendorId)
      );
      
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from("campaign_compliance_checkpoints")
        .select("*")
        .in("campaign_id", vendorCampaigns.map(c => c.id));
      
      if (checkpointsError) throw checkpointsError;
      
      // Calculate scores
      const contentVerificationScore = verificationLogs.length > 0 ? 
        verificationLogs.filter(log => log.status === 'passed').length / verificationLogs.length : 1.0;
      
      const fraudRiskScore = fraudAlerts.length > 0 ? 
        fraudAlerts.filter(alert => alert.status === 'resolved' || alert.status === 'false_positive').length / fraudAlerts.length : 0.0;
      
      const deliveryComplianceScore = checkpoints.length > 0 ? 
        checkpoints.filter(cp => cp.status === 'passed').length / checkpoints.length : 1.0;
      
      const overallComplianceScore = (
        contentVerificationScore * 0.3 + 
        (1 - fraudRiskScore) * 0.3 + 
        deliveryComplianceScore * 0.4
      );
      
      const violationsCount = 
        verificationLogs.filter(log => log.status === 'failed').length +
        fraudAlerts.filter(alert => alert.status === 'open' && alert.severity === 'high').length +
        checkpoints.filter(cp => cp.status === 'failed').length;
      
      // Insert or update the compliance score
      const { data, error } = await supabase
        .from("vendor_compliance_scores")
        .upsert({
          vendor_id: vendorId,
          period_start: periodStart,
          period_end: periodEnd,
          content_verification_score: Math.round(contentVerificationScore * 100) / 100,
          fraud_risk_score: Math.round(fraudRiskScore * 100) / 100,
          delivery_compliance_score: Math.round(deliveryComplianceScore * 100) / 100,
          overall_compliance_score: Math.round(overallComplianceScore * 100) / 100,
          campaigns_evaluated: vendorCampaigns.length,
          violations_count: violationsCount,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-compliance-scores"] });
      queryClient.invalidateQueries({ queryKey: ["latest-vendor-compliance-scores"] });
      toast.success("Vendor compliance score calculated successfully");
    },
    onError: (error) => {
      console.error("Error calculating vendor compliance score:", error);
      toast.error("Failed to calculate vendor compliance score");
    },
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ["compliance-overview"],
    queryFn: async () => {
      // Get latest compliance scores for all vendors
      const { data: vendors, error: vendorsError } = await supabase
        .from("vendors")
        .select("id, name, is_active");
      
      if (vendorsError) throw vendorsError;
      
      const { data: complianceScores, error: scoresError } = await supabase
        .from("vendor_compliance_scores")
        .select("*")
        .order("period_end", { ascending: false });
      
      if (scoresError) throw scoresError;
      
      // Get latest score for each vendor
      const latestScores = new Map();
      complianceScores.forEach(score => {
        if (!latestScores.has(score.vendor_id) || 
            new Date(score.period_end) > new Date(latestScores.get(score.vendor_id).period_end)) {
          latestScores.set(score.vendor_id, score);
        }
      });
      
      // Calculate overall metrics
      const totalVendors = vendors.filter(v => v.is_active).length;
      const scoredVendors = latestScores.size;
      const scores = Array.from(latestScores.values());
      
      const averageContentScore = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score.content_verification_score, 0) / scores.length : 0;
      
      const averageFraudRisk = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score.fraud_risk_score, 0) / scores.length : 0;
      
      const averageDeliveryScore = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score.delivery_compliance_score, 0) / scores.length : 0;
      
      const averageOverallScore = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score.overall_compliance_score, 0) / scores.length : 0;
      
      const highRiskVendors = scores.filter(score => score.overall_compliance_score < 0.6).length;
      const compliantVendors = scores.filter(score => score.overall_compliance_score >= 0.8).length;
      
      return {
        total_vendors: totalVendors,
        scored_vendors: scoredVendors,
        unscored_vendors: totalVendors - scoredVendors,
        average_content_verification_score: Math.round(averageContentScore * 100) / 100,
        average_fraud_risk_score: Math.round(averageFraudRisk * 100) / 100,
        average_delivery_compliance_score: Math.round(averageDeliveryScore * 100) / 100,
        average_overall_compliance_score: Math.round(averageOverallScore * 100) / 100,
        high_risk_vendors: highRiskVendors,
        compliant_vendors: compliantVendors,
        at_risk_vendors: scores.filter(score => 
          score.overall_compliance_score >= 0.6 && score.overall_compliance_score < 0.8
        ).length,
      };
    },
  });
};