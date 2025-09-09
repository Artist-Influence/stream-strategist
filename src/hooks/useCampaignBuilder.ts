import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CampaignData {
  name: string;
  client: string;
  client_id?: string;
  track_url: string;
  track_name?: string;
  stream_goal: number;
  budget: number;
  sub_genre: string;
  start_date: string;
  duration_days: number;
}

export function useCampaignBuilder() {
  const { campaignId } = useParams();
  const [isEditing, setIsEditing] = useState(!!campaignId);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<Partial<CampaignData>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing campaign data if editing
  useEffect(() => {
    if (campaignId) {
      loadCampaignData(campaignId);
    }
  }, [campaignId]);

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
        brand_name: data.client || 'Unknown Client',
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

  return {
    isEditing,
    isLoading,
    campaignData,
    setCampaignData,
    saveCampaign,
    campaignId
  };
}