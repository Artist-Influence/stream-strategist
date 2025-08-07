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
      console.log('Raw CSV text:', text); // Debug log
      
      // Parse CSV with proper options
      const { data, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(), // Remove spaces from headers
      });
      
      if (errors.length > 0) {
        console.error('CSV parsing errors:', errors);
        toast({
          title: "CSV Parsing Error",
          description: "Error parsing CSV file. Check console for details.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Parsed data:', data); // Debug log
      
      let updatedCount = 0;
      let createdCount = 0;
      
      for (const row of data as any[]) {
        // Clean up field names (handle variations in CSV headers)
        const campaignName = row['Campaign Name'] || row['campaign_name'] || row['Campaign'];
        const clientName = row['Client'] || row['client'] || row['Artist'];
        const streamGoal = parseInt(row['Stream Goal'] || row['stream_goal'] || row['Goal'] || '0');
        const remainingStreams = parseInt(row['Remaining Streams'] || row['remaining_streams'] || row['Remaining'] || '0');
        const dailyStreams = parseInt(row['Daily Streams'] || row['daily_streams'] || row['Daily'] || '0');
        const weeklyStreams = parseInt(row['Weekly Streams'] || row['weekly_streams'] || row['Weekly'] || '0');
        const trackUrl = row['Track URL'] || row['track_url'] || row['URL'] || '';
        const startDateRaw = row['Start Date'] || row['start_date'] || '';
        
        if (!campaignName || !clientName) {
          console.log('Skipping row - missing campaign name or client:', row);
          continue;
        }
        
        // Parse playlist data from various potential playlist columns
        let parsedPlaylists: string[] = [];
        const playlistColumns = Object.keys(row).filter(key => 
          key.toLowerCase().includes('playlist') || 
          key.toLowerCase().includes('placed') ||
          key.toLowerCase().includes('adds')
        );
        
        for (const column of playlistColumns) {
          const playlistData = row[column];
          if (playlistData && typeof playlistData === 'string') {
            // Parse format: "PLAYLIST NAME - PLAYLIST NAME - PLAYLIST NAME [NEW] -"
            const playlists = playlistData
              .split(' - ')
              .map(name => name.trim())
              .filter(name => name && name !== '')
              .map(name => name.replace(/\[NEW\]/gi, '').trim()) // Remove [NEW] tags
              .filter(name => name);
            
            parsedPlaylists = [...parsedPlaylists, ...playlists];
          }
        }
        
        // Remove duplicates and get existing playlists from database
        parsedPlaylists = [...new Set(parsedPlaylists)];
        
        // Fetch matching playlists from database
        let matchedPlaylists: any[] = [];
        if (parsedPlaylists.length > 0) {
          const { data: dbPlaylists } = await supabase
            .from('playlists')
            .select('id, name, vendor_id, vendors(name)')
            .in('name', parsedPlaylists);
          
          if (dbPlaylists) {
            matchedPlaylists = dbPlaylists.map(playlist => ({
              id: playlist.id,
              name: playlist.name,
              vendor_name: playlist.vendors?.name || 'Unknown',
              imported: true
            }));
          }
        }
        
        // Find existing campaign by name and client (only in campaign_manager source)
        const { data: existingCampaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('name', campaignName.trim())
          .eq('client', clientName.trim())
          .eq('source', 'campaign_manager')
          .maybeSingle();
        
        if (existingCampaign) {
          // Compare playlists and track additions
          const existingPlaylists = Array.isArray(existingCampaign.selected_playlists) 
            ? existingCampaign.selected_playlists 
            : [];
          const existingPlaylistNames = existingPlaylists.map((p: any) => 
            typeof p === 'string' ? p : p.name
          );
          
          const newPlaylists = parsedPlaylists.filter(name => 
            !existingPlaylistNames.includes(name)
          );
          
          let updateNotes = `Updated via CSV import - Daily: ${dailyStreams || 0}, Weekly: ${weeklyStreams || 0}`;
          if (newPlaylists.length > 0) {
            updateNotes += ` | New playlists added: ${newPlaylists.join(', ')}`;
          }
          
          // Update existing campaign
          const { error: updateError } = await supabase
            .from('campaigns')
            .update({
              stream_goal: streamGoal || existingCampaign.stream_goal,
              remaining_streams: remainingStreams || existingCampaign.remaining_streams,
              // delivered_streams: streamGoal ? (streamGoal - remainingStreams) : 0, // Remove this field as it doesn't exist
              track_url: trackUrl || existingCampaign.track_url,
              selected_playlists: matchedPlaylists.length > 0 ? matchedPlaylists : existingCampaign.selected_playlists,
              // updated_at is automatically updated by trigger
            })
            .eq('id', existingCampaign.id);
          
          if (updateError) {
            console.error('Error updating campaign:', updateError);
            continue;
          }
          
          // Add weekly update entry if streams data provided
          if (dailyStreams || weeklyStreams) {
            await supabase
              .from('weekly_updates')
              .insert({
                campaign_id: existingCampaign.id,
                streams: weeklyStreams || dailyStreams * 7 || 0,
                imported_on: new Date().toISOString().split('T')[0],
                notes: updateNotes
              });
          }
          
          console.log('Updated campaign:', campaignName);
          
          updatedCount++;
        } else {
          // Create new campaign if doesn't exist
          let genres: string[] = [];
          let subGenre = '';
          
          // Fetch genres from Spotify API if track URL provided
          if (trackUrl) {
            try {
              const { data: spotifyData, error: spotifyError } = await supabase.functions.invoke('spotify-fetch', {
                body: { url: trackUrl.trim() }
              });
              
              if (!spotifyError && spotifyData) {
                if (spotifyData.genres && spotifyData.genres.length > 0) {
                  genres = spotifyData.genres.slice(0, 3); // Top 3 genres
                  subGenre = genres[0] || '';
                }
              }
            } catch (error) {
              console.warn('Failed to fetch genres from Spotify:', error);
            }
          }
          
          // Determine start date - use provided date or default to today
          const startDate = startDateRaw ? 
            new Date(startDateRaw).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];
          
          const { data: newCampaign, error: insertError } = await supabase
            .from('campaigns')
            .insert({
              name: campaignName.trim(),
              brand_name: campaignName.trim(),
              client: clientName.trim(),
              client_name: clientName.trim(),
              stream_goal: streamGoal || 0,
              remaining_streams: remainingStreams || streamGoal || 0,
              // delivered_streams: streamGoal ? Math.max(0, streamGoal - remainingStreams) : 0, // Remove this field as it doesn't exist
              budget: 0, // Budget to be manually entered later
              status: 'active',
              track_url: trackUrl || '',
              sub_genre: subGenre,
              sub_genres: genres,
              start_date: startDate,
              duration_days: 90,
              selected_playlists: matchedPlaylists.length > 0 ? matchedPlaylists : [],
              vendor_allocations: {},
              totals: { projected_streams: 0 },
              source: 'campaign_manager', // Explicitly set source
              created_at: startDate, // Set created_at to campaign start date
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating campaign:', insertError);
            continue;
          }
          
          // Add initial weekly update if provided
          if (newCampaign && (dailyStreams || weeklyStreams)) {
            const importNotes = `Initial import - Daily: ${dailyStreams || 0}, Weekly: ${weeklyStreams || 0}`;
            const playlistNotes = parsedPlaylists.length > 0 ? ` | Playlists: ${parsedPlaylists.join(', ')}` : '';
            
            await supabase
              .from('weekly_updates')
              .insert({
                campaign_id: newCampaign.id,
                streams: weeklyStreams || dailyStreams * 7 || 0,
                imported_on: new Date().toISOString().split('T')[0],
                notes: importNotes + playlistNotes
              });
          }
          
          console.log('Created new campaign:', campaignName);
          
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('Starting file import for:', file.name);
    await handleCampaignImport(file);
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
        
        <div className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="csv-upload"
            />
            <Label htmlFor="csv-upload" className="cursor-pointer block space-y-3">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {isImporting ? 'Importing campaigns...' : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop your file here
                </p>
              </div>
            </Label>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <p className="font-semibold text-sm">Required CSV Format:</p>
            <div className="bg-background p-3 rounded border text-xs font-mono">
              <div className="text-foreground mb-1">
                Campaign Name,Client,Goal,Remaining,Daily,Weekly,URL,Start Date,[Playlist columns]
              </div>
              <div className="text-muted-foreground">
                "Jared Rapoza","Slime",20000,18000,200,1400,"https://open.spotify.com/track/...","2024-01-15","Playlist Name - Another Playlist [NEW] -"
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• <strong>Column Headers:</strong> Can use "Campaign Name" or "Campaign" or "campaign_name"</p>
              <p>• <strong>Client Names:</strong> Can use "Client" or "client" or "Artist"</p>
              <p>• <strong>Start Date:</strong> Campaign start date (YYYY-MM-DD format), defaults to today if not provided</p>
              <p>• <strong>Budget:</strong> Will be set to $0 and must be manually entered later</p>
              <p>• <strong>Genres:</strong> Automatically detected from Spotify track URL</p>
              <p>• <strong>Playlists:</strong> Any column containing playlist data will be parsed automatically</p>
              <p>• <strong>Updates:</strong> Existing campaigns updated by Campaign Name + Client match</p>
              <p>• <strong>New campaigns:</strong> Created automatically with created date set to start date</p>
              <p>• <strong>Debug:</strong> Check browser console for detailed import logs</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}