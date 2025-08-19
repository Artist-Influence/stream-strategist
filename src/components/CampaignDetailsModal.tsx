import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlaylistWithStatus {
  id: string;
  name: string;
  url?: string;
  vendor_name?: string;
  status?: string;
  placed_date?: string;
}

interface CampaignDetailsModalProps {
  campaign: any;
  open: boolean;
  onClose: () => void;
}

const PLAYLIST_STATUSES = [
  'Pending',
  'Pitched', 
  'Accepted',
  'Placed',
  'Rejected'
];

export function CampaignDetailsModal({ campaign, open, onClose }: CampaignDetailsModalProps) {
  const [campaignData, setCampaignData] = useState<any>(null);
  const [playlists, setPlaylists] = useState<PlaylistWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (campaign?.id && open) {
      fetchCampaignDetails();
    }
  }, [campaign?.id, open]);

  const fetchCampaignDetails = async () => {
    if (!campaign?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaign.id)
        .single();

      if (error) throw error;

      setCampaignData(data as any);
      
      // Parse selected_playlists with proper status handling
      if (data?.selected_playlists) {
        const playlistsWithStatus = (data.selected_playlists as any[]).map(playlist => ({
          ...playlist,
          status: playlist.status || 'Pending',
          placed_date: playlist.placed_date || null
        }));
        setPlaylists(playlistsWithStatus);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlaylistStatus = async (playlistIndex: number, updates: Partial<PlaylistWithStatus>) => {
    const updatedPlaylists = [...playlists];
    updatedPlaylists[playlistIndex] = {
      ...updatedPlaylists[playlistIndex],
      ...updates
    };
    
    setPlaylists(updatedPlaylists);
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          selected_playlists: updatedPlaylists as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign!.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Playlist status updated",
      });
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast({
        title: "Error",
        description: "Failed to update playlist status",
        variant: "destructive",
      });
      // Revert on error
      fetchCampaignDetails();
    }
  };

  const removePlaylist = async (playlistIndex: number) => {
    const updatedPlaylists = playlists.filter((_, i) => i !== playlistIndex);
    setPlaylists(updatedPlaylists);
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          selected_playlists: updatedPlaylists as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign!.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Playlist removed from campaign",
      });
    } catch (error) {
      console.error('Failed to remove playlist:', error);
      toast({
        title: "Error", 
        description: "Failed to remove playlist",
        variant: "destructive",
      });
      // Revert on error
      fetchCampaignDetails();
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Placed': return 'default';
      case 'Accepted': return 'secondary';
      case 'Pitched': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            Loading campaign details...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaignData?.name || campaign?.name}
            <Badge variant={getStatusVariant(campaignData?.status || 'draft')}>
              {campaignData?.status || 'draft'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg">
            <div>
              <Label className="text-muted-foreground">Client</Label>
              <p className="font-medium">{campaignData?.client_name || campaignData?.client}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Budget</Label>
              <p className="font-medium">${campaignData?.budget?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Stream Goal</Label>
              <p className="font-medium">{campaignData?.stream_goal?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Remaining Streams</Label>
              <p className="font-medium">{(campaignData?.remaining_streams || campaignData?.stream_goal)?.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Genre</Label>
              <p className="font-medium">{campaignData?.sub_genre || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Duration</Label>
              <p className="font-medium">{campaignData?.duration_days} days</p>
            </div>
          </div>
          
          {/* Track URL */}
          {campaignData?.track_url && (
            <div className="p-4 bg-card rounded-lg">
              <Label className="text-muted-foreground">Track URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <a 
                  href={campaignData.track_url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {campaignData.track_url}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          
          {/* Campaign Playlists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Campaign Playlists ({playlists.length})</Label>
            </div>
            
            {playlists.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Playlist Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placed Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playlists.map((playlist, idx) => (
                    <TableRow key={`${playlist.id}-${idx}`}>
                      <TableCell>
                        {playlist.url ? (
                          <a 
                            href={playlist.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {playlist.name || 'Unnamed Playlist'}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>{playlist.name || 'Unnamed Playlist'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {playlist.vendor_name || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={playlist.status || 'Pending'}
                          onValueChange={(value) => {
                            const updates: Partial<PlaylistWithStatus> = { status: value };
                            if (value === 'Placed') {
                              const date = prompt('Enter placement date (YYYY-MM-DD):');
                              if (date) {
                                updates.placed_date = date;
                              }
                            }
                            updatePlaylistStatus(idx, updates);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLAYLIST_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {playlist.placed_date ? (
                          <span className="text-sm">{formatDate(playlist.placed_date)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePlaylist(idx)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
                No playlists assigned to this campaign yet
              </div>
            )}
          </div>
          
          {/* Campaign Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg text-sm text-muted-foreground">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{campaignData?.created_at ? formatDate(campaignData.created_at) : 'Unknown'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Updated</Label>
              <p>{campaignData?.updated_at ? formatDate(campaignData.updated_at) : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}