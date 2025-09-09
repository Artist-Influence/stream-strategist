import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendorCampaignRequest {
  id: string;
  campaign_id: string;
  vendor_id: string;
  playlist_ids: string[];
  status: 'pending' | 'approved' | 'rejected';
  response_notes?: string;
  requested_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  // Joined campaign data
  campaign?: {
    id: string;
    name: string;
    brand_name: string;
    track_name?: string;
    track_url: string;
    budget: number;
    start_date: string;
    duration_days: number;
    music_genres: string[];
    content_types: string[];
    territory_preferences: string[];
    post_types: string[];
    sub_genres?: string[];
    stream_goal?: number;
    creator_count: number;
  };
  // Joined playlist data
  playlists?: Array<{
    id: string;
    name: string;
    avg_daily_streams: number;
    follower_count?: number;
  }>;
}

export interface RespondToRequestData {
  requestId: string;
  status: 'approved' | 'rejected';
  response_notes?: string;
}

// Hook to fetch vendor campaign requests for current vendor
export function useVendorCampaignRequests() {
  return useQuery({
    queryKey: ['vendor-campaign-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_vendor_requests')
        .select(`
          *,
          campaigns:campaign_id (
            id,
            name,
            brand_name,
            track_name,
            track_url,
            budget,
            start_date,
            duration_days,
            music_genres,
            content_types,
            territory_preferences,
            post_types,
            sub_genres,
            stream_goal,
            creator_count
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch playlist details for each request
      const requestsWithPlaylists = await Promise.all(
        (data || []).map(async (request) => {
          const playlistIds = Array.isArray(request.playlist_ids) ? request.playlist_ids as string[] : [];
          if (playlistIds && playlistIds.length > 0) {
            const { data: playlists, error: playlistError } = await supabase
              .from('playlists')
              .select('id, name, avg_daily_streams, follower_count')
              .in('id', playlistIds);

            if (playlistError) {
              console.error('Error fetching playlists:', playlistError);
              return { ...request, playlists: [] };
            }

            return { ...request, playlists };
          }
          return { ...request, playlists: [] };
        })
      );

      return requestsWithPlaylists as VendorCampaignRequest[];
    },
  });
}

// Hook to respond to campaign requests (approve/reject)
export function useRespondToVendorRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, status, response_notes }: RespondToRequestData) => {
      const { data, error } = await supabase
        .from('campaign_vendor_requests')
        .update({
          status,
          response_notes,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-campaign-requests'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-vendor-responses'] });
      
      toast({
        title: variables.status === 'approved' ? 'Request Approved' : 'Request Rejected',
        description: `You have ${variables.status} the campaign request.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to respond to request. Please try again.',
        variant: 'destructive',
      });
      console.error('Error responding to request:', error);
    },
  });
}