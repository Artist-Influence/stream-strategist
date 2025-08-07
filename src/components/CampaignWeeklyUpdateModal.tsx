import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Info, Upload } from "lucide-react";
import Papa from "papaparse";

interface CampaignWeeklyUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CampaignWeeklyUpdateModal({ 
  open, 
  onOpenChange 
}: CampaignWeeklyUpdateModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleWeeklyUpdateImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const { data } = Papa.parse(text, { header: true });
      
      let updateCount = 0;
      for (const row of data as any[]) {
        if (!row.campaign_name) continue;
        
        // Find campaign by name
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('name', row.campaign_name.trim())
          .eq('source', 'campaign_manager')
          .eq('campaign_type', 'spotify')
          .single();
        
        if (campaign) {
          // Update campaign with weekly data
          const dailyStreams = parseInt(row.daily_streams) || 0;
          const weeklyStreams = parseInt(row.weekly_streams) || 0;
          const remainingStreams = parseInt(row.remaining_streams) || campaign.remaining_streams;
          
          await supabase
            .from('campaigns')
            .update({
              remaining_streams: remainingStreams,
              // Could add delivered_streams calculation here
              delivered_streams: campaign.stream_goal - remainingStreams
            })
            .eq('id', campaign.id);
          
          // Create weekly update entry
          await supabase
            .from('weekly_updates')
            .insert({
              campaign_id: campaign.id,
              streams: weeklyStreams,
              imported_on: new Date().toISOString().split('T')[0],
              notes: `Daily: ${dailyStreams}, Weekly: ${weeklyStreams}, Remaining: ${remainingStreams}`
            });
          
          updateCount++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-updates'] });
      
      toast({
        title: "Import Successful",
        description: `Updated ${updateCount} campaigns with weekly data`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import weekly updates. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Campaign Weekly Updates
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <pre className="text-xs">
                    Format: campaign_name,daily_streams,weekly_streams,remaining_streams,playlists{'\n'}
                    Example: "Jared Rapoza",222,1554,18446,"Underground Hip-Hop, Trap & Bass"
                  </pre>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Upload CSV with weekly streaming performance data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="weekly-update-file">CSV File</Label>
            <Input
              id="weekly-update-file"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleWeeklyUpdateImport(file);
              }}
              disabled={isImporting}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Expected format:</p>
            <ul className="list-disc list-inside mt-1">
              <li>campaign_name: Exact name of existing campaign</li>
              <li>daily_streams: Current daily streaming rate</li>
              <li>weekly_streams: Total streams for the week</li>
              <li>remaining_streams: Streams still needed to reach goal</li>
              <li>playlists: Comma-separated list of playlist names (optional)</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}