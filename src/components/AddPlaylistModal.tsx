import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UNIFIED_GENRES } from "@/lib/constants";

interface AddPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
}

export default function AddPlaylistModal({ open, onOpenChange, vendorId }: AddPlaylistModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    genres: [] as string[],
    avg_daily_streams: "",
    follower_count: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addPlaylistMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("playlists").insert({
        vendor_id: vendorId,
        name: data.name,
        url: data.url,
        genres: data.genres,
        avg_daily_streams: parseInt(data.avg_daily_streams),
        follower_count: parseInt(data.follower_count),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists", vendorId] });
      toast({
        title: "Success",
        description: "Playlist added successfully",
      });
      onOpenChange(false);
      setFormData({ name: "", url: "", genres: [], avg_daily_streams: "", follower_count: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add playlist",
        variant: "destructive",
      });
      console.error("Error adding playlist:", error);
    },
  });

  // Function to extract playlist ID from Spotify URL
  const extractPlaylistId = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Auto-populate playlist data from Spotify API
  const handleUrlPaste = async (url: string) => {
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return;

    setIsLoading(true);
    try {
      // Call Spotify API edge function
      const { data, error } = await supabase.functions.invoke('spotify-playlist-fetch', {
        body: { playlistId }
      });

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          follower_count: data.followers?.total?.toString() || prev.follower_count,
          genres: data.genres || prev.genres,
        }));
        
        toast({
          title: "Playlist data loaded",
          description: "Auto-populated from Spotify",
        });
      }
    } catch (error) {
      console.error("Error fetching playlist data:", error);
      toast({
        title: "Note",
        description: "Could not auto-populate data. Please enter manually.",
        variant: "default",
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url || formData.genres.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addPlaylistMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Spotify Playlist URL *</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              onBlur={(e) => handleUrlPaste(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              disabled={isLoading}
            />
            {isLoading && <p className="text-sm text-muted-foreground">Loading playlist data...</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter playlist name"
            />
          </div>

          <div className="space-y-2">
            <Label>Genres * (max 4)</Label>
            <MultiSelect
              options={UNIFIED_GENRES}
              selected={formData.genres}
              onChange={(genres) => setFormData({ ...formData, genres })}
              placeholder="Select up to 4 genres"
              max={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="streams">Avg Daily Streams</Label>
              <Input
                id="streams"
                type="number"
                value={formData.avg_daily_streams}
                onChange={(e) => setFormData({ ...formData, avg_daily_streams: e.target.value })}
                placeholder="e.g. 5000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="followers">Followers</Label>
              <Input
                id="followers"
                type="number"
                value={formData.follower_count}
                onChange={(e) => setFormData({ ...formData, follower_count: e.target.value })}
                placeholder="e.g. 50000"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addPlaylistMutation.isPending || isLoading}>
              {addPlaylistMutation.isPending ? "Adding..." : "Add Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}