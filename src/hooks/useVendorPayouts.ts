import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendorPayout {
  vendor_id: string;
  vendor_name: string;
  campaign_id: string;
  campaign_name: string;
  amount_owed: number;
  payment_status: 'paid' | 'unpaid';
  campaign_completion_date?: string;
  invoice_id?: string;
  payment_date?: string;
  allocated_streams: number;
  actual_streams: number;
  cost_per_stream: number;
}

export interface VendorPayoutSummary {
  vendor_id: string;
  vendor_name: string;
  total_owed: number;
  unpaid_campaigns: number;
  paid_campaigns: number;
  campaigns: VendorPayout[];
}

export const useVendorPayouts = () => {
  return useQuery({
    queryKey: ['vendor-payouts'],
    queryFn: async (): Promise<VendorPayoutSummary[]> => {
      // Fetch campaign allocations with vendor and campaign data
      const { data: allocations, error: allocationsError } = await supabase
        .from('campaign_allocations_performance')
        .select(`
          *,
          campaigns:campaign_id (
            id,
            name,
            status,
            start_date,
            duration_days
          ),
          vendors:vendor_id (
            id,
            name
          ),
          campaign_invoices!left (
            id,
            status,
            paid_date,
            amount
          )
        `)
        .not('vendors', 'is', null)
        .not('campaigns', 'is', null);

      // Also fetch active/completed campaigns with vendor allocations that may not be in allocations table yet
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          start_date,
          duration_days,
          vendor_allocations,
          campaign_invoices!left (
            id,
            status,
            paid_date,
            amount
          )
        `)
        .in('status', ['active', 'completed'])
        .not('vendor_allocations', 'is', null);

      // Fetch all vendors to get cost_per_1k_streams rates
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name, cost_per_1k_streams');

      if (allocationsError && campaignsError && vendorsError) {
        throw allocationsError || campaignsError || vendorsError;
      }

      const vendorMap = new Map(vendors?.map(v => [v.id, v]) || []);
      const allPayoutData = [];

      // Process campaign_allocations_performance data
      if (allocations) {
        allPayoutData.push(...allocations);
      }

      // Process campaigns with vendor_allocations data (for approved campaigns not yet in allocations table)
      if (campaigns) {
        for (const campaign of campaigns) {
          const vendorAllocations = campaign.vendor_allocations || [];
          
          // Handle both array and object formats for backward compatibility
          const allocationsArray = Array.isArray(vendorAllocations) 
            ? vendorAllocations 
            : Object.entries(vendorAllocations).map(([vendorId, allocation]) => ({
                vendor_id: vendorId,
                ...(allocation as any)
              }));
          
          for (const allocation of allocationsArray) {
            if (!allocation || typeof allocation !== 'object') continue;
            
            const vendorId = allocation.vendor_id;
            if (!vendorId) continue;
            
            // Check if this allocation already exists in allocations table
            const existingAllocation = allocations?.find(a => 
              a.campaign_id === campaign.id && a.vendor_id === vendorId
            );
            
            if (!existingAllocation) {
              const vendor = vendorMap.get(vendorId);
              if (vendor) {
                const allocatedStreams = allocation.allocation || allocation.allocatedStreams || 0;
                const costPer1k = vendor.cost_per_1k_streams || 0;
                const costPerStream = costPer1k / 1000;
                
                allPayoutData.push({
                  id: `campaign-${campaign.id}-${vendorId}`,
                  campaign_id: campaign.id,
                  vendor_id: vendorId,
                  allocated_streams: allocatedStreams,
                  predicted_streams: allocatedStreams,
                  actual_streams: allocatedStreams, // Use allocated as actual for campaigns not in performance table
                  cost_per_stream: costPerStream,
                  actual_cost_per_stream: costPerStream,
                  performance_score: 0,
                  campaigns: {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    start_date: campaign.start_date,
                    duration_days: campaign.duration_days
                  },
                  vendors: {
                    id: vendor.id,
                    name: vendor.name
                  },
                  campaign_invoices: campaign.campaign_invoices || []
                });
              }
            }
          }
        }
      }

      // Group by vendor and calculate totals
      const vendorPayouts = new Map<string, VendorPayoutSummary>();

      allPayoutData?.forEach((allocation: any) => {
        const vendor = allocation.vendors;
        const campaign = allocation.campaigns;
        const invoice = allocation.campaign_invoices?.[0];
        
        if (!vendor || !campaign) return;

        const vendorId = vendor.id;
        const amountOwed = allocation.actual_streams * (allocation.actual_cost_per_stream || allocation.cost_per_stream || 0);
        const paymentStatus = invoice?.status === 'paid' ? 'paid' : 'unpaid';
        
        // Calculate campaign completion date
        const startDate = new Date(campaign.start_date);
        const completionDate = new Date(startDate);
        completionDate.setDate(completionDate.getDate() + campaign.duration_days);

        const payoutData: VendorPayout = {
          vendor_id: vendorId,
          vendor_name: vendor.name,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          amount_owed: amountOwed,
          payment_status: paymentStatus,
          campaign_completion_date: completionDate.toISOString().split('T')[0],
          invoice_id: invoice?.id,
          payment_date: invoice?.paid_date,
          allocated_streams: allocation.allocated_streams,
          actual_streams: allocation.actual_streams,
          cost_per_stream: allocation.actual_cost_per_stream || allocation.cost_per_stream || 0
        };

        if (!vendorPayouts.has(vendorId)) {
          vendorPayouts.set(vendorId, {
            vendor_id: vendorId,
            vendor_name: vendor.name,
            total_owed: 0,
            unpaid_campaigns: 0,
            paid_campaigns: 0,
            campaigns: []
          });
        }

        const summary = vendorPayouts.get(vendorId)!;
        summary.campaigns.push(payoutData);
        summary.total_owed += amountOwed;
        
        if (paymentStatus === 'paid') {
          summary.paid_campaigns += 1;
        } else {
          summary.unpaid_campaigns += 1;
        }
      });

      return Array.from(vendorPayouts.values());
    }
  });
};

export const useMarkPayoutPaid = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      vendorId, 
      amount 
    }: { 
      campaignId: string; 
      vendorId: string; 
      amount: number; 
    }) => {
      // First check if invoice exists
      const { data: existingInvoice } = await supabase
        .from('campaign_invoices')
        .select('id')
        .eq('campaign_id', campaignId)
        .single();

      if (existingInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('campaign_invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
            amount: amount
          })
          .eq('id', existingInvoice.id);

        if (error) throw error;
        return existingInvoice.id;
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from('campaign_invoices')
          .insert({
            campaign_id: campaignId,
            amount: amount,
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
            invoice_number: `INV-${campaignId.substring(0, 8)}-${Date.now()}`
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-enhanced'] });
      toast({
        title: "Payment Marked as Paid",
        description: "Vendor payout has been successfully processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: "Failed to mark payment as paid. Please try again.",
        variant: "destructive",
      });
    }
  });
};

export const useBulkMarkPayoutsPaid = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payouts: Array<{ campaignId: string; vendorId: string; amount: number }>) => {
      const results = [];
      
      for (const payout of payouts) {
        // Check if invoice exists
        const { data: existingInvoice } = await supabase
          .from('campaign_invoices')
          .select('id')
          .eq('campaign_id', payout.campaignId)
          .single();

        if (existingInvoice) {
          // Update existing invoice
          const { error } = await supabase
            .from('campaign_invoices')
            .update({
              status: 'paid',
              paid_date: new Date().toISOString().split('T')[0],
              amount: payout.amount
            })
            .eq('id', existingInvoice.id);

          if (error) throw error;
          results.push(existingInvoice.id);
        } else {
          // Create new invoice
          const { data, error } = await supabase
            .from('campaign_invoices')
            .insert({
              campaign_id: payout.campaignId,
              amount: payout.amount,
              status: 'paid',
              paid_date: new Date().toISOString().split('T')[0],
              invoice_number: `INV-${payout.campaignId.substring(0, 8)}-${Date.now()}`
            })
            .select('id')
            .single();

          if (error) throw error;
          results.push(data.id);
        }
      }
      
      return results;
    },
    onSuccess: (_, payouts) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-enhanced'] });
      toast({
        title: "Bulk Payment Processed",
        description: `${payouts.length} vendor payouts have been marked as paid.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Payment Failed",
        description: "Failed to process bulk payments. Please try again.",
        variant: "destructive",
      });
    }
  });
};