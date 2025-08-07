import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AddPlaylistToCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  currentPlaylists: any[];
  onPlaylistsUpdated: () => void;
}

interface Playlist {
  id: string;
  name: string;
  url: string;
  genres: string[];
  avg_daily_streams: number;
  follower_count?: number;
  vendor_id: string;
  vendors?: { name: string };
}

export default function AddPlaylistToCampaignModal({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  currentPlaylists,
  onPlaylistsUpdated
}: AddPlaylistToCampaignModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current playlist IDs
  const currentPlaylistIds = currentPlaylists.map(p => 
    typeof p === 'string' ? p : p.id
  ).filter(Boolean);

  // Fetch available playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['available-playlists', searchTerm],
    queryFn: async (): Promise<Playlist[]> => {
      let query = supabase
        .from('playlists')
        .select('*, vendors(name)')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out playlists already in campaign
      return (data || []).filter(playlist => 
        !currentPlaylistIds.includes(playlist.id)
      );
    },
    enabled: open
  });

  const addPlaylistsMutation = useMutation({
    mutationFn: async (playlistIds: string[]) => {
      // Get the selected playlists data
      const selectedPlaylistsData = playlists?.filter(p => 
        playlistIds.includes(p.id)
      ).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        vendor_name: playlist.vendors?.name || 'Unknown',
        imported: false,
        added_date: new Date().toISOString()
      })) || [];

      // Combine with existing playlists
      const updatedPlaylists = [...currentPlaylists, ...selectedPlaylistsData];

      const { error } = await supabase
        .from('campaigns')
        .update({ 
          selected_playlists: updatedPlaylists,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .eq('source', 'campaign_manager')
        .eq('campaign_type', 'spotify');

      if (error) throw error;
      return selectedPlaylistsData;
    },
    onSuccess: (addedPlaylists) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      onPlaylistsUpdated();
      toast({
        title: "Playlists Added",
        description: `${addedPlaylists.length} playlists added to ${campaignName}`,
      });
      setSelectedPlaylists(new Set());
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add playlists to campaign",
        variant: "destructive",
      });
      console.error('Error adding playlists:', error);
    }
  });

  const handlePlaylistToggle = (playlistId: string) => {
    setSelectedPlaylists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const handleAddPlaylists = () => {
    if (selectedPlaylists.size === 0) return;
    addPlaylistsMutation.mutate(Array.from(selectedPlaylists));
  };

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedPlaylists(new Set());
      setSearchTerm("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Playlists to Campaign</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add new playlists to "{campaignName}"
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          {selectedPlaylists.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">
                {selectedPlaylists.size} playlist(s) selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedPlaylists(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Playlists table */}
          <div className="border rounded-lg flex-1 min-h-0 overflow-hidden">
            <div className="overflow-auto h-full">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading playlists...</p>
                </div>
              ) : !playlists || playlists.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No playlists found matching your search' : 'No available playlists to add'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedPlaylists.size === playlists.length && playlists.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlaylists(new Set(playlists.map(p => p.id)));
                            } else {
                              setSelectedPlaylists(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Playlist Name</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Genres</TableHead>
                      <TableHead>Daily Streams</TableHead>
                      <TableHead>Followers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playlists.map((playlist) => (
                      <TableRow key={playlist.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPlaylists.has(playlist.id)}
                            onChange={() => handlePlaylistToggle(playlist.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <p>{playlist.name}</p>
                            {playlist.url && (
                              <a 
                                href={playlist.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary"
                              >
                                View Playlist
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {playlist.vendors?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {playlist.genres?.slice(0, 3).map((genre) => (
                              <Badge key={genre} variant="secondary" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                            {playlist.genres?.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{playlist.genres.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {playlist.avg_daily_streams?.toLocaleString() || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {playlist.follower_count?.toLocaleString() || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {playlists?.length || 0} playlists available to add
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPlaylists}
              disabled={selectedPlaylists.size === 0 || addPlaylistsMutation.isPending}
              className="bg-gradient-primary hover:opacity-80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {selectedPlaylists.size} Playlist{selectedPlaylists.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}