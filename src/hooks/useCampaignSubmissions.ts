import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { APP_CAMPAIGN_SOURCE, APP_CAMPAIGN_SOURCE_INTAKE, APP_CAMPAIGN_TYPE } from '@/lib/constants';

interface CampaignSubmission {
  id: string;
  client_name: string;
  client_emails: string[];
  campaign_name: string;
  price_paid: number;
  stream_goal: number;
  start_date: string;
  duration_days?: number;
  track_url: string;
  notes?: string;
  salesperson: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  music_genres: string[];
  territory_preferences: string[];
}

interface CreateSubmissionData {
  client_name: string;
  client_emails: string[];
  campaign_name: string;
  price_paid: number;
  stream_goal: number;
  start_date: string;
  duration_days: number;
  track_url: string;
  notes?: string;
  salesperson: string;
  music_genres: string[];
  territory_preferences: string[];
}

// Hook to fetch all submissions (for admin) - Only pending and rejected submissions for better performance
export function useCampaignSubmissions() {
  return useQuery({
    queryKey: ['campaign-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_submissions')
        .select('*')
        .in('status', ['pending_approval', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(50); // Add limit for better performance

      if (error) throw error;
      return data as CampaignSubmission[];
    },
    staleTime: 30000, // Cache for 30 seconds
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
        .insert({
          ...submissionData,
          music_genres: submissionData.music_genres || [],
          territory_preferences: submissionData.territory_preferences || []
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // Don't show toast here - let the component handle the success UI
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
      console.log('🚀 Starting approval process for submission:', submissionId);
      
      // First, get the submission data
      const { data: submission, error: fetchError } = await supabase
        .from('campaign_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching submission:', fetchError);
        throw new Error(`Failed to fetch submission: ${fetchError.message}`);
      }
      
      console.log('✅ Submission data fetched:', submission.campaign_name);

      // Store rejection reason in algorithm_recommendations and update submission
      // Use the indexed lookup for better performance
      console.log('🔍 Looking for existing client:', submission.client_name);
      const { data: existingClient, error: clientFindError } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', submission.client_name)
        .maybeSingle(); // Use maybeSingle to avoid errors when no client found

      let clientId = existingClient?.id;

      // If client doesn't exist, create them
      if (!clientId) {
        console.log('👤 Creating new client:', submission.client_name);
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            name: submission.client_name,
            emails: submission.client_emails
          }])
          .select('id')
          .single();

        if (clientError) {
          console.error('❌ Error creating client:', clientError);
          throw new Error(`Failed to create client: ${clientError.message}`);
        }
        clientId = newClient.id;
        console.log('✅ Client created with ID:', clientId);
      } else {
        console.log('✅ Found existing client with ID:', clientId);
      }

      // Run allocation algorithm to generate playlist recommendations for Spotify campaigns
      console.log('🎵 Fetching playlists and vendors for allocation algorithm...');
      const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          *,
          vendor:vendors(*)
        `);

      if (playlistsError) {
        console.error('❌ Error fetching playlists:', playlistsError);
        throw new Error(`Failed to fetch playlists: ${playlistsError.message}`);
      }

      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (vendorsError) {
        console.error('❌ Error fetching vendors:', vendorsError);
        throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
      }

      let algorithmRecommendations = {};
      console.log(`🏪 Found ${vendors?.length || 0} vendors and ${playlists?.length || 0} playlists`);

      if (playlists && playlists.length > 0 && vendors && vendors.length > 0) {
        try {
          console.log('🤖 Running allocation algorithm...');
          // Import the allocation algorithm
          const { allocateStreams } = await import('@/lib/allocationAlgorithm');
          
          // Build vendor caps (assume max daily streams * duration for simplicity)
          const vendorCaps: Record<string, number> = {};
          vendors.forEach(vendor => {
            const vendorPlaylists = playlists.filter(p => p.vendor_id === vendor.id);
            const totalCapacity = vendorPlaylists.reduce((sum, p) => sum + (p.avg_daily_streams || 0), 0);
            vendorCaps[vendor.id] = Math.floor(totalCapacity * (submission.duration_days ?? 90));
          });

          const algorithmResult = await allocateStreams({
            playlists: playlists,
            goal: submission.stream_goal,
            vendorCaps,
            subGenre: (submission.music_genres || [])[0] || '',
            durationDays: submission.duration_days ?? 90,
            campaignGenres: submission.music_genres || [],
            vendors,
            campaignBudget: submission.price_paid
          });

          algorithmRecommendations = {
            allocations: algorithmResult.allocations,
            genreMatches: algorithmResult.genreMatches,
            insights: algorithmResult.insights,
            timestamp: new Date().toISOString()
          };
          console.log('✅ Algorithm completed successfully');
        } catch (error) {
          console.warn('⚠️ Algorithm failed, creating draft without recommendations:', error);
        }
      }

      // Create draft campaign with algorithm recommendations for Spotify playlisting
      console.log('📝 Creating draft campaign...');
      const { error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: submission.campaign_name,
          brand_name: submission.campaign_name,
          client: submission.client_name,
          client_name: submission.client_name,
          client_id: clientId,
          track_url: submission.track_url,
          track_name: submission.campaign_name.split(' - ')[1] || submission.campaign_name,
          stream_goal: submission.stream_goal,
          remaining_streams: submission.stream_goal,
          budget: submission.price_paid,
          start_date: submission.start_date,
          status: 'draft',
          duration_days: submission.duration_days ?? 90,
          sub_genre: (submission.music_genres || []).join(', '),
          music_genres: submission.music_genres || [],
          territory_preferences: submission.territory_preferences || [],
          selected_playlists: [],
          vendor_allocations: {},
          algorithm_recommendations: algorithmRecommendations,
          pending_operator_review: true,
          totals: {},
          results: {},
          source: APP_CAMPAIGN_SOURCE_INTAKE,
          campaign_type: APP_CAMPAIGN_TYPE,
          salesperson: submission.salesperson,
          submission_id: submissionId
        });

      if (campaignError) {
        console.error('❌ Error creating campaign:', campaignError);
        throw new Error(`Failed to create campaign: ${campaignError.message}`);
      }
      console.log('✅ Draft campaign created successfully');

      // Update submission status to approved
      console.log('✅ Updating submission status to approved...');
      const { error: updateError } = await supabase
        .from('campaign_submissions')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'admin' // Could be enhanced with actual user info
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('❌ Error updating submission status:', updateError);
        throw new Error(`Failed to update submission status: ${updateError.message}`);
      }
      
      console.log('🎉 Approval process completed successfully');
      return submission;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Approved",
        description: "Draft campaign created with AI playlist recommendations. Ready for operator review.",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      console.error('💥 Campaign approval failed:', error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve campaign. Check console for details.",
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