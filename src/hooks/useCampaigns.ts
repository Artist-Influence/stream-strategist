import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  client_id?: string;
  client_name?: string;
  start_date: string;
  duration_days: number;
  budget: number;
  stream_goal: number;
  remaining_streams: number;
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaignsForClient(clientId: string) {
  return useQuery({
    queryKey: ['campaigns', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!clientId,
  });
}

export function useUnassignedCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'unassigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .is('client_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useAssignCampaignToClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ campaignId, clientId }: { campaignId: string; clientId: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ client_id: clientId })
        .eq('id', campaignId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'client', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Campaign assigned successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error assigning campaign', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUnassignCampaignFromClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ campaignId, clientId }: { campaignId: string; clientId: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ client_id: null })
        .eq('id', campaignId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'client', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Campaign unassigned successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error unassigning campaign', 
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}