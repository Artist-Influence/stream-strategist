import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import Papa from "papaparse";

interface CampaignWeeklyImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CampaignWeeklyImportModal({ 
  open, 
  onOpenChange 
}: CampaignWeeklyImportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCampaignImport = async (file: File) => {
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const { data } = Papa.parse(text, { header: true });
      
      let updatedCount = 0;
      let createdCount = 0;
      
      for (const row of data as any[]) {
        if (!row['Campaign Name'] || !row['Client']) continue;
        
        // Find existing campaign by name and client
        const { data: existingCampaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('name', row['Campaign Name'].trim())
          .eq('client', row['Client'].trim())
          .maybeSingle();
        
        if (existingCampaign) {
          // Update existing campaign
          await supabase
            .from('campaigns')
            .update({
              stream_goal: parseInt(row['Stream Goal']) || existingCampaign.stream_goal,
              remaining_streams: parseInt(row['Remaining Streams']) || existingCampaign.remaining_streams,
              // updated_at is automatically updated by trigger
            })
            .eq('id', existingCampaign.id);
          
          // Add weekly update entry if streams data provided
          if (row['Daily Streams'] || row['Weekly Streams']) {
            await supabase
              .from('weekly_updates')
              .insert({
                campaign_id: existingCampaign.id,
                streams: parseInt(row['Weekly Streams']) || parseInt(row['Daily Streams']) * 7 || 0,
                imported_on: new Date().toISOString().split('T')[0],
                notes: `Updated via CSV import - Daily: ${row['Daily Streams'] || 0}, Weekly: ${row['Weekly Streams'] || 0}`
              });
          }
          
          updatedCount++;
        } else {
          // Create new campaign if doesn't exist
          const { data: newCampaign } = await supabase
            .from('campaigns')
            .insert({
              name: row['Campaign Name'].trim(),
              brand_name: row['Campaign Name'].trim(),
              client: row['Client'].trim(),
              client_name: row['Client'].trim(),
              stream_goal: parseInt(row['Stream Goal']) || 0,
              remaining_streams: parseInt(row['Remaining Streams']) || 0,
              budget: parseFloat(row['Budget']) || 0,
              status: 'active',
              track_url: row['Track URL'] || '',
              sub_genre: row['Genres']?.split(',')[0]?.trim() || '',
              sub_genres: row['Genres']?.split(',').map((g: string) => g.trim()) || [],
              start_date: new Date().toISOString().split('T')[0],
              duration_days: 90,
              selected_playlists: [],
              vendor_allocations: {},
              totals: { projected_streams: 0 }
            })
            .select()
            .single();
          
          // Add initial weekly update if provided
          if (newCampaign && (row['Daily Streams'] || row['Weekly Streams'])) {
            await supabase
              .from('weekly_updates')
              .insert({
                campaign_id: newCampaign.id,
                streams: parseInt(row['Weekly Streams']) || parseInt(row['Daily Streams']) * 7 || 0,
                imported_on: new Date().toISOString().split('T')[0],
                notes: `Initial import - Daily: ${row['Daily Streams'] || 0}, Weekly: ${row['Weekly Streams'] || 0}`
              });
          }
          
          createdCount++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-updates'] });
      
      toast({
        title: "Import Successful",
        description: `Updated ${updatedCount} campaigns, created ${createdCount} new campaigns`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Please check your CSV format and try again",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleCampaignImport(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Campaign Updates</DialogTitle>
          <DialogDescription>
            Upload a CSV file to update existing campaigns or create new ones
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="csv-upload"
            />
            <Label htmlFor="csv-upload" className="cursor-pointer block">
              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">
                {isImporting ? 'Importing...' : 'Click to upload CSV or drag and drop'}
              </p>
            </Label>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="font-semibold mb-2 text-sm">Required CSV Format:</p>
            <div className="bg-background p-3 rounded text-xs font-mono overflow-x-auto">
              <div className="whitespace-nowrap">
                Campaign Name,Client,Stream Goal,Remaining Streams,Daily Streams,Weekly Streams,Budget,Track URL,Genres
              </div>
              <div className="whitespace-nowrap text-muted-foreground mt-1">
                "Jared Rapoza","Slime",20000,18000,200,1400,2500,"https://spotify.com/...","Hip-Hop, Trap"
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              • Existing campaigns will be updated based on Campaign Name + Client match
              • New campaigns will be created if no match is found
              • Weekly updates will be automatically logged for tracking
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}