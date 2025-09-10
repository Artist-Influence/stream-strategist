import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CampaignData {
  name: string;
  client: string;
  client_id?: string;
  brand_name?: string;
  track_url: string;
  track_name?: string;
  stream_goal: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
}

export function useCampaignBuilder() {
  const { campaignId, submissionId } = useParams();
  const [isEditing, setIsEditing] = useState(!!campaignId);
  const [isReviewing, setIsReviewing] = useState(!!submissionId);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<Partial<CampaignData>>({});
  const [submissionData, setSubmissionData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing campaign data if editing or submission data if reviewing
  useEffect(() => {
    if (campaignId) {
      loadCampaignData(campaignId);
    } else if (submissionId) {
      loadSubmissionData(submissionId);
    }
  }, [campaignId, submissionId]);

  const loadCampaignData = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setCampaignData({
        name: data.name,
        client: data.client,
        client_id: data.client_id,
        track_url: data.track_url,
        track_name: data.track_name,
        stream_goal: data.stream_goal,
        budget: data.budget,
        sub_genre: data.sub_genre,
        start_date: data.start_date,
        duration_days: data.duration_days,
      });
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubmissionData = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setSubmissionData(data);
      
      // Resolve client_id from client_name if needed
      let clientId = '';
      if (data.client_name) {
        try {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('name', data.client_name)
            .single();
          if (client) {
            clientId = client.id;
          }
        } catch (error) {
          console.log('Could not resolve client_id:', error);
        }
      }
      
      // Convert submission data to campaign data format with proper field mapping
      setCampaignData({
        name: data.campaign_name,
        client: data.client_name,
        client_id: clientId, // Use resolved client_id
        track_url: data.track_url,
        stream_goal: data.stream_goal,
        budget: data.price_paid, // Map price_paid to budget
        sub_genre: Array.isArray(data.music_genres) ? data.music_genres.join(', ') : data.music_genres || '',
        start_date: data.start_date,
        duration_days: data.duration_days,
      });
      setIsReviewing(true);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: "Failed to load submission data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCampaign = async (data: CampaignData, allocationsData: any, status: 'built' | 'unreleased' | 'active' = 'built') => {
    try {
      const campaignPayload = {
        name: data.name,
        client: data.client,
        client_id: data.client_id,
        track_url: data.track_url,
        track_name: data.track_name,
        stream_goal: data.stream_goal,
        budget: data.budget,
        sub_genre: data.sub_genre,
        start_date: data.start_date,
        duration_days: data.duration_days,
        status,
        selected_playlists: allocationsData.selectedPlaylists || [],
        vendor_allocations: allocationsData.allocations || {},
        totals: {
          projected_streams: allocationsData.totalProjectedStreams || 0
        },
        brand_name: data.brand_name || data.client || 'Unknown Client',
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (isEditing && campaignId) {
        // Update existing campaign
        result = await supabase
          .from('campaigns')
          .update(campaignPayload)
          .eq('id', campaignId)
          .select()
          .single();
      } else {
        // Create new campaign with required fields
        result = await supabase
          .from('campaigns')
          .insert({
            ...campaignPayload,
            source: 'artist_influence_spotify_campaigns',
            campaign_type: 'artist_influence_spotify_promotion'
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });

      const action = isEditing ? 'updated' : 'created';
      const statusMessage = status === 'active' ? 'and activated' : 
                           status === 'unreleased' ? 'as unreleased' : 
                           'and ready for launch';

      toast({
        title: `Campaign ${action}`,
        description: `Campaign successfully ${action} ${statusMessage}.`,
      });

      return result.data;
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} campaign.`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveSubmission = async (data: CampaignData, allocationsData: any) => {
    if (!submissionData) {
      throw new Error('No submission data available');
    }

    try {
      // Create campaign from submission
      const campaignPayload = {
        name: data.name,
        client: data.client,
        client_id: data.client_id,
        track_url: data.track_url,
        track_name: data.track_name,
        stream_goal: data.stream_goal,
        budget: data.budget,
        sub_genre: data.sub_genre,
        start_date: data.start_date,
        duration_days: data.duration_days,
        status: 'active',
        selected_playlists: allocationsData.selectedPlaylists || [],
        vendor_allocations: allocationsData.allocations || {},
        totals: {
          projected_streams: allocationsData.totalProjectedStreams || 0
        },
        brand_name: data.client || submissionData.client_name || 'Unknown Client',
        submission_id: submissionData.id,
        source: 'artist_influence_spotify_campaigns',
        campaign_type: 'artist_influence_spotify_promotion'
      };

      const result = await supabase
        .from('campaigns')
        .insert(campaignPayload)
        .select()
        .single();

      if (result.error) throw result.error;

      // Create vendor requests for selected playlists
      if (allocationsData.selectedPlaylists && allocationsData.selectedPlaylists.length > 0) {
        // Group playlists by vendor
        const { data: playlists } = await supabase
          .from('playlists')
          .select('*, vendor:vendors(*)')
          .in('id', allocationsData.selectedPlaylists);

        if (playlists) {
          const vendorGroups = playlists.reduce((groups, playlist) => {
            const vendorId = playlist.vendor_id;
            if (!groups[vendorId]) {
              groups[vendorId] = [];
            }
            groups[vendorId].push(playlist.id);
            return groups;
          }, {} as Record<string, string[]>);

          // Create vendor requests
          const vendorRequests = Object.entries(vendorGroups).map(([vendorId, playlistIds]) => ({
            campaign_id: result.data.id,
            vendor_id: vendorId,
            playlist_ids: playlistIds,
            status: 'pending'
          }));

          await supabase
            .from('campaign_vendor_requests')
            .insert(vendorRequests);
        }
      }

      // Update submission status
      await supabase
        .from('campaign_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'System'
        })
        .eq('id', submissionData.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });

      toast({
        title: "Submission Approved",
        description: "Campaign has been created successfully.",
      });

      return result.data;
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const rejectSubmission = async (reason: string) => {
    if (!submissionData) {
      throw new Error('No submission data available');
    }

    try {
      await supabase
        .from('campaign_submissions')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', submissionData.id);

      queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });

      toast({
        title: "Submission Rejected",
        description: "Submission has been rejected.",
      });
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isEditing,
    isReviewing,
    isLoading,
    campaignData,
    submissionData,
    setCampaignData,
    saveCampaign,
    approveSubmission,
    rejectSubmission,
    campaignId,
    submissionId
  };
}