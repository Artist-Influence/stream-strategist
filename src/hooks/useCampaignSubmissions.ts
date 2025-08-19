import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { APP_CAMPAIGN_SOURCE, APP_CAMPAIGN_TYPE } from '@/lib/constants';

interface CampaignSubmission {
  id: string;
  client_name: string;
  client_emails: string[];
  campaign_name: string;
  price_paid: number;
  stream_goal: number;
  start_date: string;
  track_url: string;
  notes?: string;
  salesperson: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

interface CreateSubmissionData {
  client_name: string;
  client_emails: string[];
  campaign_name: string;
  price_paid: number;
  stream_goal: number;
  start_date: string;
  track_url: string;
  notes?: string;
  salesperson: string;
}

// Hook to fetch all submissions (for admin)
export function useCampaignSubmissions() {
  return useQuery({
    queryKey: ['campaign-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CampaignSubmission[];
    },
  });
}

// Hook to create a new submission (public)
export function useCreateCampaignSubmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionData: CreateSubmissionData) => {
      const { error } = await supabase
        .from('campaign_submissions')
        .insert([submissionData]);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Submitted",
        description: "Your campaign has been submitted for approval. You'll be contacted soon!",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit campaign. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Hook to approve a submission (admin only)
export function useApproveCampaignSubmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      // First, get the submission data
      const { data: submission, error: fetchError } = await supabase
        .from('campaign_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      // Try to find existing client by name (case-insensitive)
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', submission.client_name)
        .limit(1)
        .single();

      let clientId = existingClient?.id;

      // If client doesn't exist, create them
      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            name: submission.client_name,
            emails: submission.client_emails
          }])
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Create the actual campaign with correct source/type
      const { error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: submission.campaign_name,
          brand_name: submission.campaign_name,
          client_name: submission.client_name,
          client_id: clientId,
          budget: submission.price_paid,
          stream_goal: submission.stream_goal,
          start_date: submission.start_date,
          track_url: submission.track_url,
          description: submission.notes || '',
          salesperson: submission.salesperson,
          source: APP_CAMPAIGN_SOURCE,
          campaign_type: APP_CAMPAIGN_TYPE,
          status: 'active'
        }]);

      if (campaignError) throw campaignError;

      // Update submission status to approved
      const { error: updateError } = await supabase
        .from('campaign_submissions')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin' // Could be enhanced with actual user info
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      return submission;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Approved",
        description: "Campaign has been created and client will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', APP_CAMPAIGN_SOURCE, APP_CAMPAIGN_TYPE] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve campaign.",
        variant: "destructive",
      });
    },
  });
}

// Hook to reject a submission (admin only)
export function useRejectCampaignSubmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      const { error } = await supabase
        .from('campaign_submissions')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Rejected",
        description: "Submission has been rejected and client will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject campaign.",
        variant: "destructive",
      });
    },
  });
}