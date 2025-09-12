import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContentVerificationLog {
  id: string;
  playlist_id: string;
  campaign_id?: string;
  verification_type: 'genre_matching' | 'content_quality' | 'manual_review';
  status: 'pending' | 'passed' | 'failed' | 'flagged';
  score?: number;
  verification_data: any;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useContentVerification = (playlistId?: string, campaignId?: string) => {
  return useQuery({
    queryKey: ["content-verification", playlistId, campaignId],
    queryFn: async () => {
      let query = supabase.from("content_verification_logs").select("*");
      
      if (playlistId) {
        query = query.eq("playlist_id", playlistId);
      }
      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }
      
      query = query.order("created_at", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ContentVerificationLog[];
    },
    enabled: !!(playlistId || campaignId),
  });
};

export const useCreateVerificationLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<ContentVerificationLog, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("content_verification_logs")
        .insert(log)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-verification"] });
      toast.success("Verification log created successfully");
    },
    onError: (error) => {
      console.error("Error creating verification log:", error);
      toast.error("Failed to create verification log");
    },
  });
};

export const useUpdateVerificationLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentVerificationLog> }) => {
      const { data, error } = await supabase
        .from("content_verification_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-verification"] });
      toast.success("Verification log updated successfully");
    },
    onError: (error) => {
      console.error("Error updating verification log:", error);
      toast.error("Failed to update verification log");
    },
  });
};

export const useVerifyPlaylistContent = () => {
  const createLog = useCreateVerificationLog();
  
  return useMutation({
    mutationFn: async ({ 
      playlistId, 
      campaignId, 
      verificationType = 'genre_matching' 
    }: { 
      playlistId: string; 
      campaignId?: string; 
      verificationType?: 'genre_matching' | 'content_quality' | 'manual_review';
    }) => {
      // Simulate content verification logic
      // In a real implementation, this would call Spotify API to verify playlist content
      const mockScore = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
      const status = mockScore > 0.8 ? 'passed' : mockScore > 0.6 ? 'flagged' : 'failed';
      
      return createLog.mutateAsync({
        playlist_id: playlistId,
        campaign_id: campaignId,
        verification_type: verificationType,
        status,
        score: mockScore,
        verification_data: {
          genre_match_accuracy: mockScore,
          content_quality_indicators: {
            follower_authenticity: Math.random() * 0.3 + 0.7,
            engagement_consistency: Math.random() * 0.3 + 0.7,
            content_relevance: Math.random() * 0.3 + 0.7,
          },
          verification_timestamp: new Date().toISOString(),
        },
        verified_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Content verification completed");
    },
    onError: (error) => {
      console.error("Error verifying content:", error);
      toast.error("Failed to verify content");
    },
  });
};