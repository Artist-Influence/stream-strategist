import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampaignComplianceCheckpoint {
  id: string;
  campaign_id: string;
  checkpoint_type: 'content_verified' | 'fraud_checked' | 'delivery_milestone' | 'completion_verified';
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  expected_date?: string;
  completed_date?: string;
  compliance_data: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useCampaignComplianceCheckpoints = (campaignId: string) => {
  return useQuery({
    queryKey: ["campaign-compliance-checkpoints", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_compliance_checkpoints")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as CampaignComplianceCheckpoint[];
    },
    enabled: !!campaignId,
  });
};

export const useCreateComplianceCheckpoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (checkpoint: Omit<CampaignComplianceCheckpoint, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("campaign_compliance_checkpoints")
        .insert(checkpoint)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-compliance-checkpoints"] });
      toast.success("Compliance checkpoint created successfully");
    },
    onError: (error) => {
      console.error("Error creating compliance checkpoint:", error);
      toast.error("Failed to create compliance checkpoint");
    },
  });
};

export const useUpdateComplianceCheckpoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      completed_date, 
      notes, 
      compliance_data 
    }: { 
      id: string; 
      status?: 'pending' | 'passed' | 'failed' | 'skipped';
      completed_date?: string;
      notes?: string;
      compliance_data?: any;
    }) => {
      const updates: any = {};
      if (status) updates.status = status;
      if (completed_date) updates.completed_date = completed_date;
      if (notes) updates.notes = notes;
      if (compliance_data) updates.compliance_data = compliance_data;
      
      const { data, error } = await supabase
        .from("campaign_compliance_checkpoints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-compliance-checkpoints"] });
      toast.success("Compliance checkpoint updated successfully");
    },
    onError: (error) => {
      console.error("Error updating compliance checkpoint:", error);
      toast.error("Failed to update compliance checkpoint");
    },
  });
};

export const useInitializeCampaignCheckpoints = () => {
  const createCheckpoint = useCreateComplianceCheckpoint();
  
  return useMutation({
    mutationFn: async ({ campaignId, startDate, durationDays }: { 
      campaignId: string; 
      startDate: string; 
      durationDays: number;
    }) => {
      const start = new Date(startDate);
      const milestones = [
        {
          checkpoint_type: 'content_verified' as const,
          expected_date: new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days before start
          compliance_data: { milestone: 'pre_launch_verification' },
        },
        {
          checkpoint_type: 'fraud_checked' as const,
          expected_date: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week after start
          compliance_data: { milestone: 'week_1_fraud_check' },
        },
        {
          checkpoint_type: 'delivery_milestone' as const,
          expected_date: new Date(start.getTime() + Math.floor(durationDays * 0.5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mid-campaign
          compliance_data: { milestone: 'mid_campaign_delivery_check' },
        },
        {
          checkpoint_type: 'completion_verified' as const,
          expected_date: new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // End of campaign
          compliance_data: { milestone: 'campaign_completion_verification' },
        },
      ];
      
      const results = [];
      for (const milestone of milestones) {
        const result = await createCheckpoint.mutateAsync({
          campaign_id: campaignId,
          status: 'pending',
          ...milestone,
        });
        results.push(result);
      }
      
      return results;
    },
    onSuccess: () => {
      toast.success("Campaign compliance checkpoints initialized");
    },
    onError: (error) => {
      console.error("Error initializing campaign checkpoints:", error);
      toast.error("Failed to initialize campaign checkpoints");
    },
  });
};

export const useVerifyDeliveryMilestone = () => {
  const updateCheckpoint = useUpdateComplianceCheckpoint();
  
  return useMutation({
    mutationFn: async ({ 
      checkpointId, 
      campaignId, 
      expectedStreams, 
      actualStreams 
    }: { 
      checkpointId: string; 
      campaignId: string;
      expectedStreams: number;
      actualStreams: number;
    }) => {
      // Calculate delivery performance
      const deliveryRate = actualStreams / expectedStreams;
      const status = deliveryRate >= 0.8 ? 'passed' : deliveryRate >= 0.6 ? 'failed' : 'failed';
      
      const complianceData = {
        expected_streams: expectedStreams,
        actual_streams: actualStreams,
        delivery_rate: deliveryRate,
        performance_rating: deliveryRate >= 0.9 ? 'excellent' : 
                           deliveryRate >= 0.8 ? 'good' : 
                           deliveryRate >= 0.6 ? 'poor' : 'critical',
        verification_timestamp: new Date().toISOString(),
      };
      
      return updateCheckpoint.mutateAsync({
        id: checkpointId,
        status,
        completed_date: new Date().toISOString().split('T')[0],
        compliance_data: complianceData,
        notes: `Delivery verification: ${(deliveryRate * 100).toFixed(1)}% of expected streams delivered`,
      });
    },
    onSuccess: () => {
      toast.success("Delivery milestone verified");
    },
    onError: (error) => {
      console.error("Error verifying delivery milestone:", error);
      toast.error("Failed to verify delivery milestone");
    },
  });
};

export const useCampaignDeliveryOverview = () => {
  return useQuery({
    queryKey: ["campaign-delivery-overview"],
    queryFn: async () => {
      // Get all campaigns with their checkpoints
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, name, status, start_date, duration_days, stream_goal");
      
      if (campaignsError) throw campaignsError;
      
      // Get all checkpoints
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from("campaign_compliance_checkpoints")
        .select("*");
      
      if (checkpointsError) throw checkpointsError;
      
      // Calculate delivery overview
      const overview = campaigns.map(campaign => {
        const campaignCheckpoints = checkpoints.filter(cp => cp.campaign_id === campaign.id);
        const passedCheckpoints = campaignCheckpoints.filter(cp => cp.status === 'passed').length;
        const failedCheckpoints = campaignCheckpoints.filter(cp => cp.status === 'failed').length;
        const pendingCheckpoints = campaignCheckpoints.filter(cp => cp.status === 'pending').length;
        
        const complianceScore = campaignCheckpoints.length > 0 ? 
          passedCheckpoints / campaignCheckpoints.length : 0;
        
        return {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          campaign_status: campaign.status,
          total_checkpoints: campaignCheckpoints.length,
          passed_checkpoints: passedCheckpoints,
          failed_checkpoints: failedCheckpoints,
          pending_checkpoints: pendingCheckpoints,
          compliance_score: complianceScore,
          compliance_status: complianceScore >= 0.8 ? 'compliant' : 
                           complianceScore >= 0.6 ? 'at_risk' : 'non_compliant',
        };
      });
      
      return overview;
    },
  });
};